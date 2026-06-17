// Common Application Utilities and State Controller

// Initialize LocalStorage database if empty or if schema reset is required
function initDatabase() {
    const hasOldTargets = localStorage.getItem('ppm_targets') && 
                          (localStorage.getItem('ppm_targets').includes('G8X-013 Mirror L') || 
                           localStorage.getItem('ppm_targets').includes('"target":15'));
                           
    const has2026Data = localStorage.getItem('ppm_data') && 
                        localStorage.getItem('ppm_data').includes('2026-03-15');
                           
        const hasProjectInClaims = localStorage.getItem('claims_data') && 
                               localStorage.getItem('claims_data').includes('"project":');
    
    const hasReworkWaitType = localStorage.getItem('rework_data') && 
                              localStorage.getItem('rework_data').includes('Waiting');
                            
    if (!localStorage.getItem('bmw_db_initialized') || hasOldTargets || !has2026Data || !hasProjectInClaims || !hasReworkWaitType) {
        localStorage.clear(); // Safe clear since this is a demonstration local app
        
        localStorage.setItem('ppm_targets', JSON.stringify(MOCK_DATA.ppm_targets));
        localStorage.setItem('ppm_data', JSON.stringify(MOCK_DATA.ppm_data));
        localStorage.setItem('claims_data', JSON.stringify(MOCK_DATA.claims_data));
        localStorage.setItem('yield_targets', JSON.stringify(MOCK_DATA.yield_targets));
        localStorage.setItem('yield_fpy_data', JSON.stringify(MOCK_DATA.yield_fpy_data));
        localStorage.setItem('yield_fy_data', JSON.stringify(MOCK_DATA.yield_fy_data));
        localStorage.setItem('wip_targets', JSON.stringify(MOCK_DATA.wip_targets));
        localStorage.setItem('wip_data', JSON.stringify(MOCK_DATA.wip_data));
        localStorage.setItem('rework_data', JSON.stringify(MOCK_DATA.rework_data));
        localStorage.setItem('scrap_data', JSON.stringify(MOCK_DATA.scrap_data));
        localStorage.setItem('scrap_targets', JSON.stringify(MOCK_DATA.scrap_targets));
        localStorage.setItem('scrap_daily', JSON.stringify(MOCK_DATA.scrap_daily));
        localStorage.setItem('scrap_inven', JSON.stringify(MOCK_DATA.scrap_inven));
        
        localStorage.setItem('bmw_db_initialized', 'true');
        console.log("Database initialized/reset with SMR/SMP seed data.");
    }
    // Perform database health check, date repair, and deduplication
    cleanAndDeduplicateDB();
}

// DB Schemas for compression to array format
const DB_SCHEMAS = {
    scrap_data: ["id", "date", "process_status", "erp_code", "qty"],
    rework_data: ["date", "process_status", "erp_code", "qty"],
    wip_data: ["date", "type", "total_wip", "pending_rework", "active_wip"],
    yield_fpy_data: ["date", "project", "process", "ins", "ok", "yield"],
    yield_fy_data: ["date", "project", "process", "ins", "ok", "yield"],
    ppm_data: ["date", "customer", "code", "defect_qty", "shipped_qty"],
    claims_data: ["date", "project", "claim_type", "location", "qty"],
    scrap_daily: ["date", "process", "erp_code", "defect", "qty"],
    scrap_inven: ["date", "erp_code", "input_qty"]
};

// Compression Maps
const PROCESS_MAP = ["-", "layup", "trimming", "gluing", "sanding", "drysanding", "painting", "polishing"];
const STATUS_MAP = ["-", "input", "ok", "scrap", "total out"];
const ERP_MAP = ["g8x-011-102", "g8x-013-103", "g8x-015-104", "g8x-017-105", "g8x-019-106"];

function compressProcessStatus(val) {
    if (!val) return val;
    const parts = val.split(':');
    const proc = parts[0].trim().toLowerCase().replace(/\s/g, ''); // dry sanding -> drysanding
    const sub = parts[1] ? parts[1].trim().toLowerCase() : '';
    
    const pIdx = PROCESS_MAP.indexOf(proc);
    if (pIdx === -1) return val;
    
    if (sub) {
        const sIdx = STATUS_MAP.indexOf(sub);
        if (sIdx !== -1) {
            return `${pIdx}:${sIdx}`;
        }
    }
    return `${pIdx}`;
}

function decompressProcessStatus(val) {
    if (typeof val !== 'string' && typeof val !== 'number') return val;
    const parts = String(val).split(':');
    const pIdx = parseInt(parts[0]);
    if (isNaN(pIdx) || pIdx < 0 || pIdx >= PROCESS_MAP.length) return val;
    
    const procRaw = PROCESS_MAP[pIdx];
    // Drysanding -> Drysanding (matches standard casing)
    const proc = procRaw.charAt(0).toUpperCase() + procRaw.slice(1);
    
    if (parts[1]) {
        const sIdx = parseInt(parts[1]);
        if (!isNaN(sIdx) && sIdx >= 0 && sIdx < STATUS_MAP.length) {
            let sub = STATUS_MAP[sIdx];
            if (sub === 'ok') sub = 'OK';
            else if (sub === 'total out') sub = 'Total Out';
            else if (sub === '-') sub = '-';
            else sub = sub.charAt(0).toUpperCase() + sub.slice(1);
            return `${proc}:${sub}`;
        }
    }
    return proc;
}

function compressErp(val) {
    if (!val) return val;
    const clean = val.trim().toLowerCase();
    const idx = ERP_MAP.indexOf(clean);
    return idx !== -1 ? idx : val;
}

function decompressErp(val) {
    if (typeof val === 'number') {
        if (val >= 0 && val < ERP_MAP.length) {
            return ERP_MAP[val].toUpperCase();
        }
    }
    return val;
}

// Database Helpers
const db = {
    get: (key) => {
        const data = localStorage.getItem(key);
        if (!data) return [];
        try {
            const list = JSON.parse(data);
            if (!Array.isArray(list)) return [];
            
            // Decompress if stored as array of arrays
            if (list.length > 0 && Array.isArray(list[0])) {
                const schema = DB_SCHEMAS[key];
                if (schema) {
                    return list.map(arr => {
                        const obj = {};
                        schema.forEach((k, idx) => {
                            let val = arr[idx];
                            if (k === 'process_status') {
                                val = decompressProcessStatus(val);
                            } else if (k === 'erp_code') {
                                val = decompressErp(val);
                            }
                            obj[k] = val;
                        });
                        return obj;
                    });
                }
            }
            return list;
        } catch (e) {
            console.error("Failed to parse database key " + key, e);
            return [];
        }
    },
    set: (key, val) => {
        try {
            let valToStore = val;
            const schema = DB_SCHEMAS[key];
            if (schema && Array.isArray(val)) {
                valToStore = val.map(obj => {
                    return schema.map(k => {
                        let cell = obj[k];
                        if (k === 'process_status') {
                            cell = compressProcessStatus(cell);
                        } else if (k === 'erp_code') {
                            cell = compressErp(cell);
                        }
                        return cell;
                    });
                });
            }
            
            localStorage.setItem(key, JSON.stringify(valToStore));
            return true;
        } catch (e) {
            console.error("LocalStorage setItem failed:", e);
            if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22) {
                toast.error("Browser Storage is FULL! Please clear database history or reduce upload file size.");
            } else {
                toast.error("Storage Error: " + e.message);
            }
            return false;
        }
    }
};

// Database self-healing, date repair, and deduplication helper
function cleanAndDeduplicateDB() {
    const keys = [
        'scrap_data', 'rework_data', 'wip_data', 
        'yield_fpy_data', 'yield_fy_data', 'ppm_data', 
        'claims_data', 'scrap_daily', 'scrap_inven'
    ];
    let totalCleaned = 0;
    
    keys.forEach(key => {
        try {
            const list = db.get(key);
            if (!list || list.length === 0) return;
            
            const seen = new Set();
            const cleanedList = [];
            
            list.forEach(item => {
                if (!item) return;
                
                // Normalize/repair dates to standard YYYY-MM-DD
                if (item.date) {
                    item.date = normalizeDate(item.date);
                }
                
                // Drop the record if the date is invalid to prevent quota bloat
                if (!item.date || !item.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    return; 
                }
                
                // Generate unique key to prevent duplicate records
                let dupKey = '';
                if (key === 'scrap_data') {
                    dupKey = `${item.date}_${item.process_status}_${item.erp_code}_${item.qty}`;
                } else if (key === 'rework_data') {
                    dupKey = `${item.date}_${item.process_status}_${item.erp_code}_${item.qty}`;
                } else if (key === 'wip_data') {
                    dupKey = `${item.date}_${item.type}_${item.total_wip}_${item.pending_rework}_${item.active_wip}`;
                } else if (key === 'yield_fpy_data' || key === 'yield_fy_data') {
                    dupKey = `${item.date}_${item.project}_${item.process}_${item.ins}_${item.ok}`;
                } else if (key === 'ppm_data') {
                    dupKey = `${item.date}_${item.customer}_${item.code}_${item.defect_qty}_${item.shipped_qty}`;
                } else if (key === 'claims_data') {
                    dupKey = `${item.date}_${item.project}_${item.claim_type}_${item.location}_${item.qty}`;
                } else if (key === 'scrap_daily') {
                    dupKey = `${item.date}_${item.process}_${item.erp_code}_${item.defect}_${item.qty}`;
                } else if (key === 'scrap_inven') {
                    dupKey = `${item.date}_${item.erp_code}_${item.input_qty}`;
                } else {
                    dupKey = JSON.stringify(item);
                }
                
                if (!seen.has(dupKey)) {
                    seen.add(dupKey);
                    cleanedList.push(item);
                }
            });
            
            // Limit size of logs for each key to prevent exceeding localstorage limits in future
            // With dictionary compression, 60k rows easily fit in 2.5MB (limit is 5MB)
            const maxLogLimit = 60000;
            if (cleanedList.length > maxLogLimit) {
                cleanedList.sort((a, b) => new Date(b.date) - new Date(a.date));
                const prunedList = cleanedList.slice(0, maxLogLimit);
                db.set(key, prunedList);
                totalCleaned += (list.length - prunedList.length);
            } else if (cleanedList.length !== list.length) {
                db.set(key, cleanedList);
                totalCleaned += (list.length - cleanedList.length);
            }
        } catch (e) {
            console.error(`Failed to clean database key ${key}:`, e);
        }
    });
    
    if (totalCleaned > 0) {
        console.log(`Database Pruning: Cleaned up ${totalCleaned} duplicate/invalid/excessive records.`);
    }
}

// SVG for classic circular BMW Logo
const BMW_LOGO_SVG = `
<svg class="bmw-logo-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <!-- Outer thick dark grey border -->
    <circle cx="50" cy="50" r="48" fill="#7f7f7f" />
    <!-- White inner ring -->
    <circle cx="50" cy="50" r="46" fill="#ffffff" />
    
    <!-- Outer border of inner core -->
    <circle cx="50" cy="50" r="30" fill="#7f7f7f" />
    <!-- Inner core (quadrants) -->
    <circle cx="50" cy="50" r="29" fill="#ffffff" />
    
    <!-- Quadrants (0 deg rotation) -->
    <!-- Top-left: Blue -->
    <path d="M 50,50 L 50,21 A 29,29 0 0,0 21,50 Z" fill="#0066b2" />
    <!-- Bottom-right: Blue -->
    <path d="M 50,50 L 50,79 A 29,29 0 0,0 79,50 Z" fill="#0066b2" />
    
    <!-- Separating lines inside inner core -->
    <line x1="50" y1="21" x2="50" y2="79" stroke="#7f7f7f" stroke-width="1.5" />
    <line x1="21" y1="50" x2="79" y2="50" stroke="#7f7f7f" stroke-width="1.5" />
    
    <!-- Text letters B M W curved along top -->
    <text x="50" y="15" font-family="'Outfit', 'Arial Black', sans-serif" font-weight="900" font-size="10" fill="#475569" text-anchor="middle">M</text>
    <text x="26" y="24" font-family="'Outfit', 'Arial Black', sans-serif" font-weight="900" font-size="10" fill="#475569" text-anchor="middle" transform="rotate(-38 26 24)">B</text>
    <text x="74" y="24" font-family="'Outfit', 'Arial Black', sans-serif" font-weight="900" font-size="10" fill="#475569" text-anchor="middle" transform="rotate(38 74 24)">W</text>
</svg>
`;

// Inject Sidebar and Header Layouts
function injectLayout(pageTitle = "BMW Portal") {
    initDatabase();
    
    const sidebarContainer = document.getElementById('sidebar-container');
    const headerContainer = document.getElementById('header-container');
    
    // Detect active page from URL
    const pathname = window.location.pathname;
    const filename = pathname.substring(pathname.lastIndexOf('/') + 1) || 'index.html';
    
    if (sidebarContainer) {
        sidebarContainer.innerHTML = `
            <aside id="sidebar">
                <div class="sidebar-logo">
                    ${BMW_LOGO_SVG}
                    <div>
                        <span class="logo-text">BMW Group</span>
                        <span class="logo-subtext">Quality Portal</span>
                    </div>
                </div>
                <ul class="sidebar-menu">
                    <li class="${filename === 'index.html' ? 'active' : ''}">
                        <a href="index.html"><i data-lucide="layout-dashboard"></i>Dashboard</a>
                    </li>
                    <li class="${filename === 'ppm.html' ? 'active' : ''}">
                        <a href="ppm.html"><i data-lucide="bar-chart-3"></i>PPM Report</a>
                    </li>
                    <li class="${filename === 'claims.html' ? 'active' : ''}">
                        <a href="claims.html"><i data-lucide="undo-2"></i>Claims Return</a>
                    </li>
                    <li class="${filename === 'yield.html' ? 'active' : ''}">
                        <a href="yield.html"><i data-lucide="gauge"></i>Yield Report</a>
                    </li>
                    <li class="${filename === 'wip.html' ? 'active' : ''}">
                        <a href="wip.html"><i data-lucide="boxes"></i>WIP Report</a>
                    </li>
                    <li class="${filename === 'rework.html' ? 'active' : ''}">
                        <a href="rework.html"><i data-lucide="refresh-cw"></i>Rework Rate</a>
                    </li>
                    <li class="${filename === 'scrap.html' ? 'active' : ''}">
                        <a href="scrap.html"><i data-lucide="trash-2"></i>Scrap Report</a>
                    </li>
                    <li class="${filename === 'import.html' ? 'active' : ''}">
                        <a href="import.html"><i data-lucide="upload-cloud"></i>Import Portal</a>
                    </li>
                </ul>
                <div class="sidebar-footer">
                    © 2026 BMW Quality Portal
                </div>
            </aside>
        `;
    }
    
    if (headerContainer) {
        headerContainer.innerHTML = `
            <header>
                <div class="header-left" style="display: flex; align-items: center; gap: 1rem;">
                    <button class="menu-toggle" id="menu-toggle-btn">
                        <i data-lucide="menu"></i>
                    </button>
                    <h1>${pageTitle}</h1>
                </div>
                <div class="header-right">
                    <button class="theme-toggle-btn" id="theme-toggle" title="Toggle Light/Dark Theme">
                        <i data-lucide="sun" id="theme-icon-sun"></i>
                        <i data-lucide="moon" id="theme-icon-moon" style="display:none;"></i>
                    </button>
                    <div class="user-profile">
                        <div class="user-avatar">QA</div>
                        <div class="user-info">
                            <span class="user-name">Quality Admin</span>
                            <span class="user-role">BMW Operations</span>
                        </div>
                    </div>
                </div>
            </header>
        `;
    }

    // Initialize Theme
    const currentTheme = localStorage.getItem('theme') || 'light';
    setTheme(currentTheme);
    
    // Bind Theme Button
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const activeTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = activeTheme === 'dark' ? 'light' : 'dark';
            setTheme(newTheme);
        });
    }

    // Bind Mobile Sidebar Toggle
    const menuToggleBtn = document.getElementById('menu-toggle-btn');
    const sidebar = document.getElementById('sidebar');
    if (menuToggleBtn && sidebar) {
        menuToggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('open');
        });
        document.addEventListener('click', (e) => {
            if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && e.target !== menuToggleBtn) {
                sidebar.classList.remove('open');
            }
        });
    }

    // Initialize Lucide Icons
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    const sunIcon = document.getElementById('theme-icon-sun');
    const moonIcon = document.getElementById('theme-icon-moon');
    
    if (sunIcon && moonIcon) {
        if (theme === 'dark') {
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
        } else {
            sunIcon.style.display = 'block';
            moonIcon.style.display = 'none';
        }
    }
}

// Toast Notifications Helper
const toast = {
    show: (message, type = 'info', duration = 3000) => {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        
        const toastEl = document.createElement('div');
        toastEl.className = `toast ${type}`;
        
        let iconName = 'info';
        if (type === 'success') iconName = 'check-circle';
        if (type === 'error') iconName = 'x-circle';
        if (type === 'warning') iconName = 'alert-triangle';
        
        toastEl.innerHTML = `
            <i data-lucide="${iconName}"></i>
            <span>${message}</span>
        `;
        
        container.appendChild(toastEl);
        if (window.lucide) {
            window.lucide.createIcons({ attrs: { class: 'lucide-icon' } });
        }
        
        setTimeout(() => {
            toastEl.style.opacity = '0';
            toastEl.style.transform = 'translateY(10px)';
            toastEl.style.transition = 'all 0.3s ease-out';
            setTimeout(() => toastEl.remove(), 300);
        }, duration);
    },
    success: (msg) => toast.show(msg, 'success'),
    error: (msg) => toast.show(msg, 'error'),
    warning: (msg) => toast.show(msg, 'warning'),
    info: (msg) => toast.show(msg, 'info')
};

// Excel Copy-Paste Tab-Separated Values (TSV) Parser
function parseExcelPaste(text) {
    if (!text || !text.trim()) return [];
    
    const rows = text.trim().split(/\r?\n/);
    const headers = rows[0].split('\t').map(h => h.trim());
    
    const parsedData = [];
    for (let i = 1; i < rows.length; i++) {
        if (!rows[i].trim()) continue;
        const cells = rows[i].split('\t').map(c => c.trim());
        const rowObj = {};
        headers.forEach((h, index) => {
            rowObj[h] = cells[index] || '';
        });
        parsedData.push(rowObj);
    }
    return parsedData;
}

// Format Date string as 'Jan 26', 'Feb 26', etc.
function formatMonthYear(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getFullYear().toString().substring(2)}`;
}

// Group Date by Quarter e.g. Q1 2026
function getQuarterString(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const q = Math.floor(date.getMonth() / 3) + 1;
    return `Q${q} ${date.getFullYear()}`;
}

// Helper: Normalize Excel Date serials or strings to YYYY-MM-DD
function normalizeDate(val) {
    if (!val) return '';
    
    // 1. If it's a JS Date object
    if (val instanceof Date || (typeof val === 'object' && typeof val.getMonth === 'function')) {
        const y = val.getFullYear();
        const m = String(val.getMonth() + 1).padStart(2, '0');
        const d = String(val.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }
    
    // 2. If it's an Excel date serial number (number or numeric string)
    const num = Number(val);
    if (!isNaN(num) && num > 30000 && num < 60000) {
        const utcDays = Math.floor(num - 25569);
        const utcValue = utcDays * 86400;
        const dateObj = new Date(utcValue * 1000);
        return dateObj.toISOString().split('T')[0];
    }
    
    // Clean string by splitting on whitespace to remove any time suffix
    const dateStr = String(val).trim();
    const cleanDateStr = dateStr.split(/\s+/)[0];
    
    // 3. If format contains '/'
    if (cleanDateStr.includes('/')) {
        const parts = cleanDateStr.split('/');
        if (parts.length === 3) {
            const part0 = parts[0].trim();
            const part1 = parts[1].trim();
            const part2 = parts[2].trim();
            
            if (part0.length === 4) {
                // yyyy/mm/dd
                const y = part0;
                const m = part1.padStart(2, '0');
                const d = part2.padStart(2, '0');
                return `${y}-${m}-${d}`;
            } else {
                // dd/mm/yyyy or d/m/yy
                const d = part0.padStart(2, '0');
                const m = part1.padStart(2, '0');
                let y = part2;
                if (y.length === 2) {
                    y = '20' + y;
                }
                return `${y}-${m}-${d}`;
            }
        }
    }
    
    // 4. If format contains '-'
    if (cleanDateStr.includes('-')) {
        const parts = cleanDateStr.split('-');
        if (parts.length === 3) {
            const part0 = parts[0].trim();
            const part1 = parts[1].trim();
            const part2 = parts[2].trim();
            
            if (part0.length === 4) {
                // yyyy-mm-dd
                return `${part0}-${part1.padStart(2, '0')}-${part2.padStart(2, '0')}`;
            } else {
                // dd-mm-yyyy or d-m-yy
                const d = part0.padStart(2, '0');
                const m = part1.padStart(2, '0');
                let y = part2;
                if (y.length === 2) {
                    y = '20' + y;
                }
                return `${y}-${m}-${d}`;
            }
        }
    }
    
    // Fallback: try standard Date parsing
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
    }
    
    return dateStr;
}
