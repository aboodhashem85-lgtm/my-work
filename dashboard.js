/**
 * Dashboard Module
 * Handles dashboard functionality, statistics, and data visualization
 */

window.Dashboard = {
  /**
   * Load dashboard content
   */
  load() {
    this.updateStatistics();
    this.loadAlerts();
    this.loadOverduePayments();
    this.createCharts();
  },

  /**
   * Update dashboard statistics
   */
  updateStatistics() {
    const stats = db.getStatistics();

    // Update stat cards
    const totalUnitsEl = document.getElementById("totalUnits");
    const totalResidentsEl = document.getElementById("totalResidents");
    const activeContractsEl = document.getElementById("activeContracts");
    const monthlyRevenueEl = document.getElementById("monthlyRevenue");

    if (totalUnitsEl) {
      this.animateNumber(totalUnitsEl, stats.totalUnits);
    }

    if (totalResidentsEl) {
      this.animateNumber(totalResidentsEl, stats.totalResidents);
    }

    if (activeContractsEl) {
      this.animateNumber(activeContractsEl, stats.activeContracts);
    }

    if (monthlyRevenueEl) {
      const settings = db.getSettings();
      const currency = settings.currency || "ريال";
      this.animateNumber(monthlyRevenueEl, stats.monthlyRevenue, currency);
    }
  },

  /**
   * Animate number counting effect
   */
  animateNumber(element, targetValue, suffix = "") {
    const startValue = 0;
    const duration = 1000;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = Math.floor(
        startValue + (targetValue - startValue) * easeOutQuart,
      );

      if (suffix) {
        element.textContent = `${currentValue.toLocaleString("ar-SA")} ${suffix}`;
      } else {
        element.textContent = currentValue.toLocaleString("ar-SA");
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  },

  /**
   * Load alerts
   */
  loadAlerts() {
    const alertsList = document.getElementById("alertsList");
    if (!alertsList) return;

    const alerts = db.getAlerts();

    if (alerts.length === 0) {
      alertsList.innerHTML = '<p class="no-data">لا توجد تنبيهات حالياً</p>';
      return;
    }

    const alertsHtml = alerts
      .slice(0, 5)
      .map(
        (alert) => `
            <div class="alert-item alert-${alert.type}">
                <div class="alert-icon">
                    <i class="fas ${this.getAlertIcon(alert.type)}"></i>
                </div>
                <div class="alert-content">
                    <h4>${alert.title}</h4>
                    <p>${alert.message}</p>
                    <small>${this.formatDate(alert.date)}</small>
                </div>
            </div>
        `,
      )
      .join("");

    alertsList.innerHTML = alertsHtml;
  },

  /**
   * Load overdue payments
   */
  loadOverduePayments() {
    const overduePayments = document.getElementById("overduePayments");
    if (!overduePayments) return;

    const payments = db.getOverduePayments();

    if (payments.length === 0) {
      overduePayments.innerHTML =
        '<p class="no-data">لا توجد مدفوعات متأخرة</p>';
      return;
    }

    const paymentsHtml = payments
      .slice(0, 5)
      .map(
        (payment) => `
            <div class="payment-item">
                <div class="payment-info">
                    <h4>${payment.residentName}</h4>
                    <p>المبلغ: ${payment.amount.toLocaleString("ar-SA")} ${db.getSettings().currency || "ريال"}</p>
                    <small>متأخر ${payment.daysOverdue} يوم</small>
                </div>
                <div class="payment-actions">
                    <button class="btn btn-sm btn-primary" onclick="Dashboard.contactResident('${payment.residentId}')">
                        <i class="fas fa-phone"></i>
                    </button>
                </div>
            </div>
        `,
      )
      .join("");

    overduePayments.innerHTML = paymentsHtml;
  },

  /**
   * Create charts and visualizations
   */
  createCharts() {
    this.createOccupancyChart();
    this.createRevenueChart();
    this.createMaintenanceChart();
  },

  /**
   * Create occupancy chart
   */
  createOccupancyChart() {
    // Add occupancy chart to dashboard
    const dashboardGrid = document.querySelector(".dashboard-grid");
    if (!dashboardGrid) return;

    const stats = db.getStatistics();

    // Check if chart already exists
    let chartCard = document.getElementById("occupancyChart");
    if (!chartCard) {
      chartCard = document.createElement("div");
      chartCard.id = "occupancyChart";
      chartCard.className = "dashboard-card";
      dashboardGrid.appendChild(chartCard);
    }

    chartCard.innerHTML = `
            <div class="card-header">
                <h3>معدل الإشغال</h3>
                <i class="fas fa-chart-pie"></i>
            </div>
            <div class="card-content">
                <div class="chart-container">
                    <canvas id="occupancyChartCanvas" width="300" height="200"></canvas>
                </div>
                <div class="chart-legend">
                    <div class="legend-item">
                        <span class="legend-color" style="background: var(--success-color);"></span>
                        <span>مشغولة (${stats.occupiedUnits})</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-color" style="background: var(--warning-color);"></span>
                        <span>فارغة (${stats.availableUnits})</span>
                    </div>
                </div>
            </div>
        `;

    // Draw pie chart
    setTimeout(() => {
      this.drawPieChart("occupancyChartCanvas", [
        { label: "مشغولة", value: stats.occupiedUnits, color: "#48bb78" },
        { label: "فارغة", value: stats.availableUnits, color: "#ed8936" },
      ]);
    }, 100);
  },

  /**
   * Create revenue chart
   */
  createRevenueChart() {
    const dashboardGrid = document.querySelector(".dashboard-grid");
    if (!dashboardGrid) return;

    // Check if chart already exists
    let chartCard = document.getElementById("revenueChart");
    if (!chartCard) {
      chartCard = document.createElement("div");
      chartCard.id = "revenueChart";
      chartCard.className = "dashboard-card";
      dashboardGrid.appendChild(chartCard);
    }

    // Get revenue data for last 6 months
    const revenueData = this.getRevenueData();

    chartCard.innerHTML = `
            <div class="card-header">
                <h3>الإيرادات الشهرية</h3>
                <i class="fas fa-chart-line"></i>
            </div>
            <div class="card-content">
                <div class="chart-container">
                    <canvas id="revenueChartCanvas" width="400" height="200"></canvas>
                </div>
            </div>
        `;

    // Draw line chart
    setTimeout(() => {
      this.drawLineChart("revenueChartCanvas", revenueData);
    }, 100);
  },

  /**
   * Create maintenance chart
   */
  createMaintenanceChart() {
    const dashboardGrid = document.querySelector(".dashboard-grid");
    if (!dashboardGrid) return;

    // Check if chart already exists
    let chartCard = document.getElementById("maintenanceChart");
    if (!chartCard) {
      chartCard = document.createElement("div");
      chartCard.id = "maintenanceChart";
      chartCard.className = "dashboard-card";
      dashboardGrid.appendChild(chartCard);
    }

    const maintenanceData = this.getMaintenanceData();

    chartCard.innerHTML = `
            <div class="card-header">
                <h3>حالة طلبات الصيانة</h3>
                <i class="fas fa-tools"></i>
            </div>
            <div class="card-content">
                <div class="chart-container">
                    <canvas id="maintenanceChartCanvas" width="300" height="200"></canvas>
                </div>
                <div class="chart-legend">
                    <div class="legend-item">
                        <span class="legend-color" style="background: var(--warning-color);"></span>
                        <span>معلقة (${maintenanceData.pending})</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-color" style="background: var(--info-color);"></span>
                        <span>قيد التنفيذ (${maintenanceData.inProgress})</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-color" style="background: var(--success-color);"></span>
                        <span>مكتملة (${maintenanceData.completed})</span>
                    </div>
                </div>
            </div>
        `;

    // Draw doughnut chart
    setTimeout(() => {
      this.drawDoughnutChart("maintenanceChartCanvas", [
        { label: "معلقة", value: maintenanceData.pending, color: "#ed8936" },
        {
          label: "قيد التنفيذ",
          value: maintenanceData.inProgress,
          color: "#4299e1",
        },
        { label: "مكتملة", value: maintenanceData.completed, color: "#48bb78" },
      ]);
    }, 100);
  },

  /**
   * Get revenue data for charts
   */
  getRevenueData() {
    const payments = db.getTable("payments");
    const months = [];
    const revenues = [];

    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);

      const monthName = date.toLocaleDateString("ar-SA", { month: "long" });
      const monthRevenue = payments
        .filter((payment) => {
          const paymentDate = new Date(payment.date);
          return (
            paymentDate.getMonth() === date.getMonth() &&
            paymentDate.getFullYear() === date.getFullYear() &&
            payment.status === "paid"
          );
        })
        .reduce((sum, payment) => sum + (payment.amount || 0), 0);

      months.push(monthName);
      revenues.push(monthRevenue);
    }

    return { months, revenues };
  },

  /**
   * Get maintenance data for charts
   */
  getMaintenanceData() {
    const maintenance = db.getTable("maintenance");

    return {
      pending: maintenance.filter((m) => m.status === "pending").length,
      inProgress: maintenance.filter((m) => m.status === "in_progress").length,
      completed: maintenance.filter((m) => m.status === "completed").length,
    };
  },

  /**
   * Draw pie chart
   */
  drawPieChart(canvasId, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate total
    const total = data.reduce((sum, item) => sum + item.value, 0);

    if (total === 0) {
      // Draw empty state
      ctx.fillStyle = "#e2e8f0";
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = "#718096";
      ctx.font = "16px Cairo";
      ctx.textAlign = "center";
      ctx.fillText("لا توجد بيانات", centerX, centerY);
      return;
    }

    let currentAngle = -Math.PI / 2; // Start from top

    data.forEach((item) => {
      const sliceAngle = (item.value / total) * 2 * Math.PI;

      // Draw slice
      ctx.fillStyle = item.color;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(
        centerX,
        centerY,
        radius,
        currentAngle,
        currentAngle + sliceAngle,
      );
      ctx.closePath();
      ctx.fill();

      // Draw border
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.stroke();

      currentAngle += sliceAngle;
    });

    // Draw center circle for doughnut effect
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue(
      "--bg-secondary",
    );
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.6, 0, 2 * Math.PI);
    ctx.fill();

    // Draw percentage in center
    const percentage = Math.round((data[0].value / total) * 100);
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue(
      "--text-primary",
    );
    ctx.font = "bold 24px Cairo";
    ctx.textAlign = "center";
    ctx.fillText(`${percentage}%`, centerX, centerY - 5);

    ctx.font = "14px Cairo";
    ctx.fillText("معدل الإشغال", centerX, centerY + 15);
  },

  /**
   * Draw doughnut chart
   */
  drawDoughnutChart(canvasId, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate total
    const total = data.reduce((sum, item) => sum + item.value, 0);

    if (total === 0) {
      // Draw empty state
      ctx.fillStyle = "#e2e8f0";
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = "#718096";
      ctx.font = "16px Cairo";
      ctx.textAlign = "center";
      ctx.fillText("لا توجد بيانات", centerX, centerY);
      return;
    }

    let currentAngle = -Math.PI / 2; // Start from top

    data.forEach((item) => {
      const sliceAngle = (item.value / total) * 2 * Math.PI;

      // Draw slice
      ctx.fillStyle = item.color;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(
        centerX,
        centerY,
        radius,
        currentAngle,
        currentAngle + sliceAngle,
      );
      ctx.closePath();
      ctx.fill();

      // Draw border
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.stroke();

      currentAngle += sliceAngle;
    });

    // Draw center circle for doughnut effect
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue(
      "--bg-secondary",
    );
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.5, 0, 2 * Math.PI);
    ctx.fill();

    // Draw total in center
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue(
      "--text-primary",
    );
    ctx.font = "bold 20px Cairo";
    ctx.textAlign = "center";
    ctx.fillText(total.toString(), centerX, centerY - 5);

    ctx.font = "12px Cairo";
    ctx.fillText("إجمالي الطلبات", centerX, centerY + 15);
  },

  /**
   * Draw line chart
   */
  drawLineChart(canvasId, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const padding = 40;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const maxValue = Math.max(...data.revenues, 1);
    const stepX = chartWidth / (data.months.length - 1);

    // Draw grid lines
    ctx.strokeStyle = getComputedStyle(
      document.documentElement,
    ).getPropertyValue("--border-color");
    ctx.lineWidth = 1;

    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + chartWidth, y);
      ctx.stroke();
    }

    // Vertical grid lines
    for (let i = 0; i < data.months.length; i++) {
      const x = padding + stepX * i;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, padding + chartHeight);
      ctx.stroke();
    }

    // Draw line
    ctx.strokeStyle = "#667eea";
    ctx.lineWidth = 3;
    ctx.beginPath();

    data.revenues.forEach((revenue, index) => {
      const x = padding + stepX * index;
      const y = padding + chartHeight - (revenue / maxValue) * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw points
    ctx.fillStyle = "#667eea";
    data.revenues.forEach((revenue, index) => {
      const x = padding + stepX * index;
      const y = padding + chartHeight - (revenue / maxValue) * chartHeight;

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Draw labels
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue(
      "--text-secondary",
    );
    ctx.font = "12px Cairo";
    ctx.textAlign = "center";

    // Month labels
    data.months.forEach((month, index) => {
      const x = padding + stepX * index;
      ctx.fillText(month, x, canvas.height - 10);
    });

    // Value labels
    ctx.textAlign = "right";
    for (let i = 0; i <= 5; i++) {
      const value = (maxValue / 5) * (5 - i);
      const y = padding + (chartHeight / 5) * i + 5;
      ctx.fillText(Math.round(value).toLocaleString("ar-SA"), padding - 10, y);
    }
  },

  /**
   * Get alert icon based on type
   */
  getAlertIcon(type) {
    const icons = {
      warning: "fa-exclamation-triangle",
      danger: "fa-exclamation-circle",
      info: "fa-info-circle",
      success: "fa-check-circle",
    };
    return icons[type] || icons.info;
  },

  /**
   * Format date for display
   */
  formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return "اليوم";
    } else if (diffDays === 2) {
      return "أمس";
    } else if (diffDays <= 7) {
      return `منذ ${diffDays} أيام`;
    } else {
      return date.toLocaleDateString("ar-SA");
    }
  },

  /**
   * Contact resident (placeholder function)
   */
  contactResident(residentId) {
    const resident = db.getRecord("residents", residentId);
    if (resident && resident.phone) {
      window.open(`tel:${resident.phone}`);
    } else {
      app.showNotification("لا يوجد رقم هاتف للمقيم", "warning");
    }
  },
};

// Add chart styles
const chartStyles = document.createElement("style");
chartStyles.textContent = `
    .chart-container {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px;
        min-height: 200px;
    }
    
    .chart-legend {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        justify-content: center;
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid var(--border-color);
    }
    
    .legend-item {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.9rem;
        color: var(--text-secondary);
    }
    
    .legend-color {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        display: block;
    }
    
    .alert-item {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 12px;
        margin-bottom: 12px;
        border-radius: 8px;
        background: var(--bg-primary);
        border-right: 4px solid;
    }
    
    .alert-item.alert-warning {
        border-right-color: var(--warning-color);
    }
    
    .alert-item.alert-danger {
        border-right-color: var(--error-color);
    }
    
    .alert-item.alert-info {
        border-right-color: var(--info-color);
    }
    
    .alert-item.alert-success {
        border-right-color: var(--success-color);
    }
    
    .alert-icon {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.9rem;
        color: white;
        flex-shrink: 0;
    }
    
    .alert-item.alert-warning .alert-icon {
        background: var(--warning-color);
    }
    
    .alert-item.alert-danger .alert-icon {
        background: var(--error-color);
    }
    
    .alert-item.alert-info .alert-icon {
        background: var(--info-color);
    }
    
    .alert-item.alert-success .alert-icon {
        background: var(--success-color);
    }
    
    .alert-content h4 {
        font-size: 1rem;
        font-weight: 600;
        margin-bottom: 4px;
        color: var(--text-primary);
    }
    
    .alert-content p {
        font-size: 0.9rem;
        color: var(--text-secondary);
        margin-bottom: 4px;
        line-height: 1.4;
    }
    
    .alert-content small {
        font-size: 0.8rem;
        color: var(--text-muted);
    }
    
    .payment-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px;
        margin-bottom: 12px;
        border-radius: 8px;
        background: var(--bg-primary);
        border-right: 4px solid var(--error-color);
    }
    
    .payment-info h4 {
        font-size: 1rem;
        font-weight: 600;
        margin-bottom: 4px;
        color: var(--text-primary);
    }
    
    .payment-info p {
        font-size: 0.9rem;
        color: var(--text-secondary);
        margin-bottom: 2px;
    }
    
    .payment-info small {
        font-size: 0.8rem;
        color: var(--error-color);
        font-weight: 500;
    }
    
    .payment-actions {
        display: flex;
        gap: 8px;
    }
    
    @media (max-width: 768px) {
        .chart-legend {
            flex-direction: column;
            align-items: flex-start;
        }
        
        .payment-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
        }
        
        .payment-actions {
            align-self: flex-end;
        }
    }
`;
document.head.appendChild(chartStyles);
