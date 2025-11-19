/**
 * Reports and Analytics Module
 * Handles report generation and data analytics
 */

window.Reports = {
  currentReport: null,
  chartInstances: {},

  /**
   * Load reports management page
   */
  async load() {
    // Load analytics module
    await AppUtils.loadScript("analytics.js");
    this.renderReportsPage();
    await this.loadDashboard();
  },

  /**
   * Render the reports management page
   */
  renderReportsPage() {
    const reportsContent = document.getElementById("reportsContent");
    if (!reportsContent) return;

    reportsContent.innerHTML = `
            <div class="reports-container">
                <!-- Header Section -->
                <div class="page-header">
                    <div class="header-actions">
                        <button class="btn btn-primary" onclick="Reports.generateFinancialReport()">
                            <i class="fas fa-chart-line"></i>
                            تقرير مالي
                        </button>
                        <button class="btn btn-success" onclick="Reports.generateOccupancyReport()">
                            <i class="fas fa-home"></i>
                            تقرير الإشغال
                        </button>
                        <button class="btn btn-info" onclick="Reports.generateMaintenanceReport()">
                            <i class="fas fa-tools"></i>
                            تقرير الصيانة
                        </button>
                        <button class="btn btn-warning" onclick="Reports.generateCustomReport()">
                            <i class="fas fa-cog"></i>
                            تقرير مخصص
                        </button>
                        <button class="btn btn-primary" onclick="Reports.generateFinancialAdvisorReport()">
                            <i class="fas fa-magic"></i>
                            المستشار المالي
                        </button>
                    </div>
                </div>

                <!-- Quick Stats -->
                <div class="quick-stats" id="quickStats">
                    <!-- Quick stats will be loaded here -->
                </div>

                <!-- Charts Section -->
                <div class="charts-section">
                    <div class="charts-grid">
                        <div class="chart-container neu-flat">
                            <div class="chart-header">
                                <h3>الإيرادات الشهرية</h3>
                                <div class="chart-controls">
                                    <select id="revenueChartPeriod" class="form-control-sm">
                                        <option value="6">آخر 6 أشهر</option>
                                        <option value="12" selected>آخر 12 شهر</option>
                                        <option value="24">آخر سنتين</option>
                                    </select>
                                </div>
                            </div>
                            <div class="chart-content">
                                <canvas id="revenueChart"></canvas>
                            </div>
                        </div>

                        <div class="chart-container neu-flat">
                            <div class="chart-header">
                                <h3>توزيع المدفوعات</h3>
                                <div class="chart-controls">
                                    <select id="paymentsChartPeriod" class="form-control-sm">
                                        <option value="1">الشهر الحالي</option>
                                        <option value="3" selected>آخر 3 أشهر</option>
                                        <option value="6">آخر 6 أشهر</option>
                                    </select>
                                </div>
                            </div>
                            <div class="chart-content">
                                <canvas id="paymentsChart"></canvas>
                            </div>
                        </div>

                        <div class="chart-container neu-flat">
                            <div class="chart-header">
                                <h3>معدل الإشغال</h3>
                                <div class="chart-controls">
                                    <button class="btn btn-sm btn-outline-primary" onclick="Reports.refreshOccupancyChart()">
                                        <i class="fas fa-sync"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="chart-content">
                                <canvas id="occupancyChart"></canvas>
                            </div>
                        </div>

                        <div class="chart-container neu-flat">
                            <div class="chart-header">
                                <h3>طلبات الصيانة</h3>
                                <div class="chart-controls">
                                    <select id="maintenanceChartPeriod" class="form-control-sm">
                                        <option value="1">الشهر الحالي</option>
                                        <option value="3" selected>آخر 3 أشهر</option>
                                        <option value="6">آخر 6 أشهر</option>
                                    </select>
                                </div>
                            </div>
                            <div class="chart-content">
                                <canvas id="maintenanceChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Report Output Section -->
                <div class="report-output" id="reportOutput" style="display: none;">
                    <div class="report-header">
                        <h3 id="reportTitle">تقرير</h3>
                        <div class="report-actions">
                            <button class="btn btn-primary" onclick="Reports.printReport()">
                                <i class="fas fa-print"></i>
                                طباعة
                            </button>
                            <button class="btn btn-success" onclick="Reports.exportReport()">
                                <i class="fas fa-download"></i>
                                تصدير
                            </button>
                            <button class="btn btn-secondary" onclick="Reports.closeReport()">
                                <i class="fas fa-times"></i>
                                إغلاق
                            </button>
                        </div>
                    </div>
                    <div class="report-content" id="reportContent">
                        <!-- Report content will be loaded here -->
                    </div>
                </div>
            </div>
        `;

    this.bindEvents();
    this.initializeCharts();
  },

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Chart period selectors
    document
      .getElementById("revenueChartPeriod")
      ?.addEventListener("change", () => {
        this.updateRevenueChart();
      });

    document
      .getElementById("paymentsChartPeriod")
      ?.addEventListener("change", () => {
        this.updatePaymentsChart();
      });

    document
      .getElementById("maintenanceChartPeriod")
      ?.addEventListener("change", () => {
        this.updateMaintenanceChart();
      });
  },

  /**
   * Load dashboard data
   */
  async loadDashboard() {
    await this.loadQuickStats();
  },

  /**
   * Load quick statistics
   */
  async loadQuickStats() {
    const units = await db.getTable("units");
    const residents = await db.getTable("residents");
    const contracts = await db.getTable("contracts");
    const payments = await db.getTable("payments");
    const maintenance = await db.getTable("maintenance");
    const settings = await db.getSettings();

    // Calculate statistics
    const totalUnits = units.length;
    const occupiedUnits = units.filter((u) => u.status === "occupied").length;
    const occupancyRate =
      totalUnits > 0 ? ((occupiedUnits / totalUnits) * 100).toFixed(1) : 0;

    const activeResidents = residents.filter(
      (r) => r.status === "active",
    ).length;

    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyRevenue = payments
      .filter(
        (p) =>
          p.date.startsWith(currentMonth) &&
          ["payment", "rent", "income"].includes(p.type),
      )
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const pendingMaintenance = maintenance.filter(
      (m) => m.status === "pending",
    ).length;

    const quickStatsHtml = `
            <div class="stat-card neu-flat">
                <div class="stat-icon">
                    <i class="fas fa-building"></i>
                </div>
                <div class="stat-content">
                    <h3>${occupancyRate}%</h3>
                    <p>معدل الإشغال</p>
                    <small>${occupiedUnits} من ${totalUnits} شقة</small>
                </div>
            </div>

            <div class="stat-card neu-flat">
                <div class="stat-icon">
                    <i class="fas fa-users"></i>
                </div>
                <div class="stat-content">
                    <h3>${activeResidents}</h3>
                    <p>المقيمون النشطون</p>
                    <small>من إجمالي ${residents.length}</small>
                </div>
            </div>

            <div class="stat-card neu-flat">
                <div class="stat-icon">
                    <i class="fas fa-money-bill-wave"></i>
                </div>
                <div class="stat-content">
                    <h3>${AppUtils.formatCurrency(monthlyRevenue, settings.currency)}</h3>
                    <p>إيرادات الشهر</p>
                    <small>${new Date().toLocaleDateString("ar-SA", { month: "long", year: "numeric" })}</small>
                </div>
            </div>

            <div class="stat-card neu-flat">
                <div class="stat-icon">
                    <i class="fas fa-tools"></i>
                </div>
                <div class="stat-content">
                    <h3>${pendingMaintenance}</h3>
                    <p>طلبات صيانة معلقة</p>
                    <small>من إجمالي ${maintenance.length}</small>
                </div>
            </div>
        `;

    const quickStatsContainer = document.getElementById("quickStats");
    if (quickStatsContainer) {
      quickStatsContainer.innerHTML = quickStatsHtml;
    }
  },

  /**
   * Initialize charts
   */
  async initializeCharts() {
    await this.createRevenueChart();
    await this.createPaymentsChart();
    await this.createOccupancyChart();
    await this.createMaintenanceChart();
  },

  /**
   * Update revenue chart
   */
  async updateRevenueChart() {
    const months = document.getElementById("revenueChartPeriod").value;
    const data = await this.getRevenueData(parseInt(months));

    this.chartInstances.revenue.data.labels = data.labels;
    this.chartInstances.revenue.data.datasets[0].data = data.values;
    this.chartInstances.revenue.update();
  },

  /**
   * Update payments chart
   */
  async updatePaymentsChart() {
    const months = document.getElementById("paymentsChartPeriod").value;
    const data = await this.getPaymentsDistribution(parseInt(months));

    this.chartInstances.payments.data.labels = data.labels;
    this.chartInstances.payments.data.datasets[0].data = data.values;
    this.chartInstances.payments.update();
  },

  /**
   * Refresh occupancy chart
   */
  async refreshOccupancyChart() {
    const data = await this.getOccupancyData();

    this.chartInstances.occupancy.data.labels = data.labels;
    this.chartInstances.occupancy.data.datasets[0].data = data.values;
    this.chartInstances.occupancy.update();
  },

  /**
   * Update maintenance chart
   */
  async updateMaintenanceChart() {
    const months = document.getElementById("maintenanceChartPeriod").value;
    const data = await this.getMaintenanceData(parseInt(months));

    this.chartInstances.maintenance.data.labels = data.labels;
    this.chartInstances.maintenance.data.datasets[0].data = data.values;
    this.chartInstances.maintenance.update();
  },

  /**
   * Create revenue chart
   */
  async createRevenueChart() {
    const ctx = document.getElementById("revenueChart");
    if (!ctx) return;

    const data = await this.getRevenueData(12);

    if (this.chartInstances.revenue) {
      this.chartInstances.revenue.destroy();
    }

    this.chartInstances.revenue = new Chart(ctx, {
      type: "line",
      data: {
        labels: data.labels,
        datasets: [
          {
            label: "الإيرادات",
            data: data.values,
            borderColor: "#4299e1",
            backgroundColor: "rgba(66, 153, 225, 0.1)",
            borderWidth: 3,
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (value) {
                return AppUtils.formatCurrency(value);
              },
            },
          },
        },
      },
    });
  },

  /**
   * Create payments distribution chart
   */
  async createPaymentsChart() {
    const ctx = document.getElementById("paymentsChart");
    if (!ctx) return;

    const data = await this.getPaymentsDistribution(3);

    if (this.chartInstances.payments) {
      this.chartInstances.payments.destroy();
    }

    this.chartInstances.payments = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: data.labels,
        datasets: [
          {
            data: data.values,
            backgroundColor: [
              "#48bb78",
              "#4299e1",
              "#ed8936",
              "#9f7aea",
              "#38b2ac",
            ],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
          },
        },
      },
    });
  },

  /**
   * Create occupancy chart
   */
  async createOccupancyChart() {
    const ctx = document.getElementById("occupancyChart");
    if (!ctx) return;

    const data = await this.getOccupancyData();

    if (this.chartInstances.occupancy) {
      this.chartInstances.occupancy.destroy();
    }

    this.chartInstances.occupancy = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: data.labels,
        datasets: [
          {
            data: data.values,
            backgroundColor: ["#48bb78", "#f56565", "#ed8936"],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
          },
        },
      },
    });
  },

  /**
   * Create maintenance chart
   */
  async createMaintenanceChart() {
    const ctx = document.getElementById("maintenanceChart");
    if (!ctx) return;

    // Use the new analytics function to get grouped maintenance data
    const trendData = await Analytics.getMaintenanceCostTrend(3);

    if (this.chartInstances.maintenance) {
      this.chartInstances.maintenance.destroy();
    }

    this.chartInstances.maintenance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: trendData.labels,
        datasets: trendData.datasets, // Use the new datasets structure
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true, // Show legend for different categories
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            stacked: true, // Stack bars for total cost per month
            ticks: {
              callback: function (value) {
                return AppUtils.formatCurrency(value);
              },
            },
          },
          x: {
            stacked: true,
          },
        },
      },
    });
  },

  /**
   * Get revenue data for chart
   */
  async getRevenueData(months) {
    const payments = await db.getTable("payments");
    const labels = [];
    const values = [];

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toISOString().slice(0, 7);

      const monthName = date.toLocaleDateString("ar-SA", {
        month: "short",
        year: "numeric",
      });
      labels.push(monthName);

      const monthRevenue = payments
        .filter(
          (p) =>
            p.date.startsWith(monthKey) &&
            ["payment", "rent", "income"].includes(p.type),
        )
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      values.push(monthRevenue);
    }

    return { labels, values };
  },

  /**
   * Get payments distribution data
   */
  async getPaymentsDistribution(months) {
    const payments = await db.getTable("payments");
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - months);
    const cutoffString = cutoffDate.toISOString().slice(0, 7);

    const recentPayments = payments.filter((p) => p.date >= cutoffString);

    const distribution = {};
    recentPayments.forEach((payment) => {
      const type = payment.type;
      distribution[type] = (distribution[type] || 0) + (payment.amount || 0);
    });

    const typeLabels = {
      payment: "دفعات",
      rent: "إيجارات",
      utilities: "خدمات",
      income: "إيرادات أخرى",
      expense: "مصروفات",
      maintenance_expense: "مصروفات صيانة",
    };

    const labels = Object.keys(distribution).map(
      (key) => typeLabels[key] || key,
    );
    const values = Object.values(distribution);

    return { labels, values };
  },

  /**
   * Get occupancy data for chart
   */
  async getOccupancyData() {
    const units = await db.getTable("units");
    const occupied = units.filter((u) => u.status === "occupied").length;
    const vacant = units.filter((u) => u.status === "vacant").length;
    const maintenance = units.filter((u) => u.status === "maintenance").length;

    const labels = ["مؤجرة", "شاغرة", "صيانة"];
    const values = [occupied, vacant, maintenance];

    return { labels, values };
  },

  /**
   * Get maintenance data for chart (Legacy - replaced by Analytics.getMaintenanceCostTrend)
   */
  async getMaintenanceData(months) {
    // This function is now only used for the updateMaintenanceChart function to get the period.
    // The actual chart data is fetched by Analytics.getMaintenanceCostTrend in createMaintenanceChart.
    // We keep this for compatibility with updateMaintenanceChart's period logic.
    const maintenanceRecords = await db.getTable("maintenance");
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - months);
    const cutoffString = cutoffDate.toISOString().slice(0, 7);

    const recentMaintenance = maintenanceRecords.filter(
      (m) => m.completionDate && m.completionDate >= cutoffString,
    );

    const counts = {};
    recentMaintenance.forEach((m) => {
      const monthKey = m.completionDate.slice(0, 7);
      counts[monthKey] = (counts[monthKey] || 0) + 1;
    });

    const labels = Object.keys(counts)
      .sort()
      .map((key) => {
        const date = new Date(key + "-01");
        return date.toLocaleDateString("ar-SA", {
          month: "short",
          year: "numeric",
        });
      });
    const values = Object.keys(counts)
      .sort()
      .map((key) => counts[key]);

    return { labels, values };
  },

  /**
   * Show report section
   */
  showReport(title) {
    document.getElementById("reportTitle").innerText = title;
    document.getElementById("reportOutput").style.display = "block";
    document.getElementById("quickStats").style.display = "none";
    document.getElementById("chartsSection").style.display = "none";
  },

  /**
   * Close report section
   */
  closeReport() {
    document.getElementById("reportOutput").style.display = "none";
    document.getElementById("quickStats").style.display = "flex";
    document.getElementById("chartsSection").style.display = "grid";
  },

  /**
   * Print report
   */
  printReport() {
    window.print();
  },

  /**
   * Export report (Placeholder)
   */
  exportReport() {
    AppUtils.showToast("سيتم تفعيل وظيفة التصدير قريباً.", "info");
  },

  /**
   * Generate Financial Report
   */
  async generateFinancialReport() {
    this.showReport("تقرير مالي شامل");

    const payments = await db.getTable("payments");
    const settings = await db.getSettings();
    const currency = settings.currency;

    // ... (Existing financial report generation logic)
    let html = `
            <div class="report-content-body">
                <h2>ملخص الأداء المالي</h2>
                <p><strong>العملة:</strong> ${currency}</p>
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>التاريخ</th>
                            <th>النوع</th>
                            <th>الوصف</th>
                            <th>المبلغ</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

    let totalIncome = 0;
    let totalExpense = 0;

    payments
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .forEach((p) => {
        const isIncome = ["payment", "rent", "income"].includes(p.type);
        const amount = p.amount || 0;

        if (isIncome) {
          totalIncome += amount;
        } else {
          totalExpense += amount;
        }

        html += `
                <tr class="${isIncome ? "text-success" : "text-danger"}">
                    <td>${p.date}</td>
                    <td>${this.getPaymentTypeLabel(p.type)}</td>
                    <td>${p.description || "لا يوجد"}</td>
                    <td>${AppUtils.formatCurrency(amount, currency)}</td>
                </tr>
            `;
      });

    const netProfit = totalIncome - totalExpense;

    html += `
                    </tbody>
                </table>

                <div class="summary-box">
                    <h3>ملخص النتائج</h3>
                    <p><strong>إجمالي الإيرادات:</strong> <span class="text-success">${AppUtils.formatCurrency(totalIncome, currency)}</span></p>
                    <p><strong>إجمالي المصروفات:</strong> <span class="text-danger">${AppUtils.formatCurrency(totalExpense, currency)}</span></p>
                    <p><strong>صافي الربح:</strong> <span class="${netProfit >= 0 ? "text-success" : "text-danger"}">${AppUtils.formatCurrency(netProfit, currency)}</span></p>
                </div>
            </div>
        `;

    document.getElementById("reportContent").innerHTML = html;
  },

  /**
   * Helper to get payment type label
   */
  getPaymentTypeLabel(type) {
    const labels = {
      payment: "دفعات",
      rent: "إيجار",
      utilities: "خدمات",
      income: "إيرادات أخرى",
      expense: "مصروفات",
      maintenance_expense: "مصروفات صيانة",
      refund: "استرداد",
    };
    return labels[type] || type;
  },

  /**
   * Generate Occupancy Report
   */
  async generateOccupancyReport() {
    this.showReport("تقرير الإشغال والوحدات");

    const units = await db.getTable("units");
    const residents = await db.getTable("residents");

    // ... (Existing occupancy report generation logic)
    let html = `
            <div class="report-content-body">
                <h2>حالة الوحدات</h2>
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>رقم الوحدة</th>
                            <th>النوع</th>
                            <th>الحالة</th>
                            <th>المستأجر الحالي</th>
                            <th>الإيجار الشهري</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

    units.forEach((unit) => {
      const resident = residents.find(
        (r) => r.unitId === unit.id && r.status === "active",
      );

      let statusClass = "";
      if (unit.status === "occupied") statusClass = "text-success";
      else if (unit.status === "vacant") statusClass = "text-warning";
      else if (unit.status === "maintenance") statusClass = "text-info";

      html += `
                <tr>
                    <td>${unit.name}</td>
                    <td>${unit.type}</td>
                    <td class="${statusClass}">${unit.status}</td>
                    <td>${resident ? resident.name : "شاغرة"}</td>
                    <td>${AppUtils.formatCurrency(unit.rent, "SAR")}</td>
                </tr>
            `;
    });

    html += `
                    </tbody>
                </table>
            </div>
        `;

    document.getElementById("reportContent").innerHTML = html;
  },

  /**
   * Generate Maintenance Report
   */
  async generateMaintenanceReport() {
    this.showReport("تقرير الصيانة الشامل");

    const maintenanceRecords = await db.getTable("maintenance");
    const units = await db.getTable("units");
    const residents = await db.getTable("residents");

    // ... (Existing maintenance report generation logic)
    let html = `
            <div class="report-content-body">
                <h2>سجل طلبات الصيانة</h2>
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>التاريخ</th>
                            <th>الوحدة</th>
                            <th>المستأجر</th>
                            <th>الوصف</th>
                            <th>الحالة</th>
                            <th>التكلفة</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

    maintenanceRecords
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .forEach((m) => {
        const unit = units.find((u) => u.id === m.unitId);
        const resident = residents.find((r) => r.id === m.residentId);

        let statusClass = "";
        if (m.status === "completed") statusClass = "text-success";
        else if (m.status === "pending") statusClass = "text-warning";
        else if (m.status === "in_progress") statusClass = "text-info";

        html += `
                <tr>
                    <td>${m.date}</td>
                    <td>${unit ? unit.name : "غير محدد"}</td>
                    <td>${resident ? resident.name : "غير محدد"}</td>
                    <td>${m.description}</td>
                    <td class="${statusClass}">${m.status}</td>
                    <td>${AppUtils.formatCurrency(m.cost || 0, "SAR")}</td>
                </tr>
            `;
      });

    html += `
                    </tbody>
                </table>
            </div>
        `;

    document.getElementById("reportContent").innerHTML = html;
  },

  /**
   * Generate Custom Report (Placeholder)
   */
  async generateCustomReport() {
    this.showReport("تقرير مخصص");

    const units = await db.getTable("units");
    const residents = await db.getTable("residents");
    const contracts = await db.getTable("contracts");
    const payments = await db.getTable("payments");
    const maintenance = await db.getTable("maintenance");

    // New: Generate Unit Profitability Report as a custom report example
    const startDate = prompt("أدخل تاريخ البدء (YYYY-MM-DD):", "2024-01-01");
    const endDate = prompt(
      "أدخل تاريخ الانتهاء (YYYY-MM-DD):",
      new Date().toISOString().slice(0, 10),
    );

    if (!startDate || !endDate) {
      this.closeReport();
      return;
    }

    try {
      const profitabilityData = await Analytics.calculateUnitProfitability(
        startDate,
        endDate,
      );

      let html = `
                <div class="report-content-body">
                    <h2>تقرير ربحية الوحدات (${startDate} إلى ${endDate})</h2>
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>الوحدة</th>
                                <th>النوع</th>
                                <th>الإيرادات</th>
                                <th>المصروفات</th>
                                <th>صافي الربح</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

      let totalProfit = 0;
      profitabilityData.forEach((data) => {
        totalProfit += data.profit;
        const profitClass = data.profit >= 0 ? "text-success" : "text-danger";
        html += `
                    <tr>
                        <td>${data.unitName}</td>
                        <td>${data.unitType}</td>
                        <td>${AppUtils.formatCurrency(data.income, data.currency)}</td>
                        <td>${AppUtils.formatCurrency(data.expenses, data.currency)}</td>
                        <td class="${profitClass}"><strong>${AppUtils.formatCurrency(data.profit, data.currency)}</strong></td>
                    </tr>
                `;
      });

      html += `
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="4"><strong>إجمالي صافي الربح</strong></td>
                                <td class="${totalProfit >= 0 ? "text-success" : "text-danger"}"><strong>${AppUtils.formatCurrency(totalProfit, profitabilityData[0]?.currency || "SAR")}</strong></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            `;

      document.getElementById("reportContent").innerHTML = html;
    } catch (error) {
      console.error("Error generating custom report:", error);
      document.getElementById("reportContent").innerHTML =
        '<p class="text-danger">حدث خطأ أثناء إنشاء التقرير: ' +
        error.message +
        "</p>";
    }
  },

  /**
   * Generate Financial Advisor Report
   */
  async generateFinancialAdvisorReport() {
    this.showReport("تقرير المستشار المالي");

    try {
      const adviceHtml = await Analytics.getFinancialAdvice();
      document.getElementById("reportContent").innerHTML = adviceHtml;
    } catch (error) {
      console.error("Error generating financial advisor report:", error);
      document.getElementById("reportContent").innerHTML =
        '<p class="text-danger">حدث خطأ أثناء إنشاء التقرير: ' +
        error.message +
        "</p>";
    }
  },
};

// Assuming AppUtils is defined elsewhere and has loadScript and formatCurrency
// For testing purposes, ensure AppUtils.loadScript is available if not already.
if (typeof AppUtils === "undefined") {
  window.AppUtils = {
    formatCurrency: (amount, currency = "SAR") =>
      `${amount.toFixed(2)} ${currency}`,
    loadScript: (src) => {
      return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = src;
        script.onload = resolve;
        document.head.appendChild(script);
      });
    },
  };
}
