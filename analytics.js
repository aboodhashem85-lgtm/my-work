/**
 * Advanced Analytics and Reporting Logic Module
 * Provides complex data aggregation and analysis functions.
 */

window.Analytics = {
  /**
   * Calculates the profitability of each unit over a specified period.
   * Profit = Total Income (Rent + Fees) - Total Expenses (Maintenance + Other Expenses)
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {Promise<Array<Object>>} - Array of unit profitability objects
   */
  /**
   * Calculates the profitability of each unit over a specified period using a single optimized SQL query.
   * Profit = Total Income (Rent + Fees) - Total Expenses (Maintenance + Other Expenses)
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {Promise<Array<Object>>} - Array of unit profitability objects
   */
  async calculateUnitProfitability(startDate, endDate) {
    if (!db.runQuery) {
      // Fallback to in-memory processing if runQuery is not available (e.g., in web fallback mode)
      return this._calculateUnitProfitabilityInMemory(startDate, endDate);
    }

    const settings = await db.getSettings();
    const currency = settings.currency || "SAR";

    const sql = `
            SELECT 
                u.id AS unitId,
                u.unitNumber AS unitName,
                u.type AS unitType,
                SUM(CASE WHEN p.type IN ('payment', 'rent', 'income') AND p.paymentDate BETWEEN ? AND ? THEN p.amount ELSE 0 END) AS income,
                SUM(CASE WHEN p.type IN ('expense', 'maintenance_expense', 'refund') AND p.paymentDate BETWEEN ? AND ? THEN p.amount ELSE 0 END) AS expense_payments,
                SUM(CASE WHEN m.completionDate BETWEEN ? AND ? THEN m.cost ELSE 0 END) AS expense_maintenance
            FROM 
                units u
            LEFT JOIN 
                payments p ON u.id = p.unitId
            LEFT JOIN 
                maintenance m ON u.id = m.unitId
            GROUP BY 
                u.id, u.unitNumber, u.type
        `;

    const params = [startDate, endDate, startDate, endDate, startDate, endDate];
    const results = await db.runQuery(sql, params);

    return results.map((row) => {
      const totalExpenses =
        (row.expense_payments || 0) + (row.expense_maintenance || 0);
      const profit = (row.income || 0) - totalExpenses;

      return {
        unitId: row.unitId,
        unitName: row.unitName,
        unitType: row.unitType,
        income: row.income || 0,
        expenses: totalExpenses,
        profit: profit,
        currency: currency,
      };
    });
  },

  // Keep the old logic as a fallback for non-Electron environments
  async _calculateUnitProfitabilityInMemory(startDate, endDate) {
    const units = await db.getTable("units");
    const payments = await db.getTable("payments");
    const maintenance = await db.getTable("maintenance");
    const settings = await db.getSettings();
    const currency = settings.currency || "SAR";

    const profitabilityMap = {};

    // Initialize profitability map with all units
    units.forEach((unit) => {
      profitabilityMap[unit.id] = {
        unitId: unit.id,
        unitName: unit.unitNumber, // Assuming unitNumber is the display name
        unitType: unit.type,
        income: 0,
        expenses: 0,
        profit: 0,
        currency: currency,
      };
    });

    // Filter payments within the date range
    const filteredPayments = payments.filter(
      (p) => p.paymentDate >= startDate && p.paymentDate <= endDate,
    );

    // Process payments (Income and Expenses)
    filteredPayments.forEach((p) => {
      if (!p.unitId || !profitabilityMap[p.unitId]) return;

      const unitData = profitabilityMap[p.unitId];

      if (["payment", "rent", "income"].includes(p.type)) {
        unitData.income += p.amount || 0;
      } else if (
        ["expense", "maintenance_expense", "refund"].includes(p.type)
      ) {
        unitData.expenses += p.amount || 0;
      }
    });

    // Process maintenance records (Expenses)
    const filteredMaintenance = maintenance.filter(
      (m) =>
        m.completionDate &&
        m.completionDate >= startDate &&
        m.completionDate <= endDate,
    );

    filteredMaintenance.forEach((m) => {
      if (!m.unitId || !profitabilityMap[m.unitId]) return;

      const cost = m.cost || 0;
      profitabilityMap[m.unitId].expenses += cost;
    });

    // Final calculation
    return Object.values(profitabilityMap).map((data) => {
      data.profit = data.income - data.expenses;
      return data;
    });
  },

  /**
   * Calculates the trend of maintenance costs over a period, grouped by category.
   * @param {number} months - Number of months to look back.
   * @returns {Promise<Object>} - Object containing labels and datasets for charting.
   */
  async getMaintenanceCostTrend(months) {
    const maintenanceRecords = await db.getTable("maintenance");
    const now = new Date();
    const trends = {};
    const categories = new Set();
    const labels = [];

    // Generate month labels
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toISOString().slice(0, 7);
      labels.push(
        date.toLocaleDateString("ar-SA", { month: "short", year: "numeric" }),
      );
      trends[monthKey] = {};
    }

    // Aggregate costs by month and category
    maintenanceRecords.forEach((m) => {
      if (!m.completionDate || !m.category || !m.cost) return;

      const monthKey = m.completionDate.slice(0, 7);
      if (trends[monthKey]) {
        const category = m.category;
        categories.add(category);
        trends[monthKey][category] =
          (trends[monthKey][category] || 0) + (m.cost || 0);
      }
    });

    // Prepare datasets for charting
    const datasets = Array.from(categories).map((category) => {
      const data = labels.map((label, index) => {
        const monthKey = Object.keys(trends)[index];
        return trends[monthKey][category] || 0;
      });

      return {
        label: category,
        data: data,
        backgroundColor: AppUtils.getColorForCategory(category), // Assuming AppUtils has a color function
        borderColor: AppUtils.getColorForCategory(category, true),
        fill: false,
        tension: 0.1,
      };
    });

    return { labels, datasets };
  },

  /**
   * Provides financial advice based on current building performance.
   * This is the core logic for the Financial Advisor feature.
   * @returns {Promise<string>} - A detailed financial advice report.
   */
  async getFinancialAdvice() {
    const units = await db.getTable("units");
    const residents = await db.getTable("residents");
    const payments = await db.getTable("payments");
    const maintenance = await db.getTable("maintenance");
    const settings = await db.getSettings();

    const currency = settings.currency || "USD";
    const now = new Date();
    const last6Months = new Date(now.getFullYear(), now.getMonth() - 5, 1)
      .toISOString()
      .slice(0, 10);
    const today = now.toISOString().slice(0, 10);

    // 1. Unit Profitability Analysis
    const profitabilityData = await this.calculateUnitProfitability(
      last6Months,
      today,
    );
    const lowProfitUnits = profitabilityData.filter((u) => u.profit < 0);

    // 1.5. Unit Vacancy Analysis (New)
    const vacantUnits = units.filter((u) => u.status === "vacant");
    const maintenanceUnits = units.filter((u) => u.status === "maintenance");

    // 2. Occupancy Rate
    const totalUnits = units.length;
    const occupiedUnits = units.filter((u) => u.status === "occupied").length;
    const occupancyRate = totalUnits > 0 ? occupiedUnits / totalUnits : 0;
    const vacancyRate = 1 - occupancyRate;

    // 3. Financial Summary (Last 6 Months)
    const totalIncome = profitabilityData.reduce((sum, u) => sum + u.income, 0);
    const totalExpenses = profitabilityData.reduce(
      (sum, u) => sum + u.expenses,
      0,
    );
    const netProfit = totalIncome - totalExpenses;
    const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

    // 4. Maintenance Trend (Last 6 Months)
    const totalMaintenanceCost = maintenance
      .filter(
        (m) =>
          m.completionDate &&
          m.completionDate >= last6Months &&
          m.completionDate <= today,
      )
      .reduce((sum, m) => sum + (m.cost || 0), 0);

    const maintenanceToIncomeRatio =
      totalIncome > 0 ? (totalMaintenanceCost / totalIncome) * 100 : 0;

    // --- Generate Advice ---
    let advice = `
            <div class="financial-advice-report">
                <h2>تقرير المستشار المالي (آخر 6 أشهر)</h2>
                <p>تاريخ التقرير: ${new Date().toLocaleDateString("ar-SA")}</p>
                
                <h3>ملخص الأداء المالي</h3>
                <table class="table table-striped">
                    <tr>
                        <th>إجمالي الإيرادات</th>
                        <td>${AppUtils.formatCurrency(totalIncome, currency)}</td>
                    </tr>
                    <tr>
                        <th>إجمالي المصروفات</th>
                        <td>${AppUtils.formatCurrency(totalExpenses, currency)}</td>
                    </tr>
                    <tr>
                        <th>صافي الربح</th>
                        <td>${AppUtils.formatCurrency(netProfit, currency)}</td>
                    </tr>
                    <tr>
                        <th>هامش الربح</th>
                        <td>${profitMargin.toFixed(2)}%</td>
                    </tr>
                    <tr>
                        <th>معدل الإشغال</th>
                        <td>${(occupancyRate * 100).toFixed(2)}%</td>
                    </tr>
                </table>
                <hr>
        `;

    // Advice 1: Low Occupancy
    if (vacancyRate > 0.1) {
      // If vacancy rate > 10%
      advice += `
                <h3><i class="fas fa-exclamation-triangle text-warning"></i> توصية حول الإشغال</h3>
                <p><strong>معدل الشغور (${(vacancyRate * 100).toFixed(2)}%) مرتفع.</strong> يجب اتخاذ إجراءات فورية لتقليل الوحدات الشاغرة. قد يشمل ذلك:</p>
                <ul>
                    <li>مراجعة أسعار الإيجار مقارنة بالسوق.</li>
                    <li>تحسين جهود التسويق للوحدات الشاغرة.</li>
                    <li>النظر في تقديم حوافز للمستأجرين الجدد.</li>
                </ul>
            `;
    } else {
      advice += `
                <h3><i class="fas fa-check-circle text-success"></i> توصية حول الإشغال</h3>
                <p><strong>معدل الإشغال ممتاز (${(occupancyRate * 100).toFixed(2)}%).</strong> استمر في مراقبة السوق لضمان بقاء أسعار الإيجار تنافسية ومُحسّنة.</p>
            `;
    }

    // Advice 1.5: Maintenance Units (New)
    if (maintenanceUnits.length > 0) {
      advice += `
                <h3><i class="fas fa-tools text-danger"></i> توصية حول وحدات الصيانة</h3>
                <p>هناك <strong>${maintenanceUnits.length} وحدة قيد الصيانة</strong> حاليًا. يجب تسريع عملية الإصلاح وإعادتها إلى السوق لزيادة الإيرادات المحتملة.</p>
                <ul>
                    ${maintenanceUnits.map((u) => `<li>الوحدة ${u.unitNumber || u.unitName} (الحالة: ${u.status}).</li>`).join("")}
                </ul>
            `;
    }

    // Advice 2: Low Profitability
    if (lowProfitUnits.length > 0) {
      advice += `
                <h3><i class="fas fa-chart-line text-danger"></i> توصية حول ربحية الوحدات</h3>
                <p>تم تحديد <strong>${lowProfitUnits.length} وحدة ذات ربحية منخفضة أو سالبة</strong> خلال الفترة المحددة. يجب تحليل مصروفات هذه الوحدات بشكل خاص:</p>
                <ul>
            `;
      lowProfitUnits.forEach((u) => {
        advice += `<li>الوحدة ${u.unitName} (الربح: ${AppUtils.formatCurrency(u.profit, currency)}).</li>`;
      });
      advice += `
                </ul>
                <p><strong>الإجراء المقترح:</strong> مراجعة سجلات الصيانة والمصروفات لهذه الوحدات. قد تكون هناك حاجة لإجراء إصلاحات كبيرة لمرة واحدة، أو قد تشير إلى مشكلة هيكلية تتطلب معالجة لتقليل تكاليف التشغيل.</p>
            `;

      // New: Suggest rent review for low-profit units
      const lowProfitAndOccupied = lowProfitUnits.filter((u) =>
        units.find(
          (unit) => unit.id === u.unitId && unit.status === "occupied",
        ),
      );
      if (lowProfitAndOccupied.length > 0) {
        advice += `<p><strong>توصية إضافية:</strong> بما أن ${lowProfitAndOccupied.length} من هذه الوحدات مؤجرة حاليًا، يجب مراجعة عقود الإيجار الخاصة بها لضمان أن الإيجار يغطي التكاليف ويحقق هامش ربح معقول.</p>`;
      }
    }

    // Advice 3: Maintenance Cost
    if (maintenanceToIncomeRatio > 0.15) {
      // If maintenance cost is more than 15% of income
      advice += `
                <h3><i class="fas fa-tools text-warning"></i> توصية حول تكاليف الصيانة</h3>
                <p><strong>نسبة تكاليف الصيانة إلى الإيرادات (${maintenanceToIncomeRatio.toFixed(2)}%) مرتفعة.</strong> هذا يشير إلى أن جزءًا كبيرًا من إيراداتك يذهب إلى الصيانة.</p>
                <ul>
                    <li>تحليل اتجاهات التكلفة حسب الفئة لتحديد المشاكل المتكررة.</li>
                    <li>النظر في عقود صيانة وقائية لتقليل تكاليف الإصلاحات الطارئة.</li>
                    <li>مراجعة أسعار مقدمي خدمات الصيانة الحاليين.</li>
                </ul>
            `;
    } else {
      advice += `
                <h3><i class="fas fa-wrench text-info"></i> توصية حول تكاليف الصيانة</h3>
                <p>تكاليف الصيانة ضمن الحدود المعقولة (${maintenanceToIncomeRatio.toFixed(2)}%). استمر في مراقبة اتجاهات التكلفة.</p>
            `;
    }

    advice += `</div>`;

    return advice;
  },
};

// Add a helper function to AppUtils for color selection (needed for getMaintenanceCostTrend)
if (typeof window.AppUtils === "undefined") {
  window.AppUtils = {};
}

// Simple deterministic color generator for categories
window.AppUtils.getColorForCategory = (category, isBorder = false) => {
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = "#";
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += ("00" + value.toString(16)).substr(-2);
  }

  // Add transparency for background color
  if (!isBorder) {
    return color + "40"; // 25% transparency
  }
  return color;
};
