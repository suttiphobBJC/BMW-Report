// Central Import Portal Controller

window.switchImportTab = function(tabName) {
    document.querySelectorAll('.tab-item').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    document.getElementById(`btn-tab-${tabName}`).classList.add('active');
    document.getElementById(`content-tab-${tabName}`).classList.add('active');
};

document.addEventListener('DOMContentLoaded', () => {
    injectLayout("Data Import Portal");
    
    // Bind File Upload Buttons
    document.getElementById('upload-yield-btn').addEventListener('click', handleYieldFileUpload);
    document.getElementById('upload-ppm-btn').addEventListener('click', handlePpmFileUpload);
    document.getElementById('upload-claims-btn').addEventListener('click', handleClaimsFileUpload);
    document.getElementById('upload-wip-btn').addEventListener('click', handleWipFileUpload);
    document.getElementById('upload-scrap-btn').addEventListener('click', handleScrapFileUpload);
    if (document.getElementById('upload-rework-btn')) {
        document.getElementById('upload-rework-btn').addEventListener('click', handleReworkFileUpload);
    }
    
    // Bind Paste Buttons
    document.getElementById('paste-yield-btn').addEventListener('click', processYieldPaste);
    document.getElementById('paste-ppm-btn').addEventListener('click', processPpmPaste);
    document.getElementById('paste-claims-btn').addEventListener('click', processClaimsPaste);
    document.getElementById('paste-wip-btn').addEventListener('click', processWipPaste);
    document.getElementById('paste-rework-btn').addEventListener('click', processReworkPaste);
    document.getElementById('paste-scrap-btn').addEventListener('click', processScrapTopPaste);
    
    // Bind Clear Buttons
    document.getElementById('clear-yield-btn').addEventListener('click', () => {
        showConfirmModal("Clear Yield Data", "Are you sure you want to delete all Yield (FPY and FY) data? This action is irreversible.", () => {
            db.set('yield_fpy_data', []);
            db.set('yield_fy_data', []);
            toast.success("Yield data cleared successfully!");
        });
    });
    document.getElementById('clear-ppm-btn').addEventListener('click', () => {
        showConfirmModal("Clear PPM Data", "Are you sure you want to delete all PPM data? This action is irreversible.", () => {
            db.set('ppm_data', []);
            toast.success("PPM data cleared successfully!");
        });
    });
    document.getElementById('clear-claims-btn').addEventListener('click', () => {
        showConfirmModal("Clear Claims Data", "Are you sure you want to delete all Claims data? This action is irreversible.", () => {
            db.set('claims_data', []);
            toast.success("Claims data cleared successfully!");
        });
    });
    document.getElementById('clear-wip-btn').addEventListener('click', () => {
        showConfirmModal("Clear WIP Data", "Are you sure you want to delete all WIP data? This action is irreversible.", () => {
            db.set('wip_data', []);
            toast.success("WIP data cleared successfully!");
        });
    });
    document.getElementById('clear-rework-btn').addEventListener('click', () => {
        showConfirmModal("Clear Rework Data", "Are you sure you want to delete all Rework data? This action is irreversible.", () => {
            db.set('rework_data', []);
            toast.success("Rework data cleared successfully!");
        });
    });
    document.getElementById('clear-scrap-btn').addEventListener('click', () => {
        showConfirmModal("Clear Scrap Data", "Are you sure you want to delete all Scrap defect and inventory data? This action is irreversible.", () => {
            db.set('scrap_data', []);
            db.set('scrap_daily', []);
            db.set('scrap_inven', []);
            toast.success("Scrap data cleared successfully!");
        });
    });

    // Bind Confirm Modal Buttons
    document.getElementById('modal-cancel-btn').addEventListener('click', closeConfirmModal);
    document.getElementById('modal-confirm-btn').addEventListener('click', () => {
        if (activeClearCallback) activeClearCallback();
        if (window.scrapConfirmCallback) {
            window.scrapConfirmCallback();
            window.scrapConfirmCallback = null;
        }
        closeConfirmModal();
    });
});

// normalizeDate is now defined globally in common.js

// ----------------------------------------------------
// FILE UPLOAD: YIELD REPORT
// ----------------------------------------------------
function handleYieldFileUpload() {
    const fileInput = document.getElementById('file-yield-input');
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
            
            let fpyCount = 0;
            let fyCount = 0;
            
            // 1. Process FPY sheet
            const fpySheet = workbook.Sheets['FPY'];
            if (fpySheet) {
                const rawRows = XLSX.utils.sheet_to_json(fpySheet, { header: 1, defval: "" });
                const parsed = parseYieldGrid(rawRows);
                if (parsed.length > 0) {
                    const currentFpy = db.get('yield_fpy_data');
                    db.set('yield_fpy_data', [...currentFpy, ...parsed]);
                    fpyCount = parsed.length;
                }
            }
            
            // 2. Process FY sheet
            const fySheet = workbook.Sheets['FY'];
            if (fySheet) {
                const rawRows = XLSX.utils.sheet_to_json(fySheet, { header: 1, defval: "" });
                const parsed = parseYieldGrid(rawRows);
                if (parsed.length > 0) {
                    const currentFy = db.get('yield_fy_data');
                    db.set('yield_fy_data', [...currentFy, ...parsed]);
                    fyCount = parsed.length;
                }
            }
            
            if (fpyCount > 0 || fyCount > 0) {
                toast.success(`Success! Imported ${fpyCount} FPY process logs & ${fyCount} FY process logs.`);
                fileInput.value = '';
            } else {
                toast.error("No valid data found in sheets 'FPY' or 'FY'. Please verify the format.");
            }
        } catch (err) {
            console.error(err);
            toast.error("Excel processing failed: " + err.message);
        }
    };
    reader.readAsArrayBuffer(file);
}

// ----------------------------------------------------
// COPY PASTE: YIELD REPORT
// ----------------------------------------------------
function processYieldPaste() {
    const fpyText = document.getElementById('paste-yield-fpy').value;
    const fyText = document.getElementById('paste-yield-fy').value;
    
    if (!fpyText.trim() && !fyText.trim()) {
        toast.error("Both paste text areas are empty.");
        return;
    }
    
    let fpyCount = 0;
    let fyCount = 0;
    
    // Process FPY
    if (fpyText.trim()) {
        const rawRows = parseYieldTSV(fpyText);
        const parsed = parseYieldGrid(rawRows);
        if (parsed.length > 0) {
            const currentFpy = db.get('yield_fpy_data');
            db.set('yield_fpy_data', [...currentFpy, ...parsed]);
            fpyCount = parsed.length;
        }
    }
    
    // Process FY
    if (fyText.trim()) {
        const rawRows = parseYieldTSV(fyText);
        const parsed = parseYieldGrid(rawRows);
        if (parsed.length > 0) {
            const currentFy = db.get('yield_fy_data');
            db.set('yield_fy_data', [...currentFy, ...parsed]);
            fyCount = parsed.length;
        }
    }
    
    if (fpyCount > 0 || fyCount > 0) {
        toast.success(`Success! Pasted and imported ${fpyCount} FPY logs & ${fyCount} FY logs.`);
        document.getElementById('paste-yield-fpy').value = '';
        document.getElementById('paste-yield-fy').value = '';
    } else {
        toast.error("Failed to parse pasted yield data. Verify format and headers.");
    }
}

// Helper TSV parser for Copy-Paste Grid
function parseYieldTSV(text) {
    if (!text || !text.trim()) return [];
    return text.trim().split(/\r?\n/).map(line => line.split('\t').map(cell => cell.trim()));
}

// Grid Parser for both Excel and TSV
function parseYieldGrid(rawRows) {
    if (rawRows.length < 3) return [];
    
    // Find the row containing "Date"
    let headerRow0Idx = -1;
    for (let i = 0; i < Math.min(5, rawRows.length); i++) {
        const row = rawRows[i];
        if (row && row.some(cell => {
            const s = String(cell).toLowerCase().trim();
            return s === 'date' || s.includes('วันที่') || s.includes('วัน/เดือน/ปี');
        })) {
            headerRow0Idx = i;
            break;
        }
    }
    
    if (headerRow0Idx === -1 || headerRow0Idx + 1 >= rawRows.length) {
        console.error("Could not locate header row in Yield grid.");
        return [];
    }
    
    const headerRow1Idx = headerRow0Idx + 1;
    const row0 = rawRows[headerRow0Idx];
    const row1 = rawRows[headerRow1Idx];
    
    const colMap = {};
    let currentProcess = "";
    let dateColIdx = -1;
    let projColIdx = -1;
    
    const maxCols = Math.max(row0.length, row1.length);
    for (let colIdx = 0; colIdx < maxCols; colIdx++) {
        const val0 = row0[colIdx] ? String(row0[colIdx]).trim() : "";
        const val1 = row1[colIdx] ? String(row1[colIdx]).trim() : "";
        
        const low0 = val0.toLowerCase();
        const low1 = val1.toLowerCase();
        
        if (low0.includes('date') || low1.includes('date') || val0.includes('วันที่') || val1.includes('วันที่')) {
            dateColIdx = colIdx;
            continue;
        }
        if (low0.includes('project') || low1.includes('project') || low0.includes('proj') || low1.includes('proj')) {
            projColIdx = colIdx;
            continue;
        }
        
        if (val0 !== "") {
            currentProcess = val0;
        }
        
        if (!currentProcess) continue;
        
        let field = "";
        if (low1.includes('ins') || low1.includes('input') || low1.includes('จำนวน')) {
            field = "ins";
        } else if (low1 === 'ok' || low1.includes('output') || low1.includes('ผ่าน')) {
            field = "ok";
        } else if (low1.includes('yield') || low1.includes('%')) {
            field = "yield";
        }
        
        if (field) {
            colMap[colIdx] = { process: currentProcess, field: field };
        }
    }
    
    if (dateColIdx === -1) {
        console.error("Date column not found in Yield grid.");
        return [];
    }
    if (projColIdx === -1) {
        projColIdx = 1;
    }
    
    const parsedRecords = [];
    
    for (let rIdx = headerRow1Idx + 1; rIdx < rawRows.length; rIdx++) {
        const row = rawRows[rIdx];
        if (!row || row.length === 0) continue;
        
        const rawDate = row[dateColIdx];
        const rawProj = row[projColIdx];
        
        if (rawDate === undefined || rawDate === null || String(rawDate).trim() === "") continue;
        
        const dateVal = normalizeDate(rawDate);
        if (!dateVal) continue;
        
        const projVal = rawProj ? String(rawProj).trim() : "N/A";
        
        const processData = {};
        
        Object.keys(colMap).forEach(colIdx => {
            const mapInfo = colMap[colIdx];
            const cellVal = row[colIdx];
            if (cellVal === undefined || cellVal === null || String(cellVal).trim() === "") return;
            
            let cleanStr = String(cellVal).replace(/,/g, '').replace(/%/g, '').trim();
            let numVal = Number(cleanStr);
            if (isNaN(numVal)) return;
            
            if (!processData[mapInfo.process]) {
                processData[mapInfo.process] = { ins: null, ok: null, yield: null };
            }
            
            if (mapInfo.field === "ins") {
                processData[mapInfo.process].ins = numVal;
            } else if (mapInfo.field === "ok") {
                processData[mapInfo.process].ok = numVal;
            } else if (mapInfo.field === "yield") {
                // If it is a decimal percentage representation from Excel (e.g. 0.8283 for 82.83%)
                if (numVal <= 1.0) {
                    numVal = numVal * 100;
                }
                processData[mapInfo.process].yield = numVal;
            }
        });
        
        Object.keys(processData).forEach(procName => {
            const pData = processData[procName];
            if ((pData.ins !== null && pData.ok !== null) || pData.yield !== null) {
                parsedRecords.push({
                    date: dateVal,
                    project: projVal,
                    process: procName,
                    ins: pData.ins !== null ? pData.ins : 0,
                    ok: pData.ok !== null ? pData.ok : 0,
                    yield: pData.yield
                });
            }
        });
    }
    
    return parsedRecords;
}

// Helper: Convert "Jan-25" / "Jan 25" / "Jan25" to YYYY-MM-DD
function normalizeMonthHeaderToDate(mKey) {
    const parts = String(mKey).trim().match(/^([A-Za-z]{3})[-\s]?(\d{2,4})$/);
    if (!parts) return null;
    
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const mStr = parts[1].toLowerCase();
    const mIdx = months.indexOf(mStr);
    if (mIdx === -1) return null;
    
    let yStr = parts[2];
    if (yStr.length === 2) {
        yStr = '20' + yStr;
    }
    
    return `${yStr}-${String(mIdx + 1).padStart(2, '0')}-15`; // 15th of the month
}

// Parser for PPM Pivoted Cross-tab format (with Customer, Delivery Quantity rows)
function parsePpmCrossTab(rows) {
    const parsed = [];
    let currentCustomer = '';
    const monthRegex = /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[-\s]?\d{2,4}$/i;
    
    // customerMap[customer][date] = { received: 0, ng: 0 }
    const customerMap = {};
    
    rows.forEach(r => {
        const keys = Object.keys(r);
        
        // Find customer key (handles merged cells by keeping running variable)
        const custKey = keys.find(k => k.toLowerCase() === 'customer' || k.toLowerCase() === 'cust');
        if (custKey && String(r[custKey]).trim() !== '') {
            currentCustomer = String(r[custKey]).trim();
        }
        
        if (!currentCustomer) return;
        
        if (!customerMap[currentCustomer]) {
            customerMap[currentCustomer] = {};
        }
        
        // Find row type (Received, NG, PPM)
        const typeKey = keys.find(k => k.toLowerCase().includes('delivery') || k.toLowerCase().includes('quantity') || k.toLowerCase().includes('type'));
        let rowType = '';
        if (typeKey && r[typeKey]) {
            rowType = String(r[typeKey]).trim().toLowerCase();
        }
        
        // Only care about received and NG
        if (rowType !== 'received' && rowType !== 'ng' && !rowType.includes('received') && !rowType.includes('ng')) {
            return;
        }
        
        // Parse month columns
        const monthKeys = keys.filter(k => monthRegex.test(k));
        monthKeys.forEach(mKey => {
            let valStr = String(r[mKey]).replace(/,/g, '').trim();
            let val = 0;
            if (valStr && valStr !== '-' && valStr !== '—') {
                val = parseFloat(valStr) || 0;
            }
            
            const standardDate = normalizeMonthHeaderToDate(mKey);
            if (!standardDate) return;
            
            if (!customerMap[currentCustomer][standardDate]) {
                customerMap[currentCustomer][standardDate] = { received: 0, ng: 0 };
            }
            
            if (rowType.includes('received')) {
                customerMap[currentCustomer][standardDate].received = val;
            } else if (rowType.includes('ng')) {
                customerMap[currentCustomer][standardDate].ng = val;
            }
        });
    });
    
    // Flatten into PPM log objects
    Object.keys(customerMap).forEach(cust => {
        Object.keys(customerMap[cust]).forEach(dateStr => {
            const data = customerMap[cust][dateStr];
            if (data.received > 0) {
                parsed.push({
                    date: dateStr,
                    customer: cust,
                    code: '',
                    defect_qty: data.ng,
                    shipped_qty: data.received
                });
            }
        });
    });
    
    return parsed;
}

// ----------------------------------------------------
// PPM IMPORT
// ----------------------------------------------------
function processPpmPaste() {
    const text = document.getElementById('paste-ppm').value;
    if (!text.trim()) {
        toast.error("PPM paste area is empty.");
        return;
    }
    
    const rows = parseExcelPaste(text);
    if (rows.length === 0) {
        toast.error("Pasted text could not be parsed.");
        return;
    }
    
    // Check if it's the pivoted/cross-tab format
    const sampleKeys = Object.keys(rows[0]);
    const isPivoted = sampleKeys.some(k => k.toLowerCase().includes('delivery') || k.toLowerCase().includes('quantity') || k.toLowerCase().includes('received') || k.toLowerCase().includes('ng'));
    
    let parsed = [];
    if (isPivoted) {
        parsed = parsePpmCrossTab(rows);
    } else {
        // Fallback to standard flat parser
        rows.forEach(r => {
            const keys = Object.keys(r);
            let dKey = keys.find(k => k.toLowerCase().includes('date') || k.toLowerCase().includes('month'));
            let cKey = keys.find(k => k.toLowerCase().includes('cust'));
            let cdKey = keys.find(k => k.toLowerCase().includes('code') || k.toLowerCase().includes('part'));
            let dfKey = keys.find(k => k.toLowerCase().includes('defect'));
            let shKey = keys.find(k => k.toLowerCase().includes('shipped') || k.toLowerCase().includes('ship'));
            
            if (dKey && cKey && dfKey && shKey) {
                parsed.push({
                    date: normalizeDate(r[dKey]),
                    customer: r[cKey],
                    code: cdKey ? r[cdKey] : '',
                    defect_qty: Number(r[dfKey]) || 0,
                    shipped_qty: Number(r[shKey]) || 0
                });
            }
        });
    }
    
    if (parsed.length > 0) {
        const current = db.get('ppm_data');
        db.set('ppm_data', [...current, ...parsed]);
        toast.success(`Success! Processed & imported ${parsed.length} PPM entries.`);
        document.getElementById('paste-ppm').value = '';
    } else {
        toast.error("Failed to parse PPM data. Check format (Pivoted Table or Flat columns: Date, Customer, DefectQty, ShippedQty).");
    }
}

// PPM Excel File Upload Handler
function handlePpmFileUpload() {
    const fileInput = document.getElementById('file-ppm-input');
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
            
            // Get first sheet
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            if (!sheet) {
                toast.error("No valid sheet found in Excel file.");
                return;
            }
            
            // Read with defval: "" so that merged cells return "" instead of being undefined
            const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
            if (rows.length === 0) {
                toast.error("Excel sheet is empty.");
                return;
            }
            
            // Check if pivoted or flat
            const sampleKeys = Object.keys(rows[0]);
            const isPivoted = sampleKeys.some(k => k.toLowerCase().includes('delivery') || k.toLowerCase().includes('quantity') || k.toLowerCase().includes('received') || k.toLowerCase().includes('ng'));
            
            let parsed = [];
            if (isPivoted) {
                parsed = parsePpmCrossTab(rows);
            } else {
                rows.forEach(r => {
                    const keys = Object.keys(r);
                    let dKey = keys.find(k => k.toLowerCase().includes('date') || k.toLowerCase().includes('month'));
                    let cKey = keys.find(k => k.toLowerCase().includes('cust'));
                    let cdKey = keys.find(k => k.toLowerCase().includes('code') || k.toLowerCase().includes('part'));
                    let dfKey = keys.find(k => k.toLowerCase().includes('defect'));
                    let shKey = keys.find(k => k.toLowerCase().includes('shipped') || k.toLowerCase().includes('ship'));
                    
                    if (dKey && cKey && dfKey && shKey) {
                        parsed.push({
                            date: normalizeDate(r[dKey]),
                            customer: String(r[cKey]).trim(),
                            code: cdKey ? String(r[cdKey]).trim() : '',
                            defect_qty: Number(r[dfKey]) || 0,
                            shipped_qty: Number(r[shKey]) || 0
                        });
                    }
                });
            }
            
            if (parsed.length > 0) {
                const current = db.get('ppm_data');
                db.set('ppm_data', [...current, ...parsed]);
                toast.success(`Success! Processed & imported ${parsed.length} PPM entries from Excel.`);
                fileInput.value = '';
            } else {
                toast.error("Columns not recognized. Check format (Pivoted Table or Flat columns: Date, Customer, DefectQty, ShippedQty).");
            }
        } catch (err) {
            console.error(err);
            toast.error("Excel processing failed: " + err.message);
        }
    };
    reader.readAsArrayBuffer(file);
}

// ----------------------------------------------------
// CLAIMS IMPORT
// ----------------------------------------------------
function aggregateRawClaims(rawRows) {
    const aggMap = {};
    
    rawRows.forEach(r => {
        const keys = Object.keys(r);
        const dateKey = keys.find(k => k.includes('วันที่') || k.toLowerCase().includes('date'));
        const projectKey = keys.find(k => k.toLowerCase().includes('project'));
        const locKey = keys.find(k => k.toLowerCase().includes('location') || k.toLowerCase().includes('loc'));
        const typeKey = keys.find(k => k.toLowerCase().includes('claim'));
        
        if (!dateKey) return;
        
        const dateVal = normalizeDate(r[dateKey]);
        if (!dateVal) return;
        
        const projectVal = projectKey && r[projectKey] ? String(r[projectKey]).trim() : 'N/A';
        const typeVal = typeKey && r[typeKey] ? String(r[typeKey]).trim() : 'N/A';
        const locVal = locKey && r[locKey] ? String(r[locKey]).trim() : 'N/A';
        
        // Default quantity to 1 for raw row-by-row transactions. Respect custom Qty if present.
        let qty = 1;
        const qtyKey = keys.find(k => k.toLowerCase().includes('qty') || k.toLowerCase().includes('quantity') || k.toLowerCase().includes('จำนวน'));
        if (qtyKey && r[qtyKey]) {
            qty = Number(String(r[qtyKey]).replace(/,/g, '')) || 1;
        }
        
        const key = `${dateVal}_${projectVal}_${typeVal}_${locVal}`;
        if (!aggMap[key]) {
            aggMap[key] = {
                date: dateVal,
                project: projectVal || 'N/A',
                claim_type: typeVal || 'N/A',
                location: locVal || 'N/A',
                qty: 0
            };
        }
        aggMap[key].qty += qty;
    });
    
    return Object.values(aggMap);
}

function processClaimsPaste() {
    const text = document.getElementById('paste-claims').value;
    if (!text.trim()) {
        toast.error("Claims paste area is empty.");
        return;
    }
    
    const rows = parseExcelPaste(text);
    if (rows.length === 0) {
        toast.error("Pasted text could not be parsed.");
        return;
    }
    
    const parsed = aggregateRawClaims(rows);
    
    if (parsed.length > 0) {
        const current = db.get('claims_data');
        db.set('claims_data', [...current, ...parsed]);
        toast.success(`Success! Imported & aggregated ${parsed.length} Claims records.`);
        document.getElementById('paste-claims').value = '';
    } else {
        toast.error("Failed to parse claims. Check format (Expected headers: วันที่ยิงรับงาน, Project, Location, Claimed Type).");
    }
}

function handleClaimsFileUpload() {
    const fileInput = document.getElementById('file-claims-input');
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
            
            const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
            if (rows.length === 0) {
                toast.error("Excel sheet is empty.");
                return;
            }
            
            const parsed = aggregateRawClaims(rows);
            
            if (parsed.length > 0) {
                const current = db.get('claims_data');
                db.set('claims_data', [...current, ...parsed]);
                toast.success(`Success! Imported & aggregated ${parsed.length} Claims records from Excel.`);
                fileInput.value = '';
            } else {
                toast.error("Failed to parse claims. Expected columns: วันที่ยิงรับงาน, Project, Location, Claimed Type.");
            }
        } catch (err) {
            console.error(err);
            toast.error("Excel processing failed: " + err.message);
        }
    };
    reader.readAsArrayBuffer(file);
}

// ----------------------------------------------------
// WIP IMPORT (DAILY MATRIX FORMAT WITH DYNAMIC DATES)
// ----------------------------------------------------
function parseWipTSV(text) {
    if (!text || !text.trim()) return [];
    return text.trim().split(/\r?\n/).map(line => line.split('\t').map(cell => cell.trim()));
}

function parseWipGrid(rawRows) {
    if (rawRows.length < 2) return [];
    
    // Find header row containing dates
    let headerRowIdx = -1;
    for (let i = 0; i < Math.min(10, rawRows.length); i++) {
        const row = rawRows[i];
        if (row && row.some(cell => {
            const s = String(cell).toLowerCase().trim();
            return s.includes('jan') || s.includes('feb') || s.includes('mar') || s.includes('apr') || s.includes('may') || s.includes('jun') || s.includes('jul') || s.includes('aug') || s.includes('sep') || s.includes('oct') || s.includes('nov') || s.includes('dec') || (typeof cell === 'number' && cell > 40000 && cell < 60000);
        })) {
            headerRowIdx = i;
            break;
        }
    }
    
    if (headerRowIdx === -1 || headerRowIdx + 1 >= rawRows.length) {
        console.error("Could not find header row in WIP sheet.");
        return [];
    }
    
    const headerRow = rawRows[headerRowIdx];
    const dateCols = [];
    for (let colIdx = 3; colIdx < headerRow.length; colIdx++) {
        const cell = headerRow[colIdx];
        if (cell !== undefined && cell !== null && String(cell).trim() !== "") {
            const dateStr = normalizeDate(cell);
            if (dateStr) {
                dateCols.push({ colIdx: colIdx, dateStr: dateStr });
            }
        }
    }
    
    if (dateCols.length === 0) {
        console.error("No valid date columns found in WIP sheet.");
        return [];
    }
    
    // accum[dateStr][typeVal] = { total_wip: 0, pending_rework: 0, active_wip: 0 }
    const accum = {};
    
    let currentCategory = "";
    let currentType = "";
    for (let rIdx = headerRowIdx + 1; rIdx < rawRows.length; rIdx++) {
        const row = rawRows[rIdx];
        if (!row || row.length === 0) continue;
        
        // Column 0 is Category (could be merged/blank in grid)
        const catCell = row[0] ? String(row[0]).trim() : "";
        if (catCell !== "") {
            currentCategory = catCell;
        }
        
        if (!currentCategory) continue;
        
        let categoryField = "";
        const catStr = currentCategory.toLowerCase();
        if (catStr.includes("total")) {
            categoryField = "total_wip";
        } else if (catStr.includes("rework")) {
            categoryField = "pending_rework";
        } else if (catStr.includes("active")) {
            categoryField = "active_wip";
        }
        
        if (!categoryField) continue;
        
        // Column 2 is Type (could be merged/blank in grid)
        const typeCell = row[2] ? String(row[2]).trim() : "";
        if (typeCell !== "") {
            currentType = typeCell;
        }
        
        let typeVal = currentType;
        
        // Fallback: Infer type from Sub-type (Column 1) if type is empty/missing
        if (!typeVal) {
            const subTypeCell = row[1] ? String(row[1]).trim().toLowerCase() : "";
            if (subTypeCell.includes("lhd")) {
                typeVal = "LHD";
            } else if (subTypeCell.includes("rhd")) {
                typeVal = "RHD";
            } else if (subTypeCell.includes("diffus")) {
                typeVal = "Diffuser";
            }
        }
        
        if (!typeVal) continue;
        
        if (typeVal.toLowerCase() === "diffusor") {
            typeVal = "Diffuser";
        }
        
        // Loop through date columns to aggregate values
        dateCols.forEach(colInfo => {
            const dateStr = colInfo.dateStr;
            const cellVal = row[colInfo.colIdx];
            if (cellVal === undefined || cellVal === null || String(cellVal).trim() === "") return;
            
            const cleanStr = String(cellVal).replace(/,/g, '').trim();
            const numVal = Number(cleanStr);
            if (isNaN(numVal)) return;
            
            if (!accum[dateStr]) {
                accum[dateStr] = {};
            }
            if (!accum[dateStr][typeVal]) {
                accum[dateStr][typeVal] = { total_wip: 0, pending_rework: 0, active_wip: 0 };
            }
            
            accum[dateStr][typeVal][categoryField] += numVal;
        });
    }
    
    // Flatten into flat wip_data array
    const parsedRecords = [];
    Object.keys(accum).forEach(dateStr => {
        Object.keys(accum[dateStr]).forEach(typeVal => {
            const data = accum[dateStr][typeVal];
            parsedRecords.push({
                date: dateStr,
                type: typeVal,
                total_wip: data.total_wip,
                pending_rework: data.pending_rework,
                active_wip: data.active_wip
            });
        });
    });
    
    return parsedRecords;
}

function processWipPaste() {
    const text = document.getElementById('paste-wip').value;
    if (!text.trim()) {
        toast.error("WIP paste area is empty.");
        return;
    }
    
    const rawRows = parseWipTSV(text);
    const parsed = parseWipGrid(rawRows);
    
    if (parsed.length > 0) {
        const current = db.get('wip_data');
        const parsedDates = new Set(parsed.map(d => d.date));
        const filteredCurrent = current.filter(d => !parsedDates.has(d.date));
        
        db.set('wip_data', [...filteredCurrent, ...parsed]);
        toast.success(`Success! Imported WIP data for ${parsedDates.size} dates.`);
        document.getElementById('paste-wip').value = '';
    } else {
        toast.error("Failed to parse WIP data. Verify the headers and structure match the daily matrix.");
    }
}

function handleWipFileUpload() {
    const fileInput = document.getElementById('file-wip-input');
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
            
            // Get first sheet
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            if (!sheet) {
                toast.error("No valid sheet found in Excel file.");
                return;
            }
            
            // Read with defval: "" so that merged cells return "" instead of being undefined
            const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
            const parsed = parseWipGrid(rawRows);
            
            if (parsed.length > 0) {
                const current = db.get('wip_data');
                const parsedDates = new Set(parsed.map(d => d.date));
                const filteredCurrent = current.filter(d => !parsedDates.has(d.date));
                
                db.set('wip_data', [...filteredCurrent, ...parsed]);
                toast.success(`Success! Imported WIP data for ${parsedDates.size} dates.`);
                fileInput.value = '';
            } else {
                toast.error("No valid WIP data found in Excel sheet. Verify the format.");
            }
        } catch (err) {
            console.error(err);
            toast.error("Excel processing failed: " + err.message);
        }
    };
    reader.readAsArrayBuffer(file);
}

// ----------------------------------------------------
// REWORK RATE IMPORT & MATRIX PARSER UTILITIES
// ----------------------------------------------------

function parseHeaderDate(val, defaultYear = 2026) {
    if (!val) return null;
    
    // Check if it's already a valid date via standard normalizeDate
    let normalized = normalizeDate(val);
    if (normalized && normalized.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return normalized;
    }
    
    const s = String(val).trim().toLowerCase();
    
    // Match dd-MonthName (e.g. 10-mar, 10-ma, 10-march)
    const matchMonth = s.match(/^(\d{1,2})[-/]([a-z]+)$/);
    if (matchMonth) {
        const day = matchMonth[1].padStart(2, '0');
        const monthAbbrev = matchMonth[2].substring(0, 3);
        const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        const monthIdx = months.findIndex(m => m.startsWith(monthAbbrev));
        if (monthIdx !== -1) {
            const m = String(monthIdx + 1).padStart(2, '0');
            return `${defaultYear}-${m}-${day}`;
        }
    }
    
    // Match dd/mm or dd-mm
    const matchNum = s.match(/^(\d{1,2})[-/](\d{1,2})$/);
    if (matchNum) {
        const day = matchNum[1].padStart(2, '0');
        const m = matchNum[2].padStart(2, '0');
        return `${defaultYear}-${m}-${day}`;
    }
    
    // Match dd-Month-yy or dd-Month-yyyy
    const matchFull = s.match(/^(\d{1,2})[-/]([a-z]+)[-/](\d{2,4})$/);
    if (matchFull) {
        const day = matchFull[1].padStart(2, '0');
        const monthAbbrev = matchFull[2].substring(0, 3);
        let year = matchFull[3];
        if (year.length === 2) year = '20' + year;
        const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        const monthIdx = months.findIndex(m => m.startsWith(monthAbbrev));
        if (monthIdx !== -1) {
            const m = String(monthIdx + 1).padStart(2, '0');
            return `${year}-${m}-${day}`;
        }
    }
    
    return null;
}

function isMatrixFormat(rawRows) {
    if (rawRows.length < 2) return false;
    const firstRow = rawRows[0];
    if (!firstRow || firstRow.length < 3) return false;
    
    let dateHeaderCount = 0;
    for (let i = 2; i < firstRow.length; i++) {
        const cell = firstRow[i];
        if (cell !== undefined && cell !== null && String(cell).trim() !== "") {
            const dateStr = normalizeDate(cell) || parseHeaderDate(cell);
            if (dateStr) {
                dateHeaderCount++;
            }
        }
    }
    return dateHeaderCount > 0;
}

function parseMatrixGrid(rawRows) {
    if (rawRows.length < 2) return [];
    
    let headerRowIdx = -1;
    for (let i = 0; i < Math.min(10, rawRows.length); i++) {
        const row = rawRows[i];
        if (row && row.some(cell => {
            const s = String(cell).toLowerCase().trim();
            return s.includes('jan') || s.includes('feb') || s.includes('mar') || s.includes('apr') || s.includes('may') || s.includes('jun') || s.includes('jul') || s.includes('aug') || s.includes('sep') || s.includes('oct') || s.includes('nov') || s.includes('dec') || (typeof cell === 'number' && cell > 40000 && cell < 60000);
        })) {
            headerRowIdx = i;
            break;
        }
    }
    
    if (headerRowIdx === -1) {
        headerRowIdx = 0;
    }
    
    const headerRow = rawRows[headerRowIdx];
    const dateCols = [];
    
    for (let colIdx = 2; colIdx < headerRow.length; colIdx++) {
        const cell = headerRow[colIdx];
        if (cell !== undefined && cell !== null && String(cell).trim() !== "") {
            let dateStr = normalizeDate(cell);
            if (!dateStr || !dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                dateStr = parseHeaderDate(cell);
            }
            if (dateStr) {
                dateCols.push({ colIdx: colIdx, dateStr: dateStr });
            }
        }
    }
    
    if (dateCols.length === 0) {
        console.error("No valid date columns found in sheet.");
        return [];
    }
    
    const parsedRecords = [];
    
    for (let rIdx = headerRowIdx + 1; rIdx < rawRows.length; rIdx++) {
        const row = rawRows[rIdx];
        if (!row || row.length < 2) continue;
        
        const erpCode = String(row[0] || "").trim();
        const processStatus = String(row[1] || "").trim();
        
        if (!erpCode || !processStatus) continue;
        
        dateCols.forEach(colInfo => {
            const dateStr = colInfo.dateStr;
            const cellVal = row[colInfo.colIdx];
            if (cellVal === undefined || cellVal === null || String(cellVal).trim() === "") return;
            
            const cleanStr = String(cellVal).replace(/,/g, '').trim();
            const numVal = Number(cleanStr);
            if (isNaN(numVal)) return;
            
            parsedRecords.push({
                date: dateStr,
                process_status: processStatus,
                erp_code: erpCode,
                qty: numVal
            });
        });
    }
    
    return parsedRecords;
}

function processReworkPaste() {
    const text = document.getElementById('paste-rework').value;
    if (!text.trim()) {
        toast.error("Rework paste area is empty.");
        return;
    }
    
    const rawRows = parseWipTSV(text);
    const parsed = parseMatrixGrid(rawRows);
    
    if (parsed.length > 0) {
        const current = db.get('rework_data');
        const parsedDates = new Set(parsed.map(d => d.date));
        const filteredCurrent = current.filter(d => !parsedDates.has(d.date));
        
        db.set('rework_data', [...filteredCurrent, ...parsed]);
        toast.success(`Success! Processed & imported Rework data for ${parsedDates.size} dates.`);
        document.getElementById('paste-rework').value = '';
    } else {
        toast.error("Failed to parse Rework matrix. Check columns (ERP Code, Process e.g. Layup:OK/Rework, and Dates).");
    }
}

function handleReworkFileUpload() {
    const fileInput = document.getElementById('file-rework-input');
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
            const parsed = parseMatrixGrid(rawRows);
            
            if (parsed.length > 0) {
                const current = db.get('rework_data');
                const parsedDates = new Set(parsed.map(d => d.date));
                const filteredCurrent = current.filter(d => !parsedDates.has(d.date));
                
                db.set('rework_data', [...filteredCurrent, ...parsed]);
                toast.success(`Success! Imported Rework matrix for ${parsedDates.size} dates.`);
                fileInput.value = '';
            } else {
                toast.error("No valid Rework daily matrix data found in Excel sheet.");
            }
        } catch (err) {
            console.error(err);
            toast.error("Excel processing failed: " + err.message);
        }
    };
    reader.readAsArrayBuffer(file);
}

// ----------------------------------------------------
// FILE UPLOAD: SCRAP TOP (Daily Scrap & Inven)
// ----------------------------------------------------
function handleScrapFileUpload() {
    const fileInput = document.getElementById('file-scrap-input');
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
            
            let dailyCount = 0;
            let invenCount = 0;
            
            // Helper for case-insensitive and flexible sheet name lookup
            const findSheetName = (names) => {
                // Exact trimmed case-insensitive
                for (let name of names) {
                    const found = workbook.SheetNames.find(s => s.toLowerCase().trim() === name.toLowerCase());
                    if (found) return found;
                }
                // Partial contains
                for (let name of names) {
                    const found = workbook.SheetNames.find(s => s.toLowerCase().includes(name.toLowerCase()));
                    if (found) return found;
                }
                return null;
            };
            
            // 1. Process Daily Scrap sheet
            const dailySheetName = findSheetName(['Daily Scrap', 'DailyScrap', 'Daily_Scrap', 'Scrap', 'Defect']) || workbook.SheetNames[0];
            const dailySheet = workbook.Sheets[dailySheetName];
            
            if (dailySheet) {
                const rawRows = XLSX.utils.sheet_to_json(dailySheet, { header: 1, defval: "" });
                if (isMatrixFormat(rawRows)) {
                    const parsed = parseMatrixGrid(rawRows);
                    if (parsed.length > 0) {
                        const current = db.get('scrap_data');
                        const parsedDates = new Set(parsed.map(d => d.date));
                        const filteredCurrent = current.filter(d => !parsedDates.has(d.date));
                        db.set('scrap_data', [...filteredCurrent, ...parsed]);
                        dailyCount = parsed.length;
                    }
                } else {
                    const rows = XLSX.utils.sheet_to_json(dailySheet);
                    const currentDaily = db.get('scrap_daily');
                    const parsed = [];
                    
                    rows.forEach(r => {
                        const keys = Object.keys(r);
                        let dKey = keys.find(k => k.toLowerCase().includes('date') || k.toLowerCase().includes('month') || k.includes('วัน'));
                        let prKey = keys.find(k => k.toLowerCase().includes('process') || k.toLowerCase().includes('สถานะ'));
                        let erKey = keys.find(k => k.toLowerCase().includes('erp') || k.toLowerCase().includes('รหัส'));
                        let dfKey = keys.find(k => k.toLowerCase().includes('defect') || k.toLowerCase().includes('ng') || k.toLowerCase().includes('เสีย'));
                        let qKey = keys.find(k => k.toLowerCase().includes('qty') || k.toLowerCase().includes('quantity') || k.toLowerCase().includes('จำนวน'));
                        
                        if (dKey && prKey && erKey && dfKey && qKey) {
                            const rawQty = r[qKey];
                            const cleanQty = Number(String(rawQty !== undefined && rawQty !== null ? rawQty : '').replace(/,/g, '').trim()) || 0;
                            parsed.push({
                                date: normalizeDate(r[dKey]),
                                process: String(r[prKey] || '').trim(),
                                erp_code: String(r[erKey] || '').trim(),
                                defect: String(r[dfKey] || '').trim(),
                                qty: cleanQty
                            });
                            dailyCount++;
                        }
                    });
                    if (parsed.length > 0) {
                        db.set('scrap_daily', [...currentDaily, ...parsed]);
                    }
                }
            }
            
            // 2. Process Inven sheet
            const invenSheetName = findSheetName(['Inven', 'Inventory', 'Input', 'InputQty', 'Input Qty']);
            const invenSheet = invenSheetName ? workbook.Sheets[invenSheetName] : null;
            if (invenSheet) {
                const rows = XLSX.utils.sheet_to_json(invenSheet);
                const currentInven = db.get('scrap_inven');
                const parsed = [];
                
                rows.forEach(r => {
                    const keys = Object.keys(r);
                    let dKey = keys.find(k => k.toLowerCase().includes('date') || k.toLowerCase().includes('month') || k.includes('วัน'));
                    let erKey = keys.find(k => {
                        const s = k.toLowerCase();
                        return s.includes('erp') || s.includes('code') || s.includes('part') || s.includes('รหัส');
                    });
                    let iKey = keys.find(k => k.toLowerCase().includes('input') || k.toLowerCase().includes('qty') || k.toLowerCase().includes('quantity') || k.toLowerCase().includes('จำนวน'));
                    
                    if (dKey && erKey && iKey) {
                        const rawInven = r[iKey];
                        const cleanInven = Number(String(rawInven !== undefined && rawInven !== null ? rawInven : '').replace(/,/g, '').trim()) || 0;
                        parsed.push({
                            date: normalizeDate(r[dKey]),
                            erp_code: String(r[erKey] || '').trim(),
                            input_qty: cleanInven
                        });
                        invenCount++;
                    }
                });
                if (parsed.length > 0) {
                    db.set('scrap_inven', [...currentInven, ...parsed]);
                }
            }
            
            if (dailyCount > 0 || invenCount > 0) {
                toast.success(`Success! Imported ${dailyCount} scrap records & ${invenCount} inventory logs.`);
                fileInput.value = '';
            } else {
                toast.error("No sheets 'Daily Scrap' or 'Inven' found, or columns do not match.");
            }
        } catch (err) {
            console.error(err);
            toast.error("Excel processing failed: " + err.message);
        }
    };
    reader.readAsArrayBuffer(file);
}

// ----------------------------------------------------
// COPY PASTE: SCRAP TOP
// ----------------------------------------------------
function processScrapTopPaste() {
    const dailyText = document.getElementById('paste-scrap-daily').value;
    const invenText = document.getElementById('paste-scrap-inven').value;
    
    if (!dailyText.trim() && !invenText.trim()) {
        toast.error("Both paste text areas are empty.");
        return;
    }
    
    let dailyCount = 0;
    let invenCount = 0;
    
    // Process Daily Scrap Paste
    if (dailyText.trim()) {
        const rawRows = parseWipTSV(dailyText);
        if (isMatrixFormat(rawRows)) {
            const parsed = parseMatrixGrid(rawRows);
            if (parsed.length > 0) {
                const current = db.get('scrap_data');
                const parsedDates = new Set(parsed.map(d => d.date));
                const filteredCurrent = current.filter(d => !parsedDates.has(d.date));
                db.set('scrap_data', [...filteredCurrent, ...parsed]);
                dailyCount = parsed.length;
            }
        } else {
            const rows = parseExcelPaste(dailyText);
            const currentDaily = db.get('scrap_daily');
            const parsed = [];
            
            rows.forEach(r => {
                const keys = Object.keys(r);
                let dKey = keys.find(k => k.toLowerCase().includes('date') || k.toLowerCase().includes('month') || k.includes('วัน'));
                let prKey = keys.find(k => k.toLowerCase().includes('process') || k.toLowerCase().includes('สถานะ'));
                let erKey = keys.find(k => k.toLowerCase().includes('erp') || k.toLowerCase().includes('รหัส'));
                let dfKey = keys.find(k => k.toLowerCase().includes('defect') || k.toLowerCase().includes('ng') || k.toLowerCase().includes('เสีย'));
                let qKey = keys.find(k => k.toLowerCase().includes('qty') || k.toLowerCase().includes('quantity') || k.toLowerCase().includes('จำนวน'));
                
                if (dKey && prKey && erKey && dfKey && qKey) {
                    const rawQty = r[qKey];
                    const cleanQty = Number(String(rawQty !== undefined && rawQty !== null ? rawQty : '').replace(/,/g, '').trim()) || 0;
                    parsed.push({
                        date: normalizeDate(r[dKey]),
                        process: String(r[prKey] || '').trim(),
                        erp_code: String(r[erKey] || '').trim(),
                        defect: String(r[dfKey] || '').trim(),
                        qty: cleanQty
                    });
                    dailyCount++;
                }
            });
            if (parsed.length > 0) {
                db.set('scrap_daily', [...currentDaily, ...parsed]);
            }
        }
    }
    
    // Process Inven Paste
    if (invenText.trim()) {
        const rows = parseExcelPaste(invenText);
        const currentInven = db.get('scrap_inven');
        const parsed = [];
        
        rows.forEach(r => {
            const keys = Object.keys(r);
            let dKey = keys.find(k => k.toLowerCase().includes('date') || k.toLowerCase().includes('month') || k.includes('วัน'));
            let erKey = keys.find(k => {
                const s = k.toLowerCase();
                return s.includes('erp') || s.includes('code') || s.includes('part') || s.includes('รหัส');
            });
            let iKey = keys.find(k => k.toLowerCase().includes('input') || k.toLowerCase().includes('qty') || k.toLowerCase().includes('quantity') || k.toLowerCase().includes('จำนวน'));
            
            if (dKey && erKey && iKey) {
                const rawInven = r[iKey];
                const cleanInven = Number(String(rawInven !== undefined && rawInven !== null ? rawInven : '').replace(/,/g, '').trim()) || 0;
                parsed.push({
                    date: normalizeDate(r[dKey]),
                    erp_code: String(r[erKey] || '').trim(),
                    input_qty: cleanInven
                });
                invenCount++;
            }
        });
        if (parsed.length > 0) {
            db.set('scrap_inven', [...currentInven, ...parsed]);
        }
    }
    
    if (dailyCount > 0 || invenCount > 0) {
        toast.success(`Success! Imported ${dailyCount} scrap records & ${invenCount} inventory logs.`);
        document.getElementById('paste-scrap-daily').value = '';
        document.getElementById('paste-scrap-inven').value = '';
    } else {
        toast.error("Failed to parse data. Verify headers match expected columns.");
    }
}

let activeClearCallback = null;
function showConfirmModal(title, msg, onConfirm) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-msg').textContent = msg;
    document.getElementById('confirm-modal').style.display = 'flex';
    activeClearCallback = onConfirm;
}
function closeConfirmModal() {
    document.getElementById('confirm-modal').style.display = 'none';
    activeClearCallback = null;
}
