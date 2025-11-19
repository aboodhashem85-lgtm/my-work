/**
 * Settings and Backup Management Module
 * Handles application settings and data backup/restore
 */

window.Settings = {
  currentSettings: null,

  /**
   * Load settings management page
   */
  load() {
    this.renderSettingsPage();
    this.loadCurrentSettings();
  },

  /**
   * Render the settings management page
   */
  renderSettingsPage() {
    const settingsContent = document.getElementById("settingsContent");
    if (!settingsContent) return;

    settingsContent.innerHTML = `
            <div class="settings-container">
                <!-- Header Section -->
                <div class="page-header">
                    <div class="header-actions">
                        <button class="btn btn-success" onclick="Settings.exportData()">
                            <i class="fas fa-download"></i>
                            تصدير البيانات
                        </button>
                        <button class="btn btn-warning" onclick="Settings.importData()">
                            <i class="fas fa-upload"></i>
                            استيراد البيانات
                        </button>
                        <button class="btn btn-danger" onclick="Settings.resetData()">
                            <i class="fas fa-trash-alt"></i>
                            إعادة تعيين البيانات
                        </button>
                    </div>
                </div>

                <!-- Settings Tabs -->
                <div class="settings-tabs">
                    <div class="tab-buttons">
                        <button class="tab-button active" onclick="Settings.switchTab('general')">
                            <i class="fas fa-cog"></i>
                            الإعدادات العامة
                        </button>
                        <button class="tab-button" onclick="Settings.switchTab('appearance')">
                            <i class="fas fa-palette"></i>
                            المظهر
                        </button>
                        <button class="tab-button" onclick="Settings.switchTab('notifications')">
                            <i class="fas fa-bell"></i>
                            الإشعارات
                        </button>
                        <button class="tab-button" onclick="Settings.switchTab('sms')">
                            <i class="fas fa-sms"></i>
                            SMS
                        </button>
                        <button class="tab-button" onclick="Settings.switchTab('backup')">
                            <i class="fas fa-shield-alt"></i>
                            النسخ الاحتياطي
                        </button>
                        <button class="tab-button" onclick="Settings.switchTab('about')">
                            <i class="fas fa-info-circle"></i>
                            حول النظام
                        </button>
                    </div>

                    <!-- General Settings Tab -->
                    <div id="generalTab" class="tab-content active">
                        <div class="settings-section neu-flat">
                            <h3>الإعدادات العامة</h3>
                            <form id="generalSettingsForm">
                                <div class="form-grid">
                                    <div class="form-group">
                                        <label for="buildingName">اسم المبنى *</label>
                                        <input type="text" id="buildingName" class="form-control" required 
                                               placeholder="مثال: مجمع الياسمين السكني">
                                    </div>
                                    <div class="form-group">
                                        <label for="buildingAddress">عنوان المبنى</label>
                                        <input type="text" id="buildingAddress" class="form-control" 
                                               placeholder="العنوان الكامل للمبنى">
                                    </div>
                                    <div class="form-group">
                                        <label for="managerName">اسم المدير</label>
                                        <input type="text" id="managerName" class="form-control" 
                                               placeholder="اسم مدير المبنى">
                                    </div>
                                    <div class="form-group">
                                        <label for="managerPhone">هاتف المدير</label>
                                        <input type="tel" id="managerPhone" class="form-control" 
                                               placeholder="رقم هاتف المدير">
                                    </div>
                                    <div class="form-group logo-upload-group">
                                        <label for="buildingLogo">شعار المبنى</label>
                                        <div class="logo-preview-container">
                                            <img id="logoPreview" src="" alt="شعار المبنى" style="max-width: 100px; max-height: 100px; display: none; margin-bottom: 10px; border: 1px solid #ccc; padding: 5px; border-radius: 5px;">
                                            <input type="file" id="buildingLogo" class="form-control" accept="image/png, image/jpeg, image/svg+xml">
                                            <small class="form-text text-muted">صيغ مدعومة: PNG, JPEG, SVG. يفضل أن يكون مربعًا.</small>
                                            <button type="button" class="btn btn-sm btn-danger mt-2" id="removeLogoBtn" style="display: none;" onclick="Settings.removeLogo()">إزالة الشعار</button>
                                        </div>
                                    </div>
                                    <div class="form-group">
                                        <label for="currency">العملة *</label>
                                        <select id="currency" class="form-control" required>
                                            <option value="SAR">ريال سعودي (SAR)</option>
                                            <option value="AED">درهم إماراتي (AED)</option>
                                            <option value="KWD">دينار كويتي (KWD)</option>
                                            <option value="QAR">ريال قطري (QAR)</option>
                                            <option value="BHD">دينار بحريني (BHD)</option>
                                            <option value="OMR">ريال عماني (OMR)</option>
                                            <option value="JOD">دينار أردني (JOD)</option>
                                            <option value="EGP">جنيه مصري (EGP)</option>
                                            <option value="USD">دولار أمريكي (USD)</option>
                                            <option value="EUR">يورو (EUR)</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label for="dateFormat">تنسيق التاريخ</label>
                                        <select id="dateFormat" class="form-control">
                                            <option value="DD/MM/YYYY">يوم/شهر/سنة</option>
                                            <option value="MM/DD/YYYY">شهر/يوم/سنة</option>
                                            <option value="YYYY-MM-DD">سنة-شهر-يوم</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label for="language">اللغة</label>
                                        <select id="language" class="form-control">
                                            <option value="ar">العربية</option>
                                            <option value="en">English</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label for="timezone">المنطقة الزمنية</label>
                                        <select id="timezone" class="form-control">
                                            <option value="Asia/Riyadh">الرياض (GMT+3)</option>
                                            <option value="Asia/Dubai">دبي (GMT+4)</option>
                                            <option value="Asia/Kuwait">الكويت (GMT+3)</option>
                                            <option value="Asia/Qatar">الدوحة (GMT+3)</option>
                                            <option value="Asia/Bahrain">المنامة (GMT+3)</option>
                                            <option value="Asia/Muscat">مسقط (GMT+4)</option>
                                            <option value="Asia/Amman">عمان (GMT+3)</option>
                                            <option value="Africa/Cairo">القاهرة (GMT+2)</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label>
                                        <input type="checkbox" id="enableAutoSave">
                                        تفعيل الحفظ التلقائي
                                    </label>
                                </div>
                                
                                <div class="form-group">
                                    <label>
                                        <input type="checkbox" id="enableDataValidation">
                                        تفعيل التحقق من صحة البيانات
                                    </label>
                                </div>

                                <div class="form-actions">
                                    <button type="button" class="btn btn-primary" onclick="Settings.saveGeneralSettings()">
                                        <i class="fas fa-save"></i>
                                        حفظ الإعدادات
                                    </button>
                                    <button type="button" class="btn btn-secondary" onclick="Settings.resetGeneralSettings()">
                                        <i class="fas fa-undo"></i>
                                        إعادة تعيين
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <!-- Appearance Settings Tab -->
                    <div id="appearanceTab" class="tab-content">
                        <div class="settings-section neu-flat">
                            <h3>إعدادات المظهر</h3>
                            <form id="appearanceSettingsForm">
                                <div class="form-group">
                                    <label for="theme">السمة</label>
                                    <select id="theme" class="form-control">
                                        <option value="light">فاتح</option>
                                        <option value="dark">داكن</option>
                                        <option value="auto">تلقائي</option>
                                    </select>
                                </div>
                                
                                <div class="form-group">
                                    <label for="primaryColor">اللون الأساسي</label>
                                    <div class="color-picker-group">
                                        <input type="color" id="primaryColor" class="color-picker" value="#4299e1">
                                        <div class="color-presets">
                                            <button type="button" class="color-preset" style="background: #4299e1" onclick="Settings.setColor('#4299e1')"></button>
                                            <button type="button" class="color-preset" style="background: #48bb78" onclick="Settings.setColor('#48bb78')"></button>
                                            <button type="button" class="color-preset" style="background: #ed8936" onclick="Settings.setColor('#ed8936')"></button>
                                            <button type="button" class="color-preset" style="background: #9f7aea" onclick="Settings.setColor('#9f7aea')"></button>
                                            <button type="button" class="color-preset" style="background: #38b2ac" onclick="Settings.setColor('#38b2ac')"></button>
                                            <button type="button" class="color-preset" style="background: #f56565" onclick="Settings.setColor('#f56565')"></button>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label for="fontSize">حجم الخط</label>
                                    <select id="fontSize" class="form-control">
                                        <option value="small">صغير</option>
                                        <option value="medium">متوسط</option>
                                        <option value="large">كبير</option>
                                    </select>
                                </div>
                                
                                <div class="form-group">
                                    <label for="sidebarPosition">موقع الشريط الجانبي</label>
                                    <select id="sidebarPosition" class="form-control">
                                        <option value="right">يمين</option>
                                        <option value="left">يسار</option>
                                    </select>
                                </div>
                                
                                <div class="form-group">
                                    <label>
                                        <input type="checkbox" id="enableAnimations">
                                        تفعيل الحركات والانتقالات
                                    </label>
                                </div>
                                
                                <div class="form-group">
                                    <label>
                                        <input type="checkbox" id="compactMode">
                                        الوضع المضغوط
                                    </label>
                                </div>

                                <div class="form-actions">
                                    <button type="button" class="btn btn-primary" onclick="Settings.saveAppearanceSettings()">
                                        <i class="fas fa-save"></i>
                                        حفظ الإعدادات
                                    </button>
                                    <button type="button" class="btn btn-secondary" onclick="Settings.resetAppearanceSettings()">
                                        <i class="fas fa-undo"></i>
                                        إعادة تعيين
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <!-- Notifications Settings Tab -->
                    <div id="notificationsTab" class="tab-content">
                        <div class="settings-section neu-flat">
                            <h3>إعدادات الإشعارات</h3>
                            <form id="notificationsSettingsForm">
                                <div class="form-group">
                                    <label>
                                        <input type="checkbox" id="enableNotifications">
                                        تفعيل الإشعارات
                                    </label>
                                </div>
                                
                                <div class="form-group">
                                    <label>
                                        <input type="checkbox" id="notifyPaymentDue">
                                        تذكير بموعد الدفع
                                    </label>
                                </div>
                                
                                <div class="form-group">
                                    <label>
                                        <input type="checkbox" id="notifyContractExpiry">
                                        تذكير بانتهاء العقود
                                    </label>
                                </div>
                                
                                <div class="form-group">
                                    <label>
                                        <input type="checkbox" id="notifyMaintenanceRequest">
                                        إشعار بطلبات الصيانة الجديدة
                                    </label>
                                </div>
                                
                                <div class="form-group">
                                    <label for="notificationDays">عدد أيام التذكير المسبق</label>
                                    <select id="notificationDays" class="form-control">
                                        <option value="1">يوم واحد</option>
                                        <option value="3">3 أيام</option>
                                        <option value="7">أسبوع</option>
                                        <option value="14">أسبوعين</option>
                                        <option value="30">شهر</option>
                                    </select>
                                </div>
                                
                                <div class="form-group">
                                    <label for="notificationSound">صوت الإشعار</label>
                                    <select id="notificationSound" class="form-control">
                                        <option value="default">افتراضي</option>
                                        <option value="bell">جرس</option>
                                        <option value="chime">نغمة</option>
                                        <option value="none">بدون صوت</option>
                                    </select>
                                </div>

                                <div class="form-actions">
                                    <button type="button" class="btn btn-primary" onclick="Settings.saveNotificationSettings()">
                                        <i class="fas fa-save"></i>
                                        حفظ الإعدادات
                                    </button>
                                    <button type="button" class="btn btn-secondary" onclick="Settings.resetNotificationSettings()">
                                        <i class="fas fa-undo"></i>
                                        إعادة تعيين
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <!-- SMS Settings Tab -->
                    <div id="smsTab" class="tab-content">
                        <div class="settings-section neu-flat">
                            <h3>إعدادات SMS</h3>
                            <form id="smsSettingsForm">
                                <div class="form-group">
                                    <label for="smsProvider">مزود خدمة SMS</label>
                                    <select id="smsProvider" class="form-control">
                                        <option value="twilio">Twilio</option>
                                        <option value="mock">محاكاة (اختبار)</option>
                                    </select>
                                </div>

                                <div class="form-group">
                                    <label for="smsAccountSid">Account SID</label>
                                    <input type="text" id="smsAccountSid" class="form-control">
                                </div>

                                <div class="form-group">
                                    <label for="smsAuthToken">Auth Token</label>
                                    <input type="text" id="smsAuthToken" class="form-control">
                                </div>

                                <div class="form-group">
                                    <label for="smsFromNumber">From Number</label>
                                    <input type="text" id="smsFromNumber" class="form-control" placeholder="مثل: +9665XXXXXXXX">
                                </div>

                                <div class="form-group">
                                    <label for="smsProxyEndpoint">Proxy Endpoint (مثال: http://localhost:3000)</label>
                                    <input type="text" id="smsProxyEndpoint" class="form-control" placeholder="http://localhost:3000">
                                </div>

                                <div class="form-group">
                                    <label for="smsApiKey">API Key (X-API-KEY)</label>
                                    <input type="text" id="smsApiKey" class="form-control" placeholder="مفتاح واجهة برمجة التطبيقات">
                                </div>

                                <div class="form-actions">
                                    <button type="button" class="btn btn-primary" onclick="Settings.saveSmsSettings()">
                                        <i class="fas fa-save"></i>
                                        حفظ إعدادات SMS
                                    </button>
                                    <button type="button" class="btn btn-secondary" onclick="Settings.resetSmsSettings()">
                                        <i class="fas fa-undo"></i>
                                        إعادة تعيين
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <!-- Backup Settings Tab -->
                    <div id="backupTab" class="tab-content">
                        <div class="settings-section neu-flat">
                            <h3>إدارة النسخ الاحتياطي</h3>
                            
                            <div class="backup-section">
                                <h4>إنشاء نسخة احتياطية</h4>
                                <p>قم بإنشاء نسخة احتياطية من جميع بيانات النظام</p>
                                <div class="backup-actions">
                                    <button class="btn btn-success" onclick="Settings.createBackup()">
                                        <i class="fas fa-download"></i>
                                        إنشاء نسخة احتياطية
                                    </button>
                                    <button class="btn btn-info" onclick="Settings.scheduleBackup()">
                                        <i class="fas fa-clock"></i>
                                        جدولة النسخ الاحتياطي
                                    </button>
                                </div>
                            </div>
                            
                            <div class="backup-section">
                                <h4>استعادة النسخة الاحتياطية</h4>
                                <p>استعادة البيانات من نسخة احتياطية سابقة</p>
                                <div class="backup-actions">
                                    <input type="file" id="backupFile" accept=".json" style="display: none;">
                                    <button class="btn btn-warning" onclick="Settings.selectBackupFile()">
                                        <i class="fas fa-upload"></i>
                                        اختيار ملف النسخة الاحتياطية
                                    </button>
                                    <button class="btn btn-primary" onclick="Settings.restoreBackup()" disabled id="restoreBtn">
                                        <i class="fas fa-undo"></i>
                                        استعادة البيانات
                                    </button>
                                </div>
                                <div id="backupFileInfo" class="backup-file-info" style="display: none;">
                                    <!-- Backup file info will be displayed here -->
                                </div>
                            </div>
                            
                            <div class="backup-section">
                                <h4>إعدادات النسخ الاحتياطي التلقائي</h4>
                                <form id="autoBackupForm">
                                    <div class="form-group">
                                        <label>
                                            <input type="checkbox" id="enableAutoBackup">
                                            تفعيل النسخ الاحتياطي التلقائي
                                        </label>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="backupFrequency">تكرار النسخ الاحتياطي</label>
                                        <select id="backupFrequency" class="form-control">
                                            <option value="daily">يومي</option>
                                            <option value="weekly">أسبوعي</option>
                                            <option value="monthly">شهري</option>
                                        </select>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="backupRetention">عدد النسخ المحفوظة</label>
                                        <select id="backupRetention" class="form-control">
                                            <option value="5">5 نسخ</option>
                                            <option value="10">10 نسخ</option>
                                            <option value="20">20 نسخة</option>
                                            <option value="unlimited">غير محدود</option>
                                        </select>
                                    </div>

                                    <div class="form-actions">
                                        <button type="button" class="btn btn-primary" onclick="Settings.saveBackupSettings()">
                                            <i class="fas fa-save"></i>
                                            حفظ الإعدادات
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>

                    <!-- About Tab -->
                    <div id="aboutTab" class="tab-content">
                        <div class="settings-section neu-flat">
                            <h3>حول النظام</h3>
                            <div class="about-content">
                                <div class="app-info">
                                    <div class="app-logo">
                                        <i class="fas fa-building"></i>
                                    </div>
                                    <div class="app-details">
                                        <h2>نظام إدارة المباني السكنية</h2>
                                        <p class="version">الإصدار 1.0.0</p>
                                        <p class="description">
                                            نظام شامل ومجاني لإدارة المباني السكنية باللغة العربية، 
                                            يوفر جميع الأدوات اللازمة لإدارة الشقق والمقيمين والعقود والمدفوعات والصيانة.
                                        </p>
                                    </div>
                                </div>
                                
                                <div class="features-list">
                                    <h4>الميزات الرئيسية</h4>
                                    <ul>
                                        <li><i class="fas fa-check"></i> إدارة الشقق والوحدات السكنية</li>
                                        <li><i class="fas fa-check"></i> إدارة المقيمين والمستأجرين</li>
                                        <li><i class="fas fa-check"></i> إدارة العقود والاتفاقيات</li>
                                        <li><i class="fas fa-check"></i> إدارة المدفوعات والفواتير</li>
                                        <li><i class="fas fa-check"></i> إدارة طلبات الصيانة</li>
                                        <li><i class="fas fa-check"></i> التقارير والإحصائيات</li>
                                        <li><i class="fas fa-check"></i> النسخ الاحتياطي والاستعادة</li>
                                        <li><i class="fas fa-check"></i> واجهة عربية متجاوبة</li>
                                    </ul>
                                </div>
                                
                                <div class="system-info">
                                    <h4>معلومات النظام</h4>
                                    <div class="info-grid">
                                        <div class="info-item">
                                            <span class="label">المتصفح:</span>
                                            <span class="value" id="browserInfo">-</span>
                                        </div>
                                        <div class="info-item">
                                            <span class="label">نظام التشغيل:</span>
                                            <span class="value" id="osInfo">-</span>
                                        </div>
                                        <div class="info-item">
                                            <span class="label">دقة الشاشة:</span>
                                            <span class="value" id="screenInfo">-</span>
                                        </div>
                                        <div class="info-item">
                                            <span class="label">حجم البيانات:</span>
                                            <span class="value" id="dataSize">-</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="support-info">
                                    <h4>الدعم والمساعدة</h4>
                                    <p>
                                        هذا النظام مجاني ومفتوح المصدر. للحصول على المساعدة أو الإبلاغ عن مشاكل، 
                                        يرجى التواصل مع فريق التطوير.
                                    </p>
                                    <div class="support-actions">
                                        <button class="btn btn-info" onclick="Settings.showHelp()">
                                            <i class="fas fa-question-circle"></i>
                                            دليل المستخدم
                                        </button>
                                        <button class="btn btn-secondary" onclick="Settings.showShortcuts()">
                                            <i class="fas fa-keyboard"></i>
                                            اختصارات لوحة المفاتيح
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

    this.bindEvents();
    this.loadSystemInfo();
  },

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Backup file input
    const backupFileInput = document.getElementById("backupFile");
    if (backupFileInput) {
      backupFileInput.addEventListener("change", (e) => {
        this.handleBackupFileSelection(e);
      });
    }

    // Color picker
    const primaryColorPicker = document.getElementById("primaryColor");
    if (primaryColorPicker) {
      primaryColorPicker.addEventListener("change", (e) => {
        this.previewColor(e.target.value);
      });
    }

    // Theme selector
    const themeSelector = document.getElementById("theme");
    if (themeSelector) {
      themeSelector.addEventListener("change", (e) => {
        this.previewTheme(e.target.value);
      });
    }
  },

  /**
   * Load current settings
   */
  async loadCurrentSettings() {
    this.currentSettings = await db.getSettings();
    this.populateSettingsForms();
  },

  /**
   * Populate settings forms with current values
   */
  populateSettingsForms() {
    const settings = this.currentSettings;

    // General settings
    document.getElementById("buildingName").value = settings.buildingName || "";
    document.getElementById("buildingAddress").value =
      settings.buildingAddress || "";
    document.getElementById("managerName").value = settings.managerName || "";
    document.getElementById("managerPhone").value = settings.managerPhone || "";
    document.getElementById("currency").value = settings.currency || "SAR";
    document.getElementById("dateFormat").value =
      settings.dateFormat || "DD/MM/YYYY";
    document.getElementById("language").value = settings.language || "ar";
    document.getElementById("timezone").value =
      settings.timezone || "Asia/Riyadh";
    document.getElementById("enableAutoSave").checked =
      settings.enableAutoSave !== false;
    document.getElementById("enableDataValidation").checked =
      settings.enableDataValidation !== false;

    // Logo Preview
    const logoPath = settings.buildingLogo;
    const logoPreview = document.getElementById("logoPreview");
    const removeLogoBtn = document.getElementById("removeLogoBtn");

    if (logoPath) {
      logoPreview.src = logoPath.startsWith("data:image")
        ? logoPath
        : `file://${logoPath}`;
      logoPreview.style.display = "block";
      removeLogoBtn.style.display = "inline-block";
    } else {
      logoPreview.src = "";
      logoPreview.style.display = "none";
      removeLogoBtn.style.display = "none";
    }

    // Appearance settings
    document.getElementById("theme").value = settings.theme || "light";
    document.getElementById("primaryColor").value =
      settings.primaryColor || "#4299e1";
    document.getElementById("fontSize").value = settings.fontSize || "medium";
    document.getElementById("sidebarPosition").value =
      settings.sidebarPosition || "right";
    document.getElementById("enableAnimations").checked =
      settings.enableAnimations !== false;
    document.getElementById("compactMode").checked =
      settings.compactMode || false;

    // Notification settings
    document.getElementById("enableNotifications").checked =
      settings.enableNotifications !== false;
    document.getElementById("notifyPaymentDue").checked =
      settings.notifyPaymentDue !== false;
    document.getElementById("notifyContractExpiry").checked =
      settings.notifyContractExpiry !== false;
    document.getElementById("notifyMaintenanceRequest").checked =
      settings.notifyMaintenanceRequest !== false;
    document.getElementById("notificationDays").value =
      settings.notificationDays || "7";
    document.getElementById("notificationSound").value =
      settings.notificationSound || "default";

    // Backup settings
    document.getElementById("enableAutoBackup").checked =
      settings.enableAutoBackup || false;
    document.getElementById("backupFrequency").value =
      settings.backupFrequency || "weekly";
    document.getElementById("backupRetention").value =
      settings.backupRetention || "10";

    // SMS settings
    const sms = settings.sms || {};
    const smsProvider = document.getElementById("smsProvider");
    if (smsProvider) smsProvider.value = sms.provider || "mock";
    const smsSid = document.getElementById("smsAccountSid");
    if (smsSid) smsSid.value = sms.accountSid || "";
    const smsToken = document.getElementById("smsAuthToken");
    if (smsToken) smsToken.value = sms.authToken || "";
    const smsFrom = document.getElementById("smsFromNumber");
    if (smsFrom) smsFrom.value = sms.fromNumber || "";
    const smsProxy = document.getElementById("smsProxyEndpoint");
    if (smsProxy) smsProxy.value = sms.proxyEndpoint || "";
    const smsApiKey = document.getElementById("smsApiKey");
    if (smsApiKey) smsApiKey.value = sms.apiKey || "";
  },

  /**
   * Switch between settings tabs
   */
  switchTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll(".tab-content").forEach((tab) => {
      tab.classList.remove("active");
    });

    // Remove active class from all tab buttons
    document.querySelectorAll(".tab-button").forEach((button) => {
      button.classList.remove("active");
    });

    // Show selected tab content
    const selectedTab = document.getElementById(tabName + "Tab");
    if (selectedTab) {
      selectedTab.classList.add("active");
    }

    // Add active class to selected tab button
    event.target.classList.add("active");
  },

  /**
   * Save general settings
   */
  /**
   * Save general settings
   */
  async saveGeneralSettings() {
    const buildingName = document.getElementById("buildingName").value.trim();
    const buildingAddress = document
      .getElementById("buildingAddress")
      .value.trim();
    const managerName = document.getElementById("managerName").value.trim();
    const managerPhone = document.getElementById("managerPhone").value.trim();
    const currency = document.getElementById("currency").value;
    const dateFormat = document.getElementById("dateFormat").value;
    const language = document.getElementById("language").value;
    const timezone = document.getElementById("timezone").value;
    const enableAutoSave = document.getElementById("enableAutoSave").checked;
    const enableDataValidation = document.getElementById(
      "enableDataValidation",
    ).checked;

    // Validation
    if (!buildingName) {
      app.showNotification("اسم المبنى مطلوب", "error");
      return;
    }

    if (managerPhone && !AppUtils.validatePhone(managerPhone)) {
      app.showNotification("رقم هاتف المدير غير صحيح", "error");
      return;
    }

    // Handle Logo Upload
    const logoInput = document.getElementById("buildingLogo");
    const logoFile = logoInput.files[0];
    let logoPath = this.currentSettings.buildingLogo || "";

    if (logoFile) {
      if (window.electronAPI && window.electronAPI.saveLogoFile) {
        // Assuming file.path is available in Electron's File object for local files
        const result = await window.electronAPI.saveLogoFile(
          logoFile.path || logoFile.name,
        );
        if (result.success) {
          logoPath = result.filePath;
        } else {
          app.showNotification("فشل في حفظ الشعار: " + result.error, "error");
          return;
        }
      } else {
        // Fallback for web environment (store as base64 for demo)
        logoPath = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(logoFile);
        });
      }
    } else if (logoInput.value === "" && this.currentSettings.buildingLogo) {
      // If input is cleared and there was a logo, we keep the path unless explicitly removed
    }

    const settings = {
      buildingName,
      buildingAddress,
      managerName,
      managerPhone,
      currency,
      dateFormat,
      language,
      timezone,
      enableAutoSave,
      enableDataValidation,
      buildingLogo: logoPath, // Save the path/base64 string
    };

    const success = await db.updateSettings(settings);

    if (success) {
      this.currentSettings = { ...this.currentSettings, ...settings };
      app.showNotification("تم حفظ الإعدادات العامة بنجاح", "success");
      // Reload settings to update UI
      this.populateSettingsForms();
    } else {
      app.showNotification("حدث خطأ أثناء حفظ الإعدادات", "error");
    }
  },

  /**
   * Save appearance settings
   */
  saveAppearanceSettings() {
    const settings = {
      theme: document.getElementById("theme").value,
      primaryColor: document.getElementById("primaryColor").value,
      fontSize: document.getElementById("fontSize").value,
      sidebarPosition: document.getElementById("sidebarPosition").value,
      enableAnimations: document.getElementById("enableAnimations").checked,
      compactMode: document.getElementById("compactMode").checked,
    };

    const success = db.updateSettings(settings);

    if (success) {
      this.currentSettings = { ...this.currentSettings, ...settings };
      this.applyAppearanceSettings(settings);
      app.showNotification("تم حفظ إعدادات المظهر بنجاح", "success");
    } else {
      app.showNotification("حدث خطأ أثناء حفظ الإعدادات", "error");
    }
  },

  /**
   * Save notification settings
   */
  saveNotificationSettings() {
    const settings = {
      enableNotifications: document.getElementById("enableNotifications")
        .checked,
      notifyPaymentDue: document.getElementById("notifyPaymentDue").checked,
      notifyContractExpiry: document.getElementById("notifyContractExpiry")
        .checked,
      notifyMaintenanceRequest: document.getElementById(
        "notifyMaintenanceRequest",
      ).checked,
      notificationDays: document.getElementById("notificationDays").value,
      notificationSound: document.getElementById("notificationSound").value,
    };

    const success = db.updateSettings(settings);

    if (success) {
      this.currentSettings = { ...this.currentSettings, ...settings };
      app.showNotification("تم حفظ إعدادات الإشعارات بنجاح", "success");
    } else {
      app.showNotification("حدث خطأ أثناء حفظ الإعدادات", "error");
    }
  },

  /**
   * Save SMS settings
   */
  saveSmsSettings() {
    const settings = {
      sms: {
        provider: document.getElementById("smsProvider").value,
        accountSid: document.getElementById("smsAccountSid").value.trim(),
        authToken: document.getElementById("smsAuthToken").value.trim(),
        fromNumber: document.getElementById("smsFromNumber").value.trim(),
        proxyEndpoint: document.getElementById("smsProxyEndpoint").value.trim(),
        apiKey: document.getElementById("smsApiKey").value.trim(),
      },
    };

    const success = db.updateSettings(settings);

    if (success) {
      this.currentSettings = { ...this.currentSettings, ...settings };
      app.showNotification("تم حفظ إعدادات SMS بنجاح", "success");
    } else {
      app.showNotification("حدث خطأ أثناء حفظ إعدادات SMS", "error");
    }
  },

  resetSmsSettings() {
    app.confirm("هل أنت متأكد من إعادة تعيين إعدادات SMS؟", () => {
      document.getElementById("smsProvider").value = "mock";
      document.getElementById("smsAccountSid").value = "";
      document.getElementById("smsAuthToken").value = "";
      document.getElementById("smsFromNumber").value = "";
      document.getElementById("smsProxyEndpoint").value = "";
      document.getElementById("smsApiKey").value = "";
    });
  },

  /**
   * Save backup settings
   */
  saveBackupSettings() {
    const settings = {
      enableAutoBackup: document.getElementById("enableAutoBackup").checked,
      backupFrequency: document.getElementById("backupFrequency").value,
      backupRetention: document.getElementById("backupRetention").value,
    };

    const success = db.updateSettings(settings);

    if (success) {
      this.currentSettings = { ...this.currentSettings, ...settings };
      app.showNotification("تم حفظ إعدادات النسخ الاحتياطي بنجاح", "success");
    } else {
      app.showNotification("حدث خطأ أثناء حفظ الإعدادات", "error");
    }
  },

  /**
   * Remove the building logo
   */
  removeLogo() {
    this.currentSettings.buildingLogo = "";
    // Manually update the settings object and save
    this.saveGeneralSettings();

    // Update UI immediately
    const logoPreview = document.getElementById("logoPreview");
    const removeLogoBtn = document.getElementById("removeLogoBtn");
    const logoInput = document.getElementById("buildingLogo");

    logoPreview.src = "";
    logoPreview.style.display = "none";
    removeLogoBtn.style.display = "none";
    logoInput.value = ""; // Clear file input
  },

  /**
   * Reset general settings
   */
  resetGeneralSettings() {
    app.confirm("هل أنت متأكد من إعادة تعيين الإعدادات العامة؟", () => {
      document.getElementById("buildingName").value = "";
      document.getElementById("buildingAddress").value = "";
      document.getElementById("managerName").value = "";
      document.getElementById("managerPhone").value = "";
      document.getElementById("currency").value = "SAR";
      document.getElementById("dateFormat").value = "DD/MM/YYYY";
      document.getElementById("language").value = "ar";
      document.getElementById("timezone").value = "Asia/Riyadh";
      document.getElementById("enableAutoSave").checked = false;
      document.getElementById("enableDataValidation").checked = false;

      // Also remove logo settings
      this.currentSettings.buildingLogo = "";
      this.saveGeneralSettings();
    });
  },

  /**
   * Reset appearance settings
   */
  resetAppearanceSettings() {
    app.confirm("هل أنت متأكد من إعادة تعيين إعدادات المظهر؟", () => {
      document.getElementById("theme").value = "light";
      document.getElementById("primaryColor").value = "#4299e1";
      document.getElementById("fontSize").value = "medium";
      document.getElementById("sidebarPosition").value = "right";
      document.getElementById("enableAnimations").checked = true;
      document.getElementById("compactMode").checked = false;

      this.previewTheme("light");
      this.previewColor("#4299e1");
    });
  },

  /**
   * Reset notification settings
   */
  resetNotificationSettings() {
    app.confirm("هل أنت متأكد من إعادة تعيين إعدادات الإشعارات؟", () => {
      document.getElementById("enableNotifications").checked = true;
      document.getElementById("notifyPaymentDue").checked = true;
      document.getElementById("notifyContractExpiry").checked = true;
      document.getElementById("notifyMaintenanceRequest").checked = true;
      document.getElementById("notificationDays").value = "7";
      document.getElementById("notificationSound").value = "default";
    });
  },

  /**
   * Apply appearance settings
   */
  applyAppearanceSettings(settings) {
    // Apply theme
    document.documentElement.setAttribute("data-theme", settings.theme);

    // Apply primary color
    document.documentElement.style.setProperty(
      "--primary-color",
      settings.primaryColor,
    );

    // Apply font size
    const fontSizeMap = {
      small: "14px",
      medium: "16px",
      large: "18px",
    };
    document.documentElement.style.setProperty(
      "--base-font-size",
      fontSizeMap[settings.fontSize],
    );

    // Apply sidebar position
    document.body.setAttribute(
      "data-sidebar-position",
      settings.sidebarPosition,
    );

    // Apply animations
    if (!settings.enableAnimations) {
      document.body.classList.add("no-animations");
    } else {
      document.body.classList.remove("no-animations");
    }

    // Apply compact mode
    if (settings.compactMode) {
      document.body.classList.add("compact-mode");
    } else {
      document.body.classList.remove("compact-mode");
    }
  },

  /**
   * Preview color change
   */
  previewColor(color) {
    document.documentElement.style.setProperty("--primary-color", color);
  },

  /**
   * Preview theme change
   */
  previewTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
  },

  /**
   * Set color from preset
   */
  setColor(color) {
    document.getElementById("primaryColor").value = color;
    this.previewColor(color);
  },

  /**
   * Create backup
   */
  createBackup() {
    try {
      const backupData = {
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        settings: db.getSettings(),
        data: {
          units: db.getTable("units"),
          residents: db.getTable("residents"),
          contracts: db.getTable("contracts"),
          payments: db.getTable("payments"),
          maintenance: db.getTable("maintenance"),
        },
      };

      const dataStr = JSON.stringify(backupData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });

      const link = document.createElement("a");
      link.href = URL.createObjectURL(dataBlob);
      link.download = `building-management-backup-${new Date().toISOString().split("T")[0]}.json`;
      link.click();

      app.showNotification("تم إنشاء النسخة الاحتياطية بنجاح", "success");
    } catch (error) {
      console.error("Backup creation error:", error);
      app.showNotification("حدث خطأ أثناء إنشاء النسخة الاحتياطية", "error");
    }
  },

  /**
   * Select backup file
   */
  selectBackupFile() {
    document.getElementById("backupFile").click();
  },

  /**
   * Handle backup file selection
   */
  handleBackupFileSelection(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backupData = JSON.parse(e.target.result);
        this.validateBackupData(backupData);
        this.displayBackupFileInfo(backupData);
        document.getElementById("restoreBtn").disabled = false;
      } catch (error) {
        app.showNotification("ملف النسخة الاحتياطية غير صحيح", "error");
        document.getElementById("restoreBtn").disabled = true;
      }
    };
    reader.readAsText(file);
  },

  /**
   * Validate backup data
   */
  validateBackupData(backupData) {
    if (!backupData.version || !backupData.timestamp || !backupData.data) {
      throw new Error("Invalid backup format");
    }

    const requiredTables = [
      "units",
      "residents",
      "contracts",
      "payments",
      "maintenance",
    ];
    for (const table of requiredTables) {
      if (!Array.isArray(backupData.data[table])) {
        throw new Error(`Missing or invalid table: ${table}`);
      }
    }
  },

  /**
   * Display backup file info
   */
  displayBackupFileInfo(backupData) {
    const infoContainer = document.getElementById("backupFileInfo");
    const backupDate = new Date(backupData.timestamp).toLocaleDateString(
      "ar-SA",
    );

    const totalRecords = Object.values(backupData.data).reduce(
      (sum, table) => sum + table.length,
      0,
    );

    infoContainer.innerHTML = `
            <div class="backup-info">
                <h5>معلومات النسخة الاحتياطية</h5>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="label">تاريخ الإنشاء:</span>
                        <span class="value">${backupDate}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">الإصدار:</span>
                        <span class="value">${backupData.version}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">إجمالي السجلات:</span>
                        <span class="value">${totalRecords}</span>
                    </div>
                </div>
                <div class="data-breakdown">
                    <h6>تفصيل البيانات:</h6>
                    <ul>
                        <li>الشقق: ${backupData.data.units.length}</li>
                        <li>المقيمون: ${backupData.data.residents.length}</li>
                        <li>العقود: ${backupData.data.contracts.length}</li>
                        <li>المدفوعات: ${backupData.data.payments.length}</li>
                        <li>طلبات الصيانة: ${backupData.data.maintenance.length}</li>
                    </ul>
                </div>
            </div>
        `;

    infoContainer.style.display = "block";
  },

  /**
   * Restore backup
   */
  restoreBackup() {
    const fileInput = document.getElementById("backupFile");
    if (!fileInput.files[0]) {
      app.showNotification("يرجى اختيار ملف النسخة الاحتياطية أولاً", "error");
      return;
    }

    app.confirm(
      "هل أنت متأكد من استعادة النسخة الاحتياطية؟ سيتم استبدال جميع البيانات الحالية.",
      () => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const backupData = JSON.parse(e.target.result);
            this.performRestore(backupData);
          } catch (error) {
            app.showNotification("حدث خطأ أثناء استعادة البيانات", "error");
          }
        };
        reader.readAsText(fileInput.files[0]);
      },
    );
  },

  /**
   * Perform restore operation
   */
  performRestore(backupData) {
    try {
      // Clear existing data
      db.clearAllData();

      // Restore settings
      if (backupData.settings) {
        db.updateSettings(backupData.settings);
      }

      // Restore data tables
      Object.entries(backupData.data).forEach(([tableName, tableData]) => {
        tableData.forEach((record) => {
          db.addRecord(tableName, record, record.id);
        });
      });

      app.showNotification("تم استعادة البيانات بنجاح", "success");

      // Reload the page to reflect changes
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("Restore error:", error);
      app.showNotification("حدث خطأ أثناء استعادة البيانات", "error");
    }
  },

  /**
   * Schedule backup
   */
  scheduleBackup() {
    app.showNotification(
      "ميزة جدولة النسخ الاحتياطي ستكون متاحة قريباً",
      "info",
    );
  },

  /**
   * Export data
   */
  exportData() {
    const modalContent = `
            <form id="exportDataForm">
                <div class="form-group">
                    <label>اختر البيانات المراد تصديرها:</label>
                    <div class="checkbox-group">
                        <label>
                            <input type="checkbox" id="exportUnits" checked>
                            الشقق والوحدات
                        </label>
                        <label>
                            <input type="checkbox" id="exportResidents" checked>
                            المقيمون
                        </label>
                        <label>
                            <input type="checkbox" id="exportContracts" checked>
                            العقود
                        </label>
                        <label>
                            <input type="checkbox" id="exportPayments" checked>
                            المدفوعات
                        </label>
                        <label>
                            <input type="checkbox" id="exportMaintenance" checked>
                            طلبات الصيانة
                        </label>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="exportFormat">تنسيق التصدير:</label>
                    <select id="exportFormat" class="form-control">
                        <option value="json">JSON</option>
                        <option value="csv">CSV</option>
                    </select>
                </div>
            </form>
        `;

    app.showModal("تصدير البيانات", modalContent, [
      {
        text: "إلغاء",
        class: "btn-secondary",
        onclick: "app.closeModal()",
      },
      {
        text: "تصدير",
        class: "btn-success",
        onclick: "Settings.performExport()",
      },
    ]);
  },

  /**
   * Perform export operation
   */
  performExport() {
    const exportData = {};
    const format = document.getElementById("exportFormat").value;

    if (document.getElementById("exportUnits").checked) {
      exportData.units = db.getTable("units");
    }
    if (document.getElementById("exportResidents").checked) {
      exportData.residents = db.getTable("residents");
    }
    if (document.getElementById("exportContracts").checked) {
      exportData.contracts = db.getTable("contracts");
    }
    if (document.getElementById("exportPayments").checked) {
      exportData.payments = db.getTable("payments");
    }
    if (document.getElementById("exportMaintenance").checked) {
      exportData.maintenance = db.getTable("maintenance");
    }

    if (Object.keys(exportData).length === 0) {
      app.showNotification("يرجى اختيار البيانات المراد تصديرها", "error");
      return;
    }

    app.closeModal();

    if (format === "json") {
      this.exportAsJSON(exportData);
    } else {
      this.exportAsCSV(exportData);
    }
  },

  /**
   * Export as JSON
   */
  exportAsJSON(data) {
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(dataBlob);
    link.download = `building-management-export-${new Date().toISOString().split("T")[0]}.json`;
    link.click();

    app.showNotification("تم تصدير البيانات بنجاح", "success");
  },

  /**
   * Export as CSV
   */
  exportAsCSV(data) {
    Object.entries(data).forEach(([tableName, tableData]) => {
      if (tableData.length > 0) {
        AppUtils.exportToCSV(
          tableData,
          `${tableName}-${new Date().toISOString().split("T")[0]}`,
        );
      }
    });

    app.showNotification("تم تصدير البيانات بنجاح", "success");
  },

  /**
   * Import data
   */
  importData() {
    app.showNotification("ميزة استيراد البيانات ستكون متاحة قريباً", "info");
  },

  /**
   * Reset all data
   */
  resetData() {
    app.confirm(
      "هل أنت متأكد من إعادة تعيين جميع البيانات؟ سيتم حذف جميع الشقق والمقيمين والعقود والمدفوعات وطلبات الصيانة. هذا الإجراء لا يمكن التراجع عنه.",
      () => {
        db.clearAllData();
        app.showNotification("تم إعادة تعيين جميع البيانات", "success");

        // Reload the page
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      },
    );
  },

  /**
   * Load system information
   */
  loadSystemInfo() {
    // Browser info
    const browserInfo = navigator.userAgent.split(" ").pop();
    document.getElementById("browserInfo").textContent = browserInfo;

    // OS info
    const osInfo = navigator.platform;
    document.getElementById("osInfo").textContent = osInfo;

    // Screen info
    const screenInfo = `${screen.width}x${screen.height}`;
    document.getElementById("screenInfo").textContent = screenInfo;

    // Data size
    const dataSize = this.calculateDataSize();
    document.getElementById("dataSize").textContent = dataSize;
  },

  /**
   * Calculate data size
   */
  calculateDataSize() {
    try {
      const allData = {
        settings: db.getSettings(),
        units: db.getTable("units"),
        residents: db.getTable("residents"),
        contracts: db.getTable("contracts"),
        payments: db.getTable("payments"),
        maintenance: db.getTable("maintenance"),
      };

      const dataStr = JSON.stringify(allData);
      const sizeInBytes = new Blob([dataStr]).size;

      if (sizeInBytes < 1024) {
        return `${sizeInBytes} بايت`;
      } else if (sizeInBytes < 1024 * 1024) {
        return `${(sizeInBytes / 1024).toFixed(1)} كيلوبايت`;
      } else {
        return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} ميجابايت`;
      }
    } catch (error) {
      return "غير محدد";
    }
  },

  /**
   * Show help
   */
  showHelp() {
    const helpContent = `
            <div class="help-content">
                <h4>دليل المستخدم</h4>
                <div class="help-sections">
                    <div class="help-section">
                        <h5>إدارة الشقق</h5>
                        <p>يمكنك إضافة وتعديل وحذف الشقق من قسم "الشقق". كل شقة لها رقم فريد وحالة (متاحة، مشغولة، صيانة).</p>
                    </div>
                    
                    <div class="help-section">
                        <h5>إدارة المقيمين</h5>
                        <p>أضف معلومات المقيمين من قسم "المقيمون". يمكنك تتبع معلومات الاتصال وحالة الإقامة.</p>
                    </div>
                    
                    <div class="help-section">
                        <h5>إدارة العقود</h5>
                        <p>أنشئ عقود إيجار جديدة وتتبع تواريخ البداية والانتهاء من قسم "العقود".</p>
                    </div>
                    
                    <div class="help-section">
                        <h5>إدارة المدفوعات</h5>
                        <p>سجل جميع المدفوعات والمصروفات من قسم "المدفوعات". يمكنك تصنيف المدفوعات حسب النوع.</p>
                    </div>
                    
                    <div class="help-section">
                        <h5>إدارة الصيانة</h5>
                        <p>تتبع طلبات الصيانة وحالتها من قسم "الصيانة". يمكنك تعيين فنيين وتحديد الأولوية.</p>
                    </div>
                    
                    <div class="help-section">
                        <h5>التقارير</h5>
                        <p>أنشئ تقارير مالية وإحصائيات من قسم "التقارير". يمكنك تصدير التقارير للطباعة.</p>
                    </div>
                </div>
            </div>
        `;

    app.showModal("دليل المستخدم", helpContent, [
      {
        text: "إغلاق",
        class: "btn-secondary",
        onclick: "app.closeModal()",
      },
    ]);
  },

  /**
   * Show keyboard shortcuts
   */
  showShortcuts() {
    const shortcutsContent = `
            <div class="shortcuts-content">
                <h4>اختصارات لوحة المفاتيح</h4>
                <div class="shortcuts-list">
                    <div class="shortcut-item">
                        <span class="shortcut-key">Ctrl + S</span>
                        <span class="shortcut-desc">حفظ البيانات</span>
                    </div>
                    <div class="shortcut-item">
                        <span class="shortcut-key">Ctrl + N</span>
                        <span class="shortcut-desc">إضافة جديد</span>
                    </div>
                    <div class="shortcut-item">
                        <span class="shortcut-key">Ctrl + F</span>
                        <span class="shortcut-desc">البحث</span>
                    </div>
                    <div class="shortcut-item">
                        <span class="shortcut-key">Ctrl + P</span>
                        <span class="shortcut-desc">طباعة</span>
                    </div>
                    <div class="shortcut-item">
                        <span class="shortcut-key">Escape</span>
                        <span class="shortcut-desc">إغلاق النافذة المنبثقة</span>
                    </div>
                    <div class="shortcut-item">
                        <span class="shortcut-key">F5</span>
                        <span class="shortcut-desc">تحديث الصفحة</span>
                    </div>
                </div>
            </div>
        `;

    app.showModal("اختصارات لوحة المفاتيح", shortcutsContent, [
      {
        text: "إغلاق",
        class: "btn-secondary",
        onclick: "app.closeModal()",
      },
    ]);
  },
};

// Add settings-specific styles
const settingsStyles = document.createElement("style");
settingsStyles.textContent = `
    .settings-container {
        max-width: 1200px;
        margin: 0 auto;
    }

    .settings-tabs {
        background: var(--bg-secondary);
        border-radius: 16px;
        padding: 20px;
        border: 1px solid var(--border-color);
    }

    .tab-buttons {
        display: flex;
        gap: 8px;
        margin-bottom: 30px;
        border-bottom: 2px solid var(--border-color);
        padding-bottom: 16px;
        flex-wrap: wrap;
    }

    .tab-button {
        background: var(--bg-primary);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 12px 16px;
        color: var(--text-secondary);
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.9rem;
    }

    .tab-button:hover {
        background: var(--primary-color);
        color: white;
        transform: translateY(-2px);
    }

    .tab-button.active {
        background: var(--gradient-primary);
        color: white;
        box-shadow: 
            6px 6px 12px var(--shadow-dark),
            -6px -6px 12px var(--shadow-light);
    }

    .tab-content {
        display: none;
    }

    .tab-content.active {
        display: block;
    }

    .settings-section {
        background: var(--bg-primary);
        border-radius: 12px;
        padding: 24px;
        border: 1px solid var(--border-color);
    }

    .settings-section h3 {
        margin: 0 0 20px 0;
        color: var(--text-primary);
        font-size: 1.3rem;
        border-bottom: 2px solid var(--primary-color);
        padding-bottom: 8px;
    }

    .color-picker-group {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .color-picker {
        width: 50px;
        height: 40px;
        border: 2px solid var(--border-color);
        border-radius: 8px;
        cursor: pointer;
    }

    .color-presets {
        display: flex;
        gap: 8px;
    }

    .color-preset {
        width: 30px;
        height: 30px;
        border: 2px solid var(--border-color);
        border-radius: 50%;
        cursor: pointer;
        transition: transform 0.2s ease;
    }

    .color-preset:hover {
        transform: scale(1.1);
    }

    .backup-section {
        margin-bottom: 30px;
        padding: 20px;
        background: var(--bg-secondary);
        border-radius: 8px;
        border-right: 4px solid var(--info-color);
    }

    .backup-section h4 {
        margin: 0 0 8px 0;
        color: var(--text-primary);
        font-size: 1.1rem;
    }

    .backup-section p {
        margin: 0 0 16px 0;
        color: var(--text-secondary);
        font-size: 0.9rem;
    }

    .backup-actions {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
    }

    .backup-file-info {
        margin-top: 16px;
        padding: 16px;
        background: var(--bg-primary);
        border-radius: 8px;
        border: 1px solid var(--border-color);
    }

    .backup-info h5 {
        margin: 0 0 12px 0;
        color: var(--text-primary);
    }

    .backup-info h6 {
        margin: 16px 0 8px 0;
        color: var(--text-primary);
        font-size: 0.9rem;
    }

    .backup-info ul {
        margin: 0;
        padding-right: 20px;
        color: var(--text-secondary);
        font-size: 0.9rem;
    }

    .data-breakdown ul li {
        margin-bottom: 4px;
    }

    .about-content {
        max-width: 800px;
    }

    .app-info {
        display: flex;
        align-items: center;
        gap: 20px;
        margin-bottom: 30px;
        padding: 20px;
        background: var(--bg-secondary);
        border-radius: 12px;
        border: 1px solid var(--border-color);
    }

    .app-logo {
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

    .app-details h2 {
        margin: 0 0 8px 0;
        color: var(--text-primary);
        font-size: 1.5rem;
    }

    .app-details .version {
        margin: 0 0 12px 0;
        color: var(--text-muted);
        font-size: 0.9rem;
    }

    .app-details .description {
        margin: 0;
        color: var(--text-secondary);
        line-height: 1.5;
    }

    .features-list {
        margin-bottom: 30px;
        padding: 20px;
        background: var(--bg-secondary);
        border-radius: 12px;
        border: 1px solid var(--border-color);
    }

    .features-list h4 {
        margin: 0 0 16px 0;
        color: var(--text-primary);
    }

    .features-list ul {
        margin: 0;
        padding: 0;
        list-style: none;
    }

    .features-list li {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 8px;
        color: var(--text-secondary);
    }

    .features-list li i {
        color: var(--success-color);
        font-size: 0.9rem;
    }

    .system-info {
        margin-bottom: 30px;
        padding: 20px;
        background: var(--bg-secondary);
        border-radius: 12px;
        border: 1px solid var(--border-color);
    }

    .system-info h4 {
        margin: 0 0 16px 0;
        color: var(--text-primary);
    }

    .support-info {
        padding: 20px;
        background: var(--bg-secondary);
        border-radius: 12px;
        border: 1px solid var(--border-color);
    }

    .support-info h4 {
        margin: 0 0 12px 0;
        color: var(--text-primary);
    }

    .support-info p {
        margin: 0 0 16px 0;
        color: var(--text-secondary);
        line-height: 1.5;
    }

    .support-actions {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
    }

    .help-content, .shortcuts-content {
        max-width: 600px;
    }

    .help-sections {
        display: flex;
        flex-direction: column;
        gap: 20px;
    }

    .help-section {
        padding: 16px;
        background: var(--bg-secondary);
        border-radius: 8px;
        border-right: 4px solid var(--primary-color);
    }

    .help-section h5 {
        margin: 0 0 8px 0;
        color: var(--text-primary);
        font-size: 1rem;
    }

    .help-section p {
        margin: 0;
        color: var(--text-secondary);
        font-size: 0.9rem;
        line-height: 1.4;
    }

    .shortcuts-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .shortcut-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        background: var(--bg-secondary);
        border-radius: 8px;
        border: 1px solid var(--border-color);
    }

    .shortcut-key {
        background: var(--bg-primary);
        padding: 4px 8px;
        border-radius: 4px;
        font-family: monospace;
        font-size: 0.85rem;
        color: var(--text-primary);
        border: 1px solid var(--border-color);
    }

    .shortcut-desc {
        color: var(--text-secondary);
        font-size: 0.9rem;
    }

    @media (max-width: 768px) {
        .tab-buttons {
            flex-direction: column;
        }

        .tab-button {
            justify-content: center;
        }

        .app-info {
            flex-direction: column;
            text-align: center;
        }

        .backup-actions {
            flex-direction: column;
        }

        .support-actions {
            flex-direction: column;
        }

        .shortcut-item {
            flex-direction: column;
            gap: 8px;
            text-align: center;
        }
    }

    @media (max-width: 480px) {
        .settings-section {
            padding: 16px;
        }

        .backup-section {
            padding: 16px;
        }

        .form-grid {
            grid-template-columns: 1fr;
        }
    }
`;
document.head.appendChild(settingsStyles);
