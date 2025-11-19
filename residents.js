/**
 * Residents Management Module
 * Handles resident/tenant management functionality
 */

window.Residents = {
  currentPage: 1,
  pageSize: 10,
  searchTerm: "",
  sortField: "name",
  sortDirection: "asc",
  filterStatus: "all",

  /**
   * Load residents management page
   */
  load() {
    this.renderResidentsPage();
    this.loadResidents();
  },

  /**
   * Render the residents management page
   */
  renderResidentsPage() {
    const residentsContent = document.getElementById("residentsContent");
    if (!residentsContent) return;

    residentsContent.innerHTML = `
            <div class="residents-container">
                <!-- Header Section -->
                <div class="page-header">
                    <div class="header-actions">
                        <button class="btn btn-primary" onclick="Residents.showAddResidentModal()">
                            <i class="fas fa-user-plus"></i>
                            إضافة مقيم جديد
                        </button>
                        <button class="btn btn-secondary" onclick="Residents.exportResidents()">
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
                                <input type="text" id="residentsSearch" class="form-control" 
                                       placeholder="البحث بالاسم أو الهاتف أو الهوية..." 
                                       value="${this.searchTerm}">
                                <i class="fas fa-search"></i>
                            </div>
                        </div>
                        <div class="filter-group">
                            <label>الحالة</label>
                            <select id="residentsStatusFilter" class="form-control">
                                <option value="all">جميع الحالات</option>
                                <option value="active">نشط</option>
                                <option value="inactive">غير نشط</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label>الترتيب</label>
                            <select id="residentsSortField" class="form-control">
                                <option value="name">الاسم</option>
                                <option value="phone">الهاتف</option>
                                <option value="nationalId">رقم الهوية</option>
                                <option value="createdAt">تاريخ الإضافة</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label>الاتجاه</label>
                            <select id="residentsSortDirection" class="form-control">
                                <option value="asc">تصاعدي</option>
                                <option value="desc">تنازلي</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Residents Grid -->
                <div class="residents-grid" id="residentsGrid">
                    <!-- Residents will be loaded here -->
                </div>

                <!-- Pagination -->
                <div id="residentsPagination" class="pagination-container">
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
    const searchInput = document.getElementById("residentsSearch");
    if (searchInput) {
      searchInput.addEventListener(
        "input",
        AppUtils.debounce((e) => {
          this.searchTerm = e.target.value;
          this.currentPage = 1;
          this.loadResidents();
        }, 300),
      );
    }

    // Status filter
    const statusFilter = document.getElementById("residentsStatusFilter");
    if (statusFilter) {
      statusFilter.value = this.filterStatus;
      statusFilter.addEventListener("change", (e) => {
        this.filterStatus = e.target.value;
        this.currentPage = 1;
        this.loadResidents();
      });
    }

    // Sort field
    const sortField = document.getElementById("residentsSortField");
    if (sortField) {
      sortField.value = this.sortField;
      sortField.addEventListener("change", (e) => {
        this.sortField = e.target.value;
        this.loadResidents();
      });
    }

    // Sort direction
    const sortDirection = document.getElementById("residentsSortDirection");
    if (sortDirection) {
      sortDirection.value = this.sortDirection;
      sortDirection.addEventListener("change", (e) => {
        this.sortDirection = e.target.value;
        this.loadResidents();
      });
    }
  },

  /**
   * Load and display residents
   */
  async loadResidents() {
    // Try loading from server if configured
    let serverLoaded = false;
    try {
      const settings = db.getSettings();
      if (settings && settings.sms && settings.sms.proxyEndpoint) {
        const data = await AppUtils.serverRequest("/api/residents");
        if (data && data.success && Array.isArray(data.residents)) {
          serverLoaded = true;
          let residents = data.residents;

          // Apply search filter
          if (this.searchTerm) {
            const searchFilter = AppUtils.createSearchFilter(this.searchTerm, [
              "name",
              "phone",
              "nationalId",
              "email",
            ]);
            residents = residents.filter(searchFilter);
          }

          // Apply status filter
          if (this.filterStatus !== "all") {
            residents = residents.filter(
              (resident) => resident.status === this.filterStatus,
            );
          }

          // Apply sorting
          const sorter = AppUtils.createSorter(
            this.sortField,
            this.sortDirection,
          );
          residents.sort(sorter);

          // Apply pagination
          const pagination = AppUtils.paginate(
            residents,
            this.currentPage,
            this.pageSize,
          );

          this.renderResidents(pagination.data);
          this.renderPagination(pagination);
          return;
        }
      }
    } catch (err) {
      console.warn(
        "Failed to load residents from server, falling back to local DB:",
        err.message || err,
      );
    }

    // Fallback to local DB
    let residents = db.getTable("residents");

    // Apply search filter
    if (this.searchTerm) {
      const searchFilter = AppUtils.createSearchFilter(this.searchTerm, [
        "name",
        "phone",
        "nationalId",
        "email",
      ]);
      residents = residents.filter(searchFilter);
    }

    // Apply status filter
    if (this.filterStatus !== "all") {
      residents = residents.filter(
        (resident) => resident.status === this.filterStatus,
      );
    }

    // Apply sorting
    const sorter = AppUtils.createSorter(this.sortField, this.sortDirection);
    residents.sort(sorter);

    // Apply pagination
    const pagination = AppUtils.paginate(
      residents,
      this.currentPage,
      this.pageSize,
    );

    this.renderResidents(pagination.data);
    this.renderPagination(pagination);
  },

  /**
   * Render residents grid
   */
  renderResidents(residents) {
    const residentsGrid = document.getElementById("residentsGrid");
    if (!residentsGrid) return;

    if (residents.length === 0) {
      residentsGrid.innerHTML = `
                <div class="no-data-message">
                    <i class="fas fa-users"></i>
                    <h3>لا يوجد مقيمون</h3>
                    <p>لم يتم العثور على مقيمين يطابقون معايير البحث</p>
                    <button class="btn btn-primary" onclick="Residents.showAddResidentModal()">
                        إضافة مقيم جديد
                    </button>
                </div>
            `;
      return;
    }

    const residentsHtml = residents
      .map((resident) => this.renderResidentCard(resident))
      .join("");
    residentsGrid.innerHTML = residentsHtml;
  },

  /**
   * Render individual resident card
   */
  renderResidentCard(resident) {
    const statusInfo = this.getResidentStatusInfo(resident.status);
    const balance = db.calculateResidentBalance(resident.id);
    const settings = db.getSettings();

    // Get current unit
    const contracts = db.getTable("contracts");
    const currentContract = contracts.find((contract) => {
      const endDate = new Date(contract.endDate);
      return contract.residentId === resident.id && endDate > new Date();
    });

    const units = db.getTable("units");
    const currentUnit = currentContract
      ? units.find((unit) => unit.id === currentContract.unitId)
      : null;

    return `
            <div class="resident-card neu-flat" data-resident-id="${resident.id}">
                <div class="resident-header">
                    <div class="resident-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="resident-info">
                        <h3>${resident.name}</h3>
                        <p class="resident-phone">
                            <i class="fas fa-phone"></i>
                            ${resident.phone || "غير محدد"}
                        </p>
                    </div>
                    <div class="resident-status ${statusInfo.class}">
                        <i class="fas ${statusInfo.icon}"></i>
                        <span>${statusInfo.label}</span>
                    </div>
                </div>
                
                <div class="resident-details">
                    <div class="detail-row">
                        <span class="detail-label">رقم الهوية:</span>
                        <span class="detail-value">${resident.nationalId || "غير محدد"}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">البريد الإلكتروني:</span>
                        <span class="detail-value">${resident.email || "غير محدد"}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">الشقة الحالية:</span>
                        <span class="detail-value">${currentUnit ? `شقة ${currentUnit.unitNumber}` : "لا يوجد"}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">الرصيد:</span>
                        <span class="detail-value ${balance >= 0 ? "text-success" : "text-danger"}">
                            ${AppUtils.formatCurrency(Math.abs(balance), settings.currency)}
                            ${balance >= 0 ? "(دائن)" : "(مدين)"}
                        </span>
                    </div>
                    ${
                      resident.agentName
                        ? `
                        <div class="detail-row">
                            <span class="detail-label">الوكيل:</span>
                            <span class="detail-value">${resident.agentName}</span>
                        </div>
                    `
                        : ""
                    }
                </div>

                <div class="resident-actions">
                    <button class="btn btn-sm btn-primary" onclick="Residents.editResident('${resident.id}')" title="تعديل">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-info" onclick="Residents.viewResidentDetails('${resident.id}')" title="التفاصيل">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-success" onclick="Residents.viewResidentStatement('${resident.id}')" title="كشف الحساب">
                        <i class="fas fa-file-invoice"></i>
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="Residents.contactResident('${resident.id}')" title="اتصال">
                        <i class="fas fa-phone"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="Residents.deleteResident('${resident.id}')" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
  },

  /**
   * Get resident status information
   */
  getResidentStatusInfo(status) {
    const statusMap = {
      active: { label: "نشط", class: "status-active", icon: "fa-check-circle" },
      inactive: {
        label: "غير نشط",
        class: "status-inactive",
        icon: "fa-times-circle",
      },
    };

    return statusMap[status] || statusMap.active;
  },

  /**
   * Render pagination
   */
  renderPagination(pagination) {
    const paginationContainer = document.getElementById("residentsPagination");
    if (!paginationContainer) return;

    const paginationHtml = AppUtils.createPaginationControls(
      pagination,
      "Residents.goToPage",
    );
    paginationContainer.innerHTML = paginationHtml;
  },

  /**
   * Go to specific page
   */
  goToPage(page) {
    this.currentPage = page;
    this.loadResidents();
  },

  /**
   * Show add resident modal
   */
  showAddResidentModal() {
    const modalContent = `
            <form id="addResidentForm">
                <div class="form-grid">
                    <div class="form-group">
                        <label for="residentName">الاسم الكامل *</label>
                        <input type="text" id="residentName" class="form-control" required 
                               placeholder="أدخل الاسم الكامل">
                    </div>
                    <div class="form-group">
                        <label for="residentPhone">رقم الهاتف *</label>
                        <input type="tel" id="residentPhone" class="form-control" required 
                               placeholder="مثال: 0501234567">
                    </div>
                    <div class="form-group">
                        <label for="residentNationalId">رقم الهوية</label>
                        <input type="text" id="residentNationalId" class="form-control" 
                               placeholder="رقم الهوية الوطنية">
                    </div>
                    <div class="form-group">
                        <label for="residentEmail">البريد الإلكتروني</label>
                        <input type="email" id="residentEmail" class="form-control" 
                               placeholder="example@email.com">
                    </div>
                    <div class="form-group">
                        <label for="residentStatus">الحالة *</label>
                        <select id="residentStatus" class="form-control" required>
                            <option value="active">نشط</option>
                            <option value="inactive">غير نشط</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="contractDate">تاريخ العقد</label>
                        <input type="date" id="contractDate" class="form-control">
                    </div>
                </div>
                
                <div class="form-section">
                    <h4>معلومات الوكيل (اختياري)</h4>
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="agentName">اسم الوكيل</label>
                            <input type="text" id="agentName" class="form-control" 
                                   placeholder="اسم الوكيل">
                        </div>
                        <div class="form-group">
                            <label for="agentPhone">هاتف الوكيل</label>
                            <input type="tel" id="agentPhone" class="form-control" 
                                   placeholder="رقم هاتف الوكيل">
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <h4>المرفقات (اختياري)</h4>
                    <div class="form-grid">
                        <div class="form-group">
                            <label>صورة الهوية</label>
                            <div class="file-upload-area" onclick="Residents.uploadNationalIdImage()">
                                <i class="fas fa-cloud-upload-alt"></i>
                                <p>اضغط لرفع صورة الهوية</p>
                                <input type="hidden" id="nationalIdImage">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>صورة بطاقة الوكيل</label>
                            <div class="file-upload-area" onclick="Residents.uploadAgentCardImage()">
                                <i class="fas fa-cloud-upload-alt"></i>
                                <p>اضغط لرفع صورة بطاقة الوكيل</p>
                                <input type="hidden" id="agentCardImage">
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        `;

    app.showModal("إضافة مقيم جديد", modalContent, [
      {
        text: "إلغاء",
        class: "btn-secondary",
        onclick: "app.closeModal()",
      },
      {
        text: "إضافة المقيم",
        class: "btn-primary",
        onclick: "Residents.saveResident()",
      },
    ]);
  },

  /**
   * Upload national ID image
   */
  async uploadNationalIdImage() {
    try {
      const imageData = await AppUtils.createFileInput("image/*");
      document.getElementById("nationalIdImage").value = imageData;

      // Update upload area
      const uploadArea = event.currentTarget;
      uploadArea.innerHTML = `
                <i class="fas fa-check-circle text-success"></i>
                <p>تم رفع صورة الهوية بنجاح</p>
            `;
      uploadArea.classList.add("uploaded");

      app.showNotification("تم رفع صورة الهوية بنجاح", "success");
    } catch (error) {
      app.showNotification(
        error.message || "حدث خطأ أثناء رفع الصورة",
        "error",
      );
    }
  },

  /**
   * Upload agent card image
   */
  async uploadAgentCardImage() {
    try {
      const imageData = await AppUtils.createFileInput("image/*");
      document.getElementById("agentCardImage").value = imageData;

      // Update upload area
      const uploadArea = event.currentTarget;
      uploadArea.innerHTML = `
                <i class="fas fa-check-circle text-success"></i>
                <p>تم رفع صورة بطاقة الوكيل بنجاح</p>
            `;
      uploadArea.classList.add("uploaded");

      app.showNotification("تم رفع صورة بطاقة الوكيل بنجاح", "success");
    } catch (error) {
      app.showNotification(
        error.message || "حدث خطأ أثناء رفع الصورة",
        "error",
      );
    }
  },

  /**
   * Save resident (add or edit)
   */
  async saveResident(residentId = null) {
    const form =
      document.getElementById("addResidentForm") ||
      document.getElementById("editResidentForm");
    if (!form) return;

    const residentData = {
      name: document.getElementById("residentName").value.trim(),
      phone: document.getElementById("residentPhone").value.trim(),
      nationalId: document.getElementById("residentNationalId").value.trim(),
      email: document.getElementById("residentEmail").value.trim(),
      status: document.getElementById("residentStatus").value,
      contractDate: document.getElementById("contractDate").value,
      agentName: document.getElementById("agentName").value.trim(),
      agentPhone: document.getElementById("agentPhone").value.trim(),
      nationalIdImage: document.getElementById("nationalIdImage").value,
      agentCardImage: document.getElementById("agentCardImage").value,
    };

    // This is the REFINED and SECURE version.
    // It replaces the old logic of using the last 4 digits of the phone number.

    if (!residentId) {
      // 1. Generate a random, more secure temporary password (plain for manager display).
      const tempPassword = Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase(); // e.g., "4K2J3F"

      // 2. Hash the temporary password before storing.
      const { salt: tempPasswordSalt, hash: tempPasswordHash } =
        await AppUtils.hashPassword(tempPassword);

      // 3. Set the correct fields for a first-time login. Store hashed temp password and force change flag.
      residentData.passwordHash = null; // Permanent password not set yet.
      residentData.passwordSalt = null;
      residentData.tempPasswordHash = tempPasswordHash; // Store hashed one-time password.
      residentData.tempPasswordSalt = tempPasswordSalt;
      residentData.forcePasswordChange = true; // This flag will force a password change.

      // 4. Add the new resident record to the database.
      // Try to create on server if configured
      let createdOnServer = false;
      try {
        const settings = db.getSettings();
        if (settings && settings.sms && settings.sms.proxyEndpoint) {
          const serverResp = await AppUtils.enqueueOrSend("/api/residents", {
            method: "POST",
            body: residentData,
          });
          if (serverResp && serverResp.success && serverResp.resident) {
            createdOnServer = true;
            db.addRecord("residents", serverResp.resident);
          } else if (serverResp && serverResp.queued) {
            createdOnServer = false;
            // Keep local record and attach queued id for tracking
            residentData._queuedId = serverResp.queueId;
          }
        }
      } catch (err) {
        console.warn(
          "Failed to create resident on server, falling back to local DB:",
          err.message || err,
        );
      }

      let success;
      if (!createdOnServer) success = db.addRecord("residents", residentData);

      if (createdOnServer || success) {
        // 4. Show a modal to the manager with the temporary password.
        // This is more prominent and secure than a fleeting notification.
        app.showModal(
          "تمت إضافة المقيم بنجاح",
          `<div class="text-center" style="line-height: 1.8;">
                <p>تم إنشاء حساب للمقيم <strong>${residentData.name}</strong> بنجاح.</p>
                <p>الرجاء تزويد المقيم بكلمة المرور المؤقتة التالية ليتمكن من تسجيل الدخول لأول مرة:</p>
                <div style="background: var(--bg-primary); padding: 15px; border-radius: 8px; margin: 20px 0; font-size: 1.5rem; font-weight: bold; letter-spacing: 3px; border: 1px solid var(--border-color);">
                    ${tempPassword}
                </div>
                <p class="text-muted">ملاحظة: سيُطلب من المقيم تغيير كلمة المرور هذه فور تسجيل الدخول.</p>
            </div>`,
          [
            {
              text: "موافق",
              class: "btn-primary",
              onclick: "app.closeModal()",
            },
          ],
        );

        // Refresh the residents list to show the new resident.
        this.loadResidents();
      } else {
        // Handle failure
        app.showNotification(
          "فشل في إضافة المقيم. الرجاء المحاولة مرة أخرى.",
          "error",
        );
      }
    } else {
      // Update existing resident: try server first
      let updatedOnServer = false;
      try {
        const settings = db.getSettings();
        if (settings && settings.sms && settings.sms.proxyEndpoint) {
          const serverResp = await AppUtils.enqueueOrSend(
            "/api/residents/" + residentId,
            { method: "PUT", body: residentData },
          );
          if (serverResp && serverResp.success && serverResp.resident) {
            updatedOnServer = true;
            db.updateRecord("residents", residentId, serverResp.resident);
          } else if (serverResp && serverResp.queued) {
            // keep local changes and tag queued id
            residentData._queuedId = serverResp.queueId;
          }
        }
      } catch (err) {
        console.warn(
          "Failed to update resident on server, falling back to local DB:",
          err.message || err,
        );
      }

      let success;
      if (!updatedOnServer)
        success = db.updateRecord("residents", residentId, residentData);
      if (updatedOnServer || success) {
        app.closeModal();
        this.loadResidents();
        app.showNotification("تم تحديث بيانات المقيم بنجاح.", "success");
      } else {
        app.showNotification("فشل في تحديث بيانات المقيم.", "error");
      }
    }

    // Validation
    if (!residentData.name) {
      app.showNotification("الاسم مطلوب", "error");
      return;
    }

    if (!AppUtils.validateArabicName(residentData.name)) {
      app.showNotification("يرجى إدخال اسم صحيح باللغة العربية", "error");
      return;
    }

    if (!residentData.phone) {
      app.showNotification("رقم الهاتف مطلوب", "error");
      return;
    }

    if (!AppUtils.validatePhone(residentData.phone)) {
      app.showNotification("رقم الهاتف غير صحيح", "error");
      return;
    }

    if (residentData.email && !AppUtils.validateEmail(residentData.email)) {
      app.showNotification("البريد الإلكتروني غير صحيح", "error");
      return;
    }

    if (
      residentData.agentPhone &&
      !AppUtils.validatePhone(residentData.agentPhone)
    ) {
      app.showNotification("رقم هاتف الوكيل غير صحيح", "error");
      return;
    }

    // Check for duplicate phone number
    const existingResidents = db.getTable("residents");
    const duplicateResident = existingResidents.find(
      (resident) =>
        resident.phone === residentData.phone && resident.id !== residentId,
    );

    if (duplicateResident) {
      app.showNotification("رقم الهاتف موجود مسبقاً", "error");
      return;
    }

    let success;
    if (residentId) {
      success = db.updateRecord("residents", residentId, residentData);
    } else {
      success = db.addRecord("residents", residentData);
    }

    if (success) {
      app.closeModal();
      this.loadResidents();
      app.showNotification(
        residentId ? "تم تحديث المقيم بنجاح" : "تم إضافة المقيم بنجاح",
        "success",
      );
    } else {
      app.showNotification("حدث خطأ أثناء حفظ البيانات", "error");
    }
  },

  /**
   * Edit resident
   */
  editResident(residentId) {
    const resident = db.getRecord("residents", residentId);
    if (!resident) {
      app.showNotification("المقيم غير موجود", "error");
      return;
    }

    const modalContent = `
            <form id="editResidentForm">
                <div class="form-grid">
                    <div class="form-group">
                        <label for="residentName">الاسم الكامل *</label>
                        <input type="text" id="residentName" class="form-control" required 
                               value="${resident.name}" placeholder="أدخل الاسم الكامل">
                    </div>
                    <div class="form-group">
                        <label for="residentPhone">رقم الهاتف *</label>
                        <input type="tel" id="residentPhone" class="form-control" required 
                               value="${resident.phone}" placeholder="مثال: 0501234567">
                    </div>
                    <div class="form-group">
                        <label for="residentNationalId">رقم الهوية</label>
                        <input type="text" id="residentNationalId" class="form-control" 
                               value="${resident.nationalId || ""}" placeholder="رقم الهوية الوطنية">
                    </div>
                    <div class="form-group">
                        <label for="residentEmail">البريد الإلكتروني</label>
                        <input type="email" id="residentEmail" class="form-control" 
                               value="${resident.email || ""}" placeholder="example@email.com">
                    </div>
                    <div class="form-group">
                        <label for="residentStatus">الحالة *</label>
                        <select id="residentStatus" class="form-control" required>
                            <option value="active" ${resident.status === "active" ? "selected" : ""}>نشط</option>
                            <option value="inactive" ${resident.status === "inactive" ? "selected" : ""}>غير نشط</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="contractDate">تاريخ العقد</label>
                        <input type="date" id="contractDate" class="form-control" 
                               value="${resident.contractDate || ""}">
                    </div>
                </div>
                
                <div class="form-section">
                    <h4>معلومات الوكيل (اختياري)</h4>
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="agentName">اسم الوكيل</label>
                            <input type="text" id="agentName" class="form-control" 
                                   value="${resident.agentName || ""}" placeholder="اسم الوكيل">
                        </div>
                        <div class="form-group">
                            <label for="agentPhone">هاتف الوكيل</label>
                            <input type="tel" id="agentPhone" class="form-control" 
                                   value="${resident.agentPhone || ""}" placeholder="رقم هاتف الوكيل">
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <h4>المرفقات (اختياري)</h4>
                    <div class="form-grid">
                        <div class="form-group">
                            <label>صورة الهوية</label>
                            <div class="file-upload-area ${resident.nationalIdImage ? "uploaded" : ""}" 
                                 onclick="Residents.uploadNationalIdImage()">
                                ${
                                  resident.nationalIdImage
                                    ? '<i class="fas fa-check-circle text-success"></i><p>تم رفع صورة الهوية</p>'
                                    : '<i class="fas fa-cloud-upload-alt"></i><p>اضغط لرفع صورة الهوية</p>'
                                }
                                <input type="hidden" id="nationalIdImage" value="${resident.nationalIdImage || ""}">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>صورة بطاقة الوكيل</label>
                            <div class="file-upload-area ${resident.agentCardImage ? "uploaded" : ""}" 
                                 onclick="Residents.uploadAgentCardImage()">
                                ${
                                  resident.agentCardImage
                                    ? '<i class="fas fa-check-circle text-success"></i><p>تم رفع صورة بطاقة الوكيل</p>'
                                    : '<i class="fas fa-cloud-upload-alt"></i><p>اضغط لرفع صورة بطاقة الوكيل</p>'
                                }
                                <input type="hidden" id="agentCardImage" value="${resident.agentCardImage || ""}">
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        `;

    app.showModal("تعديل المقيم", modalContent, [
      {
        text: "إلغاء",
        class: "btn-secondary",
        onclick: "app.closeModal()",
      },
      {
        text: "حفظ التغييرات",
        class: "btn-primary",
        onclick: `Residents.saveResident('${residentId}')`,
      },
    ]);
  },

  /**
   * View resident details
   */
  viewResidentDetails(residentId) {
    const resident = db.getRecord("residents", residentId);
    if (!resident) {
      app.showNotification("المقيم غير موجود", "error");
      return;
    }

    // Get related data
    const contracts = db
      .getTable("contracts")
      .filter((c) => c.residentId === residentId);
    const payments = db
      .getTable("payments")
      .filter((p) => p.residentId === residentId);
    const balance = db.calculateResidentBalance(residentId);
    const statusInfo = this.getResidentStatusInfo(resident.status);
    const settings = db.getSettings();

    // Get current contract and unit
    const currentContract = contracts.find((contract) => {
      const endDate = new Date(contract.endDate);
      return endDate > new Date();
    });

    const units = db.getTable("units");
    const currentUnit = currentContract
      ? units.find((unit) => unit.id === currentContract.unitId)
      : null;

    const modalContent = `
            <div class="resident-details-view">
                <div class="resident-summary">
                    <div class="resident-header-view">
                        <div class="resident-avatar-large">
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="resident-info-large">
                            <h3>${resident.name}</h3>
                            <p>${resident.phone}</p>
                            <span class="status-badge ${statusInfo.class}">
                                <i class="fas ${statusInfo.icon}"></i>
                                ${statusInfo.label}
                            </span>
                        </div>
                    </div>
                </div>

                <div class="details-grid">
                    <div class="detail-section">
                        <h4>معلومات شخصية</h4>
                        <div class="detail-list">
                            <div class="detail-item">
                                <span class="label">رقم الهوية:</span>
                                <span class="value">${resident.nationalId || "غير محدد"}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">البريد الإلكتروني:</span>
                                <span class="value">${resident.email || "غير محدد"}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">تاريخ العقد:</span>
                                <span class="value">${resident.contractDate ? AppUtils.formatDate(resident.contractDate) : "غير محدد"}</span>
                            </div>
                        </div>
                    </div>

                    ${
                      resident.agentName
                        ? `
                        <div class="detail-section">
                            <h4>معلومات الوكيل</h4>
                            <div class="detail-list">
                                <div class="detail-item">
                                    <span class="label">اسم الوكيل:</span>
                                    <span class="value">${resident.agentName}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="label">هاتف الوكيل:</span>
                                    <span class="value">${resident.agentPhone || "غير محدد"}</span>
                                </div>
                            </div>
                        </div>
                    `
                        : ""
                    }

                    ${
                      currentContract
                        ? `
                        <div class="detail-section">
                            <h4>العقد الحالي</h4>
                            <div class="detail-list">
                                <div class="detail-item">
                                    <span class="label">الشقة:</span>
                                    <span class="value">${currentUnit ? `شقة ${currentUnit.unitNumber}` : "غير محدد"}</span>
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
                        <h4>الحالة المالية</h4>
                        <div class="detail-list">
                            <div class="detail-item">
                                <span class="label">الرصيد الحالي:</span>
                                <span class="value ${balance >= 0 ? "text-success" : "text-danger"}">
                                    ${AppUtils.formatCurrency(Math.abs(balance), settings.currency)}
                                    ${balance >= 0 ? "(دائن)" : "(مدين)"}
                                </span>
                            </div>
                            <div class="detail-item">
                                <span class="label">عدد المدفوعات:</span>
                                <span class="value">${payments.length}</span>
                            </div>
                        </div>
                    </div>

                    <div class="detail-section">
                        <h4>إحصائيات</h4>
                        <div class="detail-list">
                            <div class="detail-item">
                                <span class="label">عدد العقود:</span>
                                <span class="value">${contracts.length}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">تاريخ الإضافة:</span>
                                <span class="value">${AppUtils.formatDate(resident.createdAt)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">آخر تحديث:</span>
                                <span class="value">${AppUtils.formatDate(resident.updatedAt)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

    app.showModal(`تفاصيل المقيم: ${resident.name}`, modalContent, [
      {
        text: "إغلاق",
        class: "btn-secondary",
        onclick: "app.closeModal()",
      },
      {
        text: "تعديل",
        class: "btn-primary",
        onclick: `app.closeModal(); Residents.editResident('${residentId}')`,
      },
    ]);
  },

  /**
   * View resident statement
   */
  viewResidentStatement(residentId) {
    const resident = db.getRecord("residents", residentId);
    if (!resident) {
      app.showNotification("المقيم غير موجود", "error");
      return;
    }

    const payments = db.getResidentPaymentHistory(residentId);
    const balance = db.calculateResidentBalance(residentId);
    const settings = db.getSettings();

    let runningBalance = 0;
    const statementRows = payments
      .map((payment) => {
        if (payment.type === "rent" || payment.type === "utilities") {
          runningBalance += payment.amount;
        } else if (payment.type === "payment") {
          runningBalance -= payment.amount;
        }

        return `
                <tr>
                    <td>${AppUtils.formatDate(payment.date)}</td>
                    <td>${this.getPaymentTypeLabel(payment.type)}</td>
                    <td>${payment.description || "-"}</td>
                    <td class="${payment.type === "payment" ? "text-success" : "text-danger"}">
                        ${payment.type === "payment" ? AppUtils.formatCurrency(payment.amount, settings.currency) : "-"}
                    </td>
                    <td class="${payment.type !== "payment" ? "text-danger" : "text-success"}">
                        ${payment.type !== "payment" ? AppUtils.formatCurrency(payment.amount, settings.currency) : "-"}
                    </td>
                    <td class="${runningBalance >= 0 ? "text-success" : "text-danger"}">
                        ${AppUtils.formatCurrency(Math.abs(runningBalance), settings.currency)}
                        ${runningBalance >= 0 ? "(دائن)" : "(مدين)"}
                    </td>
                </tr>
            `;
      })
      .join("");

    const modalContent = `
            <div class="statement-view">
                <div class="statement-header">
                    <h3>كشف حساب: ${resident.name}</h3>
                    <p>رقم الهاتف: ${resident.phone}</p>
                    <p>الرصيد الحالي: 
                        <strong class="${balance >= 0 ? "text-success" : "text-danger"}">
                            ${AppUtils.formatCurrency(Math.abs(balance), settings.currency)}
                            ${balance >= 0 ? "(دائن)" : "(مدين)"}
                        </strong>
                    </p>
                </div>

                <div class="statement-table">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>التاريخ</th>
                                <th>النوع</th>
                                <th>الوصف</th>
                                <th>دائن</th>
                                <th>مدين</th>
                                <th>الرصيد</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${statementRows || '<tr><td colspan="6" class="text-center">لا توجد معاملات</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

    app.showModal(`كشف حساب: ${resident.name}`, modalContent, [
      {
        text: "إغلاق",
        class: "btn-secondary",
        onclick: "app.closeModal()",
      },
      {
        text: "طباعة",
        class: "btn-primary",
        onclick: `Residents.printStatement('${residentId}')`,
      },
    ]);
  },

  /**
   * Get payment type label
   */
  getPaymentTypeLabel(type) {
    const typeMap = {
      rent: "إيجار",
      utilities: "خدمات",
      payment: "دفعة",
      deposit: "تأمين",
      maintenance: "صيانة",
    };

    return typeMap[type] || type;
  },

  /**
   * Print resident statement
   */
  printStatement(residentId) {
    const resident = db.getRecord("residents", residentId);
    if (!resident) return;

    const payments = db.getResidentPaymentHistory(residentId);
    const balance = db.calculateResidentBalance(residentId);
    const settings = db.getSettings();

    let runningBalance = 0;
    const statementRows = payments
      .map((payment) => {
        if (payment.type === "rent" || payment.type === "utilities") {
          runningBalance += payment.amount;
        } else if (payment.type === "payment") {
          runningBalance -= payment.amount;
        }

        return `
                <tr>
                    <td>${AppUtils.formatDate(payment.date)}</td>
                    <td>${this.getPaymentTypeLabel(payment.type)}</td>
                    <td>${payment.description || "-"}</td>
                    <td>${payment.type === "payment" ? AppUtils.formatCurrency(payment.amount, settings.currency) : "-"}</td>
                    <td>${payment.type !== "payment" ? AppUtils.formatCurrency(payment.amount, settings.currency) : "-"}</td>
                    <td>${AppUtils.formatCurrency(Math.abs(runningBalance), settings.currency)} ${runningBalance >= 0 ? "(دائن)" : "(مدين)"}</td>
                </tr>
            `;
      })
      .join("");

    const printContent = `
            <div style="text-align: center; margin-bottom: 30px;">
                <h2>كشف حساب المقيم</h2>
                <h3>${resident.name}</h3>
                <p>رقم الهاتف: ${resident.phone}</p>
                <p>الرصيد الحالي: <strong>${AppUtils.formatCurrency(Math.abs(balance), settings.currency)} ${balance >= 0 ? "(دائن)" : "(مدين)"}</strong></p>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <thead>
                    <tr style="background-color: #f5f5f5;">
                        <th style="border: 1px solid #ddd; padding: 8px;">التاريخ</th>
                        <th style="border: 1px solid #ddd; padding: 8px;">النوع</th>
                        <th style="border: 1px solid #ddd; padding: 8px;">الوصف</th>
                        <th style="border: 1px solid #ddd; padding: 8px;">دائن</th>
                        <th style="border: 1px solid #ddd; padding: 8px;">مدين</th>
                        <th style="border: 1px solid #ddd; padding: 8px;">الرصيد</th>
                    </tr>
                </thead>
                <tbody>
                    ${statementRows || '<tr><td colspan="6" style="text-align: center; border: 1px solid #ddd; padding: 8px;">لا توجد معاملات</td></tr>'}
                </tbody>
            </table>
        `;

    AppUtils.printDocument(`كشف حساب - ${resident.name}`, printContent);
    app.closeModal();
  },

  /**
   * Contact resident
   */
  contactResident(residentId) {
    const resident = db.getRecord("residents", residentId);
    if (!resident) {
      app.showNotification("المقيم غير موجود", "error");
      return;
    }

    if (resident.phone) {
      window.open(`tel:${resident.phone}`);
    } else {
      app.showNotification("لا يوجد رقم هاتف للمقيم", "warning");
    }
  },

  /**
   * Delete resident
   */
  deleteResident(residentId) {
    const resident = db.getRecord("residents", residentId);
    if (!resident) {
      app.showNotification("المقيم غير موجود", "error");
      return;
    }

    // Check if resident has active contracts
    const contracts = db.getTable("contracts");
    const activeContracts = contracts.filter((contract) => {
      const endDate = new Date(contract.endDate);
      return contract.residentId === residentId && endDate > new Date();
    });

    if (activeContracts.length > 0) {
      app.showNotification("لا يمكن حذف المقيم لوجود عقود نشطة", "error");
      return;
    }

    app.confirm(
      `هل أنت متأكد من حذف المقيم ${resident.name}؟ هذا الإجراء لا يمكن التراجع عنه.`,
      `Residents.confirmDeleteResident('${residentId}')`,
    );
  },

  /**
   * Confirm resident deletion
   */
  confirmDeleteResident(residentId) {
    // Try server delete first if configured
    (async () => {
      try {
        const settings = db.getSettings();
        if (settings && settings.sms && settings.sms.proxyEndpoint) {
          const resp = await AppUtils.enqueueOrSend(
            "/api/residents/" + residentId,
            { method: "DELETE" },
          );
          if (resp && resp.success) {
            db.deleteRecord("residents", residentId);
            this.loadResidents();
            app.showNotification("تم حذف المقيم بنجاح", "success");
            return;
          }

          if (resp && resp.queued) {
            // Mark locally as deleted (soft-delete) and keep queued id
            db.updateRecord("residents", residentId, {
              _queuedDelete: resp.queueId,
              status: "pending_delete",
            });
            this.loadResidents();
            app.showNotification(
              "تم وضع عملية الحذف في قائمة الانتظار وسيتم تنفيذها عند الاتصال",
              "info",
            );
            return;
          }
        }
      } catch (err) {
        console.warn(
          "Failed to delete resident on server, falling back to local DB:",
          err.message || err,
        );
      }

      const success = db.deleteRecord("residents", residentId);
      if (success) {
        this.loadResidents();
        app.showNotification("تم حذف المقيم بنجاح", "success");
      } else {
        app.showNotification("حدث خطأ أثناء حذف المقيم", "error");
      }
    })();
  },

  /**
   * Export residents data
   */
  exportResidents() {
    const residents = db.getTable("residents");

    if (residents.length === 0) {
      app.showNotification("لا توجد بيانات للتصدير", "warning");
      return;
    }

    const exportData = residents.map((resident) => ({
      الاسم: resident.name,
      الهاتف: resident.phone,
      "رقم الهوية": resident.nationalId,
      "البريد الإلكتروني": resident.email,
      الحالة: this.getResidentStatusInfo(resident.status).label,
      "تاريخ العقد": resident.contractDate
        ? AppUtils.formatDate(resident.contractDate)
        : "",
      "اسم الوكيل": resident.agentName,
      "هاتف الوكيل": resident.agentPhone,
      "تاريخ الإضافة": AppUtils.formatDate(resident.createdAt),
    }));

    AppUtils.exportToCSV(
      exportData,
      `residents-${new Date().toISOString().split("T")[0]}`,
    );
    app.showNotification("تم تصدير البيانات بنجاح", "success");
  },
};

// Add residents-specific styles
const residentsStyles = document.createElement("style");
residentsStyles.textContent = `
    .residents-container {
        max-width: 1400px;
        margin: 0 auto;
    }

    .residents-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
        gap: 20px;
        margin-bottom: 20px;
    }

    .resident-card {
        background: var(--bg-secondary);
        border-radius: 16px;
        padding: 20px;
        transition: all 0.3s ease;
        border: 1px solid var(--border-color);
    }

    .resident-card:hover {
        transform: translateY(-4px);
        box-shadow: 
            12px 12px 20px var(--shadow-dark),
            -12px -12px 20px var(--shadow-light);
    }

    .resident-header {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--border-color);
    }

    .resident-avatar {
        width: 50px;
        height: 50px;
        background: var(--gradient-primary);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 1.2rem;
        flex-shrink: 0;
    }

    .resident-info {
        flex: 1;
    }

    .resident-info h3 {
        margin: 0 0 4px 0;
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--text-primary);
    }

    .resident-phone {
        margin: 0;
        color: var(--text-muted);
        font-size: 0.9rem;
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .resident-status {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 500;
        flex-shrink: 0;
    }

    .status-active {
        background: rgba(72, 187, 120, 0.1);
        color: var(--success-color);
    }

    .status-inactive {
        background: rgba(245, 101, 101, 0.1);
        color: var(--error-color);
    }

    .resident-details {
        margin-bottom: 16px;
    }

    .resident-actions {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
        padding-top: 12px;
        border-top: 1px solid var(--border-color);
        flex-wrap: wrap;
    }

    .form-section {
        margin-top: 24px;
        padding-top: 20px;
        border-top: 1px solid var(--border-color);
    }

    .form-section h4 {
        margin-bottom: 16px;
        color: var(--text-primary);
        font-size: 1.1rem;
    }

    .file-upload-area {
        border: 2px dashed var(--border-color);
        border-radius: 8px;
        padding: 20px;
        text-align: center;
        cursor: pointer;
        transition: all 0.3s ease;
        background: var(--bg-primary);
    }

    .file-upload-area:hover {
        border-color: var(--primary-color);
        background: var(--bg-secondary);
    }

    .file-upload-area.uploaded {
        border-color: var(--success-color);
        background: rgba(72, 187, 120, 0.1);
    }

    .file-upload-area i {
        font-size: 2rem;
        margin-bottom: 8px;
        color: var(--text-muted);
    }

    .file-upload-area.uploaded i {
        color: var(--success-color);
    }

    .file-upload-area p {
        margin: 0;
        color: var(--text-muted);
        font-size: 0.9rem;
    }

    .resident-details-view {
        max-width: 700px;
    }

    .resident-header-view {
        display: flex;
        align-items: center;
        gap: 20px;
        margin-bottom: 24px;
        padding-bottom: 20px;
        border-bottom: 2px solid var(--border-color);
    }

    .resident-avatar-large {
        width: 80px;
        height: 80px;
        background: var(--gradient-primary);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 2rem;
        flex-shrink: 0;
    }

    .resident-info-large h3 {
        margin: 0 0 8px 0;
        font-size: 1.5rem;
        color: var(--text-primary);
    }

    .resident-info-large p {
        margin: 0 0 12px 0;
        color: var(--text-muted);
        font-size: 1.1rem;
    }

    .statement-view {
        max-width: 900px;
    }

    .statement-header {
        text-align: center;
        margin-bottom: 24px;
        padding-bottom: 20px;
        border-bottom: 2px solid var(--border-color);
    }

    .statement-header h3 {
        margin: 0 0 8px 0;
        color: var(--text-primary);
    }

    .statement-header p {
        margin: 4px 0;
        color: var(--text-secondary);
    }

    .statement-table {
        overflow-x: auto;
    }

    .statement-table table {
        font-size: 0.9rem;
    }

    .statement-table th {
        background: var(--bg-primary);
        font-weight: 600;
        white-space: nowrap;
    }

    .statement-table td {
        white-space: nowrap;
    }

    @media (max-width: 768px) {
        .residents-grid {
            grid-template-columns: 1fr;
        }

        .resident-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
        }

        .resident-actions {
            justify-content: center;
        }

        .form-grid {
            grid-template-columns: 1fr;
        }

        .resident-header-view {
            flex-direction: column;
            text-align: center;
        }

        .statement-table {
            font-size: 0.8rem;
        }
    }

    @media (max-width: 480px) {
        .resident-actions {
            gap: 4px;
        }

        .resident-actions .btn {
            padding: 6px 8px;
            font-size: 0.8rem;
        }
    }
`;
document.head.appendChild(residentsStyles);
