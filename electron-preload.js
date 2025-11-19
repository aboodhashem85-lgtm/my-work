const { contextBridge, ipcRenderer } = require("electron");

// تعريض APIs آمنة للواجهة الأمامية
contextBridge.exposeInMainWorld("electronAPI", {
  // Database API
  db: {
    getTable: (tableName) => ipcRenderer.invoke("db:get-table", tableName),
    addRecord: (tableName, record) =>
      ipcRenderer.invoke("db:add-record", tableName, record),
    updateRecord: (tableName, id, updates) =>
      ipcRenderer.invoke("db:update-record", tableName, id, updates),
    deleteRecord: (tableName, id) =>
      ipcRenderer.invoke("db:delete-record", tableName, id),
    getRecord: (tableName, id) =>
      ipcRenderer.invoke("db:get-record", tableName, id),
    runQuery: (sql, params) => ipcRenderer.invoke("db:run-query", sql, params),
    saveSetting: (key, value) =>
      ipcRenderer.invoke("db:save-setting", key, value),
    getSettings: () => ipcRenderer.invoke("db:get-settings"),
    // For complex queries (use with caution)
    run: (sql, params) => ipcRenderer.invoke("db:run", sql, params),
    all: (sql, params) => ipcRenderer.invoke("db:all", sql, params),
    get: (sql, params) => ipcRenderer.invoke("db:get", sql, params),
  },
  // معلومات التطبيق
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
  getAppPath: () => ipcRenderer.invoke("get-app-path"),

  // نوافذ الحوار
  showMessageBox: (options) => ipcRenderer.invoke("show-message-box", options),
  showSaveDialog: (options) => ipcRenderer.invoke("show-save-dialog", options),
  showOpenDialog: (options) => ipcRenderer.invoke("show-open-dialog", options),

  // إدارة الملفات
  saveLogoFile: (tempPath) => ipcRenderer.invoke("save-logo-file", tempPath),

  // الطباعة والتصدير
  printToPDF: (htmlContent, defaultFilename) =>
    ipcRenderer.invoke("print-to-pdf", htmlContent, defaultFilename),

  // النسخ الاحتياطي والاستعادة
  onCreateBackup: (callback) => ipcRenderer.on("create-backup", callback),
  onRestoreBackup: (callback) => ipcRenderer.on("restore-backup", callback),
  onExportData: (callback) => ipcRenderer.on("export-data", callback),

  // إزالة المستمعين
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),

  // فحص البيئة
  isElectron: true,
  platform: process.platform,
});

// إضافة مستمعين للأحداث
window.addEventListener("DOMContentLoaded", () => {
  // إضافة فئة CSS للإشارة إلى أن التطبيق يعمل في Electron
  document.body.classList.add("electron-app");

  // إضافة فئة CSS للمنصة
  document.body.classList.add(`platform-${process.platform}`);

  // تحديث عنوان النافذة
  document.title = "نظام إدارة المباني السكنية";

  // إضافة أنماط خاصة بـ Electron
  const electronStyles = document.createElement("style");
  electronStyles.textContent = `
        /* أنماط خاصة بتطبيق Electron */
        .electron-app {
            user-select: none;
            -webkit-user-select: none;
        }
        
        .electron-app input,
        .electron-app textarea,
        .electron-app [contenteditable] {
            user-select: text;
            -webkit-user-select: text;
        }
        
        /* إخفاء شريط التمرير في macOS */
        .platform-darwin::-webkit-scrollbar {
            width: 8px;
        }
        
        .platform-darwin::-webkit-scrollbar-track {
            background: transparent;
        }
        
        .platform-darwin::-webkit-scrollbar-thumb {
            background: rgba(0, 0, 0, 0.2);
            border-radius: 4px;
        }
        
        .platform-darwin::-webkit-scrollbar-thumb:hover {
            background: rgba(0, 0, 0, 0.3);
        }
        
        /* تحسينات للنوافذ */
        .platform-win32 .window-controls {
            display: none;
        }
        
        /* تحسينات للينكس */
        .platform-linux .app-header {
            padding-top: 0;
        }
        
        /* منع السحب والإفلات للملفات */
        .electron-app {
            -webkit-app-region: no-drag;
        }
        
        /* السماح بالسحب لشريط العنوان */
        .app-header {
            -webkit-app-region: drag;
        }
        
        .app-header button,
        .app-header input,
        .app-header select {
            -webkit-app-region: no-drag;
        }
    `;
  document.head.appendChild(electronStyles);
});

// منع السحب والإفلات للملفات
document.addEventListener("dragover", (e) => {
  e.preventDefault();
  e.stopPropagation();
});

document.addEventListener("drop", (e) => {
  e.preventDefault();
  e.stopPropagation();
});

// منع القائمة السياقية الافتراضية
document.addEventListener("contextmenu", (e) => {
  e.preventDefault();
});

// منع اختصارات لوحة المفاتيح غير المرغوب فيها
document.addEventListener("keydown", (e) => {
  // منع F5 (إعادة تحميل)
  if (e.key === "F5") {
    e.preventDefault();
  }

  // منع Ctrl+Shift+I (أدوات المطور)
  if (e.ctrlKey && e.shiftKey && e.key === "I") {
    e.preventDefault();
  }

  // منع Ctrl+Shift+J (وحدة التحكم)
  if (e.ctrlKey && e.shiftKey && e.key === "J") {
    e.preventDefault();
  }

  // منع Ctrl+U (عرض المصدر)
  if (e.ctrlKey && e.key === "u") {
    e.preventDefault();
  }
});

// إضافة وظائف مساعدة للتطبيق
window.electronUtils = {
  // فحص ما إذا كان التطبيق يعمل في Electron
  isElectron: () => {
    return window.electronAPI && window.electronAPI.isElectron;
  },

  // الحصول على معلومات المنصة
  getPlatform: () => {
    return window.electronAPI ? window.electronAPI.platform : "web";
  },

  // إظهار رسالة تأكيد
  showConfirm: async (message, title = "تأكيد") => {
    if (window.electronAPI) {
      const result = await window.electronAPI.showMessageBox({
        type: "question",
        buttons: ["نعم", "لا"],
        defaultId: 0,
        title: title,
        message: message,
      });
      return result.response === 0;
    } else {
      return confirm(message);
    }
  },

  // إظهار رسالة معلومات
  showInfo: async (message, title = "معلومات") => {
    if (window.electronAPI) {
      await window.electronAPI.showMessageBox({
        type: "info",
        buttons: ["موافق"],
        title: title,
        message: message,
      });
    } else {
      alert(message);
    }
  },

  // إظهار رسالة خطأ
  showError: async (message, title = "خطأ") => {
    if (window.electronAPI) {
      await window.electronAPI.showMessageBox({
        type: "error",
        buttons: ["موافق"],
        title: title,
        message: message,
      });
    } else {
      alert(message);
    }
  },

  // حفظ ملف
  saveFile: async (defaultPath, filters) => {
    if (window.electronAPI) {
      return await window.electronAPI.showSaveDialog({
        defaultPath: defaultPath,
        filters: filters,
      });
    } else {
      // في المتصفح، استخدم تحميل الملف
      return null;
    }
  },

  // فتح ملف
  openFile: async (filters) => {
    if (window.electronAPI) {
      return await window.electronAPI.showOpenDialog({
        filters: filters,
        properties: ["openFile"],
      });
    } else {
      // في المتصفح، استخدم input file
      return null;
    }
  },
};

console.log("Electron preload script loaded successfully");
