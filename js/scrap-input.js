// Scrap Data Input & Logging Controller

let scrapLogs = [];
let filteredLogs = [];
let currentPage = 1;
const itemsPerPage = 25;
let selectedIds = new Set();
let modalConfirmCallback = null;

document.addEventListener('DOMContentLoaded', () => {
    const isImportPage = window.location.pathname.includes('import.html');
    
    if (!isImportPage) {
        injectLayout("Scrap Data Input & Management");
    }
    
    // Ensure all scrap records have unique IDs
    ensureUniqueIds();
    loadScrapLogs();
    
    // Bind listeners
    if (isImportPage) {
        const pasteBtn = document.getElementById('paste-scrap-input-btn');
        if (pasteBtn) pasteBtn.addEventListener('click', processScrapInputPaste);
        
        const uploadBtn = document.getElementById('upload-scrap-input-btn');
        if (uploadBtn) uploadBtn.addEventListener('click', handleScrapInputFileUpload);
    } else {
        const oldImportBtn = document.getElementById('import-scrap-btn');
        if (oldImportBtn) oldImportBtn.addEventListener('click', processScrapPaste);
        
        const oldClearBtn = document.getElementById('clear-paste-btn');
        if (oldClearBtn) oldClearBtn.addEventListener('click', () => {
            document.getElementById('scrap-paste-input').value = '';
        });
        
        // Modal buttons for standalone page
        document.getElementById('modal-cancel-btn').addEventListener('click', closeConfirmModal);
        document.getElementById('modal-confirm-btn').addEventListener('click', () => {
            if (modalConfirmCallback) modalConfirmCallback();
            closeConfirmModal();
        });
    }
    
    // Common bindings for both pages
    document.getElementById('search-btn').addEventListener('click', () => {
        currentPage = 1;
        applyFilters();
    });
    document.getElementById('reset-search-btn').addEventListener('click', resetSearch);
    
    document.getElementById('select-all-checkbox').addEventListener('change', handleSelectAll);
    document.getElementById('delete-selected-btn').addEventListener('click', confirmDeleteSelected);
    document.getElementById('delete-all-btn').addEventListener('click', confirmDeleteAll);
});

// Ensure ID safety
function ensureUniqueIds() {
    let logs = db.get('scrap_data');
    let updated = false;
    logs.forEach(item => {
        if (!item.id) {
            item.id = 'sc_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
            updated = true;
        }
    });
    if (updated) {
        db.set('scrap_data', logs);
    }
}

function loadScrapLogs() {
    scrapLogs = db.get('scrap_data');
    applyFilters();
}

function applyFilters() {
    const startDateVal = document.getElementById('search-start-date').value;
    const endDateVal = document.getElementById('search-end-date').value;
    const processVal = document.getElementById('search-process-status').value;
    
    filteredLogs = scrapLogs.filter(row => {
        // Date check
        if (startDateVal && row.date < startDateVal) return false;
        if (endDateVal && row.date > endDateVal) return false;
        
        // Process check (prefix match e.g. "Layup" matches "Layup:OK" or "Layup:Scrap")
        if (processVal !== 'All' && row.process_status) {
            const rowProcess = row.process_status.split(':')[0].toLowerCase();
            if (rowProcess !== processVal.toLowerCase()) return false;
        }
        return true;
    });

    // Sort descending by date
    filteredLogs.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    selectedIds.clear();
    document.getElementById('select-all-checkbox').checked = false;
    updateDeleteButtonState();
    renderLogsTable();
}

function resetSearch() {
    document.getElementById('search-start-date').value = '';
    document.getElementById('search-end-date').value = '';
    document.getElementById('search-process-status').value = 'All';
    currentPage = 1;
    applyFilters();
}

function renderLogsTable() {
    const tbody = document.getElementById('scrap-logs-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    const totalItems = filteredLogs.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    
    if (currentPage > totalPages) currentPage = totalPages;
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    
    // Update summary text
    const summary = document.getElementById('pagination-summary');
    if (summary) {
        if (totalItems > 0) {
            summary.textContent = `Showing ${startIndex + 1}-${endIndex} of ${totalItems} entries`;
        } else {
            summary.textContent = `Showing 0-0 of 0 entries`;
        }
    }
    
    // Slice items for current page
    const pageItems = filteredLogs.slice(startIndex, endIndex);
    
    pageItems.forEach((row, i) => {
        const rowNo = startIndex + i + 1;
        const tr = document.createElement('tr');
        const isChecked = selectedIds.has(row.id);
        const processName = row.process_status ? row.process_status.split(':')[0] : '';
        const subStatus = row.process_status ? (row.process_status.split(':')[1] || '') : '';
        
        // Format substatus pill color
        let statusBadge = `<span style="background-color: var(--border-color); padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">${row.process_status}</span>`;
        if (subStatus.toLowerCase() === 'ok') {
            statusBadge = `<strong>${processName}</strong> <span style="background-color: #d1fae5; color: #065f46; padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">OK</span>`;
        } else if (subStatus.toLowerCase() === 'scrap') {
            statusBadge = `<strong>${processName}</strong> <span style="background-color: #fee2e2; color: #991b1b; padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">Scrap</span>`;
        } else if (subStatus.toLowerCase() === 'input') {
            statusBadge = `<strong>${processName}</strong> <span style="background-color: #eff6ff; color: #1e40af; padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">Input</span>`;
        } else if (subStatus.toLowerCase() === '-' || subStatus.trim() === '') {
            statusBadge = `<strong>${processName}</strong> <span style="background-color: var(--border-color); color: var(--text-secondary); padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">-</span>`;
        } else {
            statusBadge = `<strong>${processName}</strong> <span style="background-color: #fef3c7; color: #92400e; padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">${subStatus}</span>`;
        }
        
        tr.innerHTML = `
            <td style="text-align: center;">
                <input type="checkbox" class="row-checkbox" data-id="${row.id}" ${isChecked ? 'checked' : ''}>
            </td>
            <td>${rowNo}</td>
            <td>${formatDateString(row.date)}</td>
            <td>${statusBadge}</td>
            <td><strong>${row.erp_code}</strong></td>
            <td>${Number(row.qty).toLocaleString()}</td>
            <td style="text-align: center;">
                <button class="btn btn-secondary btn-sm" onclick="deleteSingleRecord('${row.id}')" style="padding: 0.35rem 0.6rem; font-size: 0.75rem; color: var(--color-danger); border-color: rgba(239, 68, 68, 0.2);">
                    Delete
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    // Bind checkbox listeners
    const checkboxes = document.querySelectorAll('.row-checkbox');
    checkboxes.forEach(cb => {
        cb.addEventListener('change', (e) => {
            const id = e.target.dataset.id;
            if (e.target.checked) {
                selectedIds.add(id);
            } else {
                selectedIds.delete(id);
                document.getElementById('select-all-checkbox').checked = false;
            }
            updateDeleteButtonState();
        });
    });
    
    renderPaginationControls(totalPages);
}

function renderPaginationControls(totalPages) {
    const controlsDiv = document.getElementById('pagination-controls-div');
    if (!controlsDiv) return;
    controlsDiv.innerHTML = '';
    
    // Prev Button
    const prevBtn = document.createElement('button');
    prevBtn.className = 'pagination-btn';
    prevBtn.innerHTML = '<i data-lucide="chevron-left" style="width: 16px; height: 16px;"></i>';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderLogsTable();
        }
    });
    controlsDiv.appendChild(prevBtn);
    
    // Numeric pages
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    for (let p = startPage; p <= endPage; p++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `pagination-btn ${p === currentPage ? 'active' : ''}`;
        pageBtn.textContent = p;
        pageBtn.addEventListener('click', () => {
            currentPage = p;
            renderLogsTable();
        });
        controlsDiv.appendChild(pageBtn);
    }
    
    // Next Button
    const nextBtn = document.createElement('button');
    nextBtn.className = 'pagination-btn';
    nextBtn.innerHTML = '<i data-lucide="chevron-right" style="width: 16px; height: 16px;"></i>';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderLogsTable();
        }
    });
    controlsDiv.appendChild(nextBtn);
    
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

function handleSelectAll(e) {
    const isChecked = e.target.checked;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredLogs.length);
    const currentPageItems = filteredLogs.slice(startIndex, endIndex);
    
    currentPageItems.forEach(item => {
        if (isChecked) {
            selectedIds.add(item.id);
        } else {
            selectedIds.delete(item.id);
        }
    });
    
    // Redraw table rows checkboxes
    const checkboxes = document.querySelectorAll('.row-checkbox');
    checkboxes.forEach(cb => {
        cb.checked = isChecked;
    });
    
    updateDeleteButtonState();
}

function updateDeleteButtonState() {
    const deleteBtn = document.getElementById('delete-selected-btn');
    if (!deleteBtn) return;
    deleteBtn.disabled = selectedIds.size === 0;
    deleteBtn.innerHTML = `<i data-lucide="trash"></i> Delete Selected (${selectedIds.size})`;
    if (window.lucide) window.lucide.createIcons();
}

// Single delete
window.deleteSingleRecord = function(id) {
    showConfirmModal(
        "Delete Record", 
        "Are you sure you want to delete this single scrap log entry?", 
        () => {
            const logs = db.get('scrap_data');
            const filtered = logs.filter(item => item.id !== id);
            db.set('scrap_data', filtered);
            toast.success("Record deleted successfully.");
            loadScrapLogs();
        }
    );
};

// Batch delete selected
function confirmDeleteSelected() {
    showConfirmModal(
        "Delete Selected Records", 
        `Are you sure you want to delete the ${selectedIds.size} selected scrap records?`, 
        () => {
            const logs = db.get('scrap_data');
            const filtered = logs.filter(item => !selectedIds.has(item.id));
            db.set('scrap_data', filtered);
            toast.success(`${selectedIds.size} records deleted successfully.`);
            loadScrapLogs();
        }
    );
}

// Clear all
function confirmDeleteAll() {
    showConfirmModal(
        "Clear All Scrap Data", 
        "WARNING: This will wipe out all recorded scrap data logs. Are you absolutely sure?", 
        () => {
            db.set('scrap_data', []);
            toast.success("All scrap data wiped.");
            loadScrapLogs();
        }
    );
}

// Modal management helpers
function showConfirmModal(title, message, onConfirm) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-msg').textContent = message;
    document.getElementById('confirm-modal').style.display = 'flex';
    
    if (window.location.pathname.includes('import.html')) {
        window.scrapConfirmCallback = onConfirm;
    } else {
        modalConfirmCallback = onConfirm;
    }
}

function closeConfirmModal() {
    document.getElementById('confirm-modal').style.display = 'none';
    if (window.location.pathname.includes('import.html')) {
        window.scrapConfirmCallback = null;
    } else {
        modalConfirmCallback = null;
    }
}

// Helper: split lines and tabs
function parseScrapTSV(text) {
    if (!text || !text.trim()) return [];
    return text.trim().split(/\r?\n/).map(line => line.split('\t').map(cell => cell.trim()));
}

// Paste handler for Excel Scrap status matrix/flat data in Import tab
function processScrapInputPaste() {
    const textarea = document.getElementById('paste-scrap-input-new');
    const rawText = textarea.value;
    
    if (!rawText || !rawText.trim()) {
        toast.error("Paste area is empty.");
        return;
    }
    
    try {
        const rawRows = parseScrapTSV(rawText);
        const parsed = parseScrapInputRowsFrom2D(rawRows);
        
        if (parsed.length > 0) {
            const current = db.get('scrap_data');
            const parsedDates = new Set(parsed.map(d => d.date));
            const filteredCurrent = current.filter(d => !parsedDates.has(d.date));
            
            if (db.set('scrap_data', [...filteredCurrent, ...parsed])) {
                toast.success(`Successfully imported ${parsed.length} scrap records!`);
                textarea.value = '';
                loadScrapLogs();
            }
        } else {
            toast.error("No valid entries found. Please verify column formatting (Date, ProcessStatus, ERPCode, Qty).");
        }
    } catch (err) {
        console.error(err);
        toast.error("Import failed: " + err.message);
    }
}

// Excel upload handler for Scrap status matrix/flat data in Import tab
function handleScrapInputFileUpload() {
    const fileInput = document.getElementById('file-scrap-input-new');
    const file = fileInput.files[0];
    
    if (!file) {
        toast.error("Please choose a file first.");
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            if (!sheet) {
                toast.error("No valid sheet found in Excel file.");
                return;
            }
            
            const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
            const parsed = parseScrapInputRowsFrom2D(rawRows);
            
            if (parsed.length > 0) {
                const current = db.get('scrap_data');
                const parsedDates = new Set(parsed.map(d => d.date));
                const filteredCurrent = current.filter(d => !parsedDates.has(d.date));
                
                if (db.set('scrap_data', [...filteredCurrent, ...parsed])) {
                    toast.success(`Success! Imported ${parsed.length} scrap entries from Excel.`);
                    fileInput.value = '';
                    loadScrapLogs();
                }
            } else {
                toast.error("No valid Scrap Input records found. Verify headers (Date, ProcessStatus, ERPCode, Qty).");
            }
        } catch (err) {
            console.error(err);
            toast.error("Excel processing failed: " + err.message);
        }
    };
    reader.readAsArrayBuffer(file);
}

// Helper: parse 2D array of rows from copy-paste/Excel to scrap_data objects
function parseScrapInputRowsFrom2D(rawRows) {
    if (rawRows.length < 2) return [];
    
    // Find header row containing Date, ProcessStatus, ERPCode, Qty
    let headerRowIdx = -1;
    for (let i = 0; i < Math.min(10, rawRows.length); i++) {
        const row = rawRows[i];
        if (row && row.some(cell => {
            const s = String(cell).toLowerCase().replace(/[\s_()]/g, '');
            return s.includes('processstatus') || s.includes('process') || s.includes('erpcode') || s.includes('qty') || s.includes('quantity');
        })) {
            headerRowIdx = i;
            break;
        }
    }
    
    if (headerRowIdx === -1) {
        headerRowIdx = 0;
    }
    
    const headerRow = rawRows[headerRowIdx];
    let dColIdx = -1, psColIdx = -1, erColIdx = -1, qColIdx = -1;
    
    for (let colIdx = 0; colIdx < headerRow.length; colIdx++) {
        const s = String(headerRow[colIdx]).toLowerCase().replace(/[\s_()]/g, '');
        if (s.includes('date') || s.includes('วันที่')) dColIdx = colIdx;
        else if (s.includes('processstatus') || s.includes('process') || s.includes('สถานะ')) psColIdx = colIdx;
        else if (s.includes('erpcode') || s.includes('erp') || s.includes('รหัส')) erColIdx = colIdx;
        else if (s.includes('qty') || s.includes('quantity') || s.includes('จำนวน')) qColIdx = colIdx;
    }
    
    if (dColIdx === -1 || psColIdx === -1 || erColIdx === -1 || qColIdx === -1) {
        console.error("Could not find all required headers (Date, ProcessStatus, ERPCode, Qty) in rows.");
        return [];
    }
    
    const parsed = [];
    for (let rIdx = headerRowIdx + 1; rIdx < rawRows.length; rIdx++) {
        const row = rawRows[rIdx];
        if (!row || row.length === 0) continue;
        
        // Use general Date parser
        const dateVal = normalizeDate(row[dColIdx]);
        const processStatusVal = String(row[psColIdx] !== undefined && row[psColIdx] !== null ? row[psColIdx] : '').trim();
        const erpCodeVal = String(row[erColIdx] !== undefined && row[erColIdx] !== null ? row[erColIdx] : '').trim();
        
        const rawQty = row[qColIdx];
        const qtyVal = Number(String(rawQty !== undefined && rawQty !== null ? rawQty : '').replace(/,/g, '').trim()) || 0;
        
        if (dateVal && processStatusVal && erpCodeVal) {
            parsed.push({
                id: 'sc_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now(),
                date: dateVal,
                process_status: processStatusVal,
                erp_code: erpCodeVal,
                qty: qtyVal
            });
        }
    }
    return parsed;
}
// Standalone page paste handler
function processScrapPaste() {
    const textarea = document.getElementById('scrap-paste-input');
    const rawText = textarea.value;
    
    if (!rawText || !rawText.trim()) {
        toast.error("Paste area is empty.");
        return;
    }
    
    try {
        const rows = rawText.trim().split(/\r?\n/);
        let importCount = 0;
        const newRecords = [];
        
        rows.forEach(r => {
            if (!r.trim()) return;
            const cols = r.split('\t').map(c => c.trim());
            
            // Check if this is the header row
            const isHeader = cols.some(cell => {
                const s = String(cell).toLowerCase().replace(/[\s_()]/g, '');
                return s === 'processstatus' || s === 'erpcode' || s === 'qty' || s === 'quantity' || s === 'date';
            });
            if (isHeader) return;
            
            if (cols.length >= 3) {
                const rawDate = cols[0];
                const processStatus = cols[1];
                const erpCode = cols[2];
                const rawQty = cols[3];
                const qtyVal = Number(String(rawQty !== undefined && rawQty !== null ? rawQty : '').replace(/,/g, '').trim()) || 0;
                
                const formattedDate = normalizeDate(rawDate);
                
                if (formattedDate && processStatus && erpCode) {
                    newRecords.push({
                        id: 'sc_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now(),
                        date: formattedDate,
                        process_status: processStatus,
                        erp_code: erpCode,
                        qty: qtyVal
                    });
                    importCount++;
                }
            }
        });
        
        if (importCount > 0) {
            const currentLogs = db.get('scrap_data');
            const merged = [...currentLogs, ...newRecords];
            if (db.set('scrap_data', merged)) {
                toast.success(`Successfully imported ${importCount} scrap records!`);
                textarea.value = '';
                loadScrapLogs();
            }
        } else {
            toast.error("No valid entries found. Please verify column formatting (Date\\tProcess\\tERP\\tQty).");
        }
    } catch (err) {
        console.error(err);
        toast.error("Import failed: " + err.message);
    }
}

// Convert YYYY-MM-DD to standard Thai/General dd/mm/yyyy
function formatDateString(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}
