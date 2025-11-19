/**
 * Payments Management Module
 * Handles payment tracking and financial management
 */

window.Payments = {
    currentPage: 1,
    pageSize: 10,
    searchTerm: '',
    sortField: 'date',
    sortDirection: 'desc',
    filterType: 'all',
    filterStatus: 'all',

    /**
     * Load payments management page
     */
    load() {
        this.renderPaymentsPage();
        this.loadPayments();
    },

    /**
     * Render the payments management page
     */
    renderPaymentsPage() {
        const paymentsContent = document.getElementById('paymentsContent');
        if (!paymentsContent) return;

        paymentsContent.innerHTML = `
            <div class="payments-container">
                <!-- Header Section -->
                <div class="page-header">
                    <div class="header-actions">
                        <button class="btn btn-primary" onclick="Payments.showAddPaymentModal()">
                            <i class="fas fa-plus"></i>
                            إضافة دفعة
                        </button>
                        <button class="btn btn-success" onclick="Payments.showAddIncomeModal()">
                            <i class="fas fa-arrow-down"></i>
                            إضافة إيراد
                        </button>
                        <button class="btn btn-warning" onclick="Payments.showAddExpenseModal()">
                            <i class="fas fa-arrow-up"></i>
                            إضافة مصروف
                        </button>
                        <button class="btn btn-secondary" onclick="Payments.exportPayments()">
                            <i class="fas fa-download"></i>
                            تصدير البيانات
                        </button>
                    </div>
                </div>

                <!-- Summary Cards -->
                <div class="summary-cards" id="paymentsSummary">
                    <!-- Summary will be loaded here -->
                </div>

                <!-- Filters Section -->
                <div class="filters-section neu-flat">
                    <div class="filters-grid">
                        <div class="filter-group">
                            <label>البحث</label>
                            <div class="search-wrapper">
                                <input type="text" id="paymentsSearch" class="form-control" 
                                       placeholder="البحث بالوصف أو اسم المقيم..." 
                                       value="${this.searchTerm}">
                                <i class="fas fa-search"></i>
                            </div>
                        </div>
                        <div class="filter-group">
                            <label>النوع</label>
                            <select id="paymentsTypeFilter" class="form-control">
                                <option value="all">جميع الأنواع</option>
                                <option value="payment">دفعة</option>
                                <option value="rent">إيجار</option>
                                <option value="utilities">خدمات</option>
                                <option value="maintenance">صيانة</option>
                                <option value="deposit">تأمين</option>
                                <option value="income">إيراد</option>
                                <option value="expense">مصروف</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label>الحالة</label>
                            <select id="paymentsStatusFilter" class="form-control">
                                <option value="all">جميع الحالات</option>
                                <option value="paid">مدفوع</option>
                                <option value="pending">معلق</option>
                                <option value="overdue">متأخر</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label>الترتيب</label>
                            <select id="paymentsSortField" class="form-control">
                                <option value="date">التاريخ</option>
                                <option value="amount">المبلغ</option>
                                <option value="type">النوع</option>
                                <option value="createdAt">تاريخ الإضافة</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label>الاتجاه</label>
                            <select id="paymentsSortDirection" class="form-control">
                                <option value="asc">تصاعدي</option>
                                <option value="desc">تنازلي</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label>من تاريخ</label>
                            <input type="date" id="paymentsFromDate" class="form-control">
                        </div>
                        <div class="filter-group">
                            <label>إلى تاريخ</label>
                            <input type="date" id="paymentsToDate" class="form-control">
                        </div>
                    </div>
                </div>

                <!-- Payments Grid -->
                <div class="payments-grid" id="paymentsGrid">
                    <!-- Payments will be loaded here -->
                </div>

                <!-- Pagination -->
                <div id="paymentsPagination" class="pagination-container">
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
        const searchInput = document.getElementById('paymentsSearch');
        if (searchInput) {
            searchInput.addEventListener('input', AppUtils.debounce((e) => {
                this.searchTerm = e.target.value;
                this.currentPage = 1;
                this.loadPayments();
            }, 300));
        }

        // Type filter
        const typeFilter = document.getElementById('paymentsTypeFilter');
        if (typeFilter) {
            typeFilter.value = this.filterType;
            typeFilter.addEventListener('change', (e) => {
                this.filterType = e.target.value;
                this.currentPage = 1;
                this.loadPayments();
            });
        }

        // Status filter
        const statusFilter = document.getElementById('paymentsStatusFilter');
        if (statusFilter) {
            statusFilter.value = this.filterStatus;
            statusFilter.addEventListener('change', (e) => {
                this.filterStatus = e.target.value;
                this.currentPage = 1;
                this.loadPayments();
            });
        }

        // Sort field
        const sortField = document.getElementById('paymentsSortField');
        if (sortField) {
            sortField.value = this.sortField;
            sortField.addEventListener('change', (e) => {
                this.sortField = e.target.value;
                this.loadPayments();
            });
        }

        // Sort direction
        const sortDirection = document.getElementById('paymentsSortDirection');
        if (sortDirection) {
            sortDirection.value = this.sortDirection;
            sortDirection.addEventListener('change', (e) => {
                this.sortDirection = e.target.value;
                this.loadPayments();
            });
        }

        // Date filters
        const fromDate = document.getElementById('paymentsFromDate');
        const toDate = document.getElementById('paymentsToDate');
        
        if (fromDate) {
            fromDate.addEventListener('change', () => {
                this.currentPage = 1;
                this.loadPayments();
            });
        }

        if (toDate) {
            toDate.addEventListener('change', () => {
                this.currentPage = 1;
                this.loadPayments();
            });
        }
    },

    /**
     * Load summary statistics
     */
    loadSummary() {
        const payments = db.getTable('payments');
        const settings = db.getSettings();
        
        // Calculate totals
        const totalIncome = payments
            .filter(p => ['payment', 'income'].includes(p.type))
            .reduce((sum, p) => sum + (p.amount || 0), 0);
            
        const totalExpenses = payments
            .filter(p => ['expense', 'maintenance'].includes(p.type))
            .reduce((sum, p) => sum + (p.amount || 0), 0);
            
        const totalRent = payments
            .filter(p => p.type === 'rent')
            .reduce((sum, p) => sum + (p.amount || 0), 0);
            
        const pendingPayments = payments
            .filter(p => p.status === 'pending')
            .reduce((sum, p) => sum + (p.amount || 0), 0);

        const netIncome = totalIncome - totalExpenses;

        const summaryHtml = `
            <div class="summary-card neu-flat income">
                <div class="summary-icon">
                    <i class="fas fa-arrow-down"></i>
                </div>
                <div class="summary-content">
                    <h3>${AppUtils.formatCurrency(totalIncome, settings.currency)}</h3>
                    <p>إجمالي الإيرادات</p>
                </div>
            </div>
            
            <div class="summary-card neu-flat expense">
                <div class="summary-icon">
                    <i class="fas fa-arrow-up"></i>
                </div>
                <div class="summary-content">
                    <h3>${AppUtils.formatCurrency(totalExpenses, settings.currency)}</h3>
                    <p>إجمالي المصروفات</p>
                </div>
            </div>
            
            <div class="summary-card neu-flat rent">
                <div class="summary-icon">
                    <i class="fas fa-home"></i>
                </div>
                <div class="summary-content">
                    <h3>${AppUtils.formatCurrency(totalRent, settings.currency)}</h3>
                    <p>إجمالي الإيجارات</p>
                </div>
            </div>
            
            <div class="summary-card neu-flat pending">
                <div class="summary-icon">
                    <i class="fas fa-clock"></i>
                </div>
                <div class="summary-content">
                    <h3>${AppUtils.formatCurrency(pendingPayments, settings.currency)}</h3>
                    <p>المدفوعات المعلقة</p>
                </div>
            </div>
            
            <div class="summary-card neu-flat ${netIncome >= 0 ? 'profit' : 'loss'}">
                <div class="summary-icon">
                    <i class="fas ${netIncome >= 0 ? 'fa-chart-line' : 'fa-chart-line-down'}"></i>
                </div>
                <div class="summary-content">
                    <h3>${AppUtils.formatCurrency(Math.abs(netIncome), settings.currency)}</h3>
                    <p>${netIncome >= 0 ? 'صافي الربح' : 'صافي الخسارة'}</p>
                </div>
            </div>
        `;

        const summaryContainer = document.getElementById('paymentsSummary');
        if (summaryContainer) {
            summaryContainer.innerHTML = summaryHtml;
        }
    },

    /**
     * Load and display payments
     */
    loadPayments() {
        let payments = db.getTable('payments');

        // Enrich payments with resident data
        const residents = db.getTable('residents');
        payments = payments.map(payment => {
            const resident = residents.find(r => r.id === payment.residentId);
            return {
                ...payment,
                residentName: resident ? resident.name : null
            };
        });

        // Apply search filter
        if (this.searchTerm) {
            const searchFilter = AppUtils.createSearchFilter(this.searchTerm, 
                ['description', 'residentName', 'reference']);
            payments = payments.filter(searchFilter);
        }

        // Apply type filter
        if (this.filterType !== 'all') {
            payments = payments.filter(payment => payment.type === this.filterType);
        }

        // Apply status filter
        if (this.filterStatus !== 'all') {
            payments = payments.filter(payment => payment.status === this.filterStatus);
        }

        // Apply date filters
        const fromDate = document.getElementById('paymentsFromDate')?.value;
        const toDate = document.getElementById('paymentsToDate')?.value;

        if (fromDate) {
            payments = payments.filter(payment => payment.date >= fromDate);
        }

        if (toDate) {
            payments = payments.filter(payment => payment.date <= toDate);
        }

        // Apply sorting
        const sorter = AppUtils.createSorter(this.sortField, this.sortDirection);
        payments.sort(sorter);

        // Apply pagination
        const pagination = AppUtils.paginate(payments, this.currentPage, this.pageSize);

        this.renderPayments(pagination.data);
        this.renderPagination(pagination);
    },

    /**
     * Render payments grid
     */
    async renderPayments(payments) {
        const paymentsGrid = document.getElementById('paymentsGrid');
        if (!paymentsGrid) return;

        if (payments.length === 0) {
            paymentsGrid.innerHTML = `
                <div class="no-data-message">
                    <i class="fas fa-money-bill-wave"></i>
                    <h3>لا توجد مدفوعات</h3>
                    <p>لم يتم العثور على مدفوعات تطابق معايير البحث</p>
                    <button class="btn btn-primary" onclick="Payments.showAddPaymentModal()">
                        إضافة دفعة جديدة
                    </button>
                </div>
            `;
            return;
        }

        // Render all payment cards asynchronously
        const paymentsHtmlArray = await Promise.all(payments.map(payment => this.renderPaymentCard(payment)));
        paymentsGrid.innerHTML = paymentsHtmlArray.join('');
    },

    /**
     * Render individual payment card
     */
    async renderPaymentCard(payment) {
        const typeInfo = this.getPaymentTypeInfo(payment.type);
        const statusInfo = this.getPaymentStatusInfo(payment.status);
        const settings = await db.getSettings();
        
        // Get building logo if available
        const buildingLogo = settings.buildingLogo || '';
        const logoHtml = buildingLogo ? `<img src="${buildingLogo.startsWith('data:image') ? buildingLogo : 'file://' + buildingLogo}" class="card-logo" alt="شعار المبنى" />` : '';

        return `
            <div class="payment-card neu-flat ${payment.type}" data-payment-id="${payment.id}">
                <div class="payment-header">
                    <div class="payment-type ${typeInfo.class}">
                        <i class="fas ${typeInfo.icon}"></i>
                        <span>${typeInfo.label}</span>
                    </div>
                    <div class="payment-header-right">
                        ${logoHtml}
                        <div class="payment-status ${statusInfo.class}">
                            <i class="fas fa-circle"></i>
                            <span>${statusInfo.label}</span>
                        </div>
                    </div>
                </div>
                
                <div class="payment-details">
                    <div class="payment-amount ${payment.type === 'expense' ? 'negative' : 'positive'}">
                        ${payment.type === 'expense' ? '-' : '+'}${AppUtils.formatCurrency(payment.amount || 0, settings.currency)}
                    </div>
                    
                    <div class="detail-row">
                        <span class="detail-label">التاريخ:</span>
                        <span class="detail-value">${AppUtils.formatDate(payment.date)}</span>
                    </div>
                    
                    ${payment.residentName ? `
                        <div class="detail-row">
                            <span class="detail-label">المقيم:</span>
                            <span class="detail-value">${payment.residentName}</span>
                        </div>
                    ` : ''}
                    
                    ${payment.description ? `
                        <div class="detail-row">
                            <span class="detail-label">الوصف:</span>
                            <span class="detail-value">${payment.description}</span>
                        </div>
                    ` : ''}
                    
                    ${payment.reference ? `
                        <div class="detail-row">
                            <span class="detail-label">المرجع:</span>
                            <span class="detail-value">${payment.reference}</span>
                        </div>
                    ` : ''}
                    
                    ${payment.paymentMethod ? `
                        <div class="detail-row">
                            <span class="detail-label">طريقة الدفع:</span>
                            <span class="detail-value">${this.getPaymentMethodLabel(payment.paymentMethod)}</span>
                        </div>
                    ` : ''}
                </div>

                <div class="payment-actions">
                    <button class="btn btn-sm btn-info" onclick="Payments.viewPaymentDetails('${payment.id}')" title="التفاصيل">
                        <i class="fas fa-eye"></i> عرض
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="Payments.printInvoice('${payment.id}')" title="طباعة فاتورة">
                        <i class="fas fa-file-invoice"></i> فاتورة
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="Payments.showEditPaymentModal('${payment.id}')" title="تعديل">
                        <i class="fas fa-edit"></i> تعديل
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="Payments.deletePayment('${payment.id}')" title="حذف">
                        <i class="fas fa-trash"></i> حذف
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * Get payment type information
     */
    getPaymentTypeInfo(type) {
        const typeMap = {
            payment: { label: 'دفعة', class: 'type-payment', icon: 'fa-money-bill' },
            rent: { label: 'إيجار', class: 'type-rent', icon: 'fa-home' },
            utilities: { label: 'خدمات', class: 'type-utilities', icon: 'fa-bolt' },
            maintenance: { label: 'صيانة', class: 'type-maintenance', icon: 'fa-tools' },
            deposit: { label: 'تأمين', class: 'type-deposit', icon: 'fa-shield-alt' },
            income: { label: 'إيراد', class: 'type-income', icon: 'fa-arrow-down' },
            expense: { label: 'مصروف', class: 'type-expense', icon: 'fa-arrow-up' }
        };

        return typeMap[type] || typeMap.payment;
    },

    /**
     * Get payment status information
     */
    getPaymentStatusInfo(status) {
        const statusMap = {
            paid: { label: 'مدفوع', class: 'status-paid' },
            pending: { label: 'معلق', class: 'status-pending' },
            overdue: { label: 'متأخر', class: 'status-overdue' }
        };

        return statusMap[status] || statusMap.paid;
    },

    /**
     * Get payment method label
     */
    getPaymentMethodLabel(method) {
        const methodMap = {
            cash: 'نقداً',
            bank_transfer: 'تحويل بنكي',
            check: 'شيك',
            card: 'بطاقة',
            online: 'دفع إلكتروني'
        };

        return methodMap[method] || method;
    },

    /**
     * Render pagination
     */
    renderPagination(pagination) {
        const paginationContainer = document.getElementById('paymentsPagination');
        if (!paginationContainer) return;

        const paginationHtml = AppUtils.createPaginationControls(pagination, 'Payments.goToPage');
        paginationContainer.innerHTML = paginationHtml;
    },

    /**
     * Go to specific page
     */
    goToPage(page) {
        this.currentPage = page;
        this.loadPayments();
    },

    /**
     * Show add payment modal
     */
    showAddPaymentModal() {
        // Get active residents
        const residents = db.getTable('residents').filter(r => r.status === 'active');

        const residentsOptions = residents.map(resident => 
            `<option value="${resident.id}">${resident.name} - ${resident.phone}</option>`
        ).join('');

        const modalContent = `
            <form id="addPaymentForm">
                <div class="form-grid">
                    <div class="form-group">
                        <label for="paymentResident">المقيم *</label>
                        <select id="paymentResident" class="form-control" required>
                            <option value="">اختر المقيم</option>
                            ${residentsOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="paymentType">نوع الدفعة *</label>
                        <select id="paymentType" class="form-control" required>
                            <option value="payment">دفعة</option>
                            <option value="rent">إيجار</option>
                            <option value="utilities">خدمات</option>
                            <option value="deposit">تأمين</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="paymentAmount">المبلغ *</label>
                        <input type="number" id="paymentAmount" class="form-control" required 
                               placeholder="مثال: 2500" min="0" step="0.01">
                    </div>
                    <div class="form-group">
                        <label for="paymentDate">التاريخ *</label>
                        <input type="date" id="paymentDate" class="form-control" required 
                               value="${new Date().toISOString().split('T')[0]}">
                    </div>
                    <div class="form-group">
                        <label for="paymentMethod">طريقة الدفع</label>
                        <select id="paymentMethod" class="form-control">
                            <option value="cash">نقداً</option>
                            <option value="bank_transfer">تحويل بنكي</option>
                            <option value="check">شيك</option>
                            <option value="card">بطاقة</option>
                            <option value="online">دفع إلكتروني</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="paymentStatus">الحالة *</label>
                        <select id="paymentStatus" class="form-control" required>
                            <option value="paid">مدفوع</option>
                            <option value="pending">معلق</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="paymentDescription">الوصف</label>
                    <textarea id="paymentDescription" class="form-control" rows="3" 
                              placeholder="وصف الدفعة..."></textarea>
                </div>
                
                <div class="form-group">
                    <label for="paymentReference">رقم المرجع</label>
                    <input type="text" id="paymentReference" class="form-control" 
                           placeholder="رقم الإيصال أو المرجع">
                </div>
            </form>
        `;

        app.showModal('إضافة دفعة جديدة', modalContent, [
            {
                text: 'إلغاء',
                class: 'btn-secondary',
                onclick: 'app.closeModal()'
            },
            {
                text: 'إضافة الدفعة',
                class: 'btn-primary',
                onclick: 'Payments.savePayment()'
            }
        ]);
    },

    /**
     * Show add income modal
     */
    showAddIncomeModal() {
        const modalContent = `
            <form id="addIncomeForm">
                <div class="form-grid">
                    <div class="form-group">
                        <label for="incomeAmount">المبلغ *</label>
                        <input type="number" id="incomeAmount" class="form-control" required 
                               placeholder="مثال: 5000" min="0" step="0.01">
                    </div>
                    <div class="form-group">
                        <label for="incomeDate">التاريخ *</label>
                        <input type="date" id="incomeDate" class="form-control" required 
                               value="${new Date().toISOString().split('T')[0]}">
                    </div>
                    <div class="form-group">
                        <label for="incomeMethod">طريقة الاستلام</label>
                        <select id="incomeMethod" class="form-control">
                            <option value="cash">نقداً</option>
                            <option value="bank_transfer">تحويل بنكي</option>
                            <option value="check">شيك</option>
                            <option value="card">بطاقة</option>
                            <option value="online">دفع إلكتروني</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="incomeDescription">الوصف *</label>
                    <textarea id="incomeDescription" class="form-control" rows="3" required
                              placeholder="وصف الإيراد..."></textarea>
                </div>
                
                <div class="form-group">
                    <label for="incomeReference">رقم المرجع</label>
                    <input type="text" id="incomeReference" class="form-control" 
                           placeholder="رقم الإيصال أو المرجع">
                </div>
            </form>
        `;

        app.showModal('إضافة إيراد جديد', modalContent, [
            {
                text: 'إلغاء',
                class: 'btn-secondary',
                onclick: 'app.closeModal()'
            },
            {
                text: 'إضافة الإيراد',
                class: 'btn-success',
                onclick: 'Payments.saveIncome()'
            }
        ]);
    },

    /**
     * Show add expense modal
     */
    showAddExpenseModal() {
        const modalContent = `
            <form id="addExpenseForm">
                <div class="form-grid">
                    <div class="form-group">
                        <label for="expenseAmount">المبلغ *</label>
                        <input type="number" id="expenseAmount" class="form-control" required 
                               placeholder="مثال: 1500" min="0" step="0.01">
                    </div>
                    <div class="form-group">
                        <label for="expenseDate">التاريخ *</label>
                        <input type="date" id="expenseDate" class="form-control" required 
                               value="${new Date().toISOString().split('T')[0]}">
                    </div>
                    <div class="form-group">
                        <label for="expenseCategory">الفئة</label>
                        <select id="expenseCategory" class="form-control">
                            <option value="maintenance">صيانة</option>
                            <option value="utilities">خدمات</option>
                            <option value="cleaning">تنظيف</option>
                            <option value="security">أمن</option>
                            <option value="administrative">إدارية</option>
                            <option value="other">أخرى</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="expenseMethod">طريقة الدفع</label>
                        <select id="expenseMethod" class="form-control">
                            <option value="cash">نقداً</option>
                            <option value="bank_transfer">تحويل بنكي</option>
                            <option value="check">شيك</option>
                            <option value="card">بطاقة</option>
                            <option value="online">دفع إلكتروني</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="expenseDescription">الوصف *</label>
                    <textarea id="expenseDescription" class="form-control" rows="3" required
                              placeholder="وصف المصروف..."></textarea>
                </div>
                
                <div class="form-group">
                    <label for="expenseReference">رقم المرجع</label>
                    <input type="text" id="expenseReference" class="form-control" 
                           placeholder="رقم الفاتورة أو المرجع">
                </div>
            </form>
        `;

        app.showModal('إضافة مصروف جديد', modalContent, [
            {
                text: 'إلغاء',
                class: 'btn-secondary',
                onclick: 'app.closeModal()'
            },
            {
                text: 'إضافة المصروف',
                class: 'btn-warning',
                onclick: 'Payments.saveExpense()'
            }
        ]);
    },

    /**
     * Save payment
     */
    savePayment(paymentId = null) {
        const form = document.getElementById('addPaymentForm') || document.getElementById('editPaymentForm');
        if (!form) return;

        const paymentData = {
            residentId: document.getElementById('paymentResident').value,
            type: document.getElementById('paymentType').value,
            amount: parseFloat(document.getElementById('paymentAmount').value) || 0,
            date: document.getElementById('paymentDate').value,
            paymentMethod: document.getElementById('paymentMethod').value,
            status: document.getElementById('paymentStatus').value,
            description: document.getElementById('paymentDescription').value.trim(),
            reference: document.getElementById('paymentReference').value.trim()
        };

        // Validation
        if (!paymentData.residentId) {
            app.showNotification('يرجى اختيار المقيم', 'error');
            return;
        }

        if (!paymentData.type) {
            app.showNotification('نوع الدفعة مطلوب', 'error');
            return;
        }

        if (paymentData.amount <= 0) {
            app.showNotification('المبلغ يجب أن يكون أكبر من صفر', 'error');
            return;
        }

        if (!paymentData.date) {
            app.showNotification('التاريخ مطلوب', 'error');
            return;
        }

        // Generate reference if not provided
        if (!paymentData.reference) {
            paymentData.reference = AppUtils.generateReference('PAY');
        }

        let success;
        if (paymentId) {
            success = db.updateRecord('payments', paymentId, paymentData);
        } else {
            success = db.addRecord('payments', paymentData);
        }

        if (success) {
            app.closeModal();
            this.loadPayments();
            this.loadSummary();
            app.showNotification(
                paymentId ? 'تم تحديث الدفعة بنجاح' : 'تم إضافة الدفعة بنجاح', 
                'success'
            );
        } else {
            app.showNotification('حدث خطأ أثناء حفظ البيانات', 'error');
        }
    },

    /**
     * Save income
     */
    saveIncome() {
        const incomeData = {
            type: 'income',
            amount: parseFloat(document.getElementById('incomeAmount').value) || 0,
            date: document.getElementById('incomeDate').value,
            paymentMethod: document.getElementById('incomeMethod').value,
            status: 'paid',
            description: document.getElementById('incomeDescription').value.trim(),
            reference: document.getElementById('incomeReference').value.trim()
        };

        // Validation
        if (incomeData.amount <= 0) {
            app.showNotification('المبلغ يجب أن يكون أكبر من صفر', 'error');
            return;
        }

        if (!incomeData.date) {
            app.showNotification('التاريخ مطلوب', 'error');
            return;
        }

        if (!incomeData.description) {
            app.showNotification('الوصف مطلوب', 'error');
            return;
        }

        // Generate reference if not provided
        if (!incomeData.reference) {
            incomeData.reference = AppUtils.generateReference('INC');
        }

        const success = db.addRecord('payments', incomeData);

        if (success) {
            app.closeModal();
            this.loadPayments();
            this.loadSummary();
            app.showNotification('تم إضافة الإيراد بنجاح', 'success');
        } else {
            app.showNotification('حدث خطأ أثناء حفظ البيانات', 'error');
        }
    },

    /**
     * Save expense
     */
    saveExpense() {
        const expenseData = {
            type: 'expense',
            amount: parseFloat(document.getElementById('expenseAmount').value) || 0,
            date: document.getElementById('expenseDate').value,
            category: document.getElementById('expenseCategory').value,
            paymentMethod: document.getElementById('expenseMethod').value,
            status: 'paid',
            description: document.getElementById('expenseDescription').value.trim(),
            reference: document.getElementById('expenseReference').value.trim()
        };

        // Validation
        if (expenseData.amount <= 0) {
            app.showNotification('المبلغ يجب أن يكون أكبر من صفر', 'error');
            return;
        }

        if (!expenseData.date) {
            app.showNotification('التاريخ مطلوب', 'error');
            return;
        }

        if (!expenseData.description) {
            app.showNotification('الوصف مطلوب', 'error');
            return;
        }

        // Generate reference if not provided
        if (!expenseData.reference) {
            expenseData.reference = AppUtils.generateReference('EXP');
        }

        const success = db.addRecord('payments', expenseData);

        if (success) {
            app.closeModal();
            this.loadPayments();
            this.loadSummary();
            app.showNotification('تم إضافة المصروف بنجاح', 'success');
        } else {
            app.showNotification('حدث خطأ أثناء حفظ البيانات', 'error');
        }
    },

    /**
     * Edit payment
     */
    editPayment(paymentId) {
        const payment = db.getRecord('payments', paymentId);
        if (!payment) {
            app.showNotification('الدفعة غير موجودة', 'error');
            return;
        }

        // Get residents for selection
        const residents = db.getTable('residents');
        const residentsOptions = residents.map(resident => 
            `<option value="${resident.id}" ${resident.id === payment.residentId ? 'selected' : ''}>
                ${resident.name} - ${resident.phone}
            </option>`
        ).join('');

        const modalContent = `
            <form id="editPaymentForm">
                <div class="form-grid">
                    ${payment.residentId ? `
                        <div class="form-group">
                            <label for="paymentResident">المقيم *</label>
                            <select id="paymentResident" class="form-control" required>
                                <option value="">اختر المقيم</option>
                                ${residentsOptions}
                            </select>
                        </div>
                    ` : ''}
                    <div class="form-group">
                        <label for="paymentType">نوع الدفعة *</label>
                        <select id="paymentType" class="form-control" required>
                            <option value="payment" ${payment.type === 'payment' ? 'selected' : ''}>دفعة</option>
                            <option value="rent" ${payment.type === 'rent' ? 'selected' : ''}>إيجار</option>
                            <option value="utilities" ${payment.type === 'utilities' ? 'selected' : ''}>خدمات</option>
                            <option value="deposit" ${payment.type === 'deposit' ? 'selected' : ''}>تأمين</option>
                            <option value="income" ${payment.type === 'income' ? 'selected' : ''}>إيراد</option>
                            <option value="expense" ${payment.type === 'expense' ? 'selected' : ''}>مصروف</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="paymentAmount">المبلغ *</label>
                        <input type="number" id="paymentAmount" class="form-control" required 
                               value="${payment.amount || ''}" placeholder="مثال: 2500" min="0" step="0.01">
                    </div>
                    <div class="form-group">
                        <label for="paymentDate">التاريخ *</label>
                        <input type="date" id="paymentDate" class="form-control" required 
                               value="${payment.date}">
                    </div>
                    <div class="form-group">
                        <label for="paymentMethod">طريقة الدفع</label>
                        <select id="paymentMethod" class="form-control">
                            <option value="cash" ${payment.paymentMethod === 'cash' ? 'selected' : ''}>نقداً</option>
                            <option value="bank_transfer" ${payment.paymentMethod === 'bank_transfer' ? 'selected' : ''}>تحويل بنكي</option>
                            <option value="check" ${payment.paymentMethod === 'check' ? 'selected' : ''}>شيك</option>
                            <option value="card" ${payment.paymentMethod === 'card' ? 'selected' : ''}>بطاقة</option>
                            <option value="online" ${payment.paymentMethod === 'online' ? 'selected' : ''}>دفع إلكتروني</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="paymentStatus">الحالة *</label>
                        <select id="paymentStatus" class="form-control" required>
                            <option value="paid" ${payment.status === 'paid' ? 'selected' : ''}>مدفوع</option>
                            <option value="pending" ${payment.status === 'pending' ? 'selected' : ''}>معلق</option>
                            <option value="overdue" ${payment.status === 'overdue' ? 'selected' : ''}>متأخر</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="paymentDescription">الوصف</label>
                    <textarea id="paymentDescription" class="form-control" rows="3" 
                              placeholder="وصف الدفعة...">${payment.description || ''}</textarea>
                </div>
                
                <div class="form-group">
                    <label for="paymentReference">رقم المرجع</label>
                    <input type="text" id="paymentReference" class="form-control" 
                           value="${payment.reference || ''}" placeholder="رقم الإيصال أو المرجع">
                </div>
            </form>
        `;

        app.showModal('تعديل الدفعة', modalContent, [
            {
                text: 'إلغاء',
                class: 'btn-secondary',
                onclick: 'app.closeModal()'
            },
            {
                text: 'حفظ التغييرات',
                class: 'btn-primary',
                onclick: `Payments.savePayment('${paymentId}')`
            }
        ]);
        /**
     * Print invoice for a payment
     */
    async printInvoice(paymentId) {
        const payment = await db.getRecord('payments', paymentId);
        if (!payment) {
            app.showNotification('لم يتم العثور على الدفعة', 'error');
            return;
        }
        
        const resident = await db.getRecord('residents', payment.residentId);
        const unit = resident ? await db.getRecord('units', resident.unitId) : null;
        const contract = resident ? await db.getRecord('contracts', resident.contractId) : null;
        const settings = await db.getSettings();
        
        // 1. Prepare data for the template
        const invoiceData = {
            invoiceNumber: `INV-${payment.id.substr(-6)}-${new Date(payment.date).getFullYear()}`,
            invoiceDate: AppUtils.formatDate(payment.date, settings.dateFormat),
            dueDate: AppUtils.formatDate(payment.dueDate || payment.date, settings.dateFormat),
            
            buildingName: settings.buildingName || 'اسم المبنى السكني',
            buildingAddress: settings.buildingAddress || 'عنوان المبنى',
            managerPhone: settings.managerPhone || 'N/A',
            buildingLogo: settings.buildingLogo || '', // Base64 or path
            
            residentName: resident ? resident.name : 'غير محدد',
            unitNumber: unit ? unit.unitNumber : 'N/A',
            contractID: contract ? contract.contractNumber : 'N/A',
            residentPhone: resident ? resident.phone : 'N/A',
            
            rentalPeriod: payment.rentalPeriod || AppUtils.formatDate(payment.date, settings.dateFormat),
            paymentStatus: this.getPaymentStatusInfo(payment.status).label,
            paymentMethod: this.getPaymentMethodLabel(payment.paymentMethod),
            
            currency: settings.currency || 'SAR',
            itemDescription: payment.description || this.getPaymentTypeInfo(payment.type).label,
            itemAmount: payment.amount || 0,
            
            subTotal: payment.amount || 0,
            discount: 0, // Assuming no discount for now
            tax: 0, // Assuming no tax for now
            grandTotal: payment.amount || 0,
            
            invoiceNotes: 'يرجى دفع المبلغ المستحق قبل تاريخ الاستحقاق لتجنب رسوم التأخير. شكراً لتعاونكم.',
            footerManagerName: settings.managerName || 'المدير',
            footerManagerPhone: settings.managerPhone || 'N/A'
        };
        
        // 2. Load and populate the HTML template
        const templatePath = window.electronAPI ? await window.electronAPI.getAppPath() + '/invoice-template-enhanced.html' : 'invoice-template-enhanced.html';
        
        let htmlContent;
        if (window.electronAPI) {
            // In Electron, read the file directly
            htmlContent = await fetch(templatePath).then(res => res.text());
        } else {
            // In web environment, fetch the file via standard means
            htmlContent = await fetch(templatePath).then(res => res.text());
        }
        
        // 3. Replace placeholders in the template
        let finalHtml = htmlContent;
        for (const key in invoiceData) {
            let value = invoiceData[key];
            
            if (key === 'buildingLogo') {
                // Special handling for logo: if path exists, replace src
                const logoSrc = value ? (value.startsWith('data:image') ? value : `file://${value}`) : '';
                finalHtml = finalHtml.replace(/<img id="buildingLogo" src=".*?"/, `<img id="buildingLogo" src="${logoSrc}"`);
                // Also hide the logo if no path is provided
                if (!value) {
                    finalHtml = finalHtml.replace(/<img id="buildingLogo" src=".*?"/, `<img id="buildingLogo" src="" style="display: none;"`);
                }
                continue;
            }
            
            // Format currency fields
            if (['itemAmount', 'subTotal', 'discount', 'tax', 'grandTotal'].includes(key)) {
                value = AppUtils.formatCurrency(value, invoiceData.currency, false);
            }
            
            // Replace all other placeholders
            finalHtml = finalHtml.replace(new RegExp(`<span id="${key}">.*?</span>`, 'g'), `<span id="${key}">${value}</span>`);
            finalHtml = finalHtml.replace(new RegExp(`id="${key}">${value}`, 'g'), `id="${key}">${value}`); // For non-span tags
        }
        
        // 4. Open a new window for printing (or use Electron print)
        if (window.electronAPI) {
            // Use Electron's print functionality
            const result = await window.electronAPI.printToPDF(finalHtml, `invoice-${invoiceData.invoiceNumber}.pdf`);
            if (result.success) {
                app.showNotification(`تم إنشاء الفاتورة بنجاح: ${result.filePath}`, 'success');
            } else {
                app.showNotification(`فشل إنشاء الفاتورة: ${result.error}`, 'error');
            }
        } else {
            // Fallback for web: open in new tab
            const printWindow = window.open('', '_blank');
            printWindow.document.write(finalHtml);
            printWindow.document.close();
            printWindow.print();
        }
    },

    /**
     * Show payment details modal
     */
    showPaymentDetails(paymentId) {       const payment = db.getRecord('payments', paymentId);
        if (!payment) {
            app.showNotification('الدفعة غير موجودة', 'error');
            return;
        }

        const resident = payment.residentId ? db.getRecord('residents', payment.residentId) : null;
        const typeInfo = this.getPaymentTypeInfo(payment.type);
        const statusInfo = this.getPaymentStatusInfo(payment.status);
        const settings = db.getSettings();

        const modalContent = `
            <div class="payment-details-view">
                <div class="payment-summary">
                    <div class="payment-header-view">
                        <div class="payment-type-large ${typeInfo.class}">
                            <i class="fas ${typeInfo.icon}"></i>
                            <span>${typeInfo.label}</span>
                        </div>
                        <div class="payment-amount-large ${payment.type === 'expense' ? 'negative' : 'positive'}">
                            ${payment.type === 'expense' ? '-' : '+'}${AppUtils.formatCurrency(payment.amount || 0, settings.currency)}
                        </div>
                    </div>
                    <div class="payment-status-large ${statusInfo.class}">
                        <i class="fas fa-circle"></i>
                        <span>${statusInfo.label}</span>
                    </div>
                </div>

                <div class="details-grid">
                    <div class="detail-section">
                        <h4>تفاصيل الدفعة</h4>
                        <div class="detail-list">
                            <div class="detail-item">
                                <span class="label">التاريخ:</span>
                                <span class="value">${AppUtils.formatDate(payment.date)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">رقم المرجع:</span>
                                <span class="value">${payment.reference || 'غير محدد'}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">طريقة الدفع:</span>
                                <span class="value">${payment.paymentMethod ? this.getPaymentMethodLabel(payment.paymentMethod) : 'غير محدد'}</span>
                            </div>
                        </div>
                    </div>

                    ${resident ? `
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
                    ` : ''}

                    ${payment.description ? `
                        <div class="detail-section">
                            <h4>الوصف</h4>
                            <div class="payment-description">
                                <p>${payment.description}</p>
                            </div>
                        </div>
                    ` : ''}

                    <div class="detail-section">
                        <h4>معلومات إضافية</h4>
                        <div class="detail-list">
                            <div class="detail-item">
                                <span class="label">تاريخ الإنشاء:</span>
                                <span class="value">${AppUtils.formatDate(payment.createdAt)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">آخر تحديث:</span>
                                <span class="value">${AppUtils.formatDate(payment.updatedAt)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        app.showModal(`تفاصيل الدفعة`, modalContent, [
            {
                text: 'إغلاق',
                class: 'btn-secondary',
                onclick: 'app.closeModal()'
            },
            {
                text: 'طباعة إيصال',
                class: 'btn-success',
                onclick: `app.closeModal(); Payments.printReceipt('${paymentId}')`
            },
            {
                text: 'تعديل',
                class: 'btn-primary',
                onclick: `app.closeModal(); Payments.editPayment('${paymentId}')`
            }
        ]);
    },

    /**
     * Print payment receipt
     */
    printReceipt(paymentId) {
        const payment = db.getRecord('payments', paymentId);
        if (!payment) {
            app.showNotification('الدفعة غير موجودة', 'error');
            return;
        }

        const resident = payment.residentId ? db.getRecord('residents', payment.residentId) : null;
        const settings = db.getSettings();
        const typeInfo = this.getPaymentTypeInfo(payment.type);

        const printContent = `
            <div style="text-align: center; margin-bottom: 40px;">
                <h1>إيصال ${typeInfo.label}</h1>
                <h2>رقم المرجع: ${payment.reference || payment.id.substr(-6)}</h2>
            </div>

            <div style="margin-bottom: 30px;">
                <table style="width: 100%; margin: 20px 0;">
                    <tr>
                        <td style="width: 30%; font-weight: bold;">التاريخ:</td>
                        <td>${AppUtils.formatDate(payment.date)}</td>
                    </tr>
                    <tr>
                        <td style="font-weight: bold;">المبلغ:</td>
                        <td style="font-size: 1.2rem; font-weight: bold;">${AppUtils.formatCurrency(payment.amount || 0, settings.currency)}</td>
                    </tr>
                    <tr>
                        <td style="font-weight: bold;">النوع:</td>
                        <td>${typeInfo.label}</td>
                    </tr>
                    ${resident ? `
                        <tr>
                            <td style="font-weight: bold;">المقيم:</td>
                            <td>${resident.name}</td>
                        </tr>
                        <tr>
                            <td style="font-weight: bold;">الهاتف:</td>
                            <td>${resident.phone}</td>
                        </tr>
                    ` : ''}
                    <tr>
                        <td style="font-weight: bold;">طريقة الدفع:</td>
                        <td>${payment.paymentMethod ? this.getPaymentMethodLabel(payment.paymentMethod) : 'غير محدد'}</td>
                    </tr>
                    ${payment.description ? `
                        <tr>
                            <td style="font-weight: bold;">الوصف:</td>
                            <td>${payment.description}</td>
                        </tr>
                    ` : ''}
                </table>
            </div>

            <div style="text-align: center; margin-top: 50px;">
                <p>شكراً لكم</p>
                <p>${settings.buildingName || 'إدارة المبنى'}</p>
            </div>
        `;

        AppUtils.printDocument(`إيصال ${typeInfo.label} - ${payment.reference || payment.id.substr(-6)}`, printContent);
    },

    /**
     * Delete payment
     */
    deletePayment(paymentId) {
        const payment = db.getRecord('payments', paymentId);
        if (!payment) {
            app.showNotification('الدفعة غير موجودة', 'error');
            return;
        }

        const typeInfo = this.getPaymentTypeInfo(payment.type);
        app.confirm(
            `هل أنت متأكد من حذف ${typeInfo.label} بمبلغ ${AppUtils.formatCurrency(payment.amount || 0)}؟ هذا الإجراء لا يمكن التراجع عنه.`,
            `Payments.confirmDeletePayment('${paymentId}')`
        );
    },

    /**
     * Confirm payment deletion
     */
    confirmDeletePayment(paymentId) {
        const success = db.deleteRecord('payments', paymentId);

        if (success) {
            this.loadPayments();
            this.loadSummary();
            app.showNotification('تم حذف الدفعة بنجاح', 'success');
        } else {
            app.showNotification('حدث خطأ أثناء حذف الدفعة', 'error');
        }
    },

    /**
     * Export payments data
     */
    exportPayments() {
        const payments = db.getTable('payments');
        
        if (payments.length === 0) {
            app.showNotification('لا توجد بيانات للتصدير', 'warning');
            return;
        }

        // Enrich with resident data
        const residents = db.getTable('residents');

        const exportData = payments.map(payment => {
            const resident = residents.find(r => r.id === payment.residentId);
            const typeInfo = this.getPaymentTypeInfo(payment.type);
            const statusInfo = this.getPaymentStatusInfo(payment.status);
            
            return {
                'رقم المرجع': payment.reference || payment.id.substr(-6),
                'النوع': typeInfo.label,
                'المبلغ': payment.amount || 0,
                'التاريخ': AppUtils.formatDate(payment.date),
                'المقيم': resident ? resident.name : '',
                'طريقة الدفع': payment.paymentMethod ? this.getPaymentMethodLabel(payment.paymentMethod) : '',
                'الحالة': statusInfo.label,
                'الوصف': payment.description || '',
                'تاريخ الإنشاء': AppUtils.formatDate(payment.createdAt)
            };
        });

        AppUtils.exportToCSV(exportData, `payments-${new Date().toISOString().split('T')[0]}`);
        app.showNotification('تم تصدير البيانات بنجاح', 'success');
    }
};

// Add payments-specific styles
const paymentsStyles = document.createElement('style');
paymentsStyles.textContent = `
    .payments-container {
        max-width: 1400px;
        margin: 0 auto;
    }

    .summary-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;
        margin-bottom: 30px;
    }

    .summary-card {
        background: var(--bg-secondary);
        border-radius: 16px;
        padding: 20px;
        display: flex;
        align-items: center;
        gap: 16px;
        border: 1px solid var(--border-color);
    }

    .summary-card.income .summary-icon {
        background: rgba(72, 187, 120, 0.1);
        color: var(--success-color);
    }

    .summary-card.expense .summary-icon {
        background: rgba(245, 101, 101, 0.1);
        color: var(--error-color);
    }

    .summary-card.rent .summary-icon {
        background: rgba(66, 153, 225, 0.1);
        color: var(--info-color);
    }

    .summary-card.pending .summary-icon {
        background: rgba(237, 137, 54, 0.1);
        color: var(--warning-color);
    }

    .summary-card.profit .summary-icon {
        background: rgba(72, 187, 120, 0.1);
        color: var(--success-color);
    }

    .summary-card.loss .summary-icon {
        background: rgba(245, 101, 101, 0.1);
        color: var(--error-color);
    }

    .summary-icon {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        flex-shrink: 0;
    }

    .summary-content h3 {
        margin: 0 0 4px 0;
        font-size: 1.4rem;
        font-weight: 600;
        color: var(--text-primary);
    }

    .summary-content p {
        margin: 0;
        color: var(--text-muted);
        font-size: 0.9rem;
    }

    .payments-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        gap: 20px;
        margin-bottom: 20px;
    }

    .payment-card {
        background: var(--bg-secondary);
        border-radius: 16px;
        padding: 20px;
        transition: all 0.3s ease;
        border: 1px solid var(--border-color);
    }

    .payment-card:hover {
        transform: translateY(-4px);
        box-shadow: 
            12px 12px 20px var(--shadow-dark),
            -12px -12px 20px var(--shadow-light);
    }

    .payment-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--border-color);
    }

    .payment-type {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 500;
    }

    .type-payment {
        background: rgba(66, 153, 225, 0.1);
        color: var(--info-color);
    }

    .type-rent {
        background: rgba(72, 187, 120, 0.1);
        color: var(--success-color);
    }

    .type-utilities {
        background: rgba(237, 137, 54, 0.1);
        color: var(--warning-color);
    }

    .type-maintenance {
        background: rgba(159, 122, 234, 0.1);
        color: var(--purple-color);
    }

    .type-deposit {
        background: rgba(56, 178, 172, 0.1);
        color: var(--teal-color);
    }

    .type-income {
        background: rgba(72, 187, 120, 0.1);
        color: var(--success-color);
    }

    .type-expense {
        background: rgba(245, 101, 101, 0.1);
        color: var(--error-color);
    }

    .payment-status {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 500;
    }

    .status-paid {
        background: rgba(72, 187, 120, 0.1);
        color: var(--success-color);
    }

    .status-pending {
        background: rgba(237, 137, 54, 0.1);
        color: var(--warning-color);
    }

    .status-overdue {
        background: rgba(245, 101, 101, 0.1);
        color: var(--error-color);
    }

    .payment-amount {
        font-size: 1.5rem;
        font-weight: 700;
        margin-bottom: 12px;
        text-align: center;
        padding: 12px;
        border-radius: 8px;
        background: var(--bg-primary);
    }

    .payment-amount.positive {
        color: var(--success-color);
    }

    .payment-amount.negative {
        color: var(--error-color);
    }

    .payment-details {
        margin-bottom: 16px;
    }

    .payment-actions {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
        padding-top: 12px;
        border-top: 1px solid var(--border-color);
        flex-wrap: wrap;
    }

    .payment-details-view {
        max-width: 600px;
    }

    .payment-header-view {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 16px;
        border-bottom: 2px solid var(--border-color);
    }

    .payment-type-large {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 16px;
        border-radius: 25px;
        font-size: 1.1rem;
        font-weight: 600;
    }

    .payment-amount-large {
        font-size: 1.8rem;
        font-weight: 700;
    }

    .payment-status-large {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 16px;
        border-radius: 20px;
        font-size: 1rem;
        font-weight: 500;
        margin-top: 12px;
    }

    .payment-description {
        padding: 16px;
        background: var(--bg-primary);
        border-radius: 8px;
        border-right: 4px solid var(--primary-color);
        line-height: 1.6;
    }

    .payment-description p {
        margin: 0;
        color: var(--text-secondary);
    }

    @media (max-width: 768px) {
        .summary-cards {
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        }

        .payments-grid {
            grid-template-columns: 1fr;
        }

        .payment-header {
            flex-direction: column;
            gap: 12px;
            align-items: flex-start;
        }

        .payment-actions {
            justify-content: center;
        }

        .form-grid {
            grid-template-columns: 1fr;
        }

        .payment-header-view {
            flex-direction: column;
            gap: 12px;
            align-items: flex-start;
        }
    }

    @media (max-width: 480px) {
        .summary-cards {
            grid-template-columns: 1fr;
        }

        .payment-actions {
            gap: 4px;
        }

        .payment-actions .btn {
            padding: 6px 8px;
            font-size: 0.8rem;
        }
    }
`;
document.head.appendChild(paymentsStyles);
