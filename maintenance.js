/**
 * Maintenance Management Module
 * Handles maintenance requests and work orders
 */

window.Maintenance = {
  currentPage: 1,
  pageSize: 10,
  searchTerm: "",
  sortField: "createdAt",
  sortDirection: "desc",
  filterStatus: "all",
  filterPriority: "all",

  /**
   * Load maintenance management page
   */
  load() {
    this.renderMaintenancePage();
    this.loadMaintenance();
  },

  /**
   * Render the maintenance management page
   */
  renderMaintenancePage() {
    const maintenanceContent = document.getElementById("maintenanceContent");
    if (!maintenanceContent) return;

    maintenanceContent.innerHTML = `
            <div class="maintenance-container">
                <!-- Header Section -->
                <div class="page-header">
                    <div class="header-actions">
                        <button class="btn btn-primary" onclick="Maintenance.showAddMaintenanceModal()">
                            <i class="fas fa-plus"></i>
                            إضافة طلب صيانة
                        </button>
                        <button class="btn btn-secondary" onclick="Maintenance.exportMaintenance()">
                            <i class="fas fa-download"></i>
                            تصدير البيانات
                        </button>
                    </div>
                </div>

                <!-- Summary Cards -->
                <div class="summary-cards" id="maintenanceSummary">
                    <!-- Summary will be loaded here -->
                </div>

                <!-- Filters Section -->
                <div class="filters-section neu-flat">
                    <div class="filters-grid">
                        <div class="filter-group">
                            <label>البحث</label>
                            <div class="search-wrapper">
                                <input type="text" id="maintenanceSearch" class="form-control" 
                                       placeholder="البحث بالوصف أو رقم الشقة..." 
                                       value="${this.searchTerm}">
                                <i class="fas fa-search"></i>
                            </div>
                        </div>
                        <div class="filter-group">
                            <label>الحالة</label>
                            <select id="maintenanceStatusFilter" class="form-control">
                                <option value="all">جميع الحالات</option>
                                <option value="pending">معلق</option>
                                <option value="in_progress">قيد التنفيذ</option>
                                <option value="completed">مكتمل</option>
                                <option value="cancelled">ملغي</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label>الأولوية</label>
                            <select id="maintenancePriorityFilter" class="form-control">
                                <option value="all">جميع الأولويات</option>
                                <option value="low">منخفضة</option>
                                <option value="medium">متوسطة</option>
                                <option value="high">عالية</option>
                                <option value="urgent">عاجلة</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label>الترتيب</label>
                            <select id="maintenanceSortField" class="form-control">
                                <option value="createdAt">تاريخ الإنشاء</option>
                                <option value="priority">الأولوية</option>
                                <option value="status">الحالة</option>
                                <option value="scheduledDate">تاريخ الجدولة</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label>الاتجاه</label>
                            <select id="maintenanceSortDirection" class="form-control">
                                <option value="asc">تصاعدي</option>
                                <option value="desc">تنازلي</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Maintenance Grid -->
                <div class="maintenance-grid" id="maintenanceGrid">
                    <!-- Maintenance requests will be loaded here -->
                </div>

                <!-- Pagination -->
                <div id="maintenancePagination" class="pagination-container">
                    <!-- Pagination will be loaded here -->
                </div>
            </div>
        `;

    this.bindEvents();
    this.loadSummary();
  },

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Search input
    const searchInput = document.getElementById("maintenanceSearch");
    if (searchInput) {
      searchInput.addEventListener(
        "input",
        AppUtils.debounce((e) => {
          this.searchTerm = e.target.value;
          this.currentPage = 1;
          this.loadMaintenance();
        }, 300),
      );
    }

    // Status filter
    const statusFilter = document.getElementById("maintenanceStatusFilter");
    if (statusFilter) {
      statusFilter.value = this.filterStatus;
      statusFilter.addEventListener("change", (e) => {
        this.filterStatus = e.target.value;
        this.currentPage = 1;
        this.loadMaintenance();
      });
    }

    // Priority filter
    const priorityFilter = document.getElementById("maintenancePriorityFilter");
    if (priorityFilter) {
      priorityFilter.value = this.filterPriority;
      priorityFilter.addEventListener("change", (e) => {
        this.filterPriority = e.target.value;
        this.currentPage = 1;
        this.loadMaintenance();
      });
    }

    // Sort field
    const sortField = document.getElementById("maintenanceSortField");
    if (sortField) {
      sortField.value = this.sortField;
      sortField.addEventListener("change", (e) => {
        this.sortField = e.target.value;
        this.loadMaintenance();
      });
    }

    // Sort direction
    const sortDirection = document.getElementById("maintenanceSortDirection");
    if (sortDirection) {
      sortDirection.value = this.sortDirection;
      sortDirection.addEventListener("change", (e) => {
        this.sortDirection = e.target.value;
        this.loadMaintenance();
      });
    }
  },

  /**
   * Load summary statistics
   */
  loadSummary() {
    const maintenance = db.getTable("maintenance");

    const pendingCount = maintenance.filter(
      (m) => m.status === "pending",
    ).length;
    const inProgressCount = maintenance.filter(
      (m) => m.status === "in_progress",
    ).length;
    const completedCount = maintenance.filter(
      (m) => m.status === "completed",
    ).length;
    const urgentCount = maintenance.filter(
      (m) => m.priority === "urgent",
    ).length;

    const summaryHtml = `
            <div class="summary-card neu-flat pending">
                <div class="summary-icon">
                    <i class="fas fa-clock"></i>
                </div>
                <div class="summary-content">
                    <h3>${pendingCount}</h3>
                    <p>طلبات معلقة</p>
                </div>
            </div>
            
            <div class="summary-card neu-flat in-progress">
                <div class="summary-icon">
                    <i class="fas fa-cog"></i>
                </div>
                <div class="summary-content">
                    <h3>${inProgressCount}</h3>
                    <p>قيد التنفيذ</p>
                </div>
            </div>
            
            <div class="summary-card neu-flat completed">
                <div class="summary-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <div class="summary-content">
                    <h3>${completedCount}</h3>
                    <p>مكتملة</p>
                </div>
            </div>
            
            <div class="summary-card neu-flat urgent">
                <div class="summary-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="summary-content">
                    <h3>${urgentCount}</h3>
                    <p>عاجلة</p>
                </div>
            </div>
        `;

    const summaryContainer = document.getElementById("maintenanceSummary");
    if (summaryContainer) {
      summaryContainer.innerHTML = summaryHtml;
    }
  },

  /**
   * Load and display maintenance requests
   */
  loadMaintenance() {
    let maintenance = db.getTable("maintenance");

    // Enrich maintenance with unit and resident data
    const units = db.getTable("units");
    const residents = db.getTable("residents");

    maintenance = maintenance.map((request) => {
      const unit = units.find((u) => u.id === request.unitId);
      const resident = request.residentId
        ? residents.find((r) => r.id === request.residentId)
        : null;

      return {
        ...request,
        unitNumber: unit ? unit.unitNumber : "غير معروف",
        residentName: resident ? resident.name : null,
      };
    });

    // Apply search filter
    if (this.searchTerm) {
      const searchFilter = AppUtils.createSearchFilter(this.searchTerm, [
        "description",
        "unitNumber",
        "residentName",
        "category",
      ]);
      maintenance = maintenance.filter(searchFilter);
    }

    // Apply status filter
    if (this.filterStatus !== "all") {
      maintenance = maintenance.filter(
        (request) => request.status === this.filterStatus,
      );
    }

    // Apply priority filter
    if (this.filterPriority !== "all") {
      maintenance = maintenance.filter(
        (request) => request.priority === this.filterPriority,
      );
    }

    // Apply sorting
    const sorter = AppUtils.createSorter(this.sortField, this.sortDirection);
    maintenance.sort(sorter);

    // Apply pagination
    const pagination = AppUtils.paginate(
      maintenance,
      this.currentPage,
      this.pageSize,
    );

    this.renderMaintenance(pagination.data);
    this.renderPagination(pagination);
  },

  /**
   * Render maintenance grid
   */
  renderMaintenance(maintenance) {
    const maintenanceGrid = document.getElementById("maintenanceGrid");
    if (!maintenanceGrid) return;

    if (maintenance.length === 0) {
      maintenanceGrid.innerHTML = `
                <div class="no-data-message">
                    <i class="fas fa-tools"></i>
                    <h3>لا توجد طلبات صيانة</h3>
                    <p>لم يتم العثور على طلبات صيانة تطابق معايير البحث</p>
                    <button class="btn btn-primary" onclick="Maintenance.showAddMaintenanceModal()">
                        إضافة طلب صيانة
                    </button>
                </div>
            `;
      return;
    }

    const maintenanceHtml = maintenance
      .map((request) => this.renderMaintenanceCard(request))
      .join("");
    maintenanceGrid.innerHTML = maintenanceHtml;
  },

  /**
   * Render individual maintenance card
   */
  renderMaintenanceCard(request) {
    const statusInfo = this.getMaintenanceStatusInfo(request.status);
    const priorityInfo = this.getMaintenancePriorityInfo(request.priority);
    const settings = db.getSettings();

    return `
            <div class="maintenance-card neu-flat ${request.priority}" data-maintenance-id="${request.id}">
                <div class="maintenance-header">
                    <div class="maintenance-priority ${priorityInfo.class}">
                        <i class="fas ${priorityInfo.icon}"></i>
                        <span>${priorityInfo.label}</span>
                    </div>
                    <div class="maintenance-status ${statusInfo.class}">
                        <i class="fas fa-circle"></i>
                        <span>${statusInfo.label}</span>
                    </div>
                </div>
                
                <div class="maintenance-details">
                    <div class="maintenance-title">
                        <h4>${request.title || "طلب صيانة"}</h4>
                    </div>
                    
                    <div class="detail-row">
                        <span class="detail-label">الشقة:</span>
                        <span class="detail-value">شقة ${request.unitNumber}</span>
                    </div>
                    
                    ${
                      request.residentName
                        ? `
                        <div class="detail-row">
                            <span class="detail-label">المقيم:</span>
                            <span class="detail-value">${request.residentName}</span>
                        </div>
                    `
                        : ""
                    }
                    
                    <div class="detail-row">
                        <span class="detail-label">الفئة:</span>
                        <span class="detail-value">${this.getMaintenanceCategoryLabel(request.category)}</span>
                    </div>
                    
                    <div class="detail-row">
                        <span class="detail-label">تاريخ الإنشاء:</span>
                        <span class="detail-value">${AppUtils.formatDate(request.createdAt)}</span>
                    </div>
                    
                    ${
                      request.scheduledDate
                        ? `
                        <div class="detail-row">
                            <span class="detail-label">تاريخ الجدولة:</span>
                            <span class="detail-value">${AppUtils.formatDate(request.scheduledDate)}</span>
                        </div>
                    `
                        : ""
                    }
                    
                    ${
                      request.estimatedCost
                        ? `
                        <div class="detail-row">
                            <span class="detail-label">التكلفة المقدرة:</span>
                            <span class="detail-value">${AppUtils.formatCurrency(request.estimatedCost, settings.currency)}</span>
                        </div>
                    `
                        : ""
                    }
                    
                    ${
                      request.description
                        ? `
                        <div class="maintenance-description">
                            <p>${request.description.length > 100 ? request.description.substring(0, 100) + "..." : request.description}</p>
                        </div>
                    `
                        : ""
                    }
                </div>

                <div class="maintenance-actions">
                    <button class="btn btn-sm btn-primary" onclick="Maintenance.editMaintenance('${request.id}')" title="تعديل">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-info" onclick="Maintenance.viewMaintenanceDetails('${request.id}')" title="التفاصيل">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-success" onclick="Maintenance.updateMaintenanceStatus('${request.id}')" title="تحديث الحالة">
                        <i class="fas fa-sync"></i>
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="Maintenance.assignTechnician('${request.id}')" title="تعيين فني">
                        <i class="fas fa-user-cog"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="Maintenance.deleteMaintenance('${request.id}')" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
  },

  /**
   * Get maintenance status information
   */
  getMaintenanceStatusInfo(status) {
    const statusMap = {
      pending: { label: "معلق", class: "status-pending" },
      in_progress: { label: "قيد التنفيذ", class: "status-in-progress" },
      completed: { label: "مكتمل", class: "status-completed" },
      cancelled: { label: "ملغي", class: "status-cancelled" },
    };

    return statusMap[status] || statusMap.pending;
  },

  /**
   * Get maintenance priority information
   */
  getMaintenancePriorityInfo(priority) {
    const priorityMap = {
      low: { label: "منخفضة", class: "priority-low", icon: "fa-arrow-down" },
      medium: { label: "متوسطة", class: "priority-medium", icon: "fa-minus" },
      high: { label: "عالية", class: "priority-high", icon: "fa-arrow-up" },
      urgent: {
        label: "عاجلة",
        class: "priority-urgent",
        icon: "fa-exclamation-triangle",
      },
    };

    return priorityMap[priority] || priorityMap.medium;
  },

  /**
   * Get maintenance category label
   */
  getMaintenanceCategoryLabel(category) {
    const categoryMap = {
      plumbing: "سباكة",
      electrical: "كهرباء",
      hvac: "تكييف وتهوية",
      appliances: "أجهزة",
      structural: "إنشائية",
      painting: "دهان",
      cleaning: "تنظيف",
      security: "أمن",
      other: "أخرى",
    };

    return categoryMap[category] || category;
  },

  /**
   * Render pagination
   */
  renderPagination(pagination) {
    const paginationContainer = document.getElementById(
      "maintenancePagination",
    );
    if (!paginationContainer) return;

    const paginationHtml = AppUtils.createPaginationControls(
      pagination,
      "Maintenance.goToPage",
    );
    paginationContainer.innerHTML = paginationHtml;
  },

  /**
   * Go to specific page
   */
  goToPage(page) {
    this.currentPage = page;
    this.loadMaintenance();
  },

  /**
   * Show add maintenance modal
   */
  showAddMaintenanceModal() {
    // Get units and residents
    const units = db.getTable("units");
    const residents = db.getTable("residents");

    const unitsOptions = units
      .map(
        (unit) => `<option value="${unit.id}">شقة ${unit.unitNumber}</option>`,
      )
      .join("");

    const residentsOptions = residents
      .map(
        (resident) =>
          `<option value="${resident.id}">${resident.name} - ${resident.phone}</option>`,
      )
      .join("");

    const modalContent = `
            <form id="addMaintenanceForm">
                <div class="form-grid">
                    <div class="form-group">
                        <label for="maintenanceTitle">العنوان *</label>
                        <input type="text" id="maintenanceTitle" class="form-control" required 
                               placeholder="مثال: إصلاح تسريب في الحمام">
                    </div>
                    <div class="form-group">
                        <label for="maintenanceUnit">الشقة *</label>
                        <select id="maintenanceUnit" class="form-control" required>
                            <option value="">اختر الشقة</option>
                            ${unitsOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="maintenanceResident">المقيم (اختياري)</label>
                        <select id="maintenanceResident" class="form-control">
                            <option value="">اختر المقيم</option>
                            ${residentsOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="maintenanceCategory">الفئة *</label>
                        <select id="maintenanceCategory" class="form-control" required>
                            <option value="plumbing">سباكة</option>
                            <option value="electrical">كهرباء</option>
                            <option value="hvac">تكييف وتهوية</option>
                            <option value="appliances">أجهزة</option>
                            <option value="structural">إنشائية</option>
                            <option value="painting">دهان</option>
                            <option value="cleaning">تنظيف</option>
                            <option value="security">أمن</option>
                            <option value="other">أخرى</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="maintenancePriority">الأولوية *</label>
                        <select id="maintenancePriority" class="form-control" required>
                            <option value="low">منخفضة</option>
                            <option value="medium" selected>متوسطة</option>
                            <option value="high">عالية</option>
                            <option value="urgent">عاجلة</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="maintenanceStatus">الحالة *</label>
                        <select id="maintenanceStatus" class="form-control" required>
                            <option value="pending" selected>معلق</option>
                            <option value="in_progress">قيد التنفيذ</option>
                            <option value="completed">مكتمل</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="scheduledDate">تاريخ الجدولة</label>
                        <input type="date" id="scheduledDate" class="form-control">
                    </div>
                    <div class="form-group">
                        <label for="estimatedCost">التكلفة المقدرة</label>
                        <input type="number" id="estimatedCost" class="form-control" 
                               placeholder="مثال: 500" min="0" step="0.01">
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="maintenanceDescription">الوصف *</label>
                    <textarea id="maintenanceDescription" class="form-control" rows="4" required
                              placeholder="وصف تفصيلي لطلب الصيانة..."></textarea>
                </div>
                
                <div class="form-group">
                    <label for="technicianName">اسم الفني</label>
                    <input type="text" id="technicianName" class="form-control" 
                           placeholder="اسم الفني المسؤول">
                </div>
                
                <div class="form-group">
                    <label for="technicianPhone">هاتف الفني</label>
                    <input type="tel" id="technicianPhone" class="form-control" 
                           placeholder="رقم هاتف الفني">
                </div>
            </form>
        `;

    app.showModal("إضافة طلب صيانة جديد", modalContent, [
      {
        text: "إلغاء",
        class: "btn-secondary",
        onclick: "app.closeModal()",
      },
      {
        text: "إضافة الطلب",
        class: "btn-primary",
        onclick: "Maintenance.saveMaintenance()",
      },
    ]);
  },

  /**
   * Save maintenance request
   */
  saveMaintenance(maintenanceId = null) {
    const form =
      document.getElementById("addMaintenanceForm") ||
      document.getElementById("editMaintenanceForm");
    if (!form) return;

    const maintenanceData = {
      title: document.getElementById("maintenanceTitle").value.trim(),
      unitId: document.getElementById("maintenanceUnit").value,
      residentId: document.getElementById("maintenanceResident").value || null,
      category: document.getElementById("maintenanceCategory").value,
      priority: document.getElementById("maintenancePriority").value,
      status: document.getElementById("maintenanceStatus").value,
      scheduledDate: document.getElementById("scheduledDate").value || null,
      estimatedCost:
        parseFloat(document.getElementById("estimatedCost").value) || null,
      description: document
        .getElementById("maintenanceDescription")
        .value.trim(),
      technicianName:
        document.getElementById("technicianName").value.trim() || null,
      technicianPhone:
        document.getElementById("technicianPhone").value.trim() || null,
    };

    // Validation
    if (!maintenanceData.title) {
      app.showNotification("العنوان مطلوب", "error");
      return;
    }

    if (!maintenanceData.unitId) {
      app.showNotification("يرجى اختيار الشقة", "error");
      return;
    }

    if (!maintenanceData.category) {
      app.showNotification("الفئة مطلوبة", "error");
      return;
    }

    if (!maintenanceData.description) {
      app.showNotification("الوصف مطلوب", "error");
      return;
    }

    if (
      maintenanceData.technicianPhone &&
      !AppUtils.validatePhone(maintenanceData.technicianPhone)
    ) {
      app.showNotification("رقم هاتف الفني غير صحيح", "error");
      return;
    }

    let success;
    if (maintenanceId) {
      success = db.updateRecord("maintenance", maintenanceId, maintenanceData);
    } else {
      success = db.addRecord("maintenance", maintenanceData);
    }

    if (success) {
      app.closeModal();
      this.loadMaintenance();
      this.loadSummary();
      app.showNotification(
        maintenanceId
          ? "تم تحديث طلب الصيانة بنجاح"
          : "تم إضافة طلب الصيانة بنجاح",
        "success",
      );
    } else {
      app.showNotification("حدث خطأ أثناء حفظ البيانات", "error");
    }
  },

  /**
   * Edit maintenance request
   */
  editMaintenance(maintenanceId) {
    const maintenance = db.getRecord("maintenance", maintenanceId);
    if (!maintenance) {
      app.showNotification("طلب الصيانة غير موجود", "error");
      return;
    }

    // Get units and residents
    const units = db.getTable("units");
    const residents = db.getTable("residents");

    const unitsOptions = units
      .map(
        (unit) =>
          `<option value="${unit.id}" ${unit.id === maintenance.unitId ? "selected" : ""}>
                شقة ${unit.unitNumber}
            </option>`,
      )
      .join("");

    const residentsOptions = residents
      .map(
        (resident) =>
          `<option value="${resident.id}" ${resident.id === maintenance.residentId ? "selected" : ""}>
                ${resident.name} - ${resident.phone}
            </option>`,
      )
      .join("");

    const modalContent = `
            <form id="editMaintenanceForm">
                <div class="form-grid">
                    <div class="form-group">
                        <label for="maintenanceTitle">العنوان *</label>
                        <input type="text" id="maintenanceTitle" class="form-control" required 
                               value="${maintenance.title || ""}" placeholder="مثال: إصلاح تسريب في الحمام">
                    </div>
                    <div class="form-group">
                        <label for="maintenanceUnit">الشقة *</label>
                        <select id="maintenanceUnit" class="form-control" required>
                            <option value="">اختر الشقة</option>
                            ${unitsOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="maintenanceResident">المقيم (اختياري)</label>
                        <select id="maintenanceResident" class="form-control">
                            <option value="">اختر المقيم</option>
                            ${residentsOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="maintenanceCategory">الفئة *</label>
                        <select id="maintenanceCategory" class="form-control" required>
                            <option value="plumbing" ${maintenance.category === "plumbing" ? "selected" : ""}>سباكة</option>
                            <option value="electrical" ${maintenance.category === "electrical" ? "selected" : ""}>كهرباء</option>
                            <option value="hvac" ${maintenance.category === "hvac" ? "selected" : ""}>تكييف وتهوية</option>
                            <option value="appliances" ${maintenance.category === "appliances" ? "selected" : ""}>أجهزة</option>
                            <option value="structural" ${maintenance.category === "structural" ? "selected" : ""}>إنشائية</option>
                            <option value="painting" ${maintenance.category === "painting" ? "selected" : ""}>دهان</option>
                            <option value="cleaning" ${maintenance.category === "cleaning" ? "selected" : ""}>تنظيف</option>
                            <option value="security" ${maintenance.category === "security" ? "selected" : ""}>أمن</option>
                            <option value="other" ${maintenance.category === "other" ? "selected" : ""}>أخرى</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="maintenancePriority">الأولوية *</label>
                        <select id="maintenancePriority" class="form-control" required>
                            <option value="low" ${maintenance.priority === "low" ? "selected" : ""}>منخفضة</option>
                            <option value="medium" ${maintenance.priority === "medium" ? "selected" : ""}>متوسطة</option>
                            <option value="high" ${maintenance.priority === "high" ? "selected" : ""}>عالية</option>
                            <option value="urgent" ${maintenance.priority === "urgent" ? "selected" : ""}>عاجلة</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="maintenanceStatus">الحالة *</label>
                        <select id="maintenanceStatus" class="form-control" required>
                            <option value="pending" ${maintenance.status === "pending" ? "selected" : ""}>معلق</option>
                            <option value="in_progress" ${maintenance.status === "in_progress" ? "selected" : ""}>قيد التنفيذ</option>
                            <option value="completed" ${maintenance.status === "completed" ? "selected" : ""}>مكتمل</option>
                            <option value="cancelled" ${maintenance.status === "cancelled" ? "selected" : ""}>ملغي</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="scheduledDate">تاريخ الجدولة</label>
                        <input type="date" id="scheduledDate" class="form-control" 
                               value="${maintenance.scheduledDate || ""}">
                    </div>
                    <div class="form-group">
                        <label for="estimatedCost">التكلفة المقدرة</label>
                        <input type="number" id="estimatedCost" class="form-control" 
                               value="${maintenance.estimatedCost || ""}" placeholder="مثال: 500" min="0" step="0.01">
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="maintenanceDescription">الوصف *</label>
                    <textarea id="maintenanceDescription" class="form-control" rows="4" required
                              placeholder="وصف تفصيلي لطلب الصيانة...">${maintenance.description || ""}</textarea>
                </div>
                
                <div class="form-group">
                    <label for="technicianName">اسم الفني</label>
                    <input type="text" id="technicianName" class="form-control" 
                           value="${maintenance.technicianName || ""}" placeholder="اسم الفني المسؤول">
                </div>
                
                <div class="form-group">
                    <label for="technicianPhone">هاتف الفني</label>
                    <input type="tel" id="technicianPhone" class="form-control" 
                           value="${maintenance.technicianPhone || ""}" placeholder="رقم هاتف الفني">
                </div>
            </form>
        `;

    app.showModal("تعديل طلب الصيانة", modalContent, [
      {
        text: "إلغاء",
        class: "btn-secondary",
        onclick: "app.closeModal()",
      },
      {
        text: "حفظ التغييرات",
        class: "btn-primary",
        onclick: `Maintenance.saveMaintenance('${maintenanceId}')`,
      },
    ]);
  },

  /**
   * View maintenance details
   */
  viewMaintenanceDetails(maintenanceId) {
    const maintenance = db.getRecord("maintenance", maintenanceId);
    if (!maintenance) {
      app.showNotification("طلب الصيانة غير موجود", "error");
      return;
    }

    const unit = db.getRecord("units", maintenance.unitId);
    const resident = maintenance.residentId
      ? db.getRecord("residents", maintenance.residentId)
      : null;
    const statusInfo = this.getMaintenanceStatusInfo(maintenance.status);
    const priorityInfo = this.getMaintenancePriorityInfo(maintenance.priority);
    const settings = db.getSettings();

    const modalContent = `
            <div class="maintenance-details-view">
                <div class="maintenance-summary">
                    <div class="maintenance-header-view">
                        <h3>${maintenance.title || "طلب صيانة"}</h3>
                        <div class="status-priority-badges">
                            <span class="status-badge ${statusInfo.class}">
                                <i class="fas fa-circle"></i>
                                ${statusInfo.label}
                            </span>
                            <span class="priority-badge ${priorityInfo.class}">
                                <i class="fas ${priorityInfo.icon}"></i>
                                ${priorityInfo.label}
                            </span>
                        </div>
                    </div>
                </div>

                <div class="details-grid">
                    <div class="detail-section">
                        <h4>معلومات أساسية</h4>
                        <div class="detail-list">
                            <div class="detail-item">
                                <span class="label">الشقة:</span>
                                <span class="value">${unit ? `شقة ${unit.unitNumber}` : "غير معروف"}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">الفئة:</span>
                                <span class="value">${this.getMaintenanceCategoryLabel(maintenance.category)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">تاريخ الإنشاء:</span>
                                <span class="value">${AppUtils.formatDate(maintenance.createdAt)}</span>
                            </div>
                            ${
                              maintenance.scheduledDate
                                ? `
                                <div class="detail-item">
                                    <span class="label">تاريخ الجدولة:</span>
                                    <span class="value">${AppUtils.formatDate(maintenance.scheduledDate)}</span>
                                </div>
                            `
                                : ""
                            }
                        </div>
                    </div>

                    ${
                      resident
                        ? `
                        <div class="detail-section">
                            <h4>معلومات المقيم</h4>
                            <div class="detail-list">
                                <div class="detail-item">
                                    <span class="label">الاسم:</span>
                                    <span class="value">${resident.name}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="label">الهاتف:</span>
                                    <span class="value">${resident.phone}</span>
                                </div>
                            </div>
                        </div>
                    `
                        : ""
                    }

                    ${
                      maintenance.technicianName
                        ? `
                        <div class="detail-section">
                            <h4>معلومات الفني</h4>
                            <div class="detail-list">
                                <div class="detail-item">
                                    <span class="label">الاسم:</span>
                                    <span class="value">${maintenance.technicianName}</span>
                                </div>
                                ${
                                  maintenance.technicianPhone
                                    ? `
                                    <div class="detail-item">
                                        <span class="label">الهاتف:</span>
                                        <span class="value">${maintenance.technicianPhone}</span>
                                    </div>
                                `
                                    : ""
                                }
                            </div>
                        </div>
                    `
                        : ""
                    }

                    ${
                      maintenance.estimatedCost
                        ? `
                        <div class="detail-section">
                            <h4>التكلفة</h4>
                            <div class="detail-list">
                                <div class="detail-item">
                                    <span class="label">التكلفة المقدرة:</span>
                                    <span class="value">${AppUtils.formatCurrency(maintenance.estimatedCost, settings.currency)}</span>
                                </div>
                            </div>
                        </div>
                    `
                        : ""
                    }

                    <div class="detail-section">
                        <h4>الوصف</h4>
                        <div class="maintenance-description">
                            <p>${maintenance.description}</p>
                        </div>
                    </div>

                    <div class="detail-section">
                        <h4>معلومات إضافية</h4>
                        <div class="detail-list">
                            <div class="detail-item">
                                <span class="label">آخر تحديث:</span>
                                <span class="value">${AppUtils.formatDate(maintenance.updatedAt)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

    app.showModal(`تفاصيل طلب الصيانة`, modalContent, [
      {
        text: "إغلاق",
        class: "btn-secondary",
        onclick: "app.closeModal()",
      },
      {
        text: "تحديث الحالة",
        class: "btn-success",
        onclick: `app.closeModal(); Maintenance.updateMaintenanceStatus('${maintenanceId}')`,
      },
      {
        text: "تعديل",
        class: "btn-primary",
        onclick: `app.closeModal(); Maintenance.editMaintenance('${maintenanceId}')`,
      },
    ]);
  },

  /**
   * Update maintenance status
   */
  updateMaintenanceStatus(maintenanceId) {
    const maintenance = db.getRecord("maintenance", maintenanceId);
    if (!maintenance) {
      app.showNotification("طلب الصيانة غير موجود", "error");
      return;
    }

    const modalContent = `
            <div class="status-update-form">
                <h4>تحديث حالة طلب الصيانة</h4>
                <p><strong>العنوان:</strong> ${maintenance.title}</p>
                <p><strong>الحالة الحالية:</strong> ${this.getMaintenanceStatusInfo(maintenance.status).label}</p>
                
                <form id="updateStatusForm">
                    <div class="form-group">
                        <label for="newStatus">الحالة الجديدة *</label>
                        <select id="newStatus" class="form-control" required>
                            <option value="pending" ${maintenance.status === "pending" ? "selected" : ""}>معلق</option>
                            <option value="in_progress" ${maintenance.status === "in_progress" ? "selected" : ""}>قيد التنفيذ</option>
                            <option value="completed" ${maintenance.status === "completed" ? "selected" : ""}>مكتمل</option>
                            <option value="cancelled" ${maintenance.status === "cancelled" ? "selected" : ""}>ملغي</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="statusNotes">ملاحظات</label>
                        <textarea id="statusNotes" class="form-control" rows="3" 
                                  placeholder="ملاحظات حول تحديث الحالة..."></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label for="actualCost">التكلفة الفعلية</label>
                        <input type="number" id="actualCost" class="form-control" 
                               value="${maintenance.actualCost || ""}" placeholder="التكلفة الفعلية" min="0" step="0.01">
                    </div>
                </form>
            </div>
        `;

    app.showModal("تحديث حالة الصيانة", modalContent, [
      {
        text: "إلغاء",
        class: "btn-secondary",
        onclick: "app.closeModal()",
      },
      {
        text: "تحديث الحالة",
        class: "btn-success",
        onclick: `Maintenance.confirmStatusUpdate('${maintenanceId}')`,
      },
    ]);
  },

  /**
   * Confirm status update
   */
  confirmStatusUpdate(maintenanceId) {
    const newStatus = document.getElementById("newStatus").value;
    const statusNotes = document.getElementById("statusNotes").value.trim();
    const actualCost =
      parseFloat(document.getElementById("actualCost").value) || null;

    if (!newStatus) {
      app.showNotification("يرجى اختيار الحالة الجديدة", "error");
      return;
    }

    const updateData = {
      status: newStatus,
      statusNotes: statusNotes || null,
      actualCost: actualCost,
      completedAt: newStatus === "completed" ? new Date().toISOString() : null,
    };

    const success = db.updateRecord("maintenance", maintenanceId, updateData);

    if (success) {
      app.closeModal();
      this.loadMaintenance();
      this.loadSummary();
      app.showNotification("تم تحديث حالة الصيانة بنجاح", "success");
    } else {
      app.showNotification("حدث خطأ أثناء تحديث الحالة", "error");
    }
  },

  /**
   * Assign technician
   */
  assignTechnician(maintenanceId) {
    const maintenance = db.getRecord("maintenance", maintenanceId);
    if (!maintenance) {
      app.showNotification("طلب الصيانة غير موجود", "error");
      return;
    }

    const modalContent = `
            <div class="technician-assignment-form">
                <h4>تعيين فني للصيانة</h4>
                <p><strong>العنوان:</strong> ${maintenance.title}</p>
                
                <form id="assignTechnicianForm">
                    <div class="form-group">
                        <label for="technicianName">اسم الفني *</label>
                        <input type="text" id="technicianName" class="form-control" required 
                               value="${maintenance.technicianName || ""}" placeholder="اسم الفني">
                    </div>
                    
                    <div class="form-group">
                        <label for="technicianPhone">هاتف الفني *</label>
                        <input type="tel" id="technicianPhone" class="form-control" required 
                               value="${maintenance.technicianPhone || ""}" placeholder="رقم هاتف الفني">
                    </div>
                    
                    <div class="form-group">
                        <label for="scheduledDate">تاريخ الجدولة</label>
                        <input type="date" id="scheduledDate" class="form-control" 
                               value="${maintenance.scheduledDate || ""}">
                    </div>
                    
                    <div class="form-group">
                        <label for="assignmentNotes">ملاحظات</label>
                        <textarea id="assignmentNotes" class="form-control" rows="3" 
                                  placeholder="ملاحظات حول التعيين..."></textarea>
                    </div>
                </form>
            </div>
        `;

    app.showModal("تعيين فني", modalContent, [
      {
        text: "إلغاء",
        class: "btn-secondary",
        onclick: "app.closeModal()",
      },
      {
        text: "تعيين الفني",
        class: "btn-warning",
        onclick: `Maintenance.confirmTechnicianAssignment('${maintenanceId}')`,
      },
    ]);
  },

  /**
   * Confirm technician assignment
   */
  confirmTechnicianAssignment(maintenanceId) {
    const technicianName = document
      .getElementById("technicianName")
      .value.trim();
    const technicianPhone = document
      .getElementById("technicianPhone")
      .value.trim();
    const scheduledDate =
      document.getElementById("scheduledDate").value || null;
    const assignmentNotes = document
      .getElementById("assignmentNotes")
      .value.trim();

    if (!technicianName) {
      app.showNotification("اسم الفني مطلوب", "error");
      return;
    }

    if (!technicianPhone) {
      app.showNotification("هاتف الفني مطلوب", "error");
      return;
    }

    if (!AppUtils.validatePhone(technicianPhone)) {
      app.showNotification("رقم هاتف الفني غير صحيح", "error");
      return;
    }

    const updateData = {
      technicianName: technicianName,
      technicianPhone: technicianPhone,
      scheduledDate: scheduledDate,
      assignmentNotes: assignmentNotes || null,
      status: "in_progress",
    };

    const success = db.updateRecord("maintenance", maintenanceId, updateData);

    if (success) {
      app.closeModal();
      this.loadMaintenance();
      this.loadSummary();
      app.showNotification("تم تعيين الفني بنجاح", "success");
    } else {
      app.showNotification("حدث خطأ أثناء تعيين الفني", "error");
    }
  },

  /**
   * Delete maintenance request
   */
  deleteMaintenance(maintenanceId) {
    const maintenance = db.getRecord("maintenance", maintenanceId);
    if (!maintenance) {
      app.showNotification("طلب الصيانة غير موجود", "error");
      return;
    }

    app.confirm(
      `هل أنت متأكد من حذف طلب الصيانة "${maintenance.title}"؟ هذا الإجراء لا يمكن التراجع عنه.`,
      `Maintenance.confirmDeleteMaintenance('${maintenanceId}')`,
    );
  },

  /**
   * Confirm maintenance deletion
   */
  confirmDeleteMaintenance(maintenanceId) {
    const success = db.deleteRecord("maintenance", maintenanceId);

    if (success) {
      this.loadMaintenance();
      this.loadSummary();
      app.showNotification("تم حذف طلب الصيانة بنجاح", "success");
    } else {
      app.showNotification("حدث خطأ أثناء حذف طلب الصيانة", "error");
    }
  },

  /**
   * Export maintenance data
   */
  exportMaintenance() {
    const maintenance = db.getTable("maintenance");

    if (maintenance.length === 0) {
      app.showNotification("لا توجد بيانات للتصدير", "warning");
      return;
    }

    // Enrich with unit and resident data
    const units = db.getTable("units");
    const residents = db.getTable("residents");

    const exportData = maintenance.map((request) => {
      const unit = units.find((u) => u.id === request.unitId);
      const resident = request.residentId
        ? residents.find((r) => r.id === request.residentId)
        : null;
      const statusInfo = this.getMaintenanceStatusInfo(request.status);
      const priorityInfo = this.getMaintenancePriorityInfo(request.priority);

      return {
        العنوان: request.title || "",
        الشقة: unit ? `شقة ${unit.unitNumber}` : "غير معروف",
        المقيم: resident ? resident.name : "",
        الفئة: this.getMaintenanceCategoryLabel(request.category),
        الأولوية: priorityInfo.label,
        الحالة: statusInfo.label,
        "تاريخ الإنشاء": AppUtils.formatDate(request.createdAt),
        "تاريخ الجدولة": request.scheduledDate
          ? AppUtils.formatDate(request.scheduledDate)
          : "",
        "التكلفة المقدرة": request.estimatedCost || "",
        "التكلفة الفعلية": request.actualCost || "",
        الفني: request.technicianName || "",
        "هاتف الفني": request.technicianPhone || "",
        الوصف: request.description || "",
      };
    });

    AppUtils.exportToCSV(
      exportData,
      `maintenance-${new Date().toISOString().split("T")[0]}`,
    );
    app.showNotification("تم تصدير البيانات بنجاح", "success");
  },
};

// Add maintenance-specific styles
const maintenanceStyles = document.createElement("style");
maintenanceStyles.textContent = `
    .maintenance-container {
        max-width: 1400px;
        margin: 0 auto;
    }

    .maintenance-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
        gap: 20px;
        margin-bottom: 20px;
    }

    .maintenance-card {
        background: var(--bg-secondary);
        border-radius: 16px;
        padding: 20px;
        transition: all 0.3s ease;
        border: 1px solid var(--border-color);
        position: relative;
    }

    .maintenance-card:hover {
        transform: translateY(-4px);
        box-shadow: 
            12px 12px 20px var(--shadow-dark),
            -12px -12px 20px var(--shadow-light);
    }

    .maintenance-card.urgent {
        border-right: 4px solid var(--error-color);
    }

    .maintenance-card.high {
        border-right: 4px solid var(--warning-color);
    }

    .maintenance-card.medium {
        border-right: 4px solid var(--info-color);
    }

    .maintenance-card.low {
        border-right: 4px solid var(--success-color);
    }

    .maintenance-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--border-color);
    }

    .maintenance-priority {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 500;
    }

    .priority-low {
        background: rgba(72, 187, 120, 0.1);
        color: var(--success-color);
    }

    .priority-medium {
        background: rgba(66, 153, 225, 0.1);
        color: var(--info-color);
    }

    .priority-high {
        background: rgba(237, 137, 54, 0.1);
        color: var(--warning-color);
    }

    .priority-urgent {
        background: rgba(245, 101, 101, 0.1);
        color: var(--error-color);
    }

    .maintenance-status {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 500;
    }

    .status-pending {
        background: rgba(237, 137, 54, 0.1);
        color: var(--warning-color);
    }

    .status-in-progress {
        background: rgba(66, 153, 225, 0.1);
        color: var(--info-color);
    }

    .status-completed {
        background: rgba(72, 187, 120, 0.1);
        color: var(--success-color);
    }

    .status-cancelled {
        background: rgba(245, 101, 101, 0.1);
        color: var(--error-color);
    }

    .maintenance-title h4 {
        margin: 0 0 12px 0;
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--text-primary);
    }

    .maintenance-description {
        margin-top: 12px;
        padding: 12px;
        background: var(--bg-primary);
        border-radius: 8px;
        border-right: 3px solid var(--primary-color);
    }

    .maintenance-description p {
        margin: 0;
        color: var(--text-secondary);
        font-size: 0.9rem;
        line-height: 1.4;
    }

    .maintenance-actions {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
        padding-top: 12px;
        border-top: 1px solid var(--border-color);
        flex-wrap: wrap;
    }

    .maintenance-details-view {
        max-width: 700px;
    }

    .maintenance-header-view {
        margin-bottom: 20px;
        padding-bottom: 16px;
        border-bottom: 2px solid var(--border-color);
    }

    .maintenance-header-view h3 {
        margin: 0 0 12px 0;
        color: var(--text-primary);
        font-size: 1.4rem;
    }

    .status-priority-badges {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
    }

    .status-badge, .priority-badge {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 0.9rem;
        font-weight: 500;
    }

    .status-update-form, .technician-assignment-form {
        background: var(--bg-primary);
        padding: 16px;
        border-radius: 8px;
        margin-bottom: 20px;
        border-right: 4px solid var(--info-color);
    }

    .status-update-form h4, .technician-assignment-form h4 {
        margin: 0 0 12px 0;
        color: var(--text-primary);
    }

    .status-update-form p, .technician-assignment-form p {
        margin: 4px 0 16px 0;
        color: var(--text-secondary);
    }

    .summary-card.pending .summary-icon {
        background: rgba(237, 137, 54, 0.1);
        color: var(--warning-color);
    }

    .summary-card.in-progress .summary-icon {
        background: rgba(66, 153, 225, 0.1);
        color: var(--info-color);
    }

    .summary-card.completed .summary-icon {
        background: rgba(72, 187, 120, 0.1);
        color: var(--success-color);
    }

    .summary-card.urgent .summary-icon {
        background: rgba(245, 101, 101, 0.1);
        color: var(--error-color);
    }

    @media (max-width: 768px) {
        .maintenance-grid {
            grid-template-columns: 1fr;
        }

        .maintenance-header {
            flex-direction: column;
            gap: 12px;
            align-items: flex-start;
        }

        .maintenance-actions {
            justify-content: center;
        }

        .form-grid {
            grid-template-columns: 1fr;
        }

        .status-priority-badges {
            flex-direction: column;
            align-items: flex-start;
        }
    }

    @media (max-width: 480px) {
        .maintenance-actions {
            gap: 4px;
        }

        .maintenance-actions .btn {
            padding: 6px 8px;
            font-size: 0.8rem;
        }
    }
`;
document.head.appendChild(maintenanceStyles);
