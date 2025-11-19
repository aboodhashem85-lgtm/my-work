/**
 * Database Management System using localStorage
 * Handles all data operations for the Building Management System
 */

class Database {
    constructor() {
        // Check if running in Electron environment
        if (window.electronAPI && window.electronAPI.db) {
            this.db = window.electronAPI.db;
            this.isElectron = true;
            console.log('Using Electron SQLite database.');
        } else {
            // Fallback for web environment (using localStorage)
            this.storageKey = 'buildingManagementSystem';
            this.isElectron = false;
            this.initializeDatabase();
            console.log('Using localStorage database (Web fallback).');
        }
    }

    /**
     * Initialize the database with default structure (for localStorage fallback only)
     */
    initializeDatabase() {
        const defaultData = {
            settings: {
                password: this.encryptPassword('123'),
                buildingName: 'مبنى سكني',
                buildingAddress: '',
                buildingPhone: '',
                buildingLogo: '',
                theme: 'light',
                currency: 'ريال',
                dateFormat: 'gregorian',
                language: 'ar',
                lastBackup: null,
                version: '1.0.0'
            },
            units: [],
            residents: [],
            contracts: [],
            payments: [],
            maintenance: [],
            inventory: [],
            notifications: [],
            messages: [],
            reports: []
        };

        // Check if database exists, if not create it
        if (!localStorage.getItem(this.storageKey)) {
            this.saveData(defaultData);
        }
    }

    /**
     * Get all data from localStorage (for localStorage fallback only)
     */
    getData() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error reading data from localStorage:', error);
            return null;
        }
    }

    /**
     * Save data to localStorage (for localStorage fallback only)
     */
    saveData(data) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error saving data to localStorage:', error);
            return false;
        }
    }

    /**
     * Get specific table data
     */
    async getTable(tableName) {
        if (this.isElectron) {
            return this.db.getTable(tableName);
        }
        // Fallback to localStorage
        const data = this.getData();
        return data ? data[tableName] || [] : [];
    }

    /**
     * Save specific table data (for localStorage fallback only)
     * This function is no longer needed in Electron, but kept for compatibility
     */
    saveTable(tableName, tableData) {
        if (this.isElectron) {
            console.warn('saveTable is deprecated in Electron mode. Use addRecord/updateRecord instead.');
            return false;
        }
        // Fallback to localStorage
        const data = this.getData();
        if (data) {
            data[tableName] = tableData;
            return this.saveData(data);
        }
        return false;
    }

    /**
     * Add new record to a table
     */
    async addRecord(tableName, record) {
        if (this.isElectron) {
            return this.db.addRecord(tableName, record);
        }
        // Fallback to localStorage
        const table = await this.getTable(tableName);
        
        // Generate unique ID
        record.id = this.generateId();
        record.createdAt = new Date().toISOString();ئ
        record.updatedAt = new Date().toISOString();
        
        table.push(record);
        return this.saveTable(tableName, table);
    }

    /**
     * Update existing record in a table
     */
    async updateRecord(tableName, id, updates) {
        if (this.isElectron) {
            return this.db.updateRecord(tableName, id, updates);
        }
        // Fallback to localStorage
        const table = await this.getTable(tableName);
        const index = table.findIndex(record => record.id === id);
        
        if (index !== -1) {
            table[index] = { ...table[index], ...updates, updatedAt: new Date().toISOString() };
            return this.saveTable(tableName, table);
        }
        return false;
    }

    /**
     * Delete record from a table
     */
    async deleteRecord(tableName, id) {
        if (this.isElectron) {
            return this.db.deleteRecord(tableName, id);
        }
        // Fallback to localStorage
        const table = await this.getTable(tableName);
        const filteredTable = table.filter(record => record.id !== id);
        
        if (filteredTable.length !== table.length) {
            return this.saveTable(tableName, filteredTable);
        }
        return false;
    }

    /**
     * Get record by ID
     */
    async getRecord(tableName, id) {
        if (this.isElectron) {
            return this.db.getRecord(tableName, id);
        }
        // Fallback to localStorage
        const table = await this.getTable(tableName);
        return table.find(record => record.id === id) || null;
    }

    /**
     * Search records in a table (simplified for Electron, complex searches need raw SQL)
     */
    async searchRecords(tableName, searchTerm, fields = []) {
        // For Electron, we'll fall back to in-memory search on the full table
        // A proper implementation would use SQLite's LIKE or FTS5
        const table = await this.getTable(tableName);
        
        if (!searchTerm) return table;
        
        const term = searchTerm.toLowerCase();
        
        return table.filter(record => {
            if (fields.length === 0) {
                // Search in all string fields
                return Object.values(record).some(value => 
                    typeof value === 'string' && value.toLowerCase().includes(term)
                );
            } else {
                // Search in specific fields
                return fields.some(field => 
                    record[field] && 
                    typeof record[field] === 'string' && 
                    record[field].toLowerCase().includes(term)
                );
            }
        });
    }

    /**
     * Filter records by criteria (simplified for Electron, complex filters need raw SQL)
     */
    async filterRecords(tableName, criteria) {
        // For Electron, we'll fall back to in-memory filter on the full table
        const table = await this.getTable(tableName);
        
        return table.filter(record => {
            return Object.keys(criteria).every(key => {
                const criteriaValue = criteria[key];
                const recordValue = record[key];
                
                if (criteriaValue === null || criteriaValue === undefined) {
                    return true;
                }
                
                if (typeof criteriaValue === 'object' && criteriaValue.operator) {
                    switch (criteriaValue.operator) {
                        case 'gt':
                            return recordValue > criteriaValue.value;
                        case 'gte':
                            return recordValue >= criteriaValue.value;
                        case 'lt':
                            return recordValue < criteriaValue.value;
                        case 'lte':
                            return recordValue <= criteriaValue.value;
                        case 'ne':
                            return recordValue !== criteriaValue.value;
                        case 'in':
                            return criteriaValue.value.includes(recordValue);
                        case 'contains':
                            return recordValue && recordValue.toLowerCase().includes(criteriaValue.value.toLowerCase());
                        default:
                            return recordValue === criteriaValue.value;
                    }
                }
                
                return recordValue === criteriaValue;
            });
        });
    }

    /**
     * Get settings
     */
    async getSettings() {
        if (this.isElectron) {
            const settings = await this.db.getSettings();
            // Ensure password is not exposed in the settings object for security
            const { password, ...safeSettings } = settings;
            return safeSettings;
        }
        // Fallback to localStorage
        const data = this.getData();
        return data ? data.settings : {};
    }

    /**
     * Update settings
     */
    async updateSettings(newSettings) {
        if (this.isElectron) {
            let success = true;
            for (const key in newSettings) {
                if (key !== 'password') { // Password is handled by changePassword
                    const result = await this.db.saveSetting(key, newSettings[key]);
                    if (!result) success = false;
                }
            }
            return success;
        }
        // Fallback to localStorage
        const data = this.getData();
        if (data) {
            data.settings = { ...data.settings, ...newSettings };
            return this.saveData(data);
        }
        return false;
    }

    /**
     * Run a custom SQL query (for Electron only)
     * @param {string} sql - The SQL query string
     * @param {Array<any>} params - Parameters for the query
     * @returns {Promise<Array<Object>>} - Query results
     */
    async runQuery(sql, params = []) {
        if (this.isElectron) {
            return this.db.runQuery(sql, params);
        }
        console.warn('runQuery is only supported in Electron mode.');
        return [];
    }

    /**
     * Verify password (needs to be updated to use the new hashing logic)
     */
    async verifyPassword(password) {
        if (this.isElectron) {
            // Retrieve the stored password hash from the database
            const storedSettings = await this.db.getSettings();
            const storedPassword = storedSettings.password;
            
            // The old password was a simple btoa(password + 'building_mgmt_salt')
            // We will use the same simple encryption logic for verification
            return this.encryptPassword(password) === storedPassword;
        }
        // Fallback to localStorage
        const settings = this.getSettings();
        return this.encryptPassword(password) === settings.password;
    }

    /**
     * Change password
     */
    async changePassword(newPassword) {
        if (this.isElectron) {
            // The old password was a simple btoa(password + 'building_mgmt_salt')
            // We will use the same simple encryption logic for change
            const encryptedPassword = this.encryptPassword(newPassword);
            return this.db.saveSetting('password', encryptedPassword);
        }
        // Fallback to localStorage
        return this.updateSettings({ password: this.encryptPassword(newPassword) });
    }

    /**
     * Simple password encryption (for demo purposes)
     */
    encryptPassword(password) {
        // Simple base64 encoding (in production, use proper encryption)
        return btoa(password + 'building_mgmt_salt');
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Export data for backup (only for localStorage fallback)
     */
    exportData() {
        if (this.isElectron) {
            console.warn('exportData is deprecated in Electron mode. Use electronAPI.createBackup() instead.');
            return null;
        }
        // Fallback to localStorage
        const data = this.getData();
        if (data) {
            data.exportDate = new Date().toISOString();
            return JSON.stringify(data, null, 2);
        }
        return null;
    }

    /**
     * Import data from backup (only for localStorage fallback)
     */
    importData(jsonData) {
        if (this.isElectron) {
            console.warn('importData is deprecated in Electron mode. Use electronAPI.restoreBackup() instead.');
            return false;
        }
        // Fallback to localStorage
        try {
            const data = JSON.parse(jsonData);
            
            // Validate data structure
            if (this.validateDataStructure(data)) {
                return this.saveData(data);
            } else {
                throw new Error('Invalid data structure');
            }
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }

    /**
     * Validate data structure (only for localStorage fallback)
     */
    validateDataStructure(data) {
        const requiredTables = ['settings', 'units', 'residents', 'contracts', 'payments', 'maintenance', 'inventory'];
        
        return requiredTables.every(table => 
            data.hasOwnProperty(table) && Array.isArray(data[table]) || table === 'settings'
        );
    }

    /**
     * Clear all data (reset database) (only for localStorage fallback)
     */
    clearAllData() {
        if (this.isElectron) {
            console.warn('clearAllData is deprecated in Electron mode. Use a raw SQL command instead.');
            return false;
        }
        // Fallback to localStorage
        localStorage.removeItem(this.storageKey);
        this.initializeDatabase();
        return true;
    }

    /**
     * Get statistics (needs to be updated to use the new async getTable)
     */
    async getStatistics() {
        const units = await this.getTable('units');
        const residents = await this.getTable('residents');
        const contracts = await this.getTable('contracts');
        const payments = await this.getTable('payments');
        const maintenance = await this.getTable('maintenance');

        // Calculate active contracts
        const activeContracts = contracts.filter(contract => {
            const endDate = new Date(contract.endDate);
            return endDate > new Date();
        });

        // Calculate monthly revenue
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthlyPayments = payments.filter(payment => {
            const paymentDate = new Date(payment.paymentDate); // Assuming paymentDate field name
            return paymentDate.getMonth() === currentMonth && 
                   paymentDate.getFullYear() === currentYear;
        });
        const monthlyRevenue = monthlyPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);

        // Calculate occupancy rate
        const occupiedUnits = units.filter(unit => unit.status === 'occupied').length;
        const totalUnits = units.length;
        const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

        return {
            totalUnits: totalUnits,
            totalResidents: residents.length,
            activeContracts: activeContracts.length,
            pendingMaintenance: maintenance.filter(m => m.status === 'pending').length,
            monthlyRevenue: monthlyRevenue,
            occupancyRate: occupancyRate.toFixed(2) + '%'
        };
    }
}

const db = new Database();

// Make the instance globally available
window.db = db;
    constructor() {
        this.storageKey = 'buildingManagementSystem';
        this.initializeDatabase();
    }

    /**
     * Initialize the database with default structure
     */
    initializeDatabase() {
        const defaultData = {
            settings: {
                password: this.encryptPassword('123'),
                buildingName: 'مبنى سكني',
                buildingAddress: '',
                buildingPhone: '',
                buildingLogo: '',
                theme: 'light',
                currency: 'ريال',
                dateFormat: 'gregorian',
                language: 'ar',
                lastBackup: null,
                version: '1.0.0'
            },
            units: [],
            residents: [],
            contracts: [],
            payments: [],
            maintenance: [],
            inventory: [],
            notifications: [],
            messages: [],
            reports: []
        };

        // Check if database exists, if not create it
        if (!localStorage.getItem(this.storageKey)) {
            this.saveData(defaultData);
        }
    }

    /**
     * Get all data from localStorage
     */
    getData() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error reading data from localStorage:', error);
            return null;
        }
    }

    /**
     * Save data to localStorage
     */
    saveData(data) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error saving data to localStorage:', error);
            return false;
        }
    }

    /**
     * Get specific table data
     */
    getTable(tableName) {
        const data = this.getData();
        return data ? data[tableName] || [] : [];
    }

    /**
     * Save specific table data
     */
    saveTable(tableName, tableData) {
        const data = this.getData();
        if (data) {
            data[tableName] = tableData;
            return this.saveData(data);
        }
        return false;
    }

    /**
     * Add new record to a table
     */
    addRecord(tableName, record) {
        const table = this.getTable(tableName);
        
        // Generate unique ID
        record.id = this.generateId();
        record.createdAt = new Date().toISOString();
        record.updatedAt = new Date().toISOString();
        
        table.push(record);
        return this.saveTable(tableName, table);
    }

    /**
     * Update existing record in a table
     */
    updateRecord(tableName, id, updates) {
        const table = this.getTable(tableName);
        const index = table.findIndex(record => record.id === id);
        
        if (index !== -1) {
            table[index] = { ...table[index], ...updates, updatedAt: new Date().toISOString() };
            return this.saveTable(tableName, table);
        }
        return false;
    }

    /**
     * Delete record from a table
     */
    deleteRecord(tableName, id) {
        const table = this.getTable(tableName);
        const filteredTable = table.filter(record => record.id !== id);
        
        if (filteredTable.length !== table.length) {
            return this.saveTable(tableName, filteredTable);
        }
        return false;
    }

    /**
     * Get record by ID
     */
    getRecord(tableName, id) {
        const table = this.getTable(tableName);
        return table.find(record => record.id === id) || null;
    }

    /**
     * Search records in a table
     */
    searchRecords(tableName, searchTerm, fields = []) {
        const table = this.getTable(tableName);
        
        if (!searchTerm) return table;
        
        const term = searchTerm.toLowerCase();
        
        return table.filter(record => {
            if (fields.length === 0) {
                // Search in all string fields
                return Object.values(record).some(value => 
                    typeof value === 'string' && value.toLowerCase().includes(term)
                );
            } else {
                // Search in specific fields
                return fields.some(field => 
                    record[field] && 
                    typeof record[field] === 'string' && 
                    record[field].toLowerCase().includes(term)
                );
            }
        });
    }

    /**
     * Filter records by criteria
     */
    filterRecords(tableName, criteria) {
        const table = this.getTable(tableName);
        
        return table.filter(record => {
            return Object.keys(criteria).every(key => {
                const criteriaValue = criteria[key];
                const recordValue = record[key];
                
                if (criteriaValue === null || criteriaValue === undefined) {
                    return true;
                }
                
                if (typeof criteriaValue === 'object' && criteriaValue.operator) {
                    switch (criteriaValue.operator) {
                        case 'gt':
                            return recordValue > criteriaValue.value;
                        case 'gte':
                            return recordValue >= criteriaValue.value;
                        case 'lt':
                            return recordValue < criteriaValue.value;
                        case 'lte':
                            return recordValue <= criteriaValue.value;
                        case 'ne':
                            return recordValue !== criteriaValue.value;
                        case 'in':
                            return criteriaValue.value.includes(recordValue);
                        case 'contains':
                            return recordValue && recordValue.toLowerCase().includes(criteriaValue.value.toLowerCase());
                        default:
                            return recordValue === criteriaValue.value;
                    }
                }
                
                return recordValue === criteriaValue;
            });
        });
    }

    /**
     * Get settings
     */
    getSettings() {
        const data = this.getData();
        return data ? data.settings : {};
    }

    /**
     * Update settings
     */
    updateSettings(newSettings) {
        const data = this.getData();
        if (data) {
            data.settings = { ...data.settings, ...newSettings };
            return this.saveData(data);
        }
        return false;
    }

    /**
     * Verify password
     */
    verifyPassword(password) {
        const settings = this.getSettings();
        return this.encryptPassword(password) === settings.password;
    }

    /**
     * Change password
     */
    changePassword(newPassword) {
        return this.updateSettings({ password: this.encryptPassword(newPassword) });
    }

    /**
     * Simple password encryption (for demo purposes)
     */
    encryptPassword(password) {
        // Simple base64 encoding (in production, use proper encryption)
        return btoa(password + 'building_mgmt_salt');
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Export data for backup
     */
    exportData() {
        const data = this.getData();
        if (data) {
            data.exportDate = new Date().toISOString();
            return JSON.stringify(data, null, 2);
        }
        return null;
    }

    /**
     * Import data from backup
     */
    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            // Validate data structure
            if (this.validateDataStructure(data)) {
                return this.saveData(data);
            } else {
                throw new Error('Invalid data structure');
            }
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }

    /**
     * Validate data structure
     */
    validateDataStructure(data) {
        const requiredTables = ['settings', 'units', 'residents', 'contracts', 'payments', 'maintenance', 'inventory'];
        
        return requiredTables.every(table => 
            data.hasOwnProperty(table) && Array.isArray(data[table]) || table === 'settings'
        );
    }

    /**
     * Clear all data (reset database)
     */
    clearAllData() {
        localStorage.removeItem(this.storageKey);
        this.initializeDatabase();
        return true;
    }

    /**
     * Get statistics
     */
    getStatistics() {
        const units = this.getTable('units');
        const residents = this.getTable('residents');
        const contracts = this.getTable('contracts');
        const payments = this.getTable('payments');
        const maintenance = this.getTable('maintenance');

        // Calculate active contracts
        const activeContracts = contracts.filter(contract => {
            const endDate = new Date(contract.endDate);
            return endDate > new Date();
        });

        // Calculate monthly revenue
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthlyPayments = payments.filter(payment => {
            const paymentDate = new Date(payment.date);
            return paymentDate.getMonth() === currentMonth && 
                   paymentDate.getFullYear() === currentYear;
        });
        const monthlyRevenue = monthlyPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);

        // Calculate occupancy rate
        const occupiedUnits = units.filter(unit => unit.status === 'occupied').length;
        const occupancyRate = units.length > 0 ? (occupiedUnits / units.length) * 100 : 0;

        // Pending maintenance requests
        const pendingMaintenance = maintenance.filter(request => request.status === 'pending').length;

        return {
            totalUnits: units.length,
            totalResidents: residents.length,
            activeContracts: activeContracts.length,
            monthlyRevenue: monthlyRevenue,
            occupancyRate: Math.round(occupancyRate),
            pendingMaintenance: pendingMaintenance,
            occupiedUnits: occupiedUnits,
            availableUnits: units.length - occupiedUnits
        };
    }

    /**
     * Get alerts and notifications
     */
    getAlerts() {
        const contracts = this.getTable('contracts');
        const payments = this.getTable('payments');
        const maintenance = this.getTable('maintenance');
        const alerts = [];

        // Contract expiration alerts (30 days)
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        contracts.forEach(contract => {
            const endDate = new Date(contract.endDate);
            if (endDate <= thirtyDaysFromNow && endDate > new Date()) {
                alerts.push({
                    type: 'warning',
                    title: 'عقد قارب على الانتهاء',
                    message: `عقد ${contract.residentName} ينتهي في ${this.formatDate(contract.endDate)}`,
                    date: new Date().toISOString(),
                    priority: 'high'
                });
            }
        });

        // Overdue payments
        const overduePayments = payments.filter(payment => {
            const dueDate = new Date(payment.dueDate);
            return dueDate < new Date() && payment.status !== 'paid';
        });

        overduePayments.forEach(payment => {
            alerts.push({
                type: 'danger',
                title: 'دفعة متأخرة',
                message: `دفعة متأخرة للمقيم ${payment.residentName} بمبلغ ${payment.amount}`,
                date: new Date().toISOString(),
                priority: 'high'
            });
        });

        // Pending maintenance
        const pendingMaintenance = maintenance.filter(request => request.status === 'pending');
        
        if (pendingMaintenance.length > 0) {
            alerts.push({
                type: 'info',
                title: 'طلبات صيانة معلقة',
                message: `يوجد ${pendingMaintenance.length} طلب صيانة في الانتظار`,
                date: new Date().toISOString(),
                priority: 'medium'
            });
        }

        return alerts.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    }

    /**
     * Format date for display
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    /**
     * Get overdue payments
     */
    getOverduePayments() {
        const payments = this.getTable('payments');
        const residents = this.getTable('residents');
        
        const overduePayments = payments.filter(payment => {
            const dueDate = new Date(payment.dueDate);
            return dueDate < new Date() && payment.status !== 'paid';
        });

        return overduePayments.map(payment => {
            const resident = residents.find(r => r.id === payment.residentId);
            return {
                ...payment,
                residentName: resident ? resident.name : 'غير معروف',
                daysOverdue: Math.floor((new Date() - new Date(payment.dueDate)) / (1000 * 60 * 60 * 24))
            };
        });
    }

    /**
     * Calculate resident balance
     */
    calculateResidentBalance(residentId) {
        const payments = this.getTable('payments');
        const residentPayments = payments.filter(payment => payment.residentId === residentId);
        
        let balance = 0;
        residentPayments.forEach(payment => {
            if (payment.type === 'rent' || payment.type === 'utilities') {
                balance += payment.amount;
            } else if (payment.type === 'payment') {
                balance -= payment.amount;
            }
        });
        
        return balance;
    }

    /**
     * Get payment history for a resident
     */
    getResidentPaymentHistory(residentId) {
        const payments = this.getTable('payments');
        return payments
            .filter(payment => payment.residentId === residentId)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    }
}

// Create global database instance
window.db = new Database();
