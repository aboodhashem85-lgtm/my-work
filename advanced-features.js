// Advanced Features Module - Building Management System

class AdvancedFeatures {
  constructor() {
    this.searchIndex = new Map();
    this.exportFormats = ["pdf", "excel", "csv", "json"];
    this.printTemplates = new Map();
    this.performanceMetrics = {
      loadTime: 0,
      renderTime: 0,
      memoryUsage: 0,
    };
    // SMS system state
    this.smsQueue = [];
    this.smsLog = [];
    this.smsSettings = {};
    this.smsProcessingInterval = null;

    this.init();
  }

  init() {
    this.initializeSearch();
    this.initializeExport();
    this.initializePrint();
    this.initializePerformanceMonitoring();
    this.initializeKeyboardShortcuts();
    this.initializeNotifications();
    this.initializeBulkOperations();
    this.initializeDataValidation();
    this.initializeAutoSave();
    this.initializeOfflineSupport();

    // initialize SMS system
    this.initializeSMS();
  }

  // Advanced Search System
  initializeSearch() {
    this.createSearchInterface();
    this.buildSearchIndex();
    this.setupSearchFilters();
  }

  createSearchInterface() {
    const searchHTML = `
            <div class="advanced-search-container neu-flat" style="display: none;">
                <div class="search-header">
                    <h3><i class="fas fa-search"></i> البحث المتقدم</h3>
                    <button class="btn-close" onclick="advancedFeatures.closeAdvancedSearch()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="search-body">
                    <div class="search-tabs">
                        <button class="search-tab active" data-tab="general">عام</button>
                        <button class="search-tab" data-tab="units">الشقق</button>
                        <button class="search-tab" data-tab="residents">السكان</button>
                        <button class="search-tab" data-tab="contracts">العقود</button>
                        <button class="search-tab" data-tab="payments">المدفوعات</button>
                        <button class="search-tab" data-tab="maintenance">الصيانة</button>
                    </div>
                    
                    <div class="search-content">
                        <div class="search-panel active" id="search-general">
                            <div class="form-group">
                                <label>البحث العام</label>
                                <input type="text" id="globalSearch" class="form-control" placeholder="ابحث في جميع البيانات...">
                            </div>
                            <div class="search-options">
                                <label class="checkbox-label">
                                    <input type="checkbox" id="searchExact"> البحث الدقيق
                                </label>
                                <label class="checkbox-label">
                                    <input type="checkbox" id="searchCaseSensitive"> حساس للأحرف
                                </label>
                            </div>
                        </div>
                        
                        <div class="search-panel" id="search-units">
                            <div class="form-grid">
                                <div class="form-group">
                                    <label>رقم الشقة</label>
                                    <input type="text" id="searchUnitNumber" class="form-control">
                                </div>
                                <div class="form-group">
                                    <label>الطابق</label>
                                    <select id="searchFloor" class="form-control">
                                        <option value="">جميع الطوابق</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>النوع</label>
                                    <select id="searchUnitType" class="form-control">
                                        <option value="">جميع الأنواع</option>
                                        <option value="شقة">شقة</option>
                                        <option value="استوديو">استوديو</option>
                                        <option value="دوبلكس">دوبلكس</option>
                                        <option value="بنتهاوس">بنتهاوس</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>الحالة</label>
                                    <select id="searchUnitStatus" class="form-control">
                                        <option value="">جميع الحالات</option>
                                        <option value="مؤجرة">مؤجرة</option>
                                        <option value="شاغرة">شاغرة</option>
                                        <option value="صيانة">صيانة</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-group">
                                <label>نطاق المساحة (متر مربع)</label>
                                <div class="range-inputs">
                                    <input type="number" id="searchAreaMin" class="form-control" placeholder="من">
                                    <span>إلى</span>
                                    <input type="number" id="searchAreaMax" class="form-control" placeholder="إلى">
                                </div>
                            </div>
                        </div>
                        
                        <div class="search-panel" id="search-residents">
                            <div class="form-grid">
                                <div class="form-group">
                                    <label>الاسم</label>
                                    <input type="text" id="searchResidentName" class="form-control">
                                </div>
                                <div class="form-group">
                                    <label>رقم الهوية</label>
                                    <input type="text" id="searchResidentId" class="form-control">
                                </div>
                                <div class="form-group">
                                    <label>رقم الهاتف</label>
                                    <input type="text" id="searchResidentPhone" class="form-control">
                                </div>
                                <div class="form-group">
                                    <label>البريد الإلكتروني</label>
                                    <input type="email" id="searchResidentEmail" class="form-control">
                                </div>
                            </div>
                        </div>
                        
                        <div class="search-panel" id="search-contracts">
                            <div class="form-grid">
                                <div class="form-group">
                                    <label>رقم العقد</label>
                                    <input type="text" id="searchContractNumber" class="form-control">
                                </div>
                                <div class="form-group">
                                    <label>حالة العقد</label>
                                    <select id="searchContractStatus" class="form-control">
                                        <option value="">جميع الحالات</option>
                                        <option value="نشط">نشط</option>
                                        <option value="منتهي">منتهي</option>
                                        <option value="ملغي">ملغي</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>تاريخ البداية من</label>
                                    <input type="date" id="searchContractStartFrom" class="form-control">
                                </div>
                                <div class="form-group">
                                    <label>تاريخ البداية إلى</label>
                                    <input type="date" id="searchContractStartTo" class="form-control">
                                </div>
                            </div>
                            <div class="form-group">
                                <label>نطاق الإيجار الشهري</label>
                                <div class="range-inputs">
                                    <input type="number" id="searchRentMin" class="form-control" placeholder="من">
                                    <span>إلى</span>
                                    <input type="number" id="searchRentMax" class="form-control" placeholder="إلى">
                                </div>
                            </div>
                        </div>
                        
                        <div class="search-panel" id="search-payments">
                            <div class="form-grid">
                                <div class="form-group">
                                    <label>نوع الدفعة</label>
                                    <select id="searchPaymentType" class="form-control">
                                        <option value="">جميع الأنواع</option>
                                        <option value="إيجار">إيجار</option>
                                        <option value="تأمين">تأمين</option>
                                        <option value="صيانة">صيانة</option>
                                        <option value="خدمات">خدمات</option>
                                        <option value="أخرى">أخرى</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>حالة الدفع</label>
                                    <select id="searchPaymentStatus" class="form-control">
                                        <option value="">جميع الحالات</option>
                                        <option value="مدفوع">مدفوع</option>
                                        <option value="معلق">معلق</option>
                                        <option value="متأخر">متأخر</option>
                                        <option value="ملغي">ملغي</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>تاريخ الدفع من</label>
                                    <input type="date" id="searchPaymentDateFrom" class="form-control">
                                </div>
                                <div class="form-group">
                                    <label>تاريخ الدفع إلى</label>
                                    <input type="date" id="searchPaymentDateTo" class="form-control">
                                </div>
                            </div>
                            <div class="form-group">
                                <label>نطاق المبلغ</label>
                                <div class="range-inputs">
                                    <input type="number" id="searchAmountMin" class="form-control" placeholder="من">
                                    <span>إلى</span>
                                    <input type="number" id="searchAmountMax" class="form-control" placeholder="إلى">
                                </div>
                            </div>
                        </div>
                        
                        <div class="search-panel" id="search-maintenance">
                            <div class="form-grid">
                                <div class="form-group">
                                    <label>نوع الصيانة</label>
                                    <select id="searchMaintenanceType" class="form-control">
                                        <option value="">جميع الأنواع</option>
                                        <option value="كهرباء">كهرباء</option>
                                        <option value="سباكة">سباكة</option>
                                        <option value="تكييف">تكييف</option>
                                        <option value="دهان">دهان</option>
                                        <option value="أخرى">أخرى</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>الحالة</label>
                                    <select id="searchMaintenanceStatus" class="form-control">
                                        <option value="">جميع الحالات</option>
                                        <option value="جديد">جديد</option>
                                        <option value="قيد التنفيذ">قيد التنفيذ</option>
                                        <option value="مكتمل">مكتمل</option>
                                        <option value="ملغي">ملغي</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>الأولوية</label>
                                    <select id="searchMaintenancePriority" class="form-control">
                                        <option value="">جميع الأولويات</option>
                                        <option value="عالية">عالية</option>
                                        <option value="متوسطة">متوسطة</option>
                                        <option value="منخفضة">منخفضة</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>تاريخ الطلب من</label>
                                    <input type="date" id="searchMaintenanceDateFrom" class="form-control">
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="search-actions">
                        <button class="btn btn-primary" onclick="advancedFeatures.performAdvancedSearch()">
                            <i class="fas fa-search"></i> بحث
                        </button>
                        <button class="btn btn-secondary" onclick="advancedFeatures.clearSearchFilters()">
                            <i class="fas fa-eraser"></i> مسح الفلاتر
                        </button>
                        <button class="btn btn-info" onclick="advancedFeatures.saveSearchTemplate()">
                            <i class="fas fa-save"></i> حفظ البحث
                        </button>
                    </div>
                </div>
            </div>
        `;

    document.body.insertAdjacentHTML("beforeend", searchHTML);
    this.setupSearchTabs();
  }

  setupSearchTabs() {
    const tabs = document.querySelectorAll(".search-tab");
    const panels = document.querySelectorAll(".search-panel");

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((t) => t.classList.remove("active"));
        panels.forEach((p) => p.classList.remove("active"));

        tab.classList.add("active");
        document
          .getElementById(`search-${tab.dataset.tab}`)
          .classList.add("active");
      });
    });
  }

  buildSearchIndex() {
    // Build search index for all data types
    const allData = {
      units: database.getUnits(),
      residents: database.getResidents(),
      contracts: database.getContracts(),
      payments: database.getPayments(),
      maintenance: database.getMaintenance(),
    };

    this.searchIndex.clear();

    Object.keys(allData).forEach((type) => {
      allData[type].forEach((item) => {
        const searchableText = this.extractSearchableText(item, type);
        this.searchIndex.set(`${type}_${item.id}`, {
          type,
          item,
          searchText: searchableText.toLowerCase(),
        });
      });
    });
  }

  extractSearchableText(item, type) {
    let text = "";

    switch (type) {
      case "units":
        text = `${item.number} ${item.floor} ${item.type} ${item.status} ${item.area}`;
        break;
      case "residents":
        text = `${item.name} ${item.nationalId} ${item.phone} ${item.email}`;
        break;
      case "contracts":
        text = `${item.contractNumber} ${item.status} ${item.monthlyRent}`;
        break;
      case "payments":
        text = `${item.type} ${item.status} ${item.amount} ${item.description}`;
        break;
      case "maintenance":
        text = `${item.type} ${item.status} ${item.priority} ${item.description}`;
        break;
    }

    return text;
  }

  showAdvancedSearch() {
    const adv = document.querySelector(".advanced-search-container");
    if (adv) {
      adv.style.display = "block";
      const gs = document.getElementById("globalSearch");
      if (gs) gs.focus();
    }
  }

  closeAdvancedSearch() {
    const adv = document.querySelector(".advanced-search-container");
    if (adv) adv.style.display = "none";
  }

  performAdvancedSearch() {
    const activeTabEl = document.querySelector(".search-tab.active");
    const activeTab = activeTabEl ? activeTabEl.dataset.tab : "general";
    let results = [];

    if (activeTab === "general") {
      results = this.performGlobalSearch();
    } else {
      results = this.performSpecificSearch(activeTab);
    }

    this.displaySearchResults(results);
    this.closeAdvancedSearch();
  }

  performGlobalSearch() {
    const globalEl = document.getElementById("globalSearch");
    const query =
      globalEl && globalEl.value ? globalEl.value.toString().toLowerCase() : "";
    const exact = document.getElementById("searchExact")
      ? document.getElementById("searchExact").checked
      : false;
    const caseSensitive = document.getElementById("searchCaseSensitive")
      ? document.getElementById("searchCaseSensitive").checked
      : false;

    if (!query) return [];

    const results = [];

    this.searchIndex.forEach((data, key) => {
      const searchText = caseSensitive
        ? data.searchText
        : data.searchText.toLowerCase();
      const searchQuery = caseSensitive ? query : query.toLowerCase();

      let match = false;
      if (exact) {
        match = searchText.includes(searchQuery);
      } else {
        match = searchQuery
          .split(" ")
          .every((term) => searchText.includes(term));
      }

      if (match) {
        results.push(data);
      }
    });

    return results;
  }

  performSpecificSearch(type) {
    const filters = this.getSearchFilters(type);
    const data = database.getData(type);

    return data
      .filter((item) => {
        return Object.keys(filters).every((key) => {
          const filterValue = filters[key];
          if (!filterValue) return true;

          const itemValue = item[key];

          if (
            typeof filterValue === "object" &&
            filterValue.min !== undefined
          ) {
            // Range filter
            const value = parseFloat(itemValue);
            const min = filterValue.min
              ? parseFloat(filterValue.min)
              : -Infinity;
            const max = filterValue.max
              ? parseFloat(filterValue.max)
              : Infinity;
            return value >= min && value <= max;
          } else {
            // Exact or partial match
            return itemValue
              .toString()
              .toLowerCase()
              .includes(filterValue.toLowerCase());
          }
        });
      })
      .map((item) => ({
        type,
        item,
        searchText: this.extractSearchableText(item, type),
      }));
  }

  getSearchFilters(type) {
    const filters = {};

    switch (type) {
      case "units":
        filters.number = document.getElementById("searchUnitNumber").value;
        filters.floor = document.getElementById("searchFloor").value;
        filters.type = document.getElementById("searchUnitType").value;
        filters.status = document.getElementById("searchUnitStatus").value;
        filters.area = {
          min: document.getElementById("searchAreaMin").value,
          max: document.getElementById("searchAreaMax").value,
        };
        break;
      case "residents":
        filters.name = document.getElementById("searchResidentName").value;
        filters.nationalId = document.getElementById("searchResidentId").value;
        filters.phone = document.getElementById("searchResidentPhone").value;
        filters.email = document.getElementById("searchResidentEmail").value;
        break;
      case "contracts":
        filters.contractNumber = document.getElementById(
          "searchContractNumber",
        ).value;
        filters.status = document.getElementById("searchContractStatus").value;
        filters.monthlyRent = {
          min: document.getElementById("searchRentMin").value,
          max: document.getElementById("searchRentMax").value,
        };
        break;
      case "payments":
        filters.type = document.getElementById("searchPaymentType").value;
        filters.status = document.getElementById("searchPaymentStatus").value;
        filters.amount = {
          min: document.getElementById("searchAmountMin").value,
          max: document.getElementById("searchAmountMax").value,
        };
        break;
      case "maintenance":
        filters.type = document.getElementById("searchMaintenanceType").value;
        filters.status = document.getElementById(
          "searchMaintenanceStatus",
        ).value;
        filters.priority = document.getElementById(
          "searchMaintenancePriority",
        ).value;
        break;
    }

    return filters;
  }

  displaySearchResults(results) {
    const resultsHTML = `
            <div class="search-results-container neu-flat">
                <div class="results-header">
                    <h3><i class="fas fa-search"></i> نتائج البحث (${results.length})</h3>
                    <button class="btn-close" onclick="this.parentElement.parentElement.remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="results-body">
                    ${
                      results.length === 0
                        ? '<div class="no-results">لم يتم العثور على نتائج</div>'
                        : results
                            .map((result) => this.formatSearchResult(result))
                            .join("")
                    }
                </div>
            </div>
        `;

    // Remove existing results
    const existingResults = document.querySelector(".search-results-container");
    if (existingResults) existingResults.remove();

    document.body.insertAdjacentHTML("beforeend", resultsHTML);
  }

  formatSearchResult(result) {
    const { type, item } = result;
    let title, subtitle, details;

    switch (type) {
      case "units":
        title = `شقة رقم ${item.number}`;
        subtitle = `الطابق ${item.floor} - ${item.type}`;
        details = `المساحة: ${item.area} م² - الحالة: ${item.status}`;
        break;
      case "residents":
        title = item.name;
        subtitle = `رقم الهوية: ${item.nationalId}`;
        details = `الهاتف: ${item.phone} - البريد: ${item.email}`;
        break;
      case "contracts":
        title = `عقد رقم ${item.contractNumber}`;
        subtitle = `الحالة: ${item.status}`;
        details = `الإيجار الشهري: ${item.monthlyRent} ريال`;
        break;
      case "payments":
        title = `دفعة ${item.type}`;
        subtitle = `المبلغ: ${item.amount} ريال`;
        details = `الحالة: ${item.status} - التاريخ: ${item.date}`;
        break;
      case "maintenance":
        title = `صيانة ${item.type}`;
        subtitle = `الأولوية: ${item.priority}`;
        details = `الحالة: ${item.status} - التاريخ: ${item.requestDate}`;
        break;
    }

    return `
            <div class="search-result-item" onclick="advancedFeatures.openSearchResult('${type}', '${item.id}')">
                <div class="result-icon">
                    <i class="fas fa-${this.getTypeIcon(type)}"></i>
                </div>
                <div class="result-content">
                    <h4>${title}</h4>
                    <p class="result-subtitle">${subtitle}</p>
                    <p class="result-details">${details}</p>
                </div>
                <div class="result-type">${this.getTypeLabel(type)}</div>
            </div>
        `;
  }

  getTypeIcon(type) {
    const icons = {
      units: "home",
      residents: "user",
      contracts: "file-contract",
      payments: "credit-card",
      maintenance: "tools",
    };
    return icons[type] || "file";
  }

  getTypeLabel(type) {
    const labels = {
      units: "شقة",
      residents: "ساكن",
      contracts: "عقد",
      payments: "دفعة",
      maintenance: "صيانة",
    };
    return labels[type] || type;
  }

  openSearchResult(type, id) {
    // Navigate to the appropriate section and highlight the item
    const sections = {
      units: "units",
      residents: "residents",
      contracts: "contracts",
      payments: "payments",
      maintenance: "maintenance",
    };

    if (sections[type]) {
      app.showPage(sections[type]);
      // Highlight the specific item
      setTimeout(() => {
        const element = document.querySelector(`[data-id="${id}"]`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.classList.add("highlight");
          setTimeout(() => element.classList.remove("highlight"), 3000);
        }
      }, 500);
    }

    // Close search results (guarded)
    const resultsContainer = document.querySelector(
      ".search-results-container",
    );
    if (resultsContainer) resultsContainer.remove();
  }

  clearSearchFilters() {
    const inputs = document.querySelectorAll(
      ".search-panel input, .search-panel select",
    );
    if (!inputs) return;
    inputs.forEach((input) => {
      try {
        if (input.type === "checkbox") {
          input.checked = false;
        } else {
          input.value = "";
        }
      } catch (err) {
        // ignore problematic input
      }
    });
  }

  // Export System
  initializeExport() {
    this.createExportInterface();
  }

  createExportInterface() {
    const exportHTML = `
            <div class="export-container neu-flat" style="display: none;">
                <div class="export-header">
                    <h3><i class="fas fa-download"></i> تصدير البيانات</h3>
                    <button class="btn-close" onclick="advancedFeatures.closeExport()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="export-body">
                    <div class="export-options">
                        <div class="form-group">
                            <label>نوع البيانات</label>
                            <select id="exportDataType" class="form-control">
                                <option value="all">جميع البيانات</option>
                                <option value="units">الشقق</option>
                                <option value="residents">السكان</option>
                                <option value="contracts">العقود</option>
                                <option value="payments">المدفوعات</option>
                                <option value="maintenance">الصيانة</option>
                                <option value="reports">التقارير</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label>تنسيق التصدير</label>
                            <div class="export-formats">
                                <label class="format-option">
                                    <input type="radio" name="exportFormat" value="pdf" checked>
                                    <span class="format-label">
                                        <i class="fas fa-file-pdf"></i>
                                        PDF
                                    </span>
                                </label>
                                <label class="format-option">
                                    <input type="radio" name="exportFormat" value="excel">
                                    <span class="format-label">
                                        <i class="fas fa-file-excel"></i>
                                        Excel
                                    </span>
                                </label>
                                <label class="format-option">
                                    <input type="radio" name="exportFormat" value="csv">
                                    <span class="format-label">
                                        <i class="fas fa-file-csv"></i>
                                        CSV
                                    </span>
                                </label>
                                <label class="format-option">
                                    <input type="radio" name="exportFormat" value="json">
                                    <span class="format-label">
                                        <i class="fas fa-file-code"></i>
                                        JSON
                                    </span>
                                </label>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>خيارات التصدير</label>
                            <div class="export-checkboxes">
                                <label class="checkbox-label">
                                    <input type="checkbox" id="includeImages" checked> تضمين الصور
                                </label>
                                <label class="checkbox-label">
                                    <input type="checkbox" id="includeCharts" checked> تضمين الرسوم البيانية
                                </label>
                                <label class="checkbox-label">
                                    <input type="checkbox" id="includeStatistics" checked> تضمين الإحصائيات
                                </label>
                                <label class="checkbox-label">
                                    <input type="checkbox" id="compressFile"> ضغط الملف
                                </label>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>نطاق التاريخ (اختياري)</label>
                            <div class="date-range">
                                <input type="date" id="exportDateFrom" class="form-control">
                                <span>إلى</span>
                                <input type="date" id="exportDateTo" class="form-control">
                            </div>
                        </div>
                    </div>
                    
                    <div class="export-actions">
                        <button class="btn btn-primary" onclick="advancedFeatures.performExport()">
                            <i class="fas fa-download"></i> تصدير
                        </button>
                        <button class="btn btn-secondary" onclick="advancedFeatures.previewExport()">
                            <i class="fas fa-eye"></i> معاينة
                        </button>
                    </div>
                </div>
            </div>
        `;

    document.body.insertAdjacentHTML("beforeend", exportHTML);
  }

  showExport() {
    const exp = document.querySelector(".export-container");
    if (exp) exp.style.display = "block";
  }

  closeExport() {
    const exp = document.querySelector(".export-container");
    if (exp) exp.style.display = "none";
  }

  performExport() {
    const dataType = document.getElementById("exportDataType").value;
    const formatEl = document.querySelector(
      'input[name="exportFormat"]:checked',
    );
    const format = formatEl ? formatEl.value : "pdf";
    const options = {
      includeImages: document.getElementById("includeImages").checked,
      includeCharts: document.getElementById("includeCharts").checked,
      includeStatistics: document.getElementById("includeStatistics").checked,
      compressFile: document.getElementById("compressFile").checked,
      dateFrom: document.getElementById("exportDateFrom").value,
      dateTo: document.getElementById("exportDateTo").value,
    };

    this.showLoadingOverlay("جاري تصدير البيانات...");

    setTimeout(() => {
      try {
        const data = this.prepareExportData(dataType, options);
        this.generateExportFile(data, format, dataType, options);
        this.hideLoadingOverlay();
        this.showNotification("تم تصدير البيانات بنجاح", "success");
        this.closeExport();
      } catch (error) {
        this.hideLoadingOverlay();
        this.showNotification("حدث خطأ أثناء التصدير", "error");
        console.error("Export error:", error);
      }
    }, 1000);
  }

  prepareExportData(dataType, options) {
    let data = {};

    if (dataType === "all") {
      data = {
        units: database.getUnits(),
        residents: database.getResidents(),
        contracts: database.getContracts(),
        payments: database.getPayments(),
        maintenance: database.getMaintenance(),
      };
    } else {
      data[dataType] = database.getData(dataType);
    }

    // Apply date filtering if specified
    if (options.dateFrom || options.dateTo) {
      data = this.filterDataByDate(data, options.dateFrom, options.dateTo);
    }

    // Add statistics if requested
    if (options.includeStatistics) {
      data.statistics = this.generateExportStatistics(data);
    }

    return data;
  }

  generateExportFile(data, format, dataType, options) {
    const filename = `building-management-${dataType}-${new Date().toISOString().split("T")[0]}`;

    switch (format) {
      case "pdf":
        this.exportToPDF(data, filename, options);
        break;
      case "excel":
        this.exportToExcel(data, filename, options);
        break;
      case "csv":
        this.exportToCSV(data, filename, options);
        break;
      case "json":
        this.exportToJSON(data, filename, options);
        break;
    }
  }

  exportToPDF(data, filename, options) {
    // Create PDF content
    const content = this.generatePDFContent(data, options);

    // Use browser's print functionality to generate PDF
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
            <!DOCTYPE html>
            <html dir="rtl" lang="ar">
            <head>
                <meta charset="UTF-8">
                <title>${filename}</title>
                <style>
                    body { font-family: Arial, sans-serif; direction: rtl; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .section { margin-bottom: 20px; }
                    .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: right; }
                    .table th { background-color: #f5f5f5; }
                    @media print { body { margin: 0; } }
                </style>
            </head>
            <body>
                ${content}
            </body>
            </html>
        `);
    printWindow.document.close();
    printWindow.print();
  }

  exportToExcel(data, filename, options) {
    // Convert data to Excel format (simplified CSV for now)
    let csvContent = "";

    Object.keys(data).forEach((key) => {
      if (key === "statistics") return;

      csvContent += `\n\n${this.getTypeLabel(key)}\n`;
      const items = data[key];

      if (items.length > 0) {
        // Headers
        const headers = Object.keys(items[0]);
        csvContent += headers.join(",") + "\n";

        // Data rows
        items.forEach((item) => {
          const row = headers.map((header) => `"${item[header] || ""}"`);
          csvContent += row.join(",") + "\n";
        });
      }
    });

    this.downloadFile(csvContent, `${filename}.csv`, "text/csv");
  }

  exportToCSV(data, filename, options) {
    this.exportToExcel(data, filename, options); // Same implementation for now
  }

  exportToJSON(data, filename, options) {
    const jsonContent = JSON.stringify(data, null, 2);
    this.downloadFile(jsonContent, `${filename}.json`, "application/json");
  }

  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Print System
  initializePrint() {
    this.setupPrintTemplates();
  }

  setupPrintTemplates() {
    this.printTemplates.set("contract", this.getContractTemplate());
    this.printTemplates.set("receipt", this.getReceiptTemplate());
    this.printTemplates.set("report", this.getReportTemplate());
    this.printTemplates.set("invoice", this.getInvoiceTemplate());
  }

  printDocument(type, data) {
    const template = this.printTemplates.get(type);
    if (!template) {
      this.showNotification("قالب الطباعة غير متوفر", "error");
      return;
    }

    const content = template(data);
    this.openPrintWindow(content);
  }

  openPrintWindow(content) {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  getContractTemplate() {
    return (data) => `
            <!DOCTYPE html>
            <html dir="rtl" lang="ar">
            <head>
                <meta charset="UTF-8">
                <title>عقد إيجار</title>
                <style>
                    body { font-family: Arial, sans-serif; direction: rtl; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .contract-details { margin: 20px 0; }
                    .signature-section { margin-top: 50px; display: flex; justify-content: space-between; }
                    @media print { body { margin: 0; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>عقد إيجار</h1>
                    <p>رقم العقد: ${data.contractNumber}</p>
                </div>
                <div class="contract-details">
                    <p><strong>المؤجر:</strong> ${data.landlord || "إدارة المبنى"}</p>
                    <p><strong>المستأجر:</strong> ${data.tenantName}</p>
                    <p><strong>رقم الشقة:</strong> ${data.unitNumber}</p>
                    <p><strong>الإيجار الشهري:</strong> ${data.monthlyRent} ريال</p>
                    <p><strong>تاريخ البداية:</strong> ${data.startDate}</p>
                    <p><strong>تاريخ النهاية:</strong> ${data.endDate}</p>
                </div>
                <div class="signature-section">
                    <div>
                        <p>توقيع المؤجر</p>
                        <p>_________________</p>
                    </div>
                    <div>
                        <p>توقيع المستأجر</p>
                        <p>_________________</p>
                    </div>
                </div>
            </body>
            </html>
        `;
  }

  getReceiptTemplate() {
    return (data) => `
            <!DOCTYPE html>
            <html dir="rtl" lang="ar">
            <head>
                <meta charset="UTF-8">
                <title>إيصال دفع</title>
                <style>
                    body { font-family: Arial, sans-serif; direction: rtl; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .receipt-details { margin: 20px 0; }
                    @media print { body { margin: 0; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>إيصال دفع</h1>
                    <p>رقم الإيصال: ${data.receiptNumber}</p>
                </div>
                <div class="receipt-details">
                    <p><strong>المبلغ:</strong> ${data.amount} ريال</p>
                    <p><strong>نوع الدفعة:</strong> ${data.type}</p>
                    <p><strong>التاريخ:</strong> ${data.date}</p>
                    <p><strong>الوصف:</strong> ${data.description}</p>
                </div>
            </body>
            </html>
        `;
  }

  // Performance Monitoring
  initializePerformanceMonitoring() {
    this.startPerformanceTracking();
    this.optimizeMemoryUsage();
    this.implementLazyLoading();
  }

  startPerformanceTracking() {
    // Track page load time
    window.addEventListener("load", () => {
      this.performanceMetrics.loadTime = performance.now();
    });

    // Track memory usage
    if ("memory" in performance) {
      setInterval(() => {
        this.performanceMetrics.memoryUsage = performance.memory.usedJSHeapSize;
      }, 5000);
    }
  }

  optimizeMemoryUsage() {
    // Implement virtual scrolling for large lists
    this.implementVirtualScrolling();

    // Clean up unused event listeners
    this.cleanupEventListeners();

    // Optimize image loading
    this.optimizeImages();
  }

  implementVirtualScrolling() {
    // Virtual scrolling implementation for large data sets
    const virtualScrollContainers =
      document.querySelectorAll(".virtual-scroll");

    virtualScrollContainers.forEach((container) => {
      this.setupVirtualScroll(container);
    });
  }

  // Keyboard Shortcuts
  initializeKeyboardShortcuts() {
    const shortcuts = {
      "Ctrl+S": () => this.saveCurrentData(),
      "Ctrl+F": () => this.showAdvancedSearch(),
      "Ctrl+E": () => this.showExport(),
      "Ctrl+P": () => this.printCurrentPage(),
      "Ctrl+N": () => this.createNewItem(),
      Escape: () => this.closeModals(),
      F1: () => this.showHelp(),
      "Ctrl+Z": () => this.undo(),
      "Ctrl+Y": () => this.redo(),
    };

    document.addEventListener("keydown", (e) => {
      const key = this.getShortcutKey(e);
      if (shortcuts[key]) {
        e.preventDefault();
        shortcuts[key]();
      }
    });
  }

  getShortcutKey(e) {
    const parts = [];
    if (e.ctrlKey) parts.push("Ctrl");
    if (e.altKey) parts.push("Alt");
    if (e.shiftKey) parts.push("Shift");
    parts.push(e.key);
    return parts.join("+");
  }

  // Notifications System
  initializeNotifications() {
    this.createNotificationContainer();
  }
  showNotification(message, type = "info", duration = 5000) {
    // Create notification element
    const notification = document.createElement("div");
    notification.className = `notification notification-${type} neu-flat`;

    const icon = this.getNotificationIcon(type);
    notification.innerHTML = `
            <i class="fas fa-${icon}" style="margin-inline-end:8px;"></i>
            <span>${message}</span>
            <button class="notification-close" style="background: none; border: none; color: var(--text-muted); cursor: pointer; margin-left: auto;">
                <i class="fas fa-times"></i>
            </button>
        `;

    // Prefer portal's toast container if available so portal and main app share the same UI
    let container = document.querySelector(".bms-toast-container");
    if (!container)
      container = document.querySelector(".notification-container");
    if (!container) {
      // Create legacy notification container if it doesn't exist
      container = document.createElement("div");
      container.className = "notification-container";
      container.style.cssText =
        "position: fixed; top: 20px; left: 20px; z-index: 10000; pointer-events: none;";
      document.body.appendChild(container);
    }

    // If using bms-toast-container, reduce spacing by wrapping in a simpler toast element
    if (container.classList.contains("bms-toast-container")) {
      const toast = document.createElement("div");
      toast.className = `bms-toast ${type}`;
      toast.textContent = message;
      const close = document.createElement("button");
      close.className = "notification-close";
      close.style.cssText =
        "background:none;border:none;color:inherit;margin-left:8px;cursor:pointer;";
      close.innerHTML = '<i class="fas fa-times"></i>';
      close.onclick = () => toast.remove();
      toast.appendChild(close);
      container.appendChild(toast);
      if (duration > 0)
        setTimeout(() => {
          toast.remove();
        }, duration);
      return;
    }

    // Fallback to legacy notification container
    container.appendChild(notification);
    const closeBtn = notification.querySelector(".notification-close");
    if (closeBtn)
      closeBtn.addEventListener("click", () => notification.remove());

    if (duration > 0) {
      setTimeout(() => {
        if (notification.parentElement) {
          notification.style.animation = "slideOutLeft 0.3s ease";
          setTimeout(() => notification.remove(), 300);
        }
      }, duration);
    }
  }

  getNotificationIcon(type) {
    const icons = {
      success: "check-circle",
      error: "exclamation-circle",
      warning: "exclamation-triangle",
      info: "info-circle",
    };
    return icons[type] || "info-circle";
  }

  // Bulk Operations
  initializeBulkOperations() {
    this.selectedItems = new Set();
    this.setupBulkSelectionUI();
  }

  setupBulkSelectionUI() {
    // Add bulk selection controls to tables
    const tables = document.querySelectorAll(".data-table");
    tables.forEach((table) => {
      this.addBulkSelectionToTable(table);
    });
  }

  addBulkSelectionToTable(table) {
    // Add select all checkbox to header
    const headerRow = table.querySelector("thead tr");
    if (headerRow) {
      const selectAllCell = document.createElement("th");
      selectAllCell.innerHTML =
        '<input type="checkbox" class="select-all-checkbox">';
      headerRow.insertBefore(selectAllCell, headerRow.firstChild);

      // Add individual checkboxes to rows
      const bodyRows = table.querySelectorAll("tbody tr");
      bodyRows.forEach((row) => {
        const selectCell = document.createElement("td");
        selectCell.innerHTML = '<input type="checkbox" class="row-checkbox">';
        row.insertBefore(selectCell, row.firstChild);
      });

      this.setupBulkSelectionEvents(table);
    }
  }

  setupBulkSelectionEvents(table) {
    const selectAllCheckbox = table.querySelector(".select-all-checkbox");
    const rowCheckboxes = table.querySelectorAll(".row-checkbox");

    selectAllCheckbox.addEventListener("change", (e) => {
      rowCheckboxes.forEach((checkbox) => {
        checkbox.checked = e.target.checked;
        this.updateSelectedItems(checkbox);
      });
      this.updateBulkActionsUI();
    });

    rowCheckboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        this.updateSelectedItems(checkbox);
        this.updateSelectAllState(table);
        this.updateBulkActionsUI();
      });
    });
  }

  updateSelectedItems(checkbox) {
    const row = checkbox.closest("tr");
    const itemId = row.dataset.id;

    if (checkbox.checked) {
      this.selectedItems.add(itemId);
    } else {
      this.selectedItems.delete(itemId);
    }
  }

  updateBulkActionsUI() {
    const count = this.selectedItems.size;
    let bulkActions = document.querySelector(".bulk-actions");

    if (count > 0) {
      if (!bulkActions) {
        bulkActions = this.createBulkActionsUI();
        document.body.appendChild(bulkActions);
      }
      const selCount = bulkActions.querySelector(".selected-count");
      if (selCount) selCount.textContent = count;
      bulkActions.style.display = "flex";
    } else if (bulkActions) {
      bulkActions.style.display = "none";
    }
  }

  createBulkActionsUI() {
    const bulkActions = document.createElement("div");
    bulkActions.className = "bulk-actions neu-flat";
    bulkActions.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: var(--bg-secondary);
            padding: 16px 20px;
            border-radius: 12px;
            box-shadow: var(--neu-shadow-elevated);
            border: 1px solid var(--border-color);
            display: none;
            align-items: center;
            gap: 16px;
            z-index: 1000;
        `;

    bulkActions.innerHTML = `
            <span class="selected-count">0</span> عنصر محدد
            <button class="btn btn-sm btn-danger" onclick="advancedFeatures.bulkDelete()">
                <i class="fas fa-trash"></i> حذف
            </button>
            <button class="btn btn-sm btn-primary" onclick="advancedFeatures.bulkExport()">
                <i class="fas fa-download"></i> تصدير
            </button>
            <button class="btn btn-sm btn-secondary" onclick="advancedFeatures.clearSelection()">
                <i class="fas fa-times"></i> إلغاء التحديد
            </button>
        `;

    return bulkActions;
  }

  bulkDelete() {
    if (this.selectedItems.size === 0) return;

    if (confirm(`هل أنت متأكد من حذف ${this.selectedItems.size} عنصر؟`)) {
      this.selectedItems.forEach((id) => {
        // Delete item based on current page context
        const currentPage = app.getCurrentPage();
        database.deleteItem(currentPage, id);
      });

      this.clearSelection();
      this.showNotification(
        `تم حذف ${this.selectedItems.size} عنصر بنجاح`,
        "success",
      );

      // Refresh current page
      app.refreshCurrentPage();
    }
  }

  bulkExport() {
    if (this.selectedItems.size === 0) return;

    const currentPage = app.getCurrentPage();
    const selectedData = Array.from(this.selectedItems)
      .map((id) => database.getItem(currentPage, id))
      .filter(Boolean);

    this.generateExportFile(
      { [currentPage]: selectedData },
      "excel",
      currentPage,
      {},
    );
    this.showNotification(
      `تم تصدير ${selectedData.length} عنصر بنجاح`,
      "success",
    );
  }

  clearSelection() {
    this.selectedItems.clear();
    document
      .querySelectorAll(".row-checkbox, .select-all-checkbox")
      .forEach((checkbox) => {
        checkbox.checked = false;
      });
    this.updateBulkActionsUI();
  }

  // Auto-save functionality
  initializeAutoSave() {
    this.autoSaveInterval = setInterval(() => {
      this.performAutoSave();
    }, 30000); // Auto-save every 30 seconds

    // Save on page unload
    window.addEventListener("beforeunload", () => {
      try {
        this.performAutoSave();
      } catch (e) {
        /* ignore */
      }
    });
  }

  performAutoSave() {
    try {
      database.saveToStorage();
      console.log("Auto-save completed");
    } catch (error) {
      console.error("Auto-save failed:", error);
    }
  }

  // Data validation
  initializeDataValidation() {
    this.validationRules = {
      required: (value) => value && value.toString().trim() !== "",
      email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      phone: (value) => /^[0-9+\-\s()]+$/.test(value),
      number: (value) => !isNaN(parseFloat(value)),
      date: (value) => !isNaN(Date.parse(value)),
      nationalId: (value) => /^[0-9]{10}$/.test(value),
    };
  }

  validateForm(formElement) {
    const errors = [];
    const inputs = formElement.querySelectorAll("[data-validate]");

    inputs.forEach((input) => {
      const rules = input.dataset.validate.split("|");
      const value = input.value;
      const fieldName = input.dataset.fieldName || input.name || "الحقل";

      rules.forEach((rule) => {
        const [ruleName, ruleParam] = rule.split(":");

        if (this.validationRules[ruleName]) {
          if (!this.validationRules[ruleName](value, ruleParam)) {
            errors.push(
              `${fieldName}: ${this.getValidationMessage(ruleName, ruleParam)}`,
            );
            input.classList.add("error");
          } else {
            input.classList.remove("error");
          }
        }
      });
    });

    return errors;
  }

  getValidationMessage(rule, param) {
    const messages = {
      required: "هذا الحقل مطلوب",
      email: "يجب إدخال بريد إلكتروني صحيح",
      phone: "يجب إدخال رقم هاتف صحيح",
      number: "يجب إدخال رقم صحيح",
      date: "يجب إدخال تاريخ صحيح",
      nationalId: "يجب إدخال رقم هوية صحيح (10 أرقام)",
    };
    return messages[rule] || "قيمة غير صحيحة";
  }

  // Offline support
  initializeOfflineSupport() {
    if ("serviceWorker" in navigator) {
      this.registerServiceWorker();
    }

    // Handle online/offline events
    window.addEventListener("online", () => {
      this.showNotification("تم استعادة الاتصال بالإنترنت", "success");
      this.syncOfflineData();
    });

    window.addEventListener("offline", () => {
      this.showNotification(
        "لا يوجد اتصال بالإنترنت - سيتم العمل في وضع عدم الاتصال",
        "warning",
      );
    });
  }

  registerServiceWorker() {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("Service Worker registered:", registration);
      })
      .catch((error) => {
        console.log("Service Worker registration failed:", error);
      });
  }

  syncOfflineData() {
    // Sync any offline changes when connection is restored
    const offlineChanges = localStorage.getItem("offlineChanges");
    if (offlineChanges) {
      try {
        const changes = JSON.parse(offlineChanges);
        // Process offline changes
        this.processOfflineChanges(changes);
        localStorage.removeItem("offlineChanges");
        this.showNotification("تم مزامنة البيانات المحفوظة محلياً", "success");
      } catch (error) {
        console.error("Failed to sync offline data:", error);
      }
    }
  }

  // Utility methods
  showLoadingOverlay(message = "جاري التحميل...") {
    const overlay = document.querySelector(".loading-overlay");
    if (overlay) {
      const p = overlay.querySelector("p");
      if (p) p.textContent = message;
      overlay.style.display = "flex";
    }
  }

  hideLoadingOverlay() {
    const overlay = document.querySelector(".loading-overlay");
    if (overlay) overlay.style.display = "none";
  }

  // Helper methods for other modules
  saveCurrentData() {
    database.saveToStorage();
    this.showNotification("تم حفظ البيانات بنجاح", "success");
  }

  printCurrentPage() {
    window.print();
  }

  createNewItem() {
    const currentPage = app.getCurrentPage();
    const createButtons = {
      units: () => units.showAddModal(),
      residents: () => residents.showAddModal(),
      contracts: () => contracts.showAddModal(),
      payments: () => payments.showAddModal(),
      maintenance: () => maintenance.showAddModal(),
    };

    if (createButtons[currentPage]) {
      createButtons[currentPage]();
    }
  }

  closeModals() {
    document
      .querySelectorAll(
        ".modal-container, .advanced-search-container, .export-container",
      )
      .forEach((modal) => {
        modal.style.display = "none";
      });
  }

  showHelp() {
    this.showNotification(
      "مساعدة: استخدم Ctrl+F للبحث، Ctrl+S للحفظ، Ctrl+E للتصدير",
      "info",
      10000,
    );
  }

  undo() {
    // Implement undo functionality
    this.showNotification("تم التراجع عن آخر عملية", "info");
  }

  redo() {
    // Implement redo functionality
    this.showNotification("تم إعادة آخر عملية", "info");
  }

  // -------------------------
  // SMS Messaging System
  // -------------------------
  initializeSMS() {
    try {
      this.loadSMSSettings();
      this.setupSMSInterface();
      // Process the SMS queue every 60 seconds
      if (this.smsProcessingInterval) clearInterval(this.smsProcessingInterval);
      this.smsProcessingInterval = setInterval(
        () => this.processSMSQueue(),
        60000,
      );
    } catch (err) {
      console.error("Failed to initialize SMS system:", err);
    }
  }

  async loadSMSSettings() {
    const settings =
      typeof database !== "undefined" &&
      typeof database.getSettings === "function"
        ? await database.getSettings()
        : {};
    // لم تعد هناك حاجة لـ smsSettings، حيث يتم الحصول على الإعدادات من قاعدة البيانات مباشرة عبر AppUtils
    // ولكن سنحتفظ بها لضمان التوافق
    this.smsSettings = {
      proxyEndpoint: settings.smsProxyEndpoint,
      apiKey: settings.smsApiKey,
    };
  }

  setupSMSInterface() {
    // Placeholder: integrate SMS settings UI into Settings page when loaded.
    // No DOM modifications here to avoid duplicating UI.
  }

  async sendSms(to, body) {
    // استخدام AppUtils.enqueueOrSend الذي يستخدم serverRequest
    try {
      const response = await AppUtils.enqueueOrSend("/api/sms", {
        method: "POST",
        body: { to, body },
      });

      if (response.queued) {
        console.log(
          `[SMS QUEUED] To: ${to}, Body: ${body}, Queue ID: ${response.queueId}`,
        );
        this.logSms(to, body, "queued", "Request queued for later retry");
        this.showNotification(
          `تم وضع الرسالة في قائمة الانتظار لإعادة المحاولة لاحقاً إلى ${to}`,
          "warning",
        );
        return true; // Return true as it was successfully queued
      }

      // إذا نجح الإرسال مباشرة
      if (response.success) {
        this.logSms(to, body, "sent", response.sid);
        this.showNotification(`تم إرسال الرسالة بنجاح إلى ${to}`, "success");
        return true;
      } else {
        const error = response.error || "فشل الإرسال عبر الخادم الوكيل";
        this.logSms(to, body, "failed", error);
        this.showNotification(`فشل إرسال الرسالة إلى ${to}: ${error}`, "error");
        return false;
      }
    } catch (error) {
      console.error(
        `[SMS ERROR] To: ${to}, Body: ${body}, Error: ${error.message}`,
      );
      this.logSms(to, body, "failed", error.message);
      this.showNotification(
        `فشل إرسال الرسالة إلى ${to}: ${error.message}`,
        "error",
      );
      return false;
    }
  }

  queueSms(to, body, trigger) {
    this.smsQueue.push({
      to,
      body,
      trigger,
      timestamp: new Date().toISOString(),
    });
    console.log(`SMS to ${to} queued. Trigger: ${trigger}`);
  }

  async processSMSQueue() {
    if (!this.smsQueue || this.smsQueue.length === 0) return;

    console.log(
      `Processing ${this.smsQueue.length} SMS messages in the queue.`,
    );

    // drain queue safely
    const queue = [...this.smsQueue];
    this.smsQueue = [];

    for (const sms of queue) {
      // send sequentially to avoid rate issues in simulation
      // eslint-disable-next-line no-await-in-loop
      await this.sendSms(sms.to, sms.body);
    }
  }

  logSms(to, body, status, reference) {
    this.smsLog.push({
      to,
      body,
      status,
      reference,
      timestamp: new Date().toISOString(),
    });

    // Optionally persist to database if API exists
    if (
      typeof database !== "undefined" &&
      typeof database.saveSmsLog === "function"
    ) {
      try {
        database.saveSmsLog(this.smsLog);
      } catch (err) {
        console.warn("Failed to persist SMS log:", err);
      }
    }
  }

  manualSendSms(residentId) {
    const resident =
      typeof database !== "undefined" &&
      typeof database.getRecord === "function"
        ? database.getRecord("residents", residentId)
        : null;
    if (!resident || !resident.phone) {
      this.showNotification("لا يوجد رقم هاتف صالح لهذا المقيم.", "error");
      return;
    }

    const modalContent = `
            <div class="form-group">
                <label>إلى:</label>
                <input type="text" class="form-control" value="${resident.name} (${resident.phone})" disabled>
            </div>
            <div class="form-group">
                <label for="smsMessage">نص الرسالة:</label>
                <textarea id="smsMessage" class="form-control" rows="5" placeholder="اكتب رسالتك هنا..."></textarea>
            </div>
        `;

    app.showModal("إرسال رسالة SMS يدوية", modalContent, [
      { text: "إلغاء", class: "btn-secondary", onclick: "app.closeModal()" },
      {
        text: "إرسال",
        class: "btn-primary",
        onclick: () => {
          const messageElem = document.getElementById("smsMessage");
          const message = messageElem ? messageElem.value : "";
          if (message) {
            this.sendSms(resident.phone, message);
            app.closeModal();
          } else {
            this.showNotification(
              "نص الرسالة لا يمكن أن يكون فارغًا.",
              "error",
            );
          }
        },
      },
    ]);
  }

  triggerLatePaymentReminders() {
    if (!database || typeof database.getOverduePayments !== "function") return;
    const overduePayments = database.getOverduePayments();
    overduePayments.forEach((payment) => {
      const resident =
        typeof database !== "undefined" &&
        typeof database.getRecord === "function"
          ? database.getRecord("residents", payment.residentId)
          : null;
      if (resident && resident.phone) {
        const message = `تذكير: لديك دفعة متأخرة بقيمة ${payment.amount} ريال. يرجى السداد في أقرب وقت.`;
        this.queueSms(resident.phone, message, "late_payment");
      }
    });
  }

  triggerContractExpiryWarnings() {
    if (!database || typeof database.getAlerts !== "function") return;
    const alerts = database
      .getAlerts()
      .filter(
        (alert) =>
          alert.type === "warning" &&
          alert.title &&
          alert.title.includes("عقد"),
      );
    alerts.forEach((alert) => {
      const contract =
        typeof database !== "undefined" &&
        typeof database.getRecord === "function"
          ? database.getRecord("contracts", alert.contractId)
          : null;
      if (contract) {
        const resident =
          typeof database !== "undefined" &&
          typeof database.getRecord === "function"
            ? database.getRecord("residents", contract.residentId)
            : null;
        if (resident && resident.phone) {
          const endDate =
            typeof AppUtils !== "undefined" && AppUtils.formatDate
              ? AppUtils.formatDate(contract.endDate)
              : contract.endDate;
          const message = `تذكير: عقد الإيجار الخاص بك سينتهي قريباً بتاريخ ${endDate}. يرجى مراجعة الإدارة للتجديد.`;
          this.queueSms(resident.phone, message, "contract_expiry");
        }
      }
    });
  }
}

// Initialize advanced features
const advancedFeatures = new AdvancedFeatures();

// Add CSS for advanced features
const advancedFeaturesCSS = `
    .advanced-search-container,
    .export-container {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 90%;
        max-width: 800px;
        max-height: 90vh;
        overflow-y: auto;
        z-index: 10000;
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
    }

    .search-header,
    .export-header {
        padding: var(--spacing-lg);
        border-bottom: 1px solid var(--border-color);
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: var(--bg-primary);
    }

    .search-tabs {
        display: flex;
        border-bottom: 1px solid var(--border-color);
        background: var(--bg-primary);
    }

    .search-tab {
        padding: var(--spacing-md) var(--spacing-lg);
        background: none;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        transition: all var(--transition-normal);
        border-bottom: 2px solid transparent;
    }

    .search-tab.active {
        color: var(--primary-color);
        border-bottom-color: var(--primary-color);
        background: var(--bg-secondary);
    }

    .search-panel {
        display: none;
        padding: var(--spacing-lg);
    }

    .search-panel.active {
        display: block;
    }

    .range-inputs {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
    }

    .range-inputs input {
        flex: 1;
    }

    .export-formats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: var(--spacing-md);
    }

    .format-option {
        display: flex;
        align-items: center;
        cursor: pointer;
    }

    .format-option input[type="radio"] {
        display: none;
    }

    .format-label {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--spacing-sm);
        padding: var(--spacing-md);
        border: 2px solid var(--border-color);
        border-radius: var(--radius-lg);
        transition: all var(--transition-normal);
        width: 100%;
        text-align: center;
    }

    .format-option input[type="radio"]:checked + .format-label {
        border-color: var(--primary-color);
        background: var(--primary-color);
        color: var(--text-inverse);
    }

    .export-checkboxes {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--spacing-sm);
    }

    .checkbox-label {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        cursor: pointer;
    }

    .date-range {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
    }

    .search-results-container {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 90%;
        max-width: 600px;
        max-height: 70vh;
        overflow-y: auto;
        z-index: 10001;
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
    }

    .search-result-item {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
        padding: var(--spacing-md);
        border-bottom: 1px solid var(--border-color);
        cursor: pointer;
        transition: all var(--transition-normal);
    }

    .search-result-item:hover {
        background: var(--bg-primary);
    }

    .result-icon {
        width: 40px;
        height: 40px;
        background: var(--primary-color);
        color: var(--text-inverse);
        border-radius: var(--radius-md);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    .result-content {
        flex: 1;
    }

    .result-content h4 {
        margin: 0 0 var(--spacing-xs) 0;
        color: var(--text-primary);
    }

    .result-subtitle,
    .result-details {
        margin: 0;
        color: var(--text-muted);
        font-size: 0.9rem;
    }

    .result-type {
        background: var(--bg-primary);
        color: var(--text-muted);
        padding: var(--spacing-xs) var(--spacing-sm);
        border-radius: var(--radius-sm);
        font-size: 0.8rem;
    }

    .highlight {
        animation: highlight 3s ease;
    }

    @keyframes highlight {
        0%, 100% { background: transparent; }
        50% { background: var(--primary-color); color: var(--text-inverse); }
    }

    .notification-container {
        position: fixed;
        top: 20px;
        left: 20px;
        z-index: 10000;
        pointer-events: none;
    }

    .notification {
        pointer-events: auto;
        margin-bottom: var(--spacing-sm);
    }

    @keyframes slideInLeft {
        from {
            transform: translateX(-100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOutLeft {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(-100%);
            opacity: 0;
        }
    }

    .bulk-actions {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 1000;
    }

    .form-control.error {
        border-color: var(--error-color);
        box-shadow: 0 0 0 3px rgba(245, 101, 101, 0.1);
    }

    .no-results {
        text-align: center;
        padding: var(--spacing-2xl);
        color: var(--text-muted);
        font-style: italic;
    }
`;

// Add the CSS to the document
const styleSheet = document.createElement("style");
styleSheet.textContent = advancedFeaturesCSS;
document.head.appendChild(styleSheet);

// SMS methods were moved into the AdvancedFeatures class to fix syntax errors.
