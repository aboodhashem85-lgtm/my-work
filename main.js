/**
 * Main Application Logic
 * Handles core functionality, navigation, and application state
 */

class BuildingManagementApp {
  constructor() {
    this.currentPage = "dashboard";
    this.isLoggedIn = false;
    this.currentTheme = "light";
    this.sidebarCollapsed = false;

    this.init();
  }

  /**
   * Initialize the application
   */
  init() {
    this.loadTheme();
    this.checkLoginStatus();
    this.bindEvents();
    this.updateUI();
  }

  /**
   * Check if user is logged in
   */
  checkLoginStatus() {
    const loginStatus = sessionStorage.getItem("isLoggedIn");
    this.isLoggedIn = loginStatus === "true";

    if (this.isLoggedIn) {
      this.showMainApp();
    } else {
      this.showLoginScreen();
    }
  }

  /**
   * Load theme from settings
   */
  loadTheme() {
    const settings = db.getSettings();
    this.currentTheme = settings.theme || "light";
    document.documentElement.setAttribute("data-theme", this.currentTheme);

    // Update theme toggle icon
    const themeToggle = document.getElementById("themeToggle");
    if (themeToggle) {
      const icon = themeToggle.querySelector("i");
      if (icon)
        icon.className =
          this.currentTheme === "light" ? "fas fa-moon" : "fas fa-sun";
    }
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Login form
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
      loginForm.addEventListener("submit", (e) => this.handleLogin(e));
    }

    // Navigation links
    document.addEventListener("click", (e) => {
      if (e.target.matches(".nav-link") || e.target.closest(".nav-link")) {
        e.preventDefault();
        const link = e.target.closest(".nav-link");
        const page = link.getAttribute("data-page");
        if (page) {
          this.navigateToPage(page);
        }
      }
    });

    // Sidebar toggle
    const sidebarToggle = document.getElementById("sidebarToggle");
    if (sidebarToggle) {
      sidebarToggle.addEventListener("click", () => this.toggleSidebar());
    }

    // Theme toggle
    const themeToggle = document.getElementById("themeToggle");
    if (themeToggle) {
      themeToggle.addEventListener("click", () => this.toggleTheme());
    }

    // Logout button
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => this.logout());
    }

    // Modal close events
    document.addEventListener("click", (e) => {
      if (
        e.target.matches(".modal-close") ||
        e.target.closest(".modal-close")
      ) {
        this.closeModal();
      }

      if (e.target.matches(".modal-container")) {
        this.closeModal();
      }
    });

    // Escape key to close modal
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeModal();
      }
    });

    // Responsive sidebar
    window.addEventListener("resize", () => {
      if (window.innerWidth <= 768) {
        this.sidebarCollapsed = true;
        this.updateSidebar();
      }
    });
  }

  /**
   * Handle login form submission
   */
  handleLogin(e) {
    e.preventDefault();

    const passwordInput = document.getElementById("password");
    const password = passwordInput.value;

    if (db.verifyPassword(password)) {
      this.isLoggedIn = true;
      sessionStorage.setItem("isLoggedIn", "true");
      this.showMainApp();
      this.showNotification("تم تسجيل الدخول بنجاح", "success");
    } else {
      this.showNotification("كلمة المرور غير صحيحة", "error");
      passwordInput.value = "";
      passwordInput.focus();
    }
  }

  /**
   * Show login screen
   */
  showLoginScreen() {
    const loginScreen = document.getElementById("loginScreen");
    const mainApp = document.getElementById("mainApp");

    if (loginScreen) loginScreen.style.display = "flex";
    if (mainApp) mainApp.style.display = "none";
  }

  /**
   * Show main application
   */
  showMainApp() {
    const loginScreen = document.getElementById("loginScreen");
    const mainApp = document.getElementById("mainApp");

    if (loginScreen) loginScreen.style.display = "none";
    if (mainApp) mainApp.style.display = "flex";

    // Load dashboard by default
    this.navigateToPage("dashboard");
  }

  /**
   * Centralized notification API used across the app and portal.
   * Delegates to advancedFeatures.showNotification when available; otherwise
   * falls back to creating/using `.bms-toast-container` so the styling is
   * consistent with the portal.
   */
  showNotification(message, type = "info", duration = 5000) {
    try {
      if (
        typeof window.advancedFeatures !== "undefined" &&
        typeof window.advancedFeatures.showNotification === "function"
      ) {
        // Let advanced features render notifications (it prefers .bms-toast-container)
        window.advancedFeatures.showNotification(message, type, duration);
        return;
      }

      // Fallback: use or create the portal-style toast container
      let container = document.querySelector(".bms-toast-container");
      if (!container) {
        container = document.createElement("div");
        container.className = "bms-toast-container";
        // Keep it visually accessible on all pages
        container.style.cssText =
          "position: fixed; left: 16px; bottom: 16px; z-index: 1200; display:flex; flex-direction:column; gap:8px;";
        document.body.appendChild(container);
      }

      const toast = document.createElement("div");
      toast.className = `bms-toast ${type}`;
      toast.textContent = message;

      const close = document.createElement("button");
      close.className = "notification-close";
      close.style.cssText =
        "background:none;border:none;color:inherit;margin-left:8px;cursor:pointer;";
      close.innerHTML = '<i class="fas fa-times"></i>';
      close.addEventListener("click", () => toast.remove());
      toast.appendChild(close);

      container.appendChild(toast);

      if (duration > 0)
        setTimeout(() => {
          toast.remove();
        }, duration);
    } catch (err) {
      console.warn("showNotification failed", err);
    }
  }

  /**
   * Navigate to a specific page
   */
  navigateToPage(page) {
    // Update current page
    this.currentPage = page;

    // Update navigation active state
    document.querySelectorAll(".nav-item").forEach((item) => {
      item.classList.remove("active");
    });

    const navEl = document.querySelector(`[data-page="${page}"]`);
    const activeNavItem = navEl ? navEl.closest(".nav-item") : null;
    if (activeNavItem) activeNavItem.classList.add("active");

    // Update page title
    const pageTitle = document.getElementById("pageTitle");
    if (pageTitle) {
      pageTitle.textContent = this.getPageTitle(page);
    }

    // Hide all page contents
    document.querySelectorAll(".page-content").forEach((content) => {
      content.classList.remove("active");
    });

    // Show current page content
    const currentContent = document.getElementById(`${page}Content`);
    if (currentContent) {
      currentContent.classList.add("active");
    }

    // Load page-specific content
    this.loadPageContent(page);

    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
      this.closeSidebar();
    }
  }

  /**
   * Get page title in Arabic
   */
  getPageTitle(page) {
    const titles = {
      dashboard: "لوحة التحكم",
      units: "إدارة الشقق",
      residents: "إدارة السكان",
      contracts: "إدارة العقود",
      payments: "إدارة المدفوعات",
      maintenance: "إدارة الصيانة",
      inventory: "إدارة المخزون",
      reports: "التقارير والإحصائيات",
      settings: "الإعدادات",
    };

    return titles[page] || "نظام إدارة المباني";
  }

  /**
   * Load page-specific content
   */
  loadPageContent(page) {
    switch (page) {
      case "dashboard":
        if (window.Dashboard) {
          window.Dashboard.load();
        }
        break;
      case "units":
        if (window.Units) {
          window.Units.load();
        }
        break;
      case "residents":
        if (window.Residents) {
          window.Residents.load();
        }
        break;
      case "contracts":
        if (window.Contracts) {
          window.Contracts.load();
        }
        break;
      case "payments":
        if (window.Payments) {
          window.Payments.load();
        }
        break;
      case "maintenance":
        if (window.Maintenance) {
          window.Maintenance.load();
        }
        break;
      case "inventory":
        if (window.Inventory) {
          window.Inventory.load();
        }
        break;
      case "reports":
        if (window.Reports) {
          window.Reports.load();
        }
        break;
      case "settings":
        this.loadSettings();
        break;
    }
  }

  /**
   * Toggle sidebar
   */
  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    this.updateSidebar();
  }

  /**
   * Close sidebar (mobile)
   */
  closeSidebar() {
    const sidebar = document.querySelector(".sidebar");
    if (sidebar) {
      sidebar.classList.remove("open");
    }
  }

  /**
   * Update sidebar state
   */
  updateSidebar() {
    const sidebar = document.querySelector(".sidebar");
    if (sidebar) {
      if (this.sidebarCollapsed) {
        sidebar.classList.add("collapsed");
      } else {
        sidebar.classList.remove("collapsed");
      }
    }
  }

  /**
   * Toggle theme
   */
  toggleTheme() {
    this.currentTheme = this.currentTheme === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", this.currentTheme);

    // Update theme toggle icon
    const themeToggle = document.getElementById("themeToggle");
    if (themeToggle) {
      const icon = themeToggle.querySelector("i");
      icon.className =
        this.currentTheme === "light" ? "fas fa-moon" : "fas fa-sun";
    }

    // Save theme to settings
    db.updateSettings({ theme: this.currentTheme });

    this.showNotification(
      `تم التبديل إلى الوضع ${this.currentTheme === "light" ? "الفاتح" : "الداكن"}`,
      "info",
    );
  }

  /**
   * Logout user
   */
  logout() {
    this.isLoggedIn = false;
    sessionStorage.removeItem("isLoggedIn");
    this.showLoginScreen();
    this.showNotification("تم تسجيل الخروج بنجاح", "info");

    // Clear password field
    const passwordInput = document.getElementById("password");
    if (passwordInput) {
      passwordInput.value = "";
    }
  }

  /**
   * Update UI elements
   */
  updateUI() {
    // Update building name in header if available
    const settings = db.getSettings();
    if (settings.buildingName) {
      const logoText = document.querySelector(".sidebar-header .logo span");
      if (logoText) logoText.textContent = settings.buildingName;
    }
  }

  /**
   * Show notification
   */
  showNotification(message, type = "info", duration = 3000) {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll(".notification");
    existingNotifications.forEach((notification) => notification.remove());

    // Create notification element
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;

    // Add styles
    notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--bg-secondary);
            color: var(--text-primary);
            padding: 16px 20px;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            z-index: 10001;
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 300px;
            animation: slideInDown 0.3s ease;
            border-left: 4px solid ${this.getNotificationColor(type)};
        `;

    // Add to document
    if (document && document.body) document.body.appendChild(notification);

    // Close button event
    const closeBtn = notification.querySelector(".notification-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        notification.style.animation = "slideOutUp 0.3s ease";
        setTimeout(() => notification.remove(), 300);
      });
    }

    // Auto remove
    if (duration > 0) {
      setTimeout(() => {
        if (notification.parentNode) {
          notification.style.animation = "slideOutUp 0.3s ease";
          setTimeout(() => notification.remove(), 300);
        }
      }, duration);
    }
  }

  /**
   * Get notification icon based on type
   */
  getNotificationIcon(type) {
    const icons = {
      success: "fa-check-circle",
      error: "fa-exclamation-circle",
      warning: "fa-exclamation-triangle",
      info: "fa-info-circle",
    };
    return icons[type] || icons.info;
  }

  /**
   * Get notification color based on type
   */
  getNotificationColor(type) {
    const colors = {
      success: "#48bb78",
      error: "#f56565",
      warning: "#ed8936",
      info: "#4299e1",
    };
    return colors[type] || colors.info;
  }

  /**
   * Show loading overlay
   */
  showLoading() {
    const loadingOverlay = document.getElementById("loadingOverlay");
    if (loadingOverlay) {
      loadingOverlay.style.display = "flex";
    }
  }

  /**
   * Hide loading overlay
   */
  hideLoading() {
    const loadingOverlay = document.getElementById("loadingOverlay");
    if (loadingOverlay) {
      loadingOverlay.style.display = "none";
    }
  }

  /**
   * Show modal
   */
  showModal(title, content, buttons = []) {
    const modalContainer = document.getElementById("modalContainer");
    if (!modalContainer) return;

    const modal = document.createElement("div");
    modal.className = "modal";

    const buttonsHtml = buttons
      .map(
        (button) =>
          `<button class="btn ${button.class || "btn-secondary"}" onclick="${button.onclick || ""}">${button.text}</button>`,
      )
      .join("");

    modal.innerHTML = `
            <div class="modal-header">
                <h3>${title}</h3>
                <button class="modal-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                ${content}
            </div>
            ${buttons.length > 0 ? `<div class="modal-footer">${buttonsHtml}</div>` : ""}
        `;

    modalContainer.innerHTML = "";
    modalContainer.appendChild(modal);
    modalContainer.style.display = "flex";

    // Focus first input if available
    const firstInput = modal.querySelector("input, select, textarea");
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100);
    }
  }

  /**
   * Close modal
   */
  closeModal() {
    const modalContainer = document.getElementById("modalContainer");
    if (modalContainer) {
      modalContainer.style.display = "none";
      modalContainer.innerHTML = "";
    }
  }

  /**
   * Confirm dialog
   */
  confirm(message, onConfirm, onCancel = null) {
    this.showModal("تأكيد", `<p>${message}</p>`, [
      {
        text: "إلغاء",
        class: "btn-secondary",
        onclick: `app.closeModal(); ${onCancel ? onCancel + "()" : ""}`,
      },
      {
        text: "تأكيد",
        class: "btn-primary",
        onclick: `app.closeModal(); ${onConfirm}()`,
      },
    ]);
  }

  /**
   * Load settings page
   */
  loadSettings() {
    const settingsContent = document.getElementById("settingsContent");
    if (!settingsContent) return;

    const settings = db.getSettings();

    settingsContent.innerHTML = `
            <div class="settings-container">
                <div class="settings-grid">
                    <div class="settings-card neu-flat">
                        <div class="card-header">
                            <h3>معلومات المبنى</h3>
                            <i class="fas fa-building"></i>
                        </div>
                        <div class="card-content">
                            <form id="buildingInfoForm">
                                <div class="form-group">
                                    <label for="buildingName">اسم المبنى</label>
                                    <input type="text" id="buildingName" class="form-control" value="${settings.buildingName || ""}" placeholder="أدخل اسم المبنى">
                                </div>
                                <div class="form-group">
                                    <label for="buildingAddress">عنوان المبنى</label>
                                    <textarea id="buildingAddress" class="form-control" placeholder="أدخل عنوان المبنى">${settings.buildingAddress || ""}</textarea>
                                </div>
                                <div class="form-group">
                                    <label for="buildingPhone">هاتف المبنى</label>
                                    <input type="tel" id="buildingPhone" class="form-control" value="${settings.buildingPhone || ""}" placeholder="أدخل رقم الهاتف">
                                </div>
                                <button type="submit" class="btn btn-primary">
                                    <i class="fas fa-save"></i>
                                    حفظ المعلومات
                                </button>
                            </form>
                        </div>
                    </div>
                    
                    <div class="settings-card neu-flat">
                        <div class="card-header">
                            <h3>الأمان</h3>
                            <i class="fas fa-shield-alt"></i>
                        </div>
                        <div class="card-content">
                            <form id="passwordForm">
                                <div class="form-group">
                                    <label for="currentPassword">كلمة المرور الحالية</label>
                                    <input type="password" id="currentPassword" class="form-control" placeholder="أدخل كلمة المرور الحالية">
                                </div>
                                <div class="form-group">
                                    <label for="newPassword">كلمة المرور الجديدة</label>
                                    <input type="password" id="newPassword" class="form-control" placeholder="أدخل كلمة المرور الجديدة">
                                </div>
                                <div class="form-group">
                                    <label for="confirmPassword">تأكيد كلمة المرور</label>
                                    <input type="password" id="confirmPassword" class="form-control" placeholder="أعد إدخال كلمة المرور الجديدة">
                                </div>
                                <button type="submit" class="btn btn-primary">
                                    <i class="fas fa-key"></i>
                                    تغيير كلمة المرور
                                </button>
                            </form>
                        </div>
                    </div>
                    
                    <div class="settings-card neu-flat">
                        <div class="card-header">
                            <h3>النسخ الاحتياطي</h3>
                            <i class="fas fa-database"></i>
                        </div>
                        <div class="card-content">
                            <div class="backup-actions">
                                <button class="btn btn-success" onclick="app.exportData()">
                                    <i class="fas fa-download"></i>
                                    تصدير البيانات
                                </button>
                                <button class="btn btn-warning" onclick="app.importData()">
                                    <i class="fas fa-upload"></i>
                                    استيراد البيانات
                                </button>
                                <button class="btn btn-danger" onclick="app.resetData()">
                                    <i class="fas fa-trash"></i>
                                    إعادة تعيين البيانات
                                </button>
                            </div>
                            <div class="backup-info">
                                <p class="text-muted">
                                    آخر نسخة احتياطية: ${settings.lastBackup ? new Date(settings.lastBackup).toLocaleDateString("ar-SA") : "لم يتم إنشاء نسخة احتياطية"}
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="settings-card neu-flat">
                        <div class="card-header">
                            <h3>الإعدادات العامة</h3>
                            <i class="fas fa-cog"></i>
                        </div>
                        <div class="card-content">
                            <form id="generalSettingsForm">
                                <div class="form-group">
                                    <label for="currency">العملة</label>
                                    <select id="currency" class="form-control">
                                        <option value="ريال" ${settings.currency === "ريال" ? "selected" : ""}>ريال سعودي</option>
                                        <option value="درهم" ${settings.currency === "درهم" ? "selected" : ""}>درهم إماراتي</option>
                                        <option value="دينار" ${settings.currency === "دينار" ? "selected" : ""}>دينار كويتي</option>
                                        <option value="جنيه" ${settings.currency === "جنيه" ? "selected" : ""}>جنيه مصري</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="dateFormat">نوع التاريخ</label>
                                    <select id="dateFormat" class="form-control">
                                        <option value="gregorian" ${settings.dateFormat === "gregorian" ? "selected" : ""}>ميلادي</option>
                                        <option value="hijri" ${settings.dateFormat === "hijri" ? "selected" : ""}>هجري</option>
                                    </select>
                                </div>
                                <button type="submit" class="btn btn-primary">
                                    <i class="fas fa-save"></i>
                                    حفظ الإعدادات
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;

    // Bind form events
    this.bindSettingsEvents();
  }

  /**
   * Bind settings form events
   */
  bindSettingsEvents() {
    // Building info form
    const buildingInfoForm = document.getElementById("buildingInfoForm");
    if (buildingInfoForm) {
      buildingInfoForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.saveBuildingInfo();
      });
    }

    // Password form
    const passwordForm = document.getElementById("passwordForm");
    if (passwordForm) {
      passwordForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.changePassword();
      });
    }

    // General settings form
    const generalSettingsForm = document.getElementById("generalSettingsForm");
    if (generalSettingsForm) {
      generalSettingsForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.saveGeneralSettings();
      });
    }
  }

  /**
   * Save building information
   */
  saveBuildingInfo() {
    const buildingName = document.getElementById("buildingName").value;
    const buildingAddress = document.getElementById("buildingAddress").value;
    const buildingPhone = document.getElementById("buildingPhone").value;

    const success = db.updateSettings({
      buildingName,
      buildingAddress,
      buildingPhone,
    });

    if (success) {
      this.showNotification("تم حفظ معلومات المبنى بنجاح", "success");
      this.updateUI();
    } else {
      this.showNotification("حدث خطأ أثناء حفظ المعلومات", "error");
    }
  }

  /**
   * Change password
   */
  changePassword() {
    const currentPassword = document.getElementById("currentPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (!db.verifyPassword(currentPassword)) {
      this.showNotification("كلمة المرور الحالية غير صحيحة", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      this.showNotification("كلمة المرور الجديدة غير متطابقة", "error");
      return;
    }

    if (newPassword.length < 3) {
      this.showNotification(
        "كلمة المرور يجب أن تكون 3 أحرف على الأقل",
        "error",
      );
      return;
    }

    const success = db.changePassword(newPassword);

    if (success) {
      this.showNotification("تم تغيير كلمة المرور بنجاح", "success");
      document.getElementById("passwordForm").reset();
    } else {
      this.showNotification("حدث خطأ أثناء تغيير كلمة المرور", "error");
    }
  }

  /**
   * Save general settings
   */
  saveGeneralSettings() {
    const currency = document.getElementById("currency").value;
    const dateFormat = document.getElementById("dateFormat").value;

    const success = db.updateSettings({
      currency,
      dateFormat,
    });

    if (success) {
      this.showNotification("تم حفظ الإعدادات بنجاح", "success");
    } else {
      this.showNotification("حدث خطأ أثناء حفظ الإعدادات", "error");
    }
  }

  /**
   * Export data
   */
  exportData() {
    const data = db.exportData();
    if (data) {
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `building-management-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Update last backup date
      db.updateSettings({ lastBackup: new Date().toISOString() });

      this.showNotification("تم تصدير البيانات بنجاح", "success");
    } else {
      this.showNotification("حدث خطأ أثناء تصدير البيانات", "error");
    }
  }

  /**
   * Import data
   */
  importData() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";

    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const success = db.importData(e.target.result);
          if (success) {
            this.showNotification("تم استيراد البيانات بنجاح", "success");
            // Reload current page
            this.loadPageContent(this.currentPage);
          } else {
            this.showNotification("حدث خطأ أثناء استيراد البيانات", "error");
          }
        };
        reader.readAsText(file);
      }
    };

    input.click();
  }

  /**
   * Reset all data
   */
  resetData() {
    this.confirm(
      "هل أنت متأكد من إعادة تعيين جميع البيانات؟ سيتم حذف جميع المعلومات نهائياً.",
      "app.confirmResetData",
    );
  }

  /**
   * Confirm reset data
   */
  confirmResetData() {
    db.clearAllData();
    this.showNotification("تم إعادة تعيين البيانات بنجاح", "success");
    // Reload application
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }
}

// Initialize application when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.app = new BuildingManagementApp();
});

// Add notification animations to CSS
const notificationStyles = document.createElement("style");
notificationStyles.textContent = `
    @keyframes slideInDown {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(-100%);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }
    
    @keyframes slideOutUp {
        from {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
        to {
            opacity: 0;
            transform: translateX(-50%) translateY(-100%);
        }
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: all 0.3s ease;
    }
    
    .notification-close:hover {
        background: var(--bg-primary);
        color: var(--text-primary);
    }
    
    .settings-container {
        max-width: 1200px;
        margin: 0 auto;
    }
    
    .settings-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
        gap: 20px;
    }
    
    .settings-card {
        background: var(--bg-secondary);
        border-radius: 16px;
        overflow: hidden;
    }
    
    .backup-actions {
        display: flex;
        gap: 12px;
        margin-bottom: 16px;
        flex-wrap: wrap;
    }
    
    .backup-info {
        padding-top: 16px;
        border-top: 1px solid var(--border-color);
    }
    
    @media (max-width: 768px) {
        .settings-grid {
            grid-template-columns: 1fr;
        }
        
        .backup-actions {
            flex-direction: column;
        }
    }
`;
document.head.appendChild(notificationStyles);
