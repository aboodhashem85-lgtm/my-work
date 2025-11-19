/**
 * Application Core Functionality and Utilities
 * Shared functions and utilities used across the application
 */

window.AppUtils = {
  /**
   * Password utilities using Web Crypto API (PBKDF2 with SHA-256)
   * Produces hex-encoded salt and derived key for storage.
   */
  async generateSalt(length = 16) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  },
  async deriveKey(password, saltHex, iterations = 100000, keyLen = 32) {
    const enc = new TextEncoder();
    const passwordKey = await crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveBits"],
    );
    const salt = new Uint8Array(
      saltHex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)),
    );
    const derivedBits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
      passwordKey,
      keyLen * 8,
    );
    const derived = new Uint8Array(derivedBits);
    return Array.from(derived)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  },

  async hashPassword(password) {
    const salt = await this.generateSalt(16);
    const hash = await this.deriveKey(password, salt);
    return { salt, hash };
  },

  async verifyPassword(password, salt, expectedHash) {
    const hash = await this.deriveKey(password, salt);
    return hash === expectedHash;
  },

  /** Generate a numeric code of given length (string) */
  generateNumericCode(length = 6) {
    let code = "";
    for (let i = 0; i < length; i++)
      code += Math.floor(Math.random() * 10).toString();
    return code;
  },

  /**
   * Helper to call server proxy APIs configured in settings (smsProxyEndpoint + smsApiKey)
   * Returns parsed JSON or throws on network error.
   */
  async serverRequest(
    path,
    { method = "GET", body = null, headers = {} } = {},
  ) {
    const settings = await db.getSettings();
    const proxy =
      settings && settings.smsProxyEndpoint
        ? settings.smsProxyEndpoint.replace(/\/$/, "")
        : null;
    const apiKey = settings && settings.smsApiKey ? settings.smsApiKey : null;
    if (!proxy) throw new Error("Proxy endpoint not configured");

    const url = proxy + path;
    const opts = { method, headers: Object.assign({}, headers) };
    if (apiKey) opts.headers["X-API-KEY"] = apiKey;
    if (body) {
      opts.headers["Content-Type"] = "application/json";
      opts.body = JSON.stringify(body);
    }

    const res = await fetch(url, opts);
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const err = data && data.error ? data.error : `HTTP ${res.status}`;
      const e = new Error(err);
      e.response = res;
      e.data = data;
      throw e;
    }
    return data;
  },
  /**
   * Offline persistent request queue for retrying failed server calls.
   * Entries are stored in localStorage under key 'bms_request_queue'.
   */
  RequestQueue: {
    storageKey: "bms_request_queue",
    running: false,
    maxRetries: 5,

    _loadQueue() {
      try {
        const raw = localStorage.getItem(this.storageKey);
        return raw ? JSON.parse(raw) : [];
      } catch (err) {
        console.warn("Failed to load request queue", err);
        return [];
      }
    },

    _saveQueue(queue) {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(queue));
      } catch (err) {
        console.warn("Failed to save request queue", err);
      }
    },

    enqueue(entry) {
      const q = this._loadQueue();
      entry.id =
        entry.id ||
        "q-" +
          Date.now().toString(36) +
          "-" +
          Math.random().toString(36).substr(2, 6);
      entry.createdAt = entry.createdAt || new Date().toISOString();
      entry.retries = entry.retries || 0;
      entry.nextAttempt = entry.nextAttempt || Date.now();
      q.push(entry);
      this._saveQueue(q);
      return entry.id;
    },

    async processOnce() {
      const q = this._loadQueue();
      if (!q.length) return;

      const now = Date.now();
      let changed = false;
      for (let i = 0; i < q.length; i++) {
        const item = q[i];
        if (item.nextAttempt && item.nextAttempt > now) continue;

        try {
          // Attempt the request
          const opts = {
            method: item.method || "GET",
            body: item.body || null,
            headers: item.headers || {},
          };
          // Note: serverRequest expects JSON bodies; keep legacy behavior
          const res = await AppUtils.serverRequest(item.path, opts);

          // On success remove from queue
          q.splice(i, 1);
          i--;
          changed = true;

          // Optional: allow callbacks to sync returned data locally (not implemented)
          continue;
        } catch (err) {
          // On error, increase retry count and schedule next attempt (exponential backoff)
          item.retries = (item.retries || 0) + 1;
          if (item.retries >= this.maxRetries) {
            // Give up - mark as failed and remove
            console.warn("Dropping queued request after max retries", item);
            q.splice(i, 1);
            i--;
            changed = true;
            continue;
          }
          const backoffSeconds = Math.min(3600, Math.pow(2, item.retries) * 5);
          item.nextAttempt = Date.now() + backoffSeconds * 1000;
          changed = true;
          console.warn("Queued request failed, will retry", item);
        }
      }

      if (changed) this._saveQueue(q);
    },

    start(intervalMs = 30000) {
      if (this.running) return;
      this.running = true;
      // process immediately then on interval
      this.processOnce().catch((err) =>
        console.warn("RequestQueue initial process error", err),
      );
      this._timer = setInterval(
        () =>
          this.processOnce().catch((err) =>
            console.warn("RequestQueue process error", err),
          ),
        intervalMs,
      );
    },

    stop() {
      if (this._timer) clearInterval(this._timer);
      this.running = false;
    },
  },

  /**
   * Try to send to server; on network error enqueue for later retry.
   * Returns server response on success, or { queued: true, queueId } when enqueued.
   */
  async enqueueOrSend(
    path,
    { method = "GET", body = null, headers = {} } = {},
  ) {
    try {
      const res = await this.serverRequest(path, { method, body, headers });
      return res;
    } catch (err) {
      console.warn(
        "Network/server request failed, enqueuing for later retry",
        path,
        err.message || err,
      );
      const queueEntry = { path, method, body, headers };
      const id = this.RequestQueue.enqueue(queueEntry);
      // Ensure background processor is running
      this.RequestQueue.start();
      try {
        if (
          window.portalApp &&
          typeof window.portalApp.updateQueueIndicator === "function"
        )
          window.portalApp.updateQueueIndicator();
      } catch (e) {}
      return { queued: true, queueId: id };
    }
  },

  /**
   * Send FormData (multipart) to the server. If network/send fails, convert attached files to DataURL
   * and enqueue as a JSON body to preserve offline retry. Returns server response or { queued: true, queueId }.
   */
  async sendFormData(path, formData) {
    const settings = await db.getSettings();
    const proxy =
      settings && settings.smsProxyEndpoint
        ? settings.smsProxyEndpoint.replace(/\/$/, "")
        : null;
    const apiKey = settings && settings.smsApiKey ? settings.smsApiKey : null;

    if (!proxy) throw new Error("Proxy endpoint not configured");

    try {
      const headers = {};
      if (apiKey) headers["X-API-KEY"] = apiKey;
      const res = await fetch(proxy + path, {
        method: "POST",
        headers,
        body: formData,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok)
        throw new Error(data && data.error ? data.error : `HTTP ${res.status}`);
      return data;
    } catch (err) {
      // On failure, convert formData to JSON body: convert any File entries to DataURL
      const jsonBody = {};
      for (const pair of formData.entries()) {
        const [key, value] = pair;
        if (value instanceof File) {
          try {
            const dataUrl = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = (e) => resolve(e.target.result);
              reader.onerror = () => reject(new Error("Failed to read file"));
              reader.readAsDataURL(value);
            });
            jsonBody[key + "DataUrl"] = dataUrl;
          } catch (e) {
            console.warn("Failed to convert file to DataURL while queuing", e);
          }
        } else {
          // For multiple values with same key, this will overwrite — acceptable for our usage
          jsonBody[key] = value;
        }
      }

      return await this.enqueueOrSend(path, { method: "POST", body: jsonBody });
    }
  },

  // Auto-start the background RequestQueue processor
  _ensureQueueStarted() {
    try {
      if (this.RequestQueue && !this.RequestQueue.running)
        this.RequestQueue.start();
    } catch (err) {
      console.warn("Failed to start request queue", err);
    }
  },

  /**
   * Format currency value
   */
  /**
   * Formats a numeric amount as a currency string using application settings.
   * If no currency is provided, uses the default currency from settings.
   * @param {number} amount - The amount to format.
   * @param {string|null} [currency=null] - The currency symbol or name to use.
   * @returns {Promise<string>} Formatted currency string (e.g., "1,000 ريال").
   */
  async formatCurrency(amount, currency = null) {
    if (!currency) {
      const settings = await db.getSettings();
      currency = settings.currency || "ريال";
    }

    return `${amount.toLocaleString("ar-SA")} ${currency}`;
  },

  /**
   * Format date based on settings
   */
  async formatDate(dateString, format = "full") {
    const date = new Date(dateString);
    const settings = await db.getSettings();
    const dateFormat = settings.dateFormat || "gregorian";

    const options = {
      full: {
        year: "numeric",
        month: "long",
        day: "numeric",
      },
      short: {
        year: "numeric",
        month: "short",
        day: "numeric",
      },
      monthYear: {
        year: "numeric",
        month: "long",
      },
    };

    if (dateFormat === "hijri") {
      // For Hijri dates, we'll use a simple approximation
      // In a real application, you would use a proper Hijri calendar library
      return date.toLocaleDateString("ar-SA-u-ca-islamic", options[format]);
    } else {
      return date.toLocaleDateString("ar-SA", options[format]);
    }
  },

  /**
   * Validate Arabic name
   */
  validateArabicName(name) {
    const arabicRegex = /^[\u0600-\u06FF\s]+$/;
    return arabicRegex.test(name.trim()) && name.trim().length >= 2;
  },

  /**
   * Validate phone number
   */
  validatePhone(phone) {
    const phoneRegex = /^(\+966|0)?[5-9]\d{8}$/;
    return phoneRegex.test(phone.replace(/\s/g, ""));
  },

  /**
   * Validate email
   */
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Generate unique reference number
   */
  generateReference(prefix = "REF") {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `${prefix}-${timestamp}-${random}`.toUpperCase();
  },

  /**
   * Calculate age from birth date
   */
  calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }

    return age;
  },

  /**
   * Get days between two dates
   */
  getDaysBetween(date1, date2) {
    const oneDay = 24 * 60 * 60 * 1000;
    const firstDate = new Date(date1);
    const secondDate = new Date(date2);

    return Math.round(Math.abs((firstDate - secondDate) / oneDay));
  },

  /**
   * Check if date is in the past
   */
  isDatePast(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return date < today;
  },

  /**
   * Check if date is within range
   */
  isDateWithinDays(dateString, days) {
    const date = new Date(dateString);
    const today = new Date();
    const targetDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);

    return date <= targetDate && date >= today;
  },

  /**
   * Sanitize HTML content
   */
  sanitizeHtml(html) {
    const div = document.createElement("div");
    div.textContent = html;
    return div.innerHTML;
  },

  /**
   * Debounce function
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * Deep clone object
   */
  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  },

  // Provide a lightweight global notification helper for legacy callers.
  // This forwards to window.app.showNotification when the main app is initialized,
  // otherwise it attempts to use advancedFeatures or the portal toast container.
  showNotification(message, type = "info", duration = 5000) {
    try {
      if (window.app && typeof window.app.showNotification === "function") {
        window.app.showNotification(message, type, duration);
        return;
      }

      if (
        window.advancedFeatures &&
        typeof window.advancedFeatures.showNotification === "function"
      ) {
        window.advancedFeatures.showNotification(message, type, duration);
        return;
      }

      // Last resort: create portal-style toast container
      let container = document.querySelector(".bms-toast-container");
      if (!container) {
        container = document.createElement("div");
        container.className = "bms-toast-container";
        container.style.cssText =
          "position: fixed; left: 16px; bottom: 16px; z-index: 1200; display:flex; flex-direction:column; gap:8px;";
        document.body.appendChild(container);
      }

      const toast = document.createElement("div");
      toast.className = `bms-toast ${type}`;
      toast.textContent = message;
      container.appendChild(toast);
      if (duration > 0) setTimeout(() => toast.remove(), duration);
    } catch (err) {
      console.warn("AppUtils.showNotification failed", err);
    }
  },

  /**
   * Generate PDF content for printing
   */
  generatePrintContent(title, content, styles = "") {
    return `
            <!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <title>${title}</title>
                <style>
                    body {
                        font-family: 'Arial', sans-serif;
                        direction: rtl;
                        margin: 0;
                        padding: 20px;
                        background: white;
                        color: black;
                    }
                    .header {
                        text-align: center;
                        border-bottom: 2px solid #333;
                        padding-bottom: 20px;
                        margin-bottom: 30px;
                    }
                    .header h1 {
                        margin: 0;
                        font-size: 24px;
                        color: #333;
                    }
                    .header p {
                        margin: 5px 0;
                        color: #666;
                    }
                    .content {
                        line-height: 1.6;
                    }
                    .footer {
                        margin-top: 50px;
                        padding-top: 20px;
                        border-top: 1px solid #ccc;
                        text-align: center;
                        color: #666;
                        font-size: 12px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 20px 0;
                    }
                    th, td {
                        border: 1px solid #ddd;
                        padding: 8px;
                        text-align: right;
                    }
                    th {
                        background-color: #f5f5f5;
                        font-weight: bold;
                    }
                    .signature-section {
                        margin-top: 50px;
                        display: flex;
                        justify-content: space-between;
                    }
                    .signature-box {
                        width: 200px;
                        text-align: center;
                    }
                    .signature-line {
                        border-top: 1px solid #333;
                        margin-top: 50px;
                        padding-top: 10px;
                    }
                    ${styles}
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${db.getSettings().buildingName || "نظام إدارة المباني"}</h1>
                    <p>${db.getSettings().buildingAddress || ""}</p>
                    <p>${db.getSettings().buildingPhone || ""}</p>
                    <p>تاريخ الطباعة: ${this.formatDate(new Date().toISOString())}</p>
                </div>
                <div class="content">
                    ${content}
                </div>
                <div class="footer">
                    <p>تم إنشاء هذا المستند بواسطة نظام إدارة المباني السكنية</p>
                </div>
            </body>
            </html>
        `;
  },

  /**
   * Print document
   */
  printDocument(title, content, styles = "") {
    const printContent = this.generatePrintContent(title, content, styles);
    const printWindow = window.open("", "_blank");

    printWindow.document.write(printContent);
    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  },

  /**
   * Export data to CSV
   */
  exportToCSV(data, filename) {
    if (!data || data.length === 0) {
      app.showNotification("لا توجد بيانات للتصدير", "warning");
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header] || "";
            return `"${value.toString().replace(/"/g, '""')}"`;
          })
          .join(","),
      ),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  /**
   * Handle file upload
   */
  handleFileUpload(
    file,
    allowedTypes = ["image/*"],
    maxSize = 5 * 1024 * 1024,
  ) {
    return new Promise((resolve, reject) => {
      // Check file type
      const isValidType = allowedTypes.some((type) => {
        if (type.endsWith("/*")) {
          return file.type.startsWith(type.slice(0, -1));
        }
        return file.type === type;
      });

      if (!isValidType) {
        reject(new Error("نوع الملف غير مدعوم"));
        return;
      }

      // Check file size
      if (file.size > maxSize) {
        reject(
          new Error(
            `حجم الملف كبير جداً. الحد الأقصى ${maxSize / (1024 * 1024)} ميجابايت`,
          ),
        );
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error("خطأ في قراءة الملف"));
      reader.readAsDataURL(file);
    });
  },

  /**
   * Create file input for upload
   */
  createFileInput(accept = "image/*", multiple = false) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.multiple = multiple;
    input.style.display = "none";

    document.body.appendChild(input);

    return new Promise((resolve, reject) => {
      input.onchange = async (e) => {
        const files = Array.from(e.target.files);
        document.body.removeChild(input);

        if (files.length === 0) {
          reject(new Error("لم يتم اختيار ملف"));
          return;
        }

        try {
          if (multiple) {
            const results = await Promise.all(
              files.map((file) => this.handleFileUpload(file)),
            );
            resolve(results);
          } else {
            const result = await this.handleFileUpload(files[0]);
            resolve(result);
          }
        } catch (error) {
          reject(error);
        }
      };

      input.click();
    });
  },

  /**
   * Format file size
   */
  formatFileSize(bytes) {
    if (bytes === 0) return "0 بايت";

    const k = 1024;
    const sizes = ["بايت", "كيلوبايت", "ميجابايت", "جيجابايت"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  },

  /**
   * Generate QR Code (simple implementation)
   */
  generateQRCode(text, size = 200) {
    // This is a placeholder for QR code generation
    // In a real application, you would use a QR code library
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    // Simple pattern for demonstration
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, size, size);

    ctx.fillStyle = "#fff";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillText("QR Code", size / 2, size / 2);
    ctx.fillText(text.substring(0, 20), size / 2, size / 2 + 20);

    return canvas.toDataURL();
  },

  /**
   * Calculate contract duration
   */
  calculateContractDuration(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const years = end.getFullYear() - start.getFullYear();
    const months = end.getMonth() - start.getMonth();
    const days = end.getDate() - start.getDate();

    let totalMonths = years * 12 + months;
    if (days < 0) {
      totalMonths--;
    }

    if (totalMonths >= 12) {
      const contractYears = Math.floor(totalMonths / 12);
      const remainingMonths = totalMonths % 12;

      if (remainingMonths === 0) {
        return `${contractYears} ${contractYears === 1 ? "سنة" : "سنوات"}`;
      } else {
        return `${contractYears} ${contractYears === 1 ? "سنة" : "سنوات"} و ${remainingMonths} ${remainingMonths === 1 ? "شهر" : "أشهر"}`;
      }
    } else {
      return `${totalMonths} ${totalMonths === 1 ? "شهر" : "أشهر"}`;
    }
  },

  /**
   * Get contract status
   */
  getContractStatus(contract) {
    const today = new Date();
    const endDate = new Date(contract.endDate);
    const startDate = new Date(contract.startDate);

    if (today < startDate) {
      return { status: "upcoming", label: "قادم", class: "text-info" };
    } else if (today > endDate) {
      return { status: "expired", label: "منتهي", class: "text-danger" };
    } else {
      const daysUntilExpiry = Math.ceil(
        (endDate - today) / (1000 * 60 * 60 * 24),
      );

      if (daysUntilExpiry <= 30) {
        return {
          status: "expiring",
          label: "قارب على الانتهاء",
          class: "text-warning",
        };
      } else {
        return { status: "active", label: "نشط", class: "text-success" };
      }
    }
  },

  /**
   * Get payment status
   */
  getPaymentStatus(payment) {
    const today = new Date();
    const dueDate = new Date(payment.dueDate);

    if (payment.status === "paid") {
      return { status: "paid", label: "مدفوع", class: "text-success" };
    } else if (today > dueDate) {
      const daysOverdue = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));
      return {
        status: "overdue",
        label: `متأخر ${daysOverdue} يوم`,
        class: "text-danger",
      };
    } else {
      const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

      if (daysUntilDue <= 7) {
        return {
          status: "due_soon",
          label: `مستحق خلال ${daysUntilDue} يوم`,
          class: "text-warning",
        };
      } else {
        return { status: "pending", label: "معلق", class: "text-info" };
      }
    }
  },

  /**
   * Get maintenance status
   */
  getMaintenanceStatus(maintenance) {
    const statusMap = {
      pending: { label: "معلق", class: "text-warning" },
      in_progress: { label: "قيد التنفيذ", class: "text-info" },
      completed: { label: "مكتمل", class: "text-success" },
      cancelled: { label: "ملغي", class: "text-danger" },
    };

    return statusMap[maintenance.status] || statusMap.pending;
  },

  /**
   * Search and filter utilities
   */
  createSearchFilter(searchTerm, fields) {
    if (!searchTerm) return () => true;

    const term = searchTerm.toLowerCase();

    return (item) => {
      return fields.some((field) => {
        const value = item[field];
        return value && value.toString().toLowerCase().includes(term);
      });
    };
  },

  /**
   * Sort utilities
   */
  createSorter(field, direction = "asc") {
    return (a, b) => {
      let aVal = a[field];
      let bVal = b[field];

      // Handle dates
      if (
        aVal &&
        typeof aVal === "string" &&
        aVal.match(/^\d{4}-\d{2}-\d{2}/)
      ) {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }

      // Handle numbers
      if (typeof aVal === "string" && !isNaN(aVal)) {
        aVal = parseFloat(aVal);
        bVal = parseFloat(bVal);
      }

      if (aVal < bVal) return direction === "asc" ? -1 : 1;
      if (aVal > bVal) return direction === "asc" ? 1 : -1;
      return 0;
    };
  },

  /**
   * Pagination utilities
   */
  paginate(array, page, pageSize) {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    return {
      data: array.slice(startIndex, endIndex),
      totalPages: Math.ceil(array.length / pageSize),
      currentPage: page,
      totalItems: array.length,
      hasNext: endIndex < array.length,
      hasPrev: page > 1,
    };
  },

  /**
   * Create pagination controls
   */
  createPaginationControls(pagination, onPageChange) {
    if (pagination.totalPages <= 1) return "";

    let controls = '<div class="pagination-controls">';

    // Previous button
    if (pagination.hasPrev) {
      controls += `<button class="btn btn-sm btn-secondary" onclick="${onPageChange}(${pagination.currentPage - 1})">
                <i class="fas fa-chevron-right"></i> السابق
            </button>`;
    }

    // Page numbers
    const startPage = Math.max(1, pagination.currentPage - 2);
    const endPage = Math.min(pagination.totalPages, pagination.currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
      const isActive = i === pagination.currentPage;
      controls += `<button class="btn btn-sm ${isActive ? "btn-primary" : "btn-secondary"}" 
                onclick="${onPageChange}(${i})">${i}</button>`;
    }

    // Next button
    if (pagination.hasNext) {
      controls += `<button class="btn btn-sm btn-secondary" onclick="${onPageChange}(${pagination.currentPage + 1})">
                التالي <i class="fas fa-chevron-left"></i>
            </button>`;
    }

    controls += "</div>";

    return controls;
  },
};

// Add pagination styles
const paginationStyles = document.createElement("style");
paginationStyles.textContent = `
    .pagination-controls {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 8px;
        margin: 20px 0;
        flex-wrap: wrap;
    }
    
    .pagination-controls .btn {
        min-width: 40px;
    }
    
    @media (max-width: 480px) {
        .pagination-controls {
            gap: 4px;
        }
        
        .pagination-controls .btn {
            padding: 6px 12px;
            font-size: 0.8rem;
        }
    }
`;
document.head.appendChild(paginationStyles);
