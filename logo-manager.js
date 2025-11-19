/**
 * Logo Manager - إدارة شعار المبنى والتفاعلات المرتبطة به
 *
 * هذا الملف يوفر جميع الوظائف اللازمة لتحميل وعرض وإدارة شعار المبنى
 * في جميع أنحاء التطبيق، بالإضافة إلى إدارة معاينة وطباعة الفواتير.
 */

window.LogoManager = {
  // حالة الشعار الحالية
  currentLogo: null,
  currentBuildingName: null,

  /**
   * تهيئة مدير الشعار
   */
  async init() {
    console.log("Initializing Logo Manager...");

    // تحميل الشعار عند بدء التطبيق
    await this.loadBuildingLogo();

    // الاستماع لحدث حفظ الإعدادات
    window.addEventListener("settings-saved", async () => {
      console.log("Settings saved event detected, reloading logo...");
      await this.loadBuildingLogo();
    });

    // الاستماع لحدث تغيير الثيم
    window.addEventListener("theme-changed", () => {
      this.updateLogoStyles();
    });

    console.log("Logo Manager initialized successfully");
  },

  /**
   * تحميل شعار المبنى من قاعدة البيانات
   */
  async loadBuildingLogo() {
    try {
      console.log("Loading building logo...");

      const settings = await db.getSettings();
      this.currentLogo = settings.buildingLogo || "";
      this.currentBuildingName =
        settings.buildingName || "نظام إدارة المباني السكنية";

      console.log("Logo loaded:", {
        hasLogo: !!this.currentLogo,
        buildingName: this.currentBuildingName,
      });

      // تحديث جميع عناصر الشعار في الواجهة
      await this.updateAllLogoElements();

      return {
        success: true,
        logo: this.currentLogo,
        buildingName: this.currentBuildingName,
      };
    } catch (error) {
      console.error("Failed to load building logo:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * تحديث جميع عناصر الشعار في الواجهة
   */
  async updateAllLogoElements() {
    console.log("Updating all logo elements...");

    // تحديث شعار تسجيل الدخول
    this.updateLoginLogo();

    // تحديث شعار الشريط الجانبي
    this.updateSidebarLogo();

    // تحديث شعار الرأس
    this.updateHeaderLogo();

    // تحديث أسماء المبنى
    this.updateBuildingNames();

    console.log("All logo elements updated");
  },

  /**
   * تحديث شعار تسجيل الدخول
   */
  updateLoginLogo() {
    const loginLogo = document.getElementById("loginLogo");
    if (!loginLogo) return;

    if (this.currentLogo) {
      const logoSrc = this.getLogoSrc(this.currentLogo);
      loginLogo.innerHTML = `
                <img src="${logoSrc}" 
                     alt="شعار المبنى" 
                     class="building-logo-img"
                     onerror="LogoManager.handleLogoError(this)">
            `;
      console.log("Login logo updated");
    } else {
      loginLogo.innerHTML = '<i class="fas fa-building"></i>';
      console.log("Login logo reset to default icon");
    }
  },

  /**
   * تحديث شعار الشريط الجانبي
   */
  updateSidebarLogo() {
    const sidebarLogo = document.getElementById("sidebarLogo");
    if (!sidebarLogo) return;

    if (this.currentLogo) {
      const logoSrc = this.getLogoSrc(this.currentLogo);
      sidebarLogo.innerHTML = `
                <img src="${logoSrc}" 
                     alt="شعار المبنى" 
                     class="building-logo-img"
                     onerror="LogoManager.handleLogoError(this)">
                <span id="sidebarBuildingName">${this.currentBuildingName}</span>
            `;
      console.log("Sidebar logo updated");
    } else {
      sidebarLogo.innerHTML = `
                <i class="fas fa-building"></i>
                <span id="sidebarBuildingName">${this.currentBuildingName}</span>
            `;
      console.log("Sidebar logo reset to default icon");
    }
  },

  /**
   * تحديث شعار الرأس
   */
  updateHeaderLogo() {
    const headerLogo = document.getElementById("headerLogo");
    if (!headerLogo) return;

    if (this.currentLogo) {
      const logoSrc = this.getLogoSrc(this.currentLogo);
      headerLogo.innerHTML = `
                <img src="${logoSrc}" 
                     alt="شعار المبنى" 
                     class="building-logo-img-small"
                     onerror="LogoManager.handleLogoError(this)">
            `;
      console.log("Header logo updated");
    } else {
      headerLogo.innerHTML = "";
      console.log("Header logo cleared");
    }
  },

  /**
   * تحديث أسماء المبنى في جميع الأماكن
   */
  updateBuildingNames() {
    // تحديث اسم المبنى في شاشة تسجيل الدخول
    const loginBuildingName = document.getElementById("loginBuildingName");
    if (loginBuildingName) {
      loginBuildingName.textContent = this.currentBuildingName;
    }

    // تحديث اسم المبنى في الشريط الجانبي
    const sidebarBuildingName = document.getElementById("sidebarBuildingName");
    if (sidebarBuildingName) {
      sidebarBuildingName.textContent = this.currentBuildingName;
    }

    console.log("Building names updated");
  },

  /**
   * الحصول على مصدر الشعار (URL أو Base64)
   */
  getLogoSrc(logo) {
    if (!logo) return "";

    // إذا كان الشعار Base64
    if (logo.startsWith("data:image")) {
      return logo;
    }

    // إذا كان مسار ملف محلي
    if (window.electronAPI) {
      // في بيئة Electron
      return "file://" + logo;
    } else {
      // في بيئة المتصفح
      return logo;
    }
  },

  /**
   * معالجة خطأ تحميل الشعار
   */
  handleLogoError(imgElement) {
    console.error("Failed to load logo image");

    // استبدال الصورة بأيقونة افتراضية
    const parent = imgElement.parentElement;
    if (parent) {
      parent.innerHTML = '<i class="fas fa-building"></i>';
    }
  },

  /**
   * تحديث أنماط الشعار عند تغيير الثيم
   */
  updateLogoStyles() {
    const theme = document.body.getAttribute("data-theme");
    console.log("Updating logo styles for theme:", theme);

    // يمكن إضافة تعديلات خاصة بالثيم هنا
    // مثل تغيير فلاتر CSS أو الشفافية
  },

  /**
   * الحصول على معلومات الشعار الحالية
   */
  getCurrentLogoInfo() {
    return {
      logo: this.currentLogo,
      buildingName: this.currentBuildingName,
      hasLogo: !!this.currentLogo,
    };
  },

  /**
   * تحديث الشعار يدويًا (للاستخدام من قبل مكونات أخرى)
   */
  async refreshLogo() {
    console.log("Manual logo refresh requested");
    await this.loadBuildingLogo();
  },
};

/**
 * Invoice Manager - إدارة الفواتير ومعاينتها
 */
window.InvoiceManager = {
  currentInvoiceId: null,
  currentInvoiceData: null,

  /**
   * تهيئة مدير الفواتير
   */
  init() {
    console.log("Initializing Invoice Manager...");

    // إضافة مستمعي الأحداث للنافذة المنبثقة
    this.setupModalListeners();

    console.log("Invoice Manager initialized successfully");
  },

  /**
   * إعداد مستمعي الأحداث للنافذة المنبثقة
   */
  setupModalListeners() {
    const modal = document.getElementById("invoiceModal");
    if (!modal) return;

    // إغلاق النافذة عند النقر على الخلفية
    const backdrop = modal.querySelector(".modal-backdrop");
    if (backdrop) {
      backdrop.addEventListener("click", () => {
        this.closeModal();
      });
    }

    // إغلاق النافذة عند الضغط على Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.style.display !== "none") {
        this.closeModal();
      }
    });
  },

  /**
   * فتح نافذة معاينة الفاتورة
   */
  async openInvoicePreview(paymentId) {
    try {
      console.log("Opening invoice preview for payment:", paymentId);

      this.currentInvoiceId = paymentId;

      // جلب بيانات الدفعة
      const payment = await db.getRecord("payments", paymentId);
      if (!payment) {
        throw new Error("Payment not found");
      }

      // إنشاء HTML الفاتورة
      const invoiceHtml = await this.generateInvoiceHtml(payment);

      // عرض الفاتورة في النافذة المنبثقة
      const invoicePreview = document.getElementById("invoicePreview");
      if (invoicePreview) {
        invoicePreview.innerHTML = invoiceHtml;
      }

      // إظهار النافذة المنبثقة
      const modal = document.getElementById("invoiceModal");
      if (modal) {
        modal.style.display = "flex";

        // إضافة تأثير الظهور
        setTimeout(() => {
          modal.classList.add("show");
        }, 10);
      }

      console.log("Invoice preview opened successfully");
    } catch (error) {
      console.error("Failed to open invoice preview:", error);
      if (window.app && window.app.showNotification) {
        window.app.showNotification(
          "فشل فتح معاينة الفاتورة: " + error.message,
          "error",
        );
      }
    }
  },

  /**
   * إغلاق نافذة معاينة الفاتورة
   */
  closeModal() {
    const modal = document.getElementById("invoiceModal");
    if (modal) {
      modal.classList.remove("show");
      setTimeout(() => {
        modal.style.display = "none";
      }, 300);
    }

    this.currentInvoiceId = null;
    this.currentInvoiceData = null;

    console.log("Invoice preview closed");
  },

  /**
   * إنشاء HTML الفاتورة
   */
  async generateInvoiceHtml(payment) {
    console.log("Generating invoice HTML...");

    // جلب الإعدادات
    const settings = await db.getSettings();

    // جلب معلومات المقيم إذا كانت موجودة
    let resident = null;
    if (payment.residentId) {
      resident = await db.getRecord("residents", payment.residentId);
    }

    // جلب معلومات الوحدة إذا كانت موجودة
    let unit = null;
    if (payment.unitId) {
      unit = await db.getRecord("units", payment.unitId);
    }

    // إعداد بيانات الفاتورة
    const invoiceData = {
      invoiceNumber:
        payment.reference || payment.id.substring(0, 8).toUpperCase(),
      invoiceDate: AppUtils.formatDate(payment.date),
      paymentType: this.getPaymentTypeLabel(payment.type),
      amount: AppUtils.formatCurrency(payment.amount, settings.currency),
      status: this.getPaymentStatusLabel(payment.status),
      description: payment.description || "لا يوجد وصف",

      // معلومات المبنى
      buildingName: settings.buildingName || "نظام إدارة المباني السكنية",
      buildingAddress: settings.buildingAddress || "العنوان غير محدد",
      buildingPhone: settings.managerPhone || "غير محدد",
      buildingLogo: LogoManager.getLogoSrc(settings.buildingLogo || ""),

      // معلومات المقيم
      residentName: resident
        ? resident.name
        : payment.residentName || "غير محدد",
      residentPhone: resident ? resident.phone : "غير محدد",
      residentEmail: resident ? resident.email : "غير محدد",

      // معلومات الوحدة
      unitNumber: unit ? unit.number : payment.unitNumber || "غير محدد",
      unitFloor: unit ? unit.floor : "غير محدد",

      // معلومات إضافية
      paymentMethod: payment.paymentMethod
        ? this.getPaymentMethodLabel(payment.paymentMethod)
        : "غير محدد",
      notes: payment.notes || "لا توجد ملاحظات",
    };

    // إنشاء HTML
    const html = `
            <div class="invoice-preview-container">
                <div class="invoice-header-preview">
                    ${
                      invoiceData.buildingLogo
                        ? `
                        <img src="${invoiceData.buildingLogo}" 
                             alt="شعار المبنى" 
                             class="invoice-logo-preview">
                    `
                        : ""
                    }
                    <div class="invoice-header-info">
                        <h1>${invoiceData.buildingName}</h1>
                        <p>${invoiceData.buildingAddress}</p>
                        <p>📞 ${invoiceData.buildingPhone}</p>
                    </div>
                    <div class="invoice-number-preview">
                        <h2>فاتورة</h2>
                        <p>رقم: ${invoiceData.invoiceNumber}</p>
                        <p>التاريخ: ${invoiceData.invoiceDate}</p>
                    </div>
                </div>
                
                <div class="invoice-body-preview">
                    <div class="invoice-section">
                        <h3>معلومات المقيم</h3>
                        <table class="invoice-table">
                            <tr>
                                <td><strong>الاسم:</strong></td>
                                <td>${invoiceData.residentName}</td>
                            </tr>
                            <tr>
                                <td><strong>رقم الوحدة:</strong></td>
                                <td>${invoiceData.unitNumber}</td>
                            </tr>
                            <tr>
                                <td><strong>الطابق:</strong></td>
                                <td>${invoiceData.unitFloor}</td>
                            </tr>
                            <tr>
                                <td><strong>الهاتف:</strong></td>
                                <td>${invoiceData.residentPhone}</td>
                            </tr>
                        </table>
                    </div>
                    
                    <div class="invoice-section">
                        <h3>تفاصيل الدفعة</h3>
                        <table class="invoice-table">
                            <tr>
                                <td><strong>نوع الدفعة:</strong></td>
                                <td>${invoiceData.paymentType}</td>
                            </tr>
                            <tr>
                                <td><strong>المبلغ:</strong></td>
                                <td class="invoice-amount">${invoiceData.amount}</td>
                            </tr>
                            <tr>
                                <td><strong>الحالة:</strong></td>
                                <td>${invoiceData.status}</td>
                            </tr>
                            <tr>
                                <td><strong>طريقة الدفع:</strong></td>
                                <td>${invoiceData.paymentMethod}</td>
                            </tr>
                            <tr>
                                <td><strong>الوصف:</strong></td>
                                <td>${invoiceData.description}</td>
                            </tr>
                        </table>
                    </div>
                    
                    ${
                      invoiceData.notes !== "لا توجد ملاحظات"
                        ? `
                        <div class="invoice-section">
                            <h3>ملاحظات</h3>
                            <p>${invoiceData.notes}</p>
                        </div>
                    `
                        : ""
                    }
                </div>
                
                <div class="invoice-footer-preview">
                    <p>شكراً لتعاملكم معنا</p>
                    <p>تم إنشاء هذه الفاتورة بواسطة نظام إدارة المباني السكنية</p>
                </div>
            </div>
        `;

    this.currentInvoiceData = invoiceData;

    return html;
  },

  /**
   * تحميل الفاتورة كملف PDF
   */
  async downloadInvoice() {
    if (!this.currentInvoiceId) {
      console.error("No invoice ID set");
      return;
    }

    console.log("Downloading invoice as PDF...");

    // استدعاء دالة الطباعة من payments.js
    if (window.Payments && window.Payments.printInvoice) {
      await window.Payments.printInvoice(this.currentInvoiceId);
      this.closeModal();
    } else {
      console.error("Payments.printInvoice function not found");
      if (window.app && window.app.showNotification) {
        window.app.showNotification("فشل تحميل الفاتورة", "error");
      }
    }
  },

  /**
   * طباعة الفاتورة
   */
  printInvoice() {
    const invoicePreview = document.getElementById("invoicePreview");
    if (!invoicePreview) {
      console.error("Invoice preview element not found");
      return;
    }

    console.log("Printing invoice...");

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
            <!DOCTYPE html>
            <html dir="rtl" lang="ar">
            <head>
                <meta charset="UTF-8">
                <title>فاتورة - ${this.currentInvoiceData?.invoiceNumber || ""}</title>
                <style>
                    ${this.getPrintStyles()}
                </style>
            </head>
            <body>
                ${invoicePreview.innerHTML}
            </body>
            </html>
        `);
    printWindow.document.close();

    // الانتظار قليلاً ثم طباعة
    setTimeout(() => {
      printWindow.print();
    }, 500);
  },

  /**
   * الحصول على أنماط الطباعة
   */
  getPrintStyles() {
    return `
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
                padding: 20px;
                color: #2c3e50;
            }
            
            .invoice-preview-container {
                max-width: 800px;
                margin: 0 auto;
            }
            
            .invoice-header-preview {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 3px solid #3498db;
            }
            
            .invoice-logo-preview {
                width: 80px;
                height: 80px;
                object-fit: contain;
            }
            
            .invoice-header-info h1 {
                font-size: 24px;
                color: #2c3e50;
                margin-bottom: 5px;
            }
            
            .invoice-header-info p {
                font-size: 14px;
                color: #7f8c8d;
                margin: 2px 0;
            }
            
            .invoice-number-preview {
                text-align: left;
            }
            
            .invoice-number-preview h2 {
                font-size: 28px;
                color: #3498db;
                margin-bottom: 5px;
            }
            
            .invoice-number-preview p {
                font-size: 14px;
                color: #7f8c8d;
                margin: 2px 0;
            }
            
            .invoice-section {
                margin-bottom: 25px;
            }
            
            .invoice-section h3 {
                font-size: 18px;
                color: #2c3e50;
                margin-bottom: 10px;
                padding-bottom: 5px;
                border-bottom: 2px solid #ecf0f1;
            }
            
            .invoice-table {
                width: 100%;
                border-collapse: collapse;
            }
            
            .invoice-table td {
                padding: 8px;
                border-bottom: 1px solid #ecf0f1;
            }
            
            .invoice-table td:first-child {
                width: 30%;
                color: #7f8c8d;
            }
            
            .invoice-amount {
                font-size: 20px;
                font-weight: bold;
                color: #27ae60;
            }
            
            .invoice-footer-preview {
                text-align: center;
                margin-top: 40px;
                padding-top: 20px;
                border-top: 2px solid #ecf0f1;
                color: #7f8c8d;
            }
            
            @media print {
                body {
                    padding: 0;
                }
            }
        `;
  },

  /**
   * الحصول على تسمية نوع الدفعة
   */
  getPaymentTypeLabel(type) {
    const types = {
      payment: "دفعة",
      rent: "إيجار",
      utilities: "خدمات",
      maintenance: "صيانة",
      deposit: "تأمين",
      income: "إيراد",
      expense: "مصروف",
    };
    return types[type] || type;
  },

  /**
   * الحصول على تسمية حالة الدفعة
   */
  getPaymentStatusLabel(status) {
    const statuses = {
      paid: "مدفوع",
      pending: "معلق",
      overdue: "متأخر",
    };
    return statuses[status] || status;
  },

  /**
   * الحصول على تسمية طريقة الدفع
   */
  getPaymentMethodLabel(method) {
    const methods = {
      cash: "نقدي",
      bank_transfer: "تحويل بنكي",
      check: "شيك",
      credit_card: "بطاقة ائتمان",
      debit_card: "بطاقة مدين",
    };
    return methods[method] || method;
  },
};

/**
 * دوال عامة للاستخدام من HTML
 */
window.closeInvoiceModal = function () {
  InvoiceManager.closeModal();
};

window.downloadInvoice = async function () {
  await InvoiceManager.downloadInvoice();
};

window.printInvoice = function () {
  InvoiceManager.printInvoice();
};

/**
 * تهيئة جميع المديرين عند تحميل الصفحة
 */
document.addEventListener("DOMContentLoaded", async function () {
  console.log("=== Initializing Logo and Invoice Managers ===");

  // تهيئة مدير الشعار
  await LogoManager.init();

  // تهيئة مدير الفواتير
  InvoiceManager.init();

  console.log("=== Initialization Complete ===");
});
