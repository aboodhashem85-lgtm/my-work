/**
 * Units Management Module
 * Handles apartment/unit management functionality
 */

window.Units = {
  currentPage: 1,
  pageSize: 10,
  searchTerm: "",
  sortField: "unitNumber",
  sortDirection: "asc",
  filterStatus: "all",

  /**
   * Load units management page
   */
  load() {
    this.renderUnitsPage();
    this.loadUnits();
  },

  /**
   * Render the units management page
   */
  renderUnitsPage() {
    const unitsContent = document.getElementById("unitsContent");
    if (!unitsContent) return;

    unitsContent.innerHTML = `
            <div class="units-container">
                <!-- Header Section -->
                <div class="page-header">
                    <div class="header-actions">
                        <button class="btn btn-primary" onclick="Units.showAddUnitModal()">
                            <i class="fas fa-plus"></i>
                            إضافة شقة جديدة
                        </button>
                        <button class="btn btn-secondary" onclick="Units.exportUnits()">
                            <i class="fas fa-download"></i>
                            تصدير البيانات
                        </button>
                    </div>
                </div>

                <!-- Filters Section -->
                <div class="filters-section neu-flat">
                    <div class="filters-grid">
                        <div class="filter-group">
                            <label>البحث</label>
                            <div class="search-wrapper">
                                <input type="text" id="unitsSearch" class="form-control" 
                                       placeholder="البحث برقم الشقة أو النوع..." 
                                       value="${this.searchTerm}">
                                <i class="fas fa-search"></i>
                            </div>
                        </div>
                        <div class="filter-group">
                            <label>الحالة</label>
                            <select id="unitsStatusFilter" class="form-control">
                                <option value="all">جميع الحالات</option>
                                <option value="available">فارغة</option>
                                <option value="occupied">مشغولة</option>
                                <option value="maintenance">تحت الصيانة</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label>الترتيب</label>
                            <select id="unitsSortField" class="form-control">
                                <option value="unitNumber">رقم الشقة</option>
                                <option value="type">النوع</option>
                                <option value="area">المساحة</option>
                                <option value="rent">الإيجار</option>
                                <option value="floor">الطابق</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label>الاتجاه</label>
                            <select id="unitsSortDirection" class="form-control">
                                <option value="asc">تصاعدي</option>
                                <option value="desc">تنازلي</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Units Grid -->
                <div class="units-grid" id="unitsGrid">
                    <!-- Units will be loaded here -->
                </div>

                <!-- Pagination -->
                <div id="unitsPagination" class="pagination-container">
                    <!-- Pagination will be loaded here -->
                </div>
            </div>
        `;

    this.bindEvents();
  },

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Search input
    const searchInput = document.getElementById("unitsSearch");
    if (searchInput) {
      searchInput.addEventListener(
        "input",
        AppUtils.debounce((e) => {
          this.searchTerm = e.target.value;
          this.currentPage = 1;
          this.loadUnits();
        }, 300),
      );
    }

    // Status filter
    const statusFilter = document.getElementById("unitsStatusFilter");
    if (statusFilter) {
      statusFilter.value = this.filterStatus;
      statusFilter.addEventListener("change", (e) => {
        this.filterStatus = e.target.value;
        this.currentPage = 1;
        this.loadUnits();
      });
    }

    // Sort field
    const sortField = document.getElementById("unitsSortField");
    if (sortField) {
      sortField.value = this.sortField;
      sortField.addEventListener("change", (e) => {
        this.sortField = e.target.value;
        this.loadUnits();
      });
    }

    // Sort direction
    const sortDirection = document.getElementById("unitsSortDirection");
    if (sortDirection) {
      sortDirection.value = this.sortDirection;
      sortDirection.addEventListener("change", (e) => {
        this.sortDirection = e.target.value;
        this.loadUnits();
      });
    }
  },

  /**
   * Load and display units
   */
  loadUnits() {
    let units = db.getTable("units");

    // Apply search filter
    if (this.searchTerm) {
      const searchFilter = AppUtils.createSearchFilter(this.searchTerm, [
        "unitNumber",
        "type",
        "description",
        "floor",
      ]);
      units = units.filter(searchFilter);
    }

    // Apply status filter
    if (this.filterStatus !== "all") {
      units = units.filter((unit) => unit.status === this.filterStatus);
    }

    // Apply sorting
    const sorter = AppUtils.createSorter(this.sortField, this.sortDirection);
    units.sort(sorter);

    // Apply pagination
    const pagination = AppUtils.paginate(
      units,
      this.currentPage,
      this.pageSize,
    );

    this.renderUnits(pagination.data);
    this.renderPagination(pagination);
  },

  /**
   * Render units grid
   */
  renderUnits(units) {
    const unitsGrid = document.getElementById("unitsGrid");
    if (!unitsGrid) return;

    if (units.length === 0) {
      unitsGrid.innerHTML = `
                <div class="no-data-message">
                    <i class="fas fa-home"></i>
                    <h3>لا توجد شقق</h3>
                    <p>لم يتم العثور على شقق تطابق معايير البحث</p>
                    <button class="btn btn-primary" onclick="Units.showAddUnitModal()">
                        إضافة شقة جديدة
                    </button>
                </div>
            `;
      return;
    }

    const unitsHtml = units.map((unit) => this.renderUnitCard(unit)).join("");
    unitsGrid.innerHTML = unitsHtml;
  },

  /**
   * Render individual unit card
   */
  renderUnitCard(unit) {
    const statusInfo = this.getUnitStatusInfo(unit.status);
    const settings = db.getSettings();

    return `
            <div class="unit-card neu-flat" data-unit-id="${unit.id}">
                <div class="unit-header">
                    <div class="unit-number">
                        <i class="fas fa-home"></i>
                        <span>شقة ${unit.unitNumber}</span>
                    </div>
                    <div class="unit-status ${statusInfo.class}">
                        <i class="fas ${statusInfo.icon}"></i>
                        <span>${statusInfo.label}</span>
                    </div>
                </div>
                
                <div class="unit-details">
                    <div class="detail-row">
                        <span class="detail-label">النوع:</span>
                        <span class="detail-value">${unit.type || "غير محدد"}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">المساحة:</span>
                        <span class="detail-value">${unit.area || "غير محدد"} م²</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">الطابق:</span>
                        <span class="detail-value">${unit.floor || "غير محدد"}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">الإيجار:</span>
                        <span class="detail-value">${AppUtils.formatCurrency(unit.rent || 0, settings.currency)}</span>
                    </div>
                    ${
                      unit.description
                        ? `
                        <div class="detail-row">
                            <span class="detail-label">الوصف:</span>
                            <span class="detail-value">${unit.description}</span>
                        </div>
                    `
                        : ""
                    }
                </div>

                <div class="unit-actions">
                    <button class="btn btn-sm btn-primary" onclick="Units.editUnit('${unit.id}')" title="تعديل">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-info" onclick="Units.viewUnitDetails('${unit.id}')" title="التفاصيل">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="Units.changeUnitStatus('${unit.id}')" title="تغيير الحالة">
                        <i class="fas fa-exchange-alt"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="Units.deleteUnit('${unit.id}')" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
  },

  /**
   * Get unit status information
   */
  getUnitStatusInfo(status) {
    const statusMap = {
      available: {
        label: "فارغة",
        class: "status-available",
        icon: "fa-check-circle",
      },
      occupied: { label: "مشغولة", class: "status-occupied", icon: "fa-user" },
      maintenance: {
        label: "تحت الصيانة",
        class: "status-maintenance",
        icon: "fa-tools",
      },
    };

    return statusMap[status] || statusMap.available;
  },

  /**
   * Render pagination
   */
  renderPagination(pagination) {
    const paginationContainer = document.getElementById("unitsPagination");
    if (!paginationContainer) return;

    const paginationHtml = AppUtils.createPaginationControls(
      pagination,
      "Units.goToPage",
    );
    paginationContainer.innerHTML = paginationHtml;
  },

  /**
   * Go to specific page
   */
  goToPage(page) {
    this.currentPage = page;
    this.loadUnits();
  },

  /**
   * Show add unit modal
   */
  showAddUnitModal() {
    const modalContent = `
            <form id="addUnitForm">
                <div class="form-grid">
                    <div class="form-group">
                        <label for="unitNumber">رقم الشقة *</label>
                        <input type="text" id="unitNumber" class="form-control" required placeholder="مثال: 101">
                    </div>
                    <div class="form-group">
                        <label for="unitType">نوع الشقة *</label>
                        <select id="unitType" class="form-control" required>
                            <option value="">اختر النوع</option>
                            <option value="استوديو">استوديو</option>
                            <option value="غرفة وصالة">غرفة وصالة</option>
                            <option value="غرفتين وصالة">غرفتين وصالة</option>
                            <option value="ثلاث غرف وصالة">ثلاث غرف وصالة</option>
                            <option value="أربع غرف وصالة">أربع غرف وصالة</option>
                            <option value="فيلا">فيلا</option>
                            <option value="دوبلكس">دوبلكس</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="unitArea">المساحة (م²)</label>
                        <input type="number" id="unitArea" class="form-control" placeholder="مثال: 120">
                    </div>
                    <div class="form-group">
                        <label for="unitFloor">الطابق</label>
                        <input type="text" id="unitFloor" class="form-control" placeholder="مثال: الأول">
                    </div>
                    <div class="form-group">
                        <label for="unitRent">الإيجار الشهري *</label>
                        <input type="number" id="unitRent" class="form-control" required placeholder="مثال: 2500">
                    </div>
                    <div class="form-group">
                        <label for="unitStatus">الحالة *</label>
                        <select id="unitStatus" class="form-control" required>
                            <option value="available">فارغة</option>
                            <option value="occupied">مشغولة</option>
                            <option value="maintenance">تحت الصيانة</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label for="unitDescription">الوصف</label>
                    <textarea id="unitDescription" class="form-control" rows="3" 
                              placeholder="وصف إضافي للشقة (اختياري)"></textarea>
                </div>
            </form>
        `;

    app.showModal("إضافة شقة جديدة", modalContent, [
      {
        text: "إلغاء",
        class: "btn-secondary",
        onclick: "app.closeModal()",
      },
      {
        text: "إضافة الشقة",
        class: "btn-primary",
        onclick: "Units.saveUnit()",
      },
    ]);
  },

  /**
   * Save unit (add or edit)
   */
  saveUnit(unitId = null) {
    const form =
      document.getElementById("addUnitForm") ||
      document.getElementById("editUnitForm");
    if (!form) return;

    const formData = new FormData(form);
    const unitData = {
      unitNumber: document.getElementById("unitNumber").value.trim(),
      type: document.getElementById("unitType").value,
      area: parseFloat(document.getElementById("unitArea").value) || null,
      floor: document.getElementById("unitFloor").value.trim(),
      rent: parseFloat(document.getElementById("unitRent").value) || 0,
      status: document.getElementById("unitStatus").value,
      description: document.getElementById("unitDescription").value.trim(),
    };

    // Validation
    if (!unitData.unitNumber) {
      app.showNotification("رقم الشقة مطلوب", "error");
      return;
    }

    if (!unitData.type) {
      app.showNotification("نوع الشقة مطلوب", "error");
      return;
    }

    if (unitData.rent <= 0) {
      app.showNotification("الإيجار يجب أن يكون أكبر من صفر", "error");
      return;
    }

    // Check for duplicate unit number
    const existingUnits = db.getTable("units");
    const duplicateUnit = existingUnits.find(
      (unit) => unit.unitNumber === unitData.unitNumber && unit.id !== unitId,
    );

    if (duplicateUnit) {
      app.showNotification("رقم الشقة موجود مسبقاً", "error");
      return;
    }

    let success;
    if (unitId) {
      success = db.updateRecord("units", unitId, unitData);
    } else {
      success = db.addRecord("units", unitData);
    }

    if (success) {
      app.closeModal();
      this.loadUnits();
      app.showNotification(
        unitId ? "تم تحديث الشقة بنجاح" : "تم إضافة الشقة بنجاح",
        "success",
      );
    } else {
      app.showNotification("حدث خطأ أثناء حفظ البيانات", "error");
    }
  },

  /**
   * Edit unit
   */
  editUnit(unitId) {
    const unit = db.getRecord("units", unitId);
    if (!unit) {
      app.showNotification("الشقة غير موجودة", "error");
      return;
    }

    const modalContent = `
            <form id="editUnitForm">
                <div class="form-grid">
                    <div class="form-group">
                        <label for="unitNumber">رقم الشقة *</label>
                        <input type="text" id="unitNumber" class="form-control" required 
                               value="${unit.unitNumber}" placeholder="مثال: 101">
                    </div>
                    <div class="form-group">
                        <label for="unitType">نوع الشقة *</label>
                        <select id="unitType" class="form-control" required>
                            <option value="">اختر النوع</option>
                            <option value="استوديو" ${unit.type === "استوديو" ? "selected" : ""}>استوديو</option>
                            <option value="غرفة وصالة" ${unit.type === "غرفة وصالة" ? "selected" : ""}>غرفة وصالة</option>
                            <option value="غرفتين وصالة" ${unit.type === "غرفتين وصالة" ? "selected" : ""}>غرفتين وصالة</option>
                            <option value="ثلاث غرف وصالة" ${unit.type === "ثلاث غرف وصالة" ? "selected" : ""}>ثلاث غرف وصالة</option>
                            <option value="أربع غرف وصالة" ${unit.type === "أربع غرف وصالة" ? "selected" : ""}>أربع غرف وصالة</option>
                            <option value="فيلا" ${unit.type === "فيلا" ? "selected" : ""}>فيلا</option>
                            <option value="دوبلكس" ${unit.type === "دوبلكس" ? "selected" : ""}>دوبلكس</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="unitArea">المساحة (م²)</label>
                        <input type="number" id="unitArea" class="form-control" 
                               value="${unit.area || ""}" placeholder="مثال: 120">
                    </div>
                    <div class="form-group">
                        <label for="unitFloor">الطابق</label>
                        <input type="text" id="unitFloor" class="form-control" 
                               value="${unit.floor || ""}" placeholder="مثال: الأول">
                    </div>
                    <div class="form-group">
                        <label for="unitRent">الإيجار الشهري *</label>
                        <input type="number" id="unitRent" class="form-control" required 
                               value="${unit.rent || ""}" placeholder="مثال: 2500">
                    </div>
                    <div class="form-group">
                        <label for="unitStatus">الحالة *</label>
                        <select id="unitStatus" class="form-control" required>
                            <option value="available" ${unit.status === "available" ? "selected" : ""}>فارغة</option>
                            <option value="occupied" ${unit.status === "occupied" ? "selected" : ""}>مشغولة</option>
                            <option value="maintenance" ${unit.status === "maintenance" ? "selected" : ""}>تحت الصيانة</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label for="unitDescription">الوصف</label>
                    <textarea id="unitDescription" class="form-control" rows="3" 
                              placeholder="وصف إضافي للشقة (اختياري)">${unit.description || ""}</textarea>
                </div>
            </form>
        `;

    app.showModal("تعديل الشقة", modalContent, [
      {
        text: "إلغاء",
        class: "btn-secondary",
        onclick: "app.closeModal()",
      },
      {
        text: "حفظ التغييرات",
        class: "btn-primary",
        onclick: `Units.saveUnit('${unitId}')`,
      },
    ]);
  },

  /**
   * View unit details
   */
  viewUnitDetails(unitId) {
    const unit = db.getRecord("units", unitId);
    if (!unit) {
      app.showNotification("الشقة غير موجودة", "error");
      return;
    }

    // Get related data
    const contracts = db
      .getTable("contracts")
      .filter((c) => c.unitId === unitId);
    const currentContract = contracts.find((c) => {
      const endDate = new Date(c.endDate);
      return endDate > new Date();
    });

    const statusInfo = this.getUnitStatusInfo(unit.status);
    const settings = db.getSettings();

    const modalContent = `
            <div class="unit-details-view">
                <div class="unit-summary">
                    <div class="unit-header-view">
                        <h3>شقة ${unit.unitNumber}</h3>
                        <span class="status-badge ${statusInfo.class}">
                            <i class="fas ${statusInfo.icon}"></i>
                            ${statusInfo.label}
                        </span>
                    </div>
                </div>

                <div class="details-grid">
                    <div class="detail-section">
                        <h4>معلومات أساسية</h4>
                        <div class="detail-list">
                            <div class="detail-item">
                                <span class="label">النوع:</span>
                                <span class="value">${unit.type || "غير محدد"}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">المساحة:</span>
                                <span class="value">${unit.area ? unit.area + " م²" : "غير محدد"}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">الطابق:</span>
                                <span class="value">${unit.floor || "غير محدد"}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">الإيجار الشهري:</span>
                                <span class="value">${AppUtils.formatCurrency(unit.rent || 0, settings.currency)}</span>
                            </div>
                            ${
                              unit.description
                                ? `
                                <div class="detail-item">
                                    <span class="label">الوصف:</span>
                                    <span class="value">${unit.description}</span>
                                </div>
                            `
                                : ""
                            }
                        </div>
                    </div>

                    ${
                      currentContract
                        ? `
                        <div class="detail-section">
                            <h4>العقد الحالي</h4>
                            <div class="detail-list">
                                <div class="detail-item">
                                    <span class="label">المستأجر:</span>
                                    <span class="value">${currentContract.residentName}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="label">تاريخ البداية:</span>
                                    <span class="value">${AppUtils.formatDate(currentContract.startDate)}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="label">تاريخ الانتهاء:</span>
                                    <span class="value">${AppUtils.formatDate(currentContract.endDate)}</span>
                                </div>
                            </div>
                        </div>
                    `
                        : ""
                    }

                    <div class="detail-section">
                        <h4>إحصائيات</h4>
                        <div class="detail-list">
                            <div class="detail-item">
                                <span class="label">عدد العقود:</span>
                                <span class="value">${contracts.length}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">تاريخ الإضافة:</span>
                                <span class="value">${AppUtils.formatDate(unit.createdAt)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">آخر تحديث:</span>
                                <span class="value">${AppUtils.formatDate(unit.updatedAt)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

    app.showModal(`تفاصيل شقة ${unit.unitNumber}`, modalContent, [
      {
        text: "إغلاق",
        class: "btn-secondary",
        onclick: "app.closeModal()",
      },
      {
        text: "تعديل",
        class: "btn-primary",
        onclick: `app.closeModal(); Units.editUnit('${unitId}')`,
      },
    ]);
  },

  /**
   * Change unit status
   */
  changeUnitStatus(unitId) {
    const unit = db.getRecord("units", unitId);
    if (!unit) {
      app.showNotification("الشقة غير موجودة", "error");
      return;
    }

    const modalContent = `
            <div class="status-change-form">
                <p>الحالة الحالية: <strong>${this.getUnitStatusInfo(unit.status).label}</strong></p>
                <div class="form-group">
                    <label for="newStatus">الحالة الجديدة:</label>
                    <select id="newStatus" class="form-control">
                        <option value="available" ${unit.status === "available" ? "selected" : ""}>فارغة</option>
                        <option value="occupied" ${unit.status === "occupied" ? "selected" : ""}>مشغولة</option>
                        <option value="maintenance" ${unit.status === "maintenance" ? "selected" : ""}>تحت الصيانة</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="statusNote">ملاحظة (اختياري):</label>
                    <textarea id="statusNote" class="form-control" rows="3" 
                              placeholder="سبب تغيير الحالة..."></textarea>
                </div>
            </div>
        `;

    app.showModal("تغيير حالة الشقة", modalContent, [
      {
        text: "إلغاء",
        class: "btn-secondary",
        onclick: "app.closeModal()",
      },
      {
        text: "تغيير الحالة",
        class: "btn-primary",
        onclick: `Units.confirmStatusChange('${unitId}')`,
      },
    ]);
  },

  /**
   * Confirm status change
   */
  confirmStatusChange(unitId) {
    const newStatus = document.getElementById("newStatus").value;
    const note = document.getElementById("statusNote").value.trim();

    const success = db.updateRecord("units", unitId, {
      status: newStatus,
      statusNote: note,
      statusChangedAt: new Date().toISOString(),
    });

    if (success) {
      app.closeModal();
      this.loadUnits();
      app.showNotification("تم تغيير حالة الشقة بنجاح", "success");
    } else {
      app.showNotification("حدث خطأ أثناء تغيير الحالة", "error");
    }
  },

  /**
   * Delete unit
   */
  deleteUnit(unitId) {
    const unit = db.getRecord("units", unitId);
    if (!unit) {
      app.showNotification("الشقة غير موجودة", "error");
      return;
    }

    // Check if unit has active contracts
    const contracts = db.getTable("contracts");
    const activeContracts = contracts.filter((contract) => {
      const endDate = new Date(contract.endDate);
      return contract.unitId === unitId && endDate > new Date();
    });

    if (activeContracts.length > 0) {
      app.showNotification("لا يمكن حذف الشقة لوجود عقود نشطة", "error");
      return;
    }

    app.confirm(
      `هل أنت متأكد من حذف شقة ${unit.unitNumber}؟ هذا الإجراء لا يمكن التراجع عنه.`,
      `Units.confirmDeleteUnit('${unitId}')`,
    );
  },

  /**
   * Confirm unit deletion
   */
  confirmDeleteUnit(unitId) {
    const success = db.deleteRecord("units", unitId);

    if (success) {
      this.loadUnits();
      app.showNotification("تم حذف الشقة بنجاح", "success");
    } else {
      app.showNotification("حدث خطأ أثناء حذف الشقة", "error");
    }
  },

  /**
   * Export units data
   */
  exportUnits() {
    const units = db.getTable("units");

    if (units.length === 0) {
      app.showNotification("لا توجد بيانات للتصدير", "warning");
      return;
    }

    const exportData = units.map((unit) => ({
      "رقم الشقة": unit.unitNumber,
      النوع: unit.type,
      المساحة: unit.area,
      الطابق: unit.floor,
      الإيجار: unit.rent,
      الحالة: this.getUnitStatusInfo(unit.status).label,
      الوصف: unit.description,
      "تاريخ الإضافة": AppUtils.formatDate(unit.createdAt),
    }));

    AppUtils.exportToCSV(
      exportData,
      `units-${new Date().toISOString().split("T")[0]}`,
    );
    app.showNotification("تم تصدير البيانات بنجاح", "success");
  },
};

// Add units-specific styles
const unitsStyles = document.createElement("style");
unitsStyles.textContent = `
    .units-container {
        max-width: 1400px;
        margin: 0 auto;
    }

    .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
    }

    .header-actions {
        display: flex;
        gap: 12px;
    }

    .filters-section {
        padding: 20px;
        margin-bottom: 20px;
        background: var(--bg-secondary);
        border-radius: 16px;
    }

    .filters-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
        align-items: end;
    }

    .filter-group label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
        color: var(--text-secondary);
    }

    .search-wrapper {
        position: relative;
    }

    .search-wrapper i {
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        color: var(--text-muted);
    }

    .search-wrapper input {
        padding-right: 40px;
    }

    .units-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        gap: 20px;
        margin-bottom: 20px;
    }

    .unit-card {
        background: var(--bg-secondary);
        border-radius: 16px;
        padding: 20px;
        transition: all 0.3s ease;
        border: 1px solid var(--border-color);
    }

    .unit-card:hover {
        transform: translateY(-4px);
        box-shadow: 
            12px 12px 20px var(--shadow-dark),
            -12px -12px 20px var(--shadow-light);
    }

    .unit-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--border-color);
    }

    .unit-number {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--text-primary);
    }

    .unit-number i {
        color: var(--primary-color);
    }

    .unit-status {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 500;
    }

    .status-available {
        background: rgba(72, 187, 120, 0.1);
        color: var(--success-color);
    }

    .status-occupied {
        background: rgba(237, 137, 54, 0.1);
        color: var(--warning-color);
    }

    .status-maintenance {
        background: rgba(245, 101, 101, 0.1);
        color: var(--error-color);
    }

    .unit-details {
        margin-bottom: 16px;
    }

    .detail-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid var(--border-light);
    }

    .detail-row:last-child {
        border-bottom: none;
    }

    .detail-label {
        color: var(--text-muted);
        font-size: 0.9rem;
    }

    .detail-value {
        color: var(--text-primary);
        font-weight: 500;
    }

    .unit-actions {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
        padding-top: 12px;
        border-top: 1px solid var(--border-color);
    }

    .no-data-message {
        grid-column: 1 / -1;
        text-align: center;
        padding: 60px 20px;
        color: var(--text-muted);
    }

    .no-data-message i {
        font-size: 4rem;
        margin-bottom: 20px;
        color: var(--text-muted);
    }

    .no-data-message h3 {
        margin-bottom: 12px;
        color: var(--text-secondary);
    }

    .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 16px;
    }

    .unit-details-view {
        max-width: 600px;
    }

    .unit-header-view {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 16px;
        border-bottom: 2px solid var(--border-color);
    }

    .unit-header-view h3 {
        margin: 0;
        color: var(--text-primary);
    }

    .status-badge {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 16px;
        border-radius: 20px;
        font-size: 0.9rem;
        font-weight: 500;
    }

    .details-grid {
        display: grid;
        gap: 20px;
    }

    .detail-section h4 {
        margin-bottom: 12px;
        color: var(--text-primary);
        font-size: 1.1rem;
        border-bottom: 1px solid var(--border-color);
        padding-bottom: 8px;
    }

    .detail-list {
        display: grid;
        gap: 8px;
    }

    .detail-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
    }

    .detail-item .label {
        color: var(--text-muted);
        font-weight: 500;
    }

    .detail-item .value {
        color: var(--text-primary);
        font-weight: 600;
    }

    .status-change-form {
        max-width: 400px;
    }

    .status-change-form p {
        margin-bottom: 16px;
        padding: 12px;
        background: var(--bg-primary);
        border-radius: 8px;
        border-right: 4px solid var(--primary-color);
    }

    @media (max-width: 768px) {
        .page-header {
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
        }

        .header-actions {
            justify-content: center;
        }

        .filters-grid {
            grid-template-columns: 1fr;
        }

        .units-grid {
            grid-template-columns: 1fr;
        }

        .unit-header {
            flex-direction: column;
            gap: 12px;
            align-items: flex-start;
        }

        .unit-actions {
            justify-content: center;
        }

        .form-grid {
            grid-template-columns: 1fr;
        }

        .unit-header-view {
            flex-direction: column;
            gap: 12px;
            align-items: flex-start;
        }
    }
`;
document.head.appendChild(unitsStyles);
