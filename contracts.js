/**
 * Contracts Management Module
 * Handles lease contract management functionality
 */

window.Contracts = {
  currentPage: 1,
  pageSize: 10,
  searchTerm: "",
  sortField: "startDate",
  sortDirection: "desc",
  filterStatus: "all",

  /**
   * Load contracts management page
   */
  load() {
    this.renderContractsPage();
    this.loadContracts();
  },

  /**
   * Render the contracts management page
   */
  renderContractsPage() {
    const contractsContent = document.getElementById("contractsContent");
    if (!contractsContent) return;

    contractsContent.innerHTML = `
            <div class="contracts-container">
                <!-- Header Section -->
                <div class="page-header">
                    <div class="header-actions">
                        <button class="btn btn-primary" onclick="Contracts.showAddContractModal()">
                            <i class="fas fa-file-contract"></i>
                            إضافة عقد جديد
                        </button>
                        <button class="btn btn-secondary" onclick="Contracts.exportContracts()">
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
                                <input type="text" id="contractsSearch" class="form-control" 
                                       placeholder="البحث باسم المقيم أو رقم الشقة..." 
                                       value="${this.searchTerm}">
                                <i class="fas fa-search"></i>
                            </div>
                        </div>
                        <div class="filter-group">
                            <label>الحالة</label>
                            <select id="contractsStatusFilter" class="form-control">
                                <option value="all">جميع الحالات</option>
                                <option value="active">نشط</option>
                                <option value="expired">منتهي</option>
                                <option value="expiring">قارب على الانتهاء</option>
                                <option value="upcoming">قادم</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label>الترتيب</label>
                            <select id="contractsSortField" class="form-control">
                                <option value="startDate">تاريخ البداية</option>
                                <option value="endDate">تاريخ الانتهاء</option>
                                <option value="residentName">اسم المقيم</option>
                                <option value="monthlyRent">الإيجار الشهري</option>
                                <option value="createdAt">تاريخ الإضافة</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label>الاتجاه</label>
                            <select id="contractsSortDirection" class="form-control">
                                <option value="asc">تصاعدي</option>
                                <option value="desc">تنازلي</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Contracts Grid -->
                <div class="contracts-grid" id="contractsGrid">
                    <!-- Contracts will be loaded here -->
                </div>

                <!-- Pagination -->
                <div id="contractsPagination" class="pagination-container">
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
    const searchInput = document.getElementById("contractsSearch");
    if (searchInput) {
      searchInput.addEventListener(
        "input",
        AppUtils.debounce((e) => {
          this.searchTerm = e.target.value;
          this.currentPage = 1;
          this.loadContracts();
        }, 300),
      );
    }

    // Status filter
    const statusFilter = document.getElementById("contractsStatusFilter");
    if (statusFilter) {
      statusFilter.value = this.filterStatus;
      statusFilter.addEventListener("change", (e) => {
        this.filterStatus = e.target.value;
        this.currentPage = 1;
        this.loadContracts();
      });
    }

    // Sort field
    const sortField = document.getElementById("contractsSortField");
    if (sortField) {
      sortField.value = this.sortField;
      sortField.addEventListener("change", (e) => {
        this.sortField = e.target.value;
        this.loadContracts();
      });
    }

    // Sort direction
    const sortDirection = document.getElementById("contractsSortDirection");
    if (sortDirection) {
      sortDirection.value = this.sortDirection;
      sortDirection.addEventListener("change", (e) => {
        this.sortDirection = e.target.value;
        this.loadContracts();
      });
    }
  },

  /**
   * Load and display contracts
   */
  loadContracts() {
    let contracts = db.getTable("contracts");

    // Enrich contracts with resident and unit data
    const residents = db.getTable("residents");
    const units = db.getTable("units");

    contracts = contracts.map((contract) => {
      const resident = residents.find((r) => r.id === contract.residentId);
      const unit = units.find((u) => u.id === contract.unitId);

      return {
        ...contract,
        residentName: resident ? resident.name : "غير معروف",
        residentPhone: resident ? resident.phone : "",
        unitNumber: unit ? unit.unitNumber : "غير معروف",
        unitType: unit ? unit.type : "",
      };
    });

    // Apply search filter
    if (this.searchTerm) {
      const searchFilter = AppUtils.createSearchFilter(this.searchTerm, [
        "residentName",
        "unitNumber",
        "contractNumber",
      ]);
      contracts = contracts.filter(searchFilter);
    }

    // Apply status filter
    if (this.filterStatus !== "all") {
      contracts = contracts.filter((contract) => {
        const status = AppUtils.getContractStatus(contract);
        return status.status === this.filterStatus;
      });
    }

    // Apply sorting
    const sorter = AppUtils.createSorter(this.sortField, this.sortDirection);
    contracts.sort(sorter);

    // Apply pagination
    const pagination = AppUtils.paginate(
      contracts,
      this.currentPage,
      this.pageSize,
    );

    this.renderContracts(pagination.data);
    this.renderPagination(pagination);
  },

  /**
   * Render contracts grid
   */
  renderContracts(contracts) {
    const contractsGrid = document.getElementById("contractsGrid");
    if (!contractsGrid) return;

    if (contracts.length === 0) {
      contractsGrid.innerHTML = `
                <div class="no-data-message">
                    <i class="fas fa-file-contract"></i>
                    <h3>لا توجد عقود</h3>
                    <p>لم يتم العثور على عقود تطابق معايير البحث</p>
                    <button class="btn btn-primary" onclick="Contracts.showAddContractModal()">
                        إضافة عقد جديد
                    </button>
                </div>
            `;
      return;
    }

    const contractsHtml = contracts
      .map((contract) => this.renderContractCard(contract))
      .join("");
    contractsGrid.innerHTML = contractsHtml;
  },

  /**
   * Render individual contract card
   */
  renderContractCard(contract) {
    const statusInfo = AppUtils.getContractStatus(contract);
    const settings = db.getSettings();
    const duration = AppUtils.calculateContractDuration(
      contract.startDate,
      contract.endDate,
    );

    return `
            <div class="contract-card neu-flat" data-contract-id="${contract.id}">
                <div class="contract-header">
                    <div class="contract-number">
                        <i class="fas fa-file-contract"></i>
                        <span>عقد ${contract.contractNumber || contract.id.substr(-6)}</span>
                    </div>
                    <div class="contract-status ${statusInfo.class}">
                        <i class="fas fa-circle"></i>
                        <span>${statusInfo.label}</span>
                    </div>
                </div>
                
                <div class="contract-details">
                    <div class="detail-row">
                        <span class="detail-label">المقيم:</span>
                        <span class="detail-value">${contract.residentName}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">الشقة:</span>
                        <span class="detail-value">شقة ${contract.unitNumber}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">تاريخ البداية:</span>
                        <span class="detail-value">${AppUtils.formatDate(contract.startDate)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">تاريخ الانتهاء:</span>
                        <span class="detail-value">${AppUtils.formatDate(contract.endDate)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">المدة:</span>
                        <span class="detail-value">${duration}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">الإيجار الشهري:</span>
                        <span class="detail-value">${AppUtils.formatCurrency(contract.monthlyRent || 0, settings.currency)}</span>
                    </div>
                    ${
                      contract.deposit
                        ? `
                        <div class="detail-row">
                            <span class="detail-label">التأمين:</span>
                            <span class="detail-value">${AppUtils.formatCurrency(contract.deposit, settings.currency)}</span>
                        </div>
                    `
                        : ""
                    }
                </div>

                <div class="contract-actions">
                    <button class="btn btn-sm btn-primary" onclick="Contracts.editContract('${contract.id}')" title="تعديل">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-info" onclick="Contracts.viewContractDetails('${contract.id}')" title="التفاصيل">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-success" onclick="Contracts.printContract('${contract.id}')" title="طباعة">
                        <i class="fas fa-print"></i>
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="Contracts.renewContract('${contract.id}')" title="تجديد">
                        <i class="fas fa-redo"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="Contracts.deleteContract('${contract.id}')" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
  },

  /**
   * Render pagination
   */
  renderPagination(pagination) {
    const paginationContainer = document.getElementById("contractsPagination");
    if (!paginationContainer) return;

    const paginationHtml = AppUtils.createPaginationControls(
      pagination,
      "Contracts.goToPage",
    );
    paginationContainer.innerHTML = paginationHtml;
  },

  /**
   * Go to specific page
   */
  goToPage(page) {
    this.currentPage = page;
    this.loadContracts();
  },

  /**
   * Show add contract modal
   */
  showAddContractModal() {
    // Get available residents and units
    const residents = db
      .getTable("residents")
      .filter((r) => r.status === "active");
    const units = db.getTable("units").filter((u) => u.status === "available");

    if (residents.length === 0) {
      app.showNotification(
        "لا يوجد مقيمون نشطون. يرجى إضافة مقيم أولاً.",
        "warning",
      );
      return;
    }

    if (units.length === 0) {
      app.showNotification(
        "لا توجد شقق فارغة. يرجى إضافة شقة أو تحرير شقة موجودة.",
        "warning",
      );
      return;
    }

    const residentsOptions = residents
      .map(
        (resident) =>
          `<option value="${resident.id}">${resident.name} - ${resident.phone}</option>`,
      )
      .join("");

    const unitsOptions = units
      .map(
        (unit) =>
          `<option value="${unit.id}">شقة ${unit.unitNumber} - ${unit.type} - ${AppUtils.formatCurrency(unit.rent || 0)}</option>`,
      )
      .join("");

    const modalContent = `
            <form id="addContractForm">
                <div class="form-grid">
                    <div class="form-group">
                        <label for="contractResident">المقيم *</label>
                        <select id="contractResident" class="form-control" required>
                            <option value="">اختر المقيم</option>
                            ${residentsOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="contractUnit">الشقة *</label>
                        <select id="contractUnit" class="form-control" required>
                            <option value="">اختر الشقة</option>
                            ${unitsOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="contractNumber">رقم العقد</label>
                        <input type="text" id="contractNumber" class="form-control" 
                               placeholder="سيتم إنشاؤه تلقائياً إذا ترك فارغاً">
                    </div>
                    <div class="form-group">
                        <label for="startDate">تاريخ البداية *</label>
                        <input type="date" id="startDate" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label for="endDate">تاريخ الانتهاء *</label>
                        <input type="date" id="endDate" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label for="monthlyRent">الإيجار الشهري *</label>
                        <input type="number" id="monthlyRent" class="form-control" required 
                               placeholder="مثال: 2500" min="0" step="0.01">
                    </div>
                    <div class="form-group">
                        <label for="deposit">مبلغ التأمين</label>
                        <input type="number" id="deposit" class="form-control" 
                               placeholder="مثال: 5000" min="0" step="0.01">
                    </div>
                    <div class="form-group">
                        <label for="paymentDay">يوم الدفع الشهري</label>
                        <select id="paymentDay" class="form-control">
                            <option value="">اختر اليوم</option>
                            ${Array.from({ length: 28 }, (_, i) => i + 1)
                              .map(
                                (day) =>
                                  `<option value="${day}">${day}</option>`,
                              )
                              .join("")}
                        </select>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="contractTerms">شروط العقد</label>
                    <textarea id="contractTerms" class="form-control" rows="4" 
                              placeholder="أدخل شروط وأحكام العقد..."></textarea>
                </div>

                <div class="form-section">
                    <h4>المرفقات (اختياري)</h4>
                    <div class="form-grid">
                        <div class="form-group">
                            <label>صورة العقد</label>
                            <div class="file-upload-area" onclick="Contracts.uploadContractImage()">
                                <i class="fas fa-cloud-upload-alt"></i>
                                <p>اضغط لرفع صورة العقد</p>
                                <input type="hidden" id="contractImage">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>صورة الضمان</label>
                            <div class="file-upload-area" onclick="Contracts.uploadGuaranteeImage()">
                                <i class="fas fa-cloud-upload-alt"></i>
                                <p>اضغط لرفع صورة الضمان</p>
                                <input type="hidden" id="guaranteeImage">
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        `;

    app.showModal("إضافة عقد جديد", modalContent, [
      {
        text: "إلغاء",
        class: "btn-secondary",
        onclick: "app.closeModal()",
      },
      {
        text: "إضافة العقد",
        class: "btn-primary",
        onclick: "Contracts.saveContract()",
      },
    ]);

    // Auto-fill rent when unit is selected
    document.getElementById("contractUnit").addEventListener("change", (e) => {
      if (e.target.value) {
        const unit = units.find((u) => u.id === e.target.value);
        if (unit && unit.rent) {
          document.getElementById("monthlyRent").value = unit.rent;
        }
      }
    });
  },

  /**
   * Upload contract image
   */
  async uploadContractImage() {
    try {
      const imageData = await AppUtils.createFileInput("image/*");
      document.getElementById("contractImage").value = imageData;

      // Update upload area
      const uploadArea = event.currentTarget;
      uploadArea.innerHTML = `
                <i class="fas fa-check-circle text-success"></i>
                <p>تم رفع صورة العقد بنجاح</p>
            `;
      uploadArea.classList.add("uploaded");

      app.showNotification("تم رفع صورة العقد بنجاح", "success");
    } catch (error) {
      app.showNotification(
        error.message || "حدث خطأ أثناء رفع الصورة",
        "error",
      );
    }
  },

  /**
   * Upload guarantee image
   */
  async uploadGuaranteeImage() {
    try {
      const imageData = await AppUtils.createFileInput("image/*");
      document.getElementById("guaranteeImage").value = imageData;

      // Update upload area
      const uploadArea = event.currentTarget;
      uploadArea.innerHTML = `
                <i class="fas fa-check-circle text-success"></i>
                <p>تم رفع صورة الضمان بنجاح</p>
            `;
      uploadArea.classList.add("uploaded");

      app.showNotification("تم رفع صورة الضمان بنجاح", "success");
    } catch (error) {
      app.showNotification(
        error.message || "حدث خطأ أثناء رفع الصورة",
        "error",
      );
    }
  },

  /**
   * Save contract (add or edit)
   */
  saveContract(contractId = null) {
    const form =
      document.getElementById("addContractForm") ||
      document.getElementById("editContractForm");
    if (!form) return;

    const contractData = {
      residentId: document.getElementById("contractResident").value,
      unitId: document.getElementById("contractUnit").value,
      contractNumber: document.getElementById("contractNumber").value.trim(),
      startDate: document.getElementById("startDate").value,
      endDate: document.getElementById("endDate").value,
      monthlyRent:
        parseFloat(document.getElementById("monthlyRent").value) || 0,
      deposit: parseFloat(document.getElementById("deposit").value) || 0,
      paymentDay: parseInt(document.getElementById("paymentDay").value) || null,
      contractTerms: document.getElementById("contractTerms").value.trim(),
      contractImage: document.getElementById("contractImage").value,
      guaranteeImage: document.getElementById("guaranteeImage").value,
    };

    // Validation
    if (!contractData.residentId) {
      app.showNotification("يرجى اختيار المقيم", "error");
      return;
    }

    if (!contractData.unitId) {
      app.showNotification("يرجى اختيار الشقة", "error");
      return;
    }

    if (!contractData.startDate) {
      app.showNotification("تاريخ البداية مطلوب", "error");
      return;
    }

    if (!contractData.endDate) {
      app.showNotification("تاريخ الانتهاء مطلوب", "error");
      return;
    }

    if (new Date(contractData.endDate) <= new Date(contractData.startDate)) {
      app.showNotification(
        "تاريخ الانتهاء يجب أن يكون بعد تاريخ البداية",
        "error",
      );
      return;
    }

    if (contractData.monthlyRent <= 0) {
      app.showNotification("الإيجار الشهري يجب أن يكون أكبر من صفر", "error");
      return;
    }

    // Generate contract number if not provided
    if (!contractData.contractNumber) {
      contractData.contractNumber = AppUtils.generateReference("CON");
    }

    // Check for overlapping contracts for the same unit
    const existingContracts = db.getTable("contracts");
    const overlappingContract = existingContracts.find((contract) => {
      if (contract.id === contractId) return false; // Skip current contract when editing

      if (contract.unitId !== contractData.unitId) return false;

      const existingStart = new Date(contract.startDate);
      const existingEnd = new Date(contract.endDate);
      const newStart = new Date(contractData.startDate);
      const newEnd = new Date(contractData.endDate);

      return newStart <= existingEnd && newEnd >= existingStart;
    });

    if (overlappingContract) {
      app.showNotification(
        "يوجد عقد متداخل مع هذه الفترة للشقة المحددة",
        "error",
      );
      return;
    }

    let success;
    if (contractId) {
      success = db.updateRecord("contracts", contractId, contractData);
    } else {
      success = db.addRecord("contracts", contractData);

      // Update unit status to occupied
      if (success) {
        db.updateRecord("units", contractData.unitId, { status: "occupied" });
      }
    }

    if (success) {
      app.closeModal();
      this.loadContracts();
      app.showNotification(
        contractId ? "تم تحديث العقد بنجاح" : "تم إضافة العقد بنجاح",
        "success",
      );
    } else {
      app.showNotification("حدث خطأ أثناء حفظ البيانات", "error");
    }
  },

  /**
   * Edit contract
   */
  editContract(contractId) {
    const contract = db.getRecord("contracts", contractId);
    if (!contract) {
      app.showNotification("العقد غير موجود", "error");
      return;
    }

    // Get all residents and units for editing
    const residents = db.getTable("residents");
    const units = db.getTable("units");

    const residentsOptions = residents
      .map(
        (resident) =>
          `<option value="${resident.id}" ${resident.id === contract.residentId ? "selected" : ""}>
                ${resident.name} - ${resident.phone}
            </option>`,
      )
      .join("");

    const unitsOptions = units
      .map(
        (unit) =>
          `<option value="${unit.id}" ${unit.id === contract.unitId ? "selected" : ""}>
                شقة ${unit.unitNumber} - ${unit.type} - ${AppUtils.formatCurrency(unit.rent || 0)}
            </option>`,
      )
      .join("");

    const modalContent = `
            <form id="editContractForm">
                <div class="form-grid">
                    <div class="form-group">
                        <label for="contractResident">المقيم *</label>
                        <select id="contractResident" class="form-control" required>
                            <option value="">اختر المقيم</option>
                            ${residentsOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="contractUnit">الشقة *</label>
                        <select id="contractUnit" class="form-control" required>
                            <option value="">اختر الشقة</option>
                            ${unitsOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="contractNumber">رقم العقد</label>
                        <input type="text" id="contractNumber" class="form-control" 
                               value="${contract.contractNumber || ""}" placeholder="رقم العقد">
                    </div>
                    <div class="form-group">
                        <label for="startDate">تاريخ البداية *</label>
                        <input type="date" id="startDate" class="form-control" required 
                               value="${contract.startDate}">
                    </div>
                    <div class="form-group">
                        <label for="endDate">تاريخ الانتهاء *</label>
                        <input type="date" id="endDate" class="form-control" required 
                               value="${contract.endDate}">
                    </div>
                    <div class="form-group">
                        <label for="monthlyRent">الإيجار الشهري *</label>
                        <input type="number" id="monthlyRent" class="form-control" required 
                               value="${contract.monthlyRent || ""}" placeholder="مثال: 2500" min="0" step="0.01">
                    </div>
                    <div class="form-group">
                        <label for="deposit">مبلغ التأمين</label>
                        <input type="number" id="deposit" class="form-control" 
                               value="${contract.deposit || ""}" placeholder="مثال: 5000" min="0" step="0.01">
                    </div>
                    <div class="form-group">
                        <label for="paymentDay">يوم الدفع الشهري</label>
                        <select id="paymentDay" class="form-control">
                            <option value="">اختر اليوم</option>
                            ${Array.from({ length: 28 }, (_, i) => i + 1)
                              .map(
                                (day) =>
                                  `<option value="${day}" ${contract.paymentDay === day ? "selected" : ""}>${day}</option>`,
                              )
                              .join("")}
                        </select>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="contractTerms">شروط العقد</label>
                    <textarea id="contractTerms" class="form-control" rows="4" 
                              placeholder="أدخل شروط وأحكام العقد...">${contract.contractTerms || ""}</textarea>
                </div>

                <div class="form-section">
                    <h4>المرفقات (اختياري)</h4>
                    <div class="form-grid">
                        <div class="form-group">
                            <label>صورة العقد</label>
                            <div class="file-upload-area ${contract.contractImage ? "uploaded" : ""}" 
                                 onclick="Contracts.uploadContractImage()">
                                ${
                                  contract.contractImage
                                    ? '<i class="fas fa-check-circle text-success"></i><p>تم رفع صورة العقد</p>'
                                    : '<i class="fas fa-cloud-upload-alt"></i><p>اضغط لرفع صورة العقد</p>'
                                }
                                <input type="hidden" id="contractImage" value="${contract.contractImage || ""}">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>صورة الضمان</label>
                            <div class="file-upload-area ${contract.guaranteeImage ? "uploaded" : ""}" 
                                 onclick="Contracts.uploadGuaranteeImage()">
                                ${
                                  contract.guaranteeImage
                                    ? '<i class="fas fa-check-circle text-success"></i><p>تم رفع صورة الضمان</p>'
                                    : '<i class="fas fa-cloud-upload-alt"></i><p>اضغط لرفع صورة الضمان</p>'
                                }
                                <input type="hidden" id="guaranteeImage" value="${contract.guaranteeImage || ""}">
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        `;

    app.showModal("تعديل العقد", modalContent, [
      {
        text: "إلغاء",
        class: "btn-secondary",
        onclick: "app.closeModal()",
      },
      {
        text: "حفظ التغييرات",
        class: "btn-primary",
        onclick: `Contracts.saveContract('${contractId}')`,
      },
    ]);
  },

  /**
   * View contract details
   */
  viewContractDetails(contractId) {
    const contract = db.getRecord("contracts", contractId);
    if (!contract) {
      app.showNotification("العقد غير موجود", "error");
      return;
    }

    // Get related data
    const resident = db.getRecord("residents", contract.residentId);
    const unit = db.getRecord("units", contract.unitId);
    const statusInfo = AppUtils.getContractStatus(contract);
    const duration = AppUtils.calculateContractDuration(
      contract.startDate,
      contract.endDate,
    );
    const settings = db.getSettings();

    const modalContent = `
            <div class="contract-details-view">
                <div class="contract-summary">
                    <div class="contract-header-view">
                        <h3>عقد ${contract.contractNumber || contract.id.substr(-6)}</h3>
                        <span class="status-badge ${statusInfo.class}">
                            <i class="fas fa-circle"></i>
                            ${statusInfo.label}
                        </span>
                    </div>
                </div>

                <div class="details-grid">
                    <div class="detail-section">
                        <h4>أطراف العقد</h4>
                        <div class="detail-list">
                            <div class="detail-item">
                                <span class="label">المقيم:</span>
                                <span class="value">${resident ? resident.name : "غير معروف"}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">هاتف المقيم:</span>
                                <span class="value">${resident ? resident.phone : "غير معروف"}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">الشقة:</span>
                                <span class="value">${unit ? `شقة ${unit.unitNumber}` : "غير معروف"}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">نوع الشقة:</span>
                                <span class="value">${unit ? unit.type : "غير معروف"}</span>
                            </div>
                        </div>
                    </div>

                    <div class="detail-section">
                        <h4>تفاصيل العقد</h4>
                        <div class="detail-list">
                            <div class="detail-item">
                                <span class="label">تاريخ البداية:</span>
                                <span class="value">${AppUtils.formatDate(contract.startDate)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">تاريخ الانتهاء:</span>
                                <span class="value">${AppUtils.formatDate(contract.endDate)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">مدة العقد:</span>
                                <span class="value">${duration}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">يوم الدفع:</span>
                                <span class="value">${contract.paymentDay ? `اليوم ${contract.paymentDay}` : "غير محدد"}</span>
                            </div>
                        </div>
                    </div>

                    <div class="detail-section">
                        <h4>التفاصيل المالية</h4>
                        <div class="detail-list">
                            <div class="detail-item">
                                <span class="label">الإيجار الشهري:</span>
                                <span class="value">${AppUtils.formatCurrency(contract.monthlyRent || 0, settings.currency)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">مبلغ التأمين:</span>
                                <span class="value">${contract.deposit ? AppUtils.formatCurrency(contract.deposit, settings.currency) : "لا يوجد"}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">إجمالي قيمة العقد:</span>
                                <span class="value">${AppUtils.formatCurrency(this.calculateTotalContractValue(contract), settings.currency)}</span>
                            </div>
                        </div>
                    </div>

                    ${
                      contract.contractTerms
                        ? `
                        <div class="detail-section">
                            <h4>شروط العقد</h4>
                            <div class="contract-terms">
                                <p>${contract.contractTerms}</p>
                            </div>
                        </div>
                    `
                        : ""
                    }

                    <div class="detail-section">
                        <h4>معلومات إضافية</h4>
                        <div class="detail-list">
                            <div class="detail-item">
                                <span class="label">تاريخ الإنشاء:</span>
                                <span class="value">${AppUtils.formatDate(contract.createdAt)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">آخر تحديث:</span>
                                <span class="value">${AppUtils.formatDate(contract.updatedAt)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">صورة العقد:</span>
                                <span class="value">${contract.contractImage ? "متوفرة" : "غير متوفرة"}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">صورة الضمان:</span>
                                <span class="value">${contract.guaranteeImage ? "متوفرة" : "غير متوفرة"}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

    app.showModal(`تفاصيل العقد`, modalContent, [
      {
        text: "إغلاق",
        class: "btn-secondary",
        onclick: "app.closeModal()",
      },
      {
        text: "طباعة",
        class: "btn-success",
        onclick: `app.closeModal(); Contracts.printContract('${contractId}')`,
      },
      {
        text: "تعديل",
        class: "btn-primary",
        onclick: `app.closeModal(); Contracts.editContract('${contractId}')`,
      },
    ]);
  },

  /**
   * Calculate total contract value
   */
  calculateTotalContractValue(contract) {
    const startDate = new Date(contract.startDate);
    const endDate = new Date(contract.endDate);
    const months =
      (endDate.getFullYear() - startDate.getFullYear()) * 12 +
      (endDate.getMonth() - startDate.getMonth());

    return (contract.monthlyRent || 0) * Math.max(months, 1);
  },

  /**
   * Print contract
   */
  printContract(contractId) {
    const contract = db.getRecord("contracts", contractId);
    if (!contract) {
      app.showNotification("العقد غير موجود", "error");
      return;
    }

    const resident = db.getRecord("residents", contract.residentId);
    const unit = db.getRecord("units", contract.unitId);
    const settings = db.getSettings();
    const duration = AppUtils.calculateContractDuration(
      contract.startDate,
      contract.endDate,
    );

    const printContent = `
            <div style="text-align: center; margin-bottom: 40px;">
                <h1>عقد إيجار</h1>
                <h2>رقم العقد: ${contract.contractNumber || contract.id.substr(-6)}</h2>
            </div>

            <div style="margin-bottom: 30px;">
                <h3>أطراف العقد:</h3>
                <table style="width: 100%; margin: 20px 0;">
                    <tr>
                        <td style="width: 30%; font-weight: bold;">المؤجر:</td>
                        <td>${settings.buildingName || "إدارة المبنى"}</td>
                    </tr>
                    <tr>
                        <td style="font-weight: bold;">المستأجر:</td>
                        <td>${resident ? resident.name : "غير معروف"}</td>
                    </tr>
                    <tr>
                        <td style="font-weight: bold;">هاتف المستأجر:</td>
                        <td>${resident ? resident.phone : "غير معروف"}</td>
                    </tr>
                </table>
            </div>

            <div style="margin-bottom: 30px;">
                <h3>تفاصيل العقار:</h3>
                <table style="width: 100%; margin: 20px 0;">
                    <tr>
                        <td style="width: 30%; font-weight: bold;">رقم الشقة:</td>
                        <td>${unit ? unit.unitNumber : "غير معروف"}</td>
                    </tr>
                    <tr>
                        <td style="font-weight: bold;">نوع الشقة:</td>
                        <td>${unit ? unit.type : "غير معروف"}</td>
                    </tr>
                    <tr>
                        <td style="font-weight: bold;">المساحة:</td>
                        <td>${unit && unit.area ? unit.area + " م²" : "غير محدد"}</td>
                    </tr>
                </table>
            </div>

            <div style="margin-bottom: 30px;">
                <h3>تفاصيل العقد:</h3>
                <table style="width: 100%; margin: 20px 0;">
                    <tr>
                        <td style="width: 30%; font-weight: bold;">تاريخ البداية:</td>
                        <td>${AppUtils.formatDate(contract.startDate)}</td>
                    </tr>
                    <tr>
                        <td style="font-weight: bold;">تاريخ الانتهاء:</td>
                        <td>${AppUtils.formatDate(contract.endDate)}</td>
                    </tr>
                    <tr>
                        <td style="font-weight: bold;">مدة العقد:</td>
                        <td>${duration}</td>
                    </tr>
                    <tr>
                        <td style="font-weight: bold;">الإيجار الشهري:</td>
                        <td>${AppUtils.formatCurrency(contract.monthlyRent || 0, settings.currency)}</td>
                    </tr>
                    ${
                      contract.deposit
                        ? `
                        <tr>
                            <td style="font-weight: bold;">مبلغ التأمين:</td>
                            <td>${AppUtils.formatCurrency(contract.deposit, settings.currency)}</td>
                        </tr>
                    `
                        : ""
                    }
                    <tr>
                        <td style="font-weight: bold;">إجمالي قيمة العقد:</td>
                        <td>${AppUtils.formatCurrency(this.calculateTotalContractValue(contract), settings.currency)}</td>
                    </tr>
                </table>
            </div>

            ${
              contract.contractTerms
                ? `
                <div style="margin-bottom: 30px;">
                    <h3>شروط وأحكام العقد:</h3>
                    <div style="padding: 20px; background-color: #f9f9f9; border-radius: 8px; line-height: 1.8;">
                        ${contract.contractTerms.replace(/\n/g, "<br>")}
                    </div>
                </div>
            `
                : ""
            }

            <div class="signature-section">
                <div class="signature-box">
                    <div class="signature-line">توقيع المؤجر</div>
                </div>
                <div class="signature-box">
                    <div class="signature-line">توقيع المستأجر</div>
                </div>
            </div>
        `;

    AppUtils.printDocument(
      `عقد إيجار - ${contract.contractNumber || contract.id.substr(-6)}`,
      printContent,
    );
  },

  /**
   * Renew contract
   */
  renewContract(contractId) {
    const contract = db.getRecord("contracts", contractId);
    if (!contract) {
      app.showNotification("العقد غير موجود", "error");
      return;
    }

    const resident = db.getRecord("residents", contract.residentId);
    const unit = db.getRecord("units", contract.unitId);

    // Calculate new dates (1 year from current end date)
    const currentEndDate = new Date(contract.endDate);
    const newStartDate = new Date(currentEndDate);
    newStartDate.setDate(newStartDate.getDate() + 1);

    const newEndDate = new Date(newStartDate);
    newEndDate.setFullYear(newEndDate.getFullYear() + 1);

    const modalContent = `
            <div class="renewal-info">
                <h4>تجديد عقد: ${contract.contractNumber || contract.id.substr(-6)}</h4>
                <p><strong>المقيم:</strong> ${resident ? resident.name : "غير معروف"}</p>
                <p><strong>الشقة:</strong> ${unit ? `شقة ${unit.unitNumber}` : "غير معروف"}</p>
                <p><strong>العقد الحالي ينتهي في:</strong> ${AppUtils.formatDate(contract.endDate)}</p>
            </div>

            <form id="renewContractForm">
                <div class="form-grid">
                    <div class="form-group">
                        <label for="renewStartDate">تاريخ بداية العقد الجديد *</label>
                        <input type="date" id="renewStartDate" class="form-control" required 
                               value="${newStartDate.toISOString().split("T")[0]}">
                    </div>
                    <div class="form-group">
                        <label for="renewEndDate">تاريخ انتهاء العقد الجديد *</label>
                        <input type="date" id="renewEndDate" class="form-control" required 
                               value="${newEndDate.toISOString().split("T")[0]}">
                    </div>
                    <div class="form-group">
                        <label for="renewMonthlyRent">الإيجار الشهري الجديد *</label>
                        <input type="number" id="renewMonthlyRent" class="form-control" required 
                               value="${contract.monthlyRent || ""}" min="0" step="0.01">
                    </div>
                    <div class="form-group">
                        <label for="renewDeposit">مبلغ التأمين الجديد</label>
                        <input type="number" id="renewDeposit" class="form-control" 
                               value="${contract.deposit || ""}" min="0" step="0.01">
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="renewTerms">شروط العقد الجديد</label>
                    <textarea id="renewTerms" class="form-control" rows="4" 
                              placeholder="أدخل شروط وأحكام العقد الجديد...">${contract.contractTerms || ""}</textarea>
                </div>
            </form>
        `;

    app.showModal("تجديد العقد", modalContent, [
      {
        text: "إلغاء",
        class: "btn-secondary",
        onclick: "app.closeModal()",
      },
      {
        text: "تجديد العقد",
        class: "btn-primary",
        onclick: `Contracts.confirmRenewal('${contractId}')`,
      },
    ]);
  },

  /**
   * Confirm contract renewal
   */
  confirmRenewal(contractId) {
    const contract = db.getRecord("contracts", contractId);
    if (!contract) return;

    const renewalData = {
      residentId: contract.residentId,
      unitId: contract.unitId,
      contractNumber: AppUtils.generateReference("CON"),
      startDate: document.getElementById("renewStartDate").value,
      endDate: document.getElementById("renewEndDate").value,
      monthlyRent:
        parseFloat(document.getElementById("renewMonthlyRent").value) || 0,
      deposit: parseFloat(document.getElementById("renewDeposit").value) || 0,
      paymentDay: contract.paymentDay,
      contractTerms: document.getElementById("renewTerms").value.trim(),
      renewedFrom: contractId,
    };

    // Validation
    if (!renewalData.startDate || !renewalData.endDate) {
      app.showNotification("تواريخ العقد مطلوبة", "error");
      return;
    }

    if (new Date(renewalData.endDate) <= new Date(renewalData.startDate)) {
      app.showNotification(
        "تاريخ الانتهاء يجب أن يكون بعد تاريخ البداية",
        "error",
      );
      return;
    }

    if (renewalData.monthlyRent <= 0) {
      app.showNotification("الإيجار الشهري يجب أن يكون أكبر من صفر", "error");
      return;
    }

    const success = db.addRecord("contracts", renewalData);

    if (success) {
      app.closeModal();
      this.loadContracts();
      app.showNotification("تم تجديد العقد بنجاح", "success");
    } else {
      app.showNotification("حدث خطأ أثناء تجديد العقد", "error");
    }
  },

  /**
   * Delete contract
   */
  deleteContract(contractId) {
    const contract = db.getRecord("contracts", contractId);
    if (!contract) {
      app.showNotification("العقد غير موجود", "error");
      return;
    }

    app.confirm(
      `هل أنت متأكد من حذف العقد ${contract.contractNumber || contract.id.substr(-6)}؟ هذا الإجراء لا يمكن التراجع عنه.`,
      `Contracts.confirmDeleteContract('${contractId}')`,
    );
  },

  /**
   * Confirm contract deletion
   */
  confirmDeleteContract(contractId) {
    const contract = db.getRecord("contracts", contractId);
    const success = db.deleteRecord("contracts", contractId);

    if (success) {
      // Update unit status to available if this was the current contract
      const statusInfo = AppUtils.getContractStatus(contract);
      if (statusInfo.status === "active") {
        db.updateRecord("units", contract.unitId, { status: "available" });
      }

      this.loadContracts();
      app.showNotification("تم حذف العقد بنجاح", "success");
    } else {
      app.showNotification("حدث خطأ أثناء حذف العقد", "error");
    }
  },

  /**
   * Export contracts data
   */
  exportContracts() {
    const contracts = db.getTable("contracts");

    if (contracts.length === 0) {
      app.showNotification("لا توجد بيانات للتصدير", "warning");
      return;
    }

    // Enrich with resident and unit data
    const residents = db.getTable("residents");
    const units = db.getTable("units");

    const exportData = contracts.map((contract) => {
      const resident = residents.find((r) => r.id === contract.residentId);
      const unit = units.find((u) => u.id === contract.unitId);
      const statusInfo = AppUtils.getContractStatus(contract);

      return {
        "رقم العقد": contract.contractNumber || contract.id.substr(-6),
        المقيم: resident ? resident.name : "غير معروف",
        "هاتف المقيم": resident ? resident.phone : "",
        الشقة: unit ? `شقة ${unit.unitNumber}` : "غير معروف",
        "تاريخ البداية": AppUtils.formatDate(contract.startDate),
        "تاريخ الانتهاء": AppUtils.formatDate(contract.endDate),
        "الإيجار الشهري": contract.monthlyRent || 0,
        التأمين: contract.deposit || 0,
        الحالة: statusInfo.label,
        "تاريخ الإنشاء": AppUtils.formatDate(contract.createdAt),
      };
    });

    AppUtils.exportToCSV(
      exportData,
      `contracts-${new Date().toISOString().split("T")[0]}`,
    );
    app.showNotification("تم تصدير البيانات بنجاح", "success");
  },
};

// Add contracts-specific styles
const contractsStyles = document.createElement("style");
contractsStyles.textContent = `
    .contracts-container {
        max-width: 1400px;
        margin: 0 auto;
    }

    .contracts-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
        gap: 20px;
        margin-bottom: 20px;
    }

    .contract-card {
        background: var(--bg-secondary);
        border-radius: 16px;
        padding: 20px;
        transition: all 0.3s ease;
        border: 1px solid var(--border-color);
    }

    .contract-card:hover {
        transform: translateY(-4px);
        box-shadow: 
            12px 12px 20px var(--shadow-dark),
            -12px -12px 20px var(--shadow-light);
    }

    .contract-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--border-color);
    }

    .contract-number {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--text-primary);
    }

    .contract-number i {
        color: var(--primary-color);
    }

    .contract-status {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 500;
    }

    .contract-details {
        margin-bottom: 16px;
    }

    .contract-actions {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
        padding-top: 12px;
        border-top: 1px solid var(--border-color);
        flex-wrap: wrap;
    }

    .contract-details-view {
        max-width: 700px;
    }

    .contract-header-view {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
        padding-bottom: 20px;
        border-bottom: 2px solid var(--border-color);
    }

    .contract-header-view h3 {
        margin: 0;
        color: var(--text-primary);
        font-size: 1.5rem;
    }

    .contract-terms {
        padding: 16px;
        background: var(--bg-primary);
        border-radius: 8px;
        border-right: 4px solid var(--primary-color);
        line-height: 1.6;
    }

    .contract-terms p {
        margin: 0;
        color: var(--text-secondary);
    }

    .renewal-info {
        background: var(--bg-primary);
        padding: 16px;
        border-radius: 8px;
        margin-bottom: 20px;
        border-right: 4px solid var(--info-color);
    }

    .renewal-info h4 {
        margin: 0 0 12px 0;
        color: var(--text-primary);
    }

    .renewal-info p {
        margin: 4px 0;
        color: var(--text-secondary);
    }

    @media (max-width: 768px) {
        .contracts-grid {
            grid-template-columns: 1fr;
        }

        .contract-header {
            flex-direction: column;
            gap: 12px;
            align-items: flex-start;
        }

        .contract-actions {
            justify-content: center;
        }

        .form-grid {
            grid-template-columns: 1fr;
        }

        .contract-header-view {
            flex-direction: column;
            gap: 12px;
            align-items: flex-start;
        }
    }

    @media (max-width: 480px) {
        .contract-actions {
            gap: 4px;
        }

        .contract-actions .btn {
            padding: 6px 8px;
            font-size: 0.8rem;
        }
    }
`;
document.head.appendChild(contractsStyles);
