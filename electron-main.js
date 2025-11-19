const { app, BrowserWindow, Menu, dialog, shell, ipcMain } = require('electron');
const sqliteService = require('./sqliteService');
const dataMigration = require('./dataMigration');
const smsServer = require('./sms-server');
const path = require('path');
const fs = require('fs');

// تمكين إعادة التحميل التلقائي في وضع التطوير
const isDev = process.argv.includes('--dev');

// متغيرات عامة
let mainWindow;
let splashWindow;

// إعداد التطبيق
app.setName('نظام إدارة المباني السكنية');

// منع تشغيل عدة نسخ من التطبيق
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        // إذا حاول المستخدم تشغيل نسخة ثانية، ركز على النافذة الموجودة
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    });
}

// إنشاء نافذة البداية
function createSplashWindow() {
    splashWindow = new BrowserWindow({
        width: 400,
        height: 300,
        frame: false,
        alwaysOnTop: true,
        transparent: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    // إنشاء صفحة البداية
    const splashHTML = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>تحميل التطبيق</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                color: white;
                overflow: hidden;
            }
            
            .splash-container {
                text-align: center;
                animation: fadeIn 1s ease-in;
            }
            
            .logo {
                width: 80px;
                height: 80px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 50%;
                margin: 0 auto 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 40px;
                animation: pulse 2s infinite;
            }
            
            .title {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 10px;
            }
            
            .subtitle {
                font-size: 14px;
                opacity: 0.8;
                margin-bottom: 30px;
            }
            
            .loading {
                width: 200px;
                height: 4px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 2px;
                margin: 0 auto;
                overflow: hidden;
            }
            
            .loading-bar {
                width: 0%;
                height: 100%;
                background: white;
                border-radius: 2px;
                animation: loading 3s ease-in-out forwards;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }
            
            @keyframes loading {
                0% { width: 0%; }
                100% { width: 100%; }
            }
        </style>
    </head>
    <body>
        <div class="splash-container">
            <div class="logo">🏢</div>
            <div class="title">نظام إدارة المباني السكنية</div>
            <div class="subtitle">جاري تحميل التطبيق...</div>
            <div class="loading">
                <div class="loading-bar"></div>
            </div>
        </div>
    </body>
    </html>
    `;

    splashWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(splashHTML));

// إخفاء نافذة البداية بعد 3 ثوان
	setTimeout(() => {
	    if (splashWindow) {
	        splashWindow.close();
	        splashWindow = null;
	    }
	    createMainWindow();
	}, 3000);
}

// إنشاء النافذة الرئيسية
function createMainWindow() {
    
    // Set up IPC handlers for SQLite
    ipcMain.handle('db:get-table', async (event, tableName) => {
        return sqliteService.getTable(tableName);
    });
    ipcMain.handle('db:add-record', async (event, tableName, record) => {
        return sqliteService.addRecord(tableName, record);
    });
    ipcMain.handle('db:update-record', async (event, tableName, id, updates) => {
        return sqliteService.updateRecord(tableName, id, updates);
    });
    ipcMain.handle('db:delete-record', async (event, tableName, id) => {
        return sqliteService.deleteRecord(tableName, id);
    });
    ipcMain.handle('db:get-record', async (event, tableName, id) => {
        return sqliteService.getRecord(tableName, id);
    });
    ipcMain.handle('db:save-setting', async (event, key, value) => {
        return sqliteService.saveSetting(key, value);
    });
    ipcMain.handle('db:get-settings', async (event) => {
        return sqliteService.getSettings();
    });
    ipcMain.handle('db:run', async (event, sql, params) => {
        return sqliteService.run(sql, params);
    });
    ipcMain.handle('db:all', async (event, sql, params) => {
        return sqliteService.all(sql, params);
    });
    ipcMain.handle('db:get', async (event, sql, params) => {
        return sqliteService.get(sql, params);
    });
    ipcMain.handle('db:run-query', async (event, sql, params) => {
        return sqliteService.runQuery(sql, params);
    });
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1200,
        minHeight: 800,
        show: false,
        icon: path.join(__dirname, 'assets', 'icon.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'electron-preload.js')
        },
        titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default'
    });

    // تحميل التطبيق
    if (isDev) {
        mainWindow.loadURL('http://localhost:8080');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile('index.html');
    }

    // إظهار النافذة عند اكتمال التحميل
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        
        if (isDev) {
            mainWindow.webContents.openDevTools();
        }
    });

// التعامل مع إغلاق النافذة
	mainWindow.on('closed', () => {
	    // إغلاق قاعدة البيانات عند إغلاق النافذة الرئيسية
	    if (sqliteService.db) {
	        sqliteService.db.close((err) => {
	            if (err) {
	                console.error('Error closing the database:', err.message);
	            } else {
	                console.log('Database connection closed.');
	            }
	        });
	    }
	    mainWindow = null;
	});

    // منع التنقل إلى مواقع خارجية
    mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
        const parsedUrl = new URL(navigationUrl);
        
        if (parsedUrl.origin !== 'http://localhost:8080' && parsedUrl.protocol !== 'file:') {
            event.preventDefault();
        }
    });

    // فتح الروابط الخارجية في المتصفح الافتراضي
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });
}

// إنشاء قائمة التطبيق
function createMenu() {
    const template = [
        {
            label: 'ملف',
            submenu: [
                {
                    label: 'نسخة احتياطية',
                    accelerator: 'CmdOrCtrl+B',
                    click: () => {
                        createBackup();
                    }
                },
                {
                    label: 'استعادة نسخة احتياطية',
                    accelerator: 'CmdOrCtrl+R',
                    click: () => {
                        restoreBackup();
                    }
                },
                { type: 'separator' },
                {
                    label: 'تصدير البيانات',
                    accelerator: 'CmdOrCtrl+E',
                    click: () => {
                        exportData();
                    }
                },
                { type: 'separator' },
                {
                    label: 'خروج',
                    accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                    click: () => {
                        app.quit();
                    }
                }
            ]
        },
        {
            label: 'تحرير',
            submenu: [
                { label: 'تراجع', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
                { label: 'إعادة', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
                { type: 'separator' },
                { label: 'قص', accelerator: 'CmdOrCtrl+X', role: 'cut' },
                { label: 'نسخ', accelerator: 'CmdOrCtrl+C', role: 'copy' },
                { label: 'لصق', accelerator: 'CmdOrCtrl+V', role: 'paste' },
                { label: 'تحديد الكل', accelerator: 'CmdOrCtrl+A', role: 'selectall' }
            ]
        },
        {
            label: 'عرض',
            submenu: [
                { label: 'إعادة تحميل', accelerator: 'CmdOrCtrl+R', role: 'reload' },
                { label: 'إعادة تحميل قسري', accelerator: 'CmdOrCtrl+Shift+R', role: 'forceReload' },
                { label: 'أدوات المطور', accelerator: 'F12', role: 'toggleDevTools' },
                { type: 'separator' },
                { label: 'تكبير', accelerator: 'CmdOrCtrl+Plus', role: 'zoomin' },
                { label: 'تصغير', accelerator: 'CmdOrCtrl+-', role: 'zoomout' },
                { label: 'حجم طبيعي', accelerator: 'CmdOrCtrl+0', role: 'resetzoom' },
                { type: 'separator' },
                { label: 'ملء الشاشة', accelerator: 'F11', role: 'togglefullscreen' }
            ]
        },
        {
            label: 'نافذة',
            submenu: [
                { label: 'تصغير', accelerator: 'CmdOrCtrl+M', role: 'minimize' },
                { label: 'إغلاق', accelerator: 'CmdOrCtrl+W', role: 'close' }
            ]
        },
        {
            label: 'مساعدة',
            submenu: [
                {
                    label: 'حول التطبيق',
                    click: () => {
                        showAboutDialog();
                    }
                },
                {
                    label: 'دليل المستخدم',
                    click: () => {
                        shell.openExternal('https://github.com/building-management/building-management-system/wiki');
                    }
                },
                {
                    label: 'الإبلاغ عن مشكلة',
                    click: () => {
                        shell.openExternal('https://github.com/building-management/building-management-system/issues');
                    }
                }
            ]
        }
    ];

    // تخصيص القائمة لنظام macOS
    if (process.platform === 'darwin') {
        template.unshift({
            label: app.getName(),
            submenu: [
                { label: 'حول ' + app.getName(), role: 'about' },
                { type: 'separator' },
                { label: 'الخدمات', role: 'services', submenu: [] },
                { type: 'separator' },
                { label: 'إخفاء ' + app.getName(), accelerator: 'Command+H', role: 'hide' },
                { label: 'إخفاء الآخرين', accelerator: 'Command+Shift+H', role: 'hideothers' },
                { label: 'إظهار الكل', role: 'unhide' },
                { type: 'separator' },
                { label: 'خروج', accelerator: 'Command+Q', click: () => app.quit() }
            ]
        });
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// إنشاء نسخة احتياطية
async function createBackup() {
    try {
        const settings = await sqliteService.getSettings();
        const defaultPath = path.join(app.getPath('documents'), `BMS_Backup_${new Date().toISOString().replace(/:/g, '-')}.json`);
        
        const { filePath } = await dialog.showSaveDialog(mainWindow, {
            title: 'إنشاء نسخة احتياطية',
            defaultPath: defaultPath,
            filters: [{ name: 'JSON Files', extensions: ['json'] }]
        });

        if (filePath) {
            // استخدام sqliteService.all للحصول على جميع البيانات
            const data = {
                settings: settings,
                units: await sqliteService.getTable('units'),
                residents: await sqliteService.getTable('residents'),
                contracts: await sqliteService.getTable('contracts'),
                payments: await sqliteService.getTable('payments'),
                maintenance: await sqliteService.getTable('maintenance'),
                messages: await sqliteService.getTable('messages')
            };
            
            const json = JSON.stringify(data, null, 2);
            fs.writeFileSync(filePath, json);
            
            dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: 'نجاح',
                message: `تم إنشاء النسخة الاحتياطية بنجاح في: ${filePath}`
            });
            
            await sqliteService.saveSetting('lastBackup', new Date().toISOString());
        }
    } catch (error) {
        console.error('Backup failed:', error);
        dialog.showErrorBox('خطأ في النسخ الاحتياطي', 'فشل إنشاء النسخة الاحتياطية. يرجى مراجعة سجل الأخطاء.');
    }
}

// استعادة نسخة احتياطية
async function restoreBackup() {
    try {
        const { filePaths } = await dialog.showOpenDialog(mainWindow, {
            title: 'استعادة نسخة احتياطية',
            filters: [{ name: 'JSON Files', extensions: ['json'] }],
            properties: ['openFile']
        });

        if (filePaths && filePaths.length > 0) {
            const filePath = filePaths[0];
            const json = fs.readFileSync(filePath, 'utf8');
            const data = JSON.parse(json);
            
            // تحقق بسيط من هيكل البيانات
            if (!data.settings || !data.units) {
                dialog.showErrorBox('خطأ في الاستعادة', 'ملف النسخة الاحتياطية غير صالح.');
                return;
            }
            
            // تنفيذ الاستعادة (حذف البيانات القديمة وإضافة الجديدة)
            await sqliteService.run('BEGIN TRANSACTION');
            try {
                // حذف البيانات القديمة
                await sqliteService.run('DELETE FROM units');
                await sqliteService.run('DELETE FROM residents');
                await sqliteService.run('DELETE FROM contracts');
                await sqliteService.run('DELETE FROM payments');
                await sqliteService.run('DELETE FROM maintenance');
                await sqliteService.run('DELETE FROM messages');
                await sqliteService.run('DELETE FROM settings');

                // إضافة البيانات الجديدة
                for (const key in data.settings) {
                    await sqliteService.saveSetting(key, data.settings[key]);
                }
                
                const tables = ['units', 'residents', 'contracts', 'payments', 'maintenance', 'messages'];
                for (const tableName of tables) {
                    for (const record of data[tableName] || []) {
                        const keys = Object.keys(record);
                        const values = Object.values(record);
                        const placeholders = keys.map(() => '?').join(', ');
                        const sql = `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders})`;
                        await sqliteService.run(sql, values);
                    }
                }
                
                await sqliteService.run('COMMIT');
                
                dialog.showMessageBox(mainWindow, {
                    type: 'info',
                    title: 'نجاح',
                    message: 'تمت استعادة النسخة الاحتياطية بنجاح. سيتم إعادة تحميل التطبيق.'
                });
                
                mainWindow.reload();
            } catch (e) {
                await sqliteService.run('ROLLBACK');
                throw e;
            }
        }
    } catch (error) {
        console.error('Restore failed:', error);
        dialog.showErrorBox('خطأ في الاستعادة', 'فشل استعادة النسخة الاحتياطية. يرجى مراجعة سجل الأخطاء.');
    }
}

// تصدير البيانات
async function exportData() {
    try {
        await createBackup(); // تصدير البيانات هو نفسه إنشاء نسخة احتياطية
    } catch (error) {
        console.error('Export failed:', error);
        dialog.showErrorBox('خطأ في التصدير', 'فشل تصدير البيانات. يرجى مراجعة سجل الأخطاء.');
    }
}

// إظهار نافذة حول التطبيق
function showAboutDialog() {
    dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'حول التطبيق',
        message: 'نظام إدارة المباني السكنية',
        detail: `الإصدار: 1.0.0
تطبيق مكتبي احترافي لإدارة العقارات والمباني السكنية

المطور: فريق إدارة المباني
الترخيص: MIT
تاريخ الإصدار: ${new Date().getFullYear()}

جميع الحقوق محفوظة`,
        buttons: ['موافق']
    });
}

// أحداث التطبيق
app.whenReady().then(async () => {
    // تهيئة قاعدة البيانات والترحيل قبل إنشاء النافذة الرئيسية
    await sqliteService.initializeDatabase();
    await dataMigration.migrateData();
    
    // بدء تشغيل خادم SMS
    try {
        await smsServer.startServer();
        // حفظ إعدادات خادم SMS في قاعدة البيانات
        await sqliteService.saveSetting('smsProxyEndpoint', `http://127.0.0.1:${smsServer.PORT}/api/sms`);
        await sqliteService.saveSetting('smsApiKey', smsServer.API_KEY);
        console.log('SMS server started and settings saved.');
    } catch (e) {
        console.error('Failed to start SMS server. SMS functionality will be disabled.', e);
    }
    
    // إنشاء مجلدات البيانات
    const userDataPath = app.getPath('userData');
    const backupsPath = path.join(userDataPath, 'backups');
    const imagesPath = path.join(userDataPath, 'images');

    if (!fs.existsSync(backupsPath)) {
        fs.mkdirSync(backupsPath, { recursive: true });
        console.log(`Created backups directory: ${backupsPath}`);
    }
    if (!fs.existsSync(imagesPath)) {
        fs.mkdirSync(imagesPath, { recursive: true });
        console.log(`Created images directory: ${imagesPath}`);
    }
    
    createSplashWindow();
    createMenu();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', (event) => {
    // يمكن إضافة منطق حفظ البيانات هنا
});

// معالجة الأخطاء
process.on('uncaughtException', (error) => {
    console.error('خطأ غير متوقع:', error);
    dialog.showErrorBox('خطأ غير متوقع', error.message);
});

// IPC handlers
ipcMain.handle('get-app-version', () => {
    return app.getVersion();
});

ipcMain.handle('get-app-path', () => {
    return app.getAppPath();
});

ipcMain.handle('show-message-box', async (event, options) => {
    const result = await dialog.showMessageBox(mainWindow, options);
    return result;
});

ipcMain.handle('show-save-dialog', async (event, options) => {
    const result = await dialog.showSaveDialog(mainWindow, options);
    return result;
});

ipcMain.handle('show-open-dialog', async (event, options) => {
    const result = await dialog.showOpenDialog(mainWindow, options);
    return result;
});

/**
 * IPC handler to save a logo file to the application's images directory
 * @param {string} tempPath - The temporary path of the file to save (from the file input)
 * @returns {object} - { success: boolean, filePath: string, error: string }
 */
ipcMain.handle('print-to-pdf', async (event, htmlContent, defaultFilename) => {
    let printWindow;
    try {
        // 1. Open a hidden window to load the HTML content
        printWindow = new BrowserWindow({
            show: false,
            webPreferences: {
                // Important: Disable web security to allow loading local files (like fonts)
                webSecurity: false, 
                nodeIntegration: false,
                contextIsolation: true
            }
        });

        // 2. Load the HTML content
        const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent);
        await printWindow.loadURL(dataUrl);

        // 3. Get the save path from the user
        const saveResult = await dialog.showSaveDialog(mainWindow, {
            title: 'حفظ الفاتورة كملف PDF',
            defaultPath: defaultFilename,
            filters: [
                { name: 'ملفات PDF', extensions: ['pdf'] }
            ]
        });

        if (saveResult.canceled || !saveResult.filePath) {
            printWindow.close();
            return { success: false, filePath: '', error: 'تم إلغاء عملية الحفظ' };
        }

        // 4. Print to PDF
        const pdfBuffer = await printWindow.webContents.printToPDF({
            pageSize: 'A4',
            printBackground: true,
            scale: 100,
            margins: {
                top: 10,
                bottom: 10,
                left: 10,
                right: 10
            }
        });

        // 5. Save the PDF file
        fs.writeFileSync(saveResult.filePath, pdfBuffer);

        printWindow.close();
        return { success: true, filePath: saveResult.filePath };

    } catch (error) {
        console.error('Failed to print to PDF:', error);
        if (printWindow) printWindow.close();
        return { success: false, filePath: '', error: error.message };
    }
});

/**
 * IPC handler to save a logo file to the application's images directory
 * @param {string} tempPath - The temporary path of the file to save (from the file input)
 * @returns {object} - { success: boolean, filePath: string, error: string }
 */
ipcMain.handle('save-logo-file', async (event, tempPath) => {
    try {
        const userDataPath = app.getPath('userData');
        const imagesPath = path.join(userDataPath, 'images');
        
        // Ensure the images directory exists
        if (!fs.existsSync(imagesPath)) {
            fs.mkdirSync(imagesPath, { recursive: true });
        }
        
        // Use a fixed name for the logo to ensure only one logo is stored
        const logoFileName = 'building_logo' + path.extname(tempPath);
        const finalPath = path.join(imagesPath, logoFileName);
        
        // Copy the file from the temporary location to the final location
        fs.copyFileSync(tempPath, finalPath);
        
        // Return the final path
        return { success: true, filePath: finalPath };
    } catch (error) {
        console.error('Failed to save logo file:', error);
        return { success: false, filePath: '', error: error.message };
    }
});

// تصدير المتغيرات للاستخدام في ملفات أخرى
module.exports = {
    getMainWindow: () => mainWindow,
    isDev
};
