// Claim Motorrad Controller
let chartModelCodeInstance = null;
let chartStatus8dInstance = null;
let chartClaimTypeInstance = null;

const motorradXAxisPlugin = {
    id: 'motorradXAxis',
    afterDraw: (chart) => {
        const xAxis = chart.scales.x;
        if (!xAxis) return;
        const periods = chart.$periods;
        const groupMode = chart.$groupMode;
        if (!periods || periods.length === 0) return;
        
        const ctx = chart.ctx;
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const lineColor = isDark ? '#334155' : '#cbd5e1';
        const textColor = isDark ? '#94a3b8' : '#475569';
        
        ctx.save();
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 1;
        ctx.fillStyle = textColor;
        ctx.font = "600 11px 'Outfit', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        
        const labelHeight = groupMode === 'Monthly' ? 35 : 20;
        
        if (groupMode === 'Monthly') {
            const line1Y = xAxis.top + labelHeight;
            const line2Y = line1Y + 24;
            const line3Y = line2Y + 24;
            
            const qRowY = line1Y + 12;
            const yRowY = line2Y + 12;
            
            // 1. Draw horizontal lines
            ctx.beginPath();
            ctx.moveTo(xAxis.left, line1Y);
            ctx.lineTo(xAxis.right, line1Y);
            ctx.moveTo(xAxis.left, line2Y);
            ctx.lineTo(xAxis.right, line2Y);
            ctx.moveTo(xAxis.left, line3Y);
            ctx.lineTo(xAxis.right, line3Y);
            ctx.stroke();
            
            // 2. Draw outer vertical border lines
            ctx.beginPath();
            ctx.moveTo(xAxis.left, xAxis.top);
            ctx.lineTo(xAxis.left, line3Y);
            ctx.moveTo(xAxis.right, xAxis.top);
            ctx.lineTo(xAxis.right, line3Y);
            ctx.stroke();
            
            // 3. Map items
            const items = periods.map((period, idx) => {
                const parts = period.split('-');
                const yr = parts[0];
                const m = parseInt(parts[1]);
                const qtr = `QTR${Math.floor((m - 1) / 3) + 1}`;
                return {
                    index: idx,
                    year: yr,
                    quarter: qtr,
                    pixel: xAxis.getPixelForTick(idx)
                };
            });
            
            // 4. Group by Quarter
            const quarterGroups = [];
            let currentQ = null;
            items.forEach(item => {
                const qKey = `${item.year}-${item.quarter}`;
                if (!currentQ || currentQ.key !== qKey) {
                    if (currentQ) quarterGroups.push(currentQ);
                    currentQ = {
                        key: qKey,
                        year: item.year,
                        quarter: item.quarter,
                        startIndex: item.index,
                        endIndex: item.index,
                        startPixel: item.pixel,
                        endPixel: item.pixel
                    };
                } else {
                    currentQ.endIndex = item.index;
                    currentQ.endPixel = item.pixel;
                }
            });
            if (currentQ) quarterGroups.push(currentQ);
            
            // 5. Group by Year
            const yearGroups = [];
            let currentY = null;
            items.forEach(item => {
                if (!currentY || currentY.year !== item.year) {
                    if (currentY) yearGroups.push(currentY);
                    currentY = {
                        year: item.year,
                        startIndex: item.index,
                        endIndex: item.index,
                        startPixel: item.pixel,
                        endPixel: item.pixel
                    };
                } else {
                    currentY.endIndex = item.index;
                    currentY.endPixel = item.pixel;
                }
            });
            if (currentY) yearGroups.push(currentY);
            
            // 6. Draw Quarter text and vertical separators
            quarterGroups.forEach((g, idx) => {
                const centerPixel = (g.startPixel + g.endPixel) / 2;
                ctx.fillText(g.quarter, centerPixel, qRowY);
                
                if (idx < quarterGroups.length - 1) {
                    const nextG = quarterGroups[idx + 1];
                    const boundaryX = (g.endPixel + nextG.startPixel) / 2;
                    ctx.beginPath();
                    ctx.moveTo(boundaryX, line1Y);
                    ctx.lineTo(boundaryX, line2Y);
                    ctx.stroke();
                }
            });
            
            // 7. Draw Year text and vertical separators
            yearGroups.forEach((g, idx) => {
                const centerPixel = (g.startPixel + g.endPixel) / 2;
                ctx.fillText(g.year, centerPixel, yRowY);
                
                if (idx < yearGroups.length - 1) {
                    const nextG = yearGroups[idx + 1];
                    const boundaryX = (g.endPixel + nextG.startPixel) / 2;
                    ctx.beginPath();
                    ctx.moveTo(boundaryX, line2Y);
                    ctx.lineTo(boundaryX, line3Y);
                    ctx.stroke();
                }
            });
        } else {
            // Quarterly mode
            const line1Y = xAxis.top + labelHeight;
            const line2Y = line1Y + 24;
            
            const yRowY = line1Y + 12;
            
            // 1. Draw horizontal lines
            ctx.beginPath();
            ctx.moveTo(xAxis.left, line1Y);
            ctx.lineTo(xAxis.right, line1Y);
            ctx.moveTo(xAxis.left, line2Y);
            ctx.lineTo(xAxis.right, line2Y);
            ctx.stroke();
            
            // 2. Draw outer vertical border lines
            ctx.beginPath();
            ctx.moveTo(xAxis.left, xAxis.top);
            ctx.lineTo(xAxis.left, line2Y);
            ctx.moveTo(xAxis.right, xAxis.top);
            ctx.lineTo(xAxis.right, line2Y);
            ctx.stroke();
            
            // 3. Map items
            const items = periods.map((period, idx) => {
                const parts = period.split('-');
                const yr = parts[0];
                return {
                    index: idx,
                    year: yr,
                    pixel: xAxis.getPixelForTick(idx)
                };
            });
            
            // 4. Group by Year
            const yearGroups = [];
            let currentY = null;
            items.forEach(item => {
                if (!currentY || currentY.year !== item.year) {
                    if (currentY) yearGroups.push(currentY);
                    currentY = {
                        year: item.year,
                        startIndex: item.index,
                        endIndex: item.index,
                        startPixel: item.pixel,
                        endPixel: item.pixel
                    };
                } else {
                    currentY.endIndex = item.index;
                    currentY.endPixel = item.pixel;
                }
            });
            if (currentY) yearGroups.push(currentY);
            
            // 5. Draw Year text and vertical separators
            yearGroups.forEach((g, idx) => {
                const centerPixel = (g.startPixel + g.endPixel) / 2;
                ctx.fillText(g.year, centerPixel, yRowY);
                
                if (idx < yearGroups.length - 1) {
                    const nextG = yearGroups[idx + 1];
                    const boundaryX = (g.endPixel + nextG.startPixel) / 2;
                    ctx.beginPath();
                    ctx.moveTo(boundaryX, line1Y);
                    ctx.lineTo(boundaryX, line2Y);
                    ctx.stroke();
                }
            });
        }
        
        ctx.restore();
    }
};

let selectedMotorradProjects = [];
let allMotorradProjects = [];

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inject sidebar and header layout
    injectLayout("Claim Motorrad Dashboard");
    
    // 2. Setup project multi-select filter
    populateProjectFilter();
    
    // 3. Render report initially
    renderMotorradReport();
    
    // 4. Bind other filters
    document.getElementById('group-mode').addEventListener('change', renderMotorradReport);
    document.getElementById('motorrad-year').addEventListener('change', renderMotorradReport);
    
    // Re-render when theme changes to update chart label and grid colors
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            // Wait slightly for theme attribute to update on html tag
            setTimeout(renderMotorradReport, 50);
        });
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('motorrad-project-dropdown');
        const options = document.getElementById('motorrad-project-options');
        if (dropdown && options && !dropdown.contains(e.target)) {
            options.style.display = 'none';
        }
    });
});

function populateProjectFilter() {
    const rawData = db.get('claim_motorrad_data') || [];
    // Get unique model codes (CAC P/N) e.g., K66, K67, K69, KM3
    const projects = [...new Set(rawData.map(d => d.model_code || 'N/A'))].filter(p => p !== '').sort();
    
    allMotorradProjects = projects;
    selectedMotorradProjects = [...projects]; // Default select all
    
    const btn = document.getElementById('motorrad-project-btn');
    const optionsDiv = document.getElementById('motorrad-project-options');
    if (!btn || !optionsDiv) return;
    
    optionsDiv.innerHTML = '';
    
    // Select All checkbox
    const selectAllLabel = document.createElement('label');
    selectAllLabel.className = 'multiselect-item';
    selectAllLabel.innerHTML = `
        <input type="checkbox" id="motorrad-select-all" checked>
        <span><strong>Select All</strong></span>
    `;
    optionsDiv.appendChild(selectAllLabel);
    
    // Individual checkboxes
    projects.forEach(p => {
        const label = document.createElement('label');
        label.className = 'multiselect-item';
        label.innerHTML = `
            <input type="checkbox" value="${p}" class="motorrad-proj-checkbox" checked>
            <span>${p}</span>
        `;
        optionsDiv.appendChild(label);
    });
    
    // Toggle options panel visibility
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isHidden = optionsDiv.style.display === 'none' || optionsDiv.style.display === '';
        optionsDiv.style.display = isHidden ? 'block' : 'none';
    });
    
    const selectAllCheckbox = document.getElementById('motorrad-select-all');
    const projCheckboxes = optionsDiv.querySelectorAll('.motorrad-proj-checkbox');
    
    // Select All logic
    selectAllCheckbox.addEventListener('change', () => {
        const isChecked = selectAllCheckbox.checked;
        projCheckboxes.forEach(cb => {
            cb.checked = isChecked;
        });
        updateSelection();
    });
    
    // Individual checkboxes logic
    projCheckboxes.forEach(cb => {
        cb.addEventListener('change', () => {
            const allChecked = Array.from(projCheckboxes).every(c => c.checked);
            const noneChecked = Array.from(projCheckboxes).every(c => !c.checked);
            selectAllCheckbox.checked = allChecked;
            selectAllCheckbox.indeterminate = !allChecked && !noneChecked;
            updateSelection();
        });
    });
    
    function updateSelection() {
        selectedMotorradProjects = Array.from(projCheckboxes)
            .filter(c => c.checked)
            .map(c => c.value);
        updateBtnText();
        renderMotorradReport();
    }
    
    function updateBtnText() {
        if (selectedMotorradProjects.length === 0) {
            btn.textContent = 'None Selected';
        } else if (selectedMotorradProjects.length === allMotorradProjects.length) {
            btn.textContent = 'All Projects';
        } else if (selectedMotorradProjects.length <= 2) {
            btn.textContent = selectedMotorradProjects.join(', ');
        } else {
            btn.textContent = `${selectedMotorradProjects.length} Selected`;
        }
    }
    
    updateBtnText();
}

function renderMotorradReport() {
    const rawData = db.get('claim_motorrad_data') || [];
    const groupMode = document.getElementById('group-mode').value; // Monthly or Quarterly
    const selectedYear = document.getElementById('motorrad-year').value; // All, 2025, 2026
    
    // Theme colors setup
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? '#1f293d' : '#e2e8f0';
    const textColor = isDark ? '#94a3b8' : '#64748b';
    const legendColor = isDark ? '#f8fafc' : '#0f172a';
    
    // Enable ChartDataLabels globally
    const activePlugins = [];
    if (typeof ChartDataLabels !== 'undefined') {
        activePlugins.push(ChartDataLabels);
    }
    
    // 1. Filter raw records
    const filteredRecords = rawData.filter(d => {
        if (!d.date) return false;
        
        // Year filter
        const yr = d.date.split('-')[0];
        if (selectedYear !== 'All' && yr !== selectedYear) return false;
        
        // Project/Model code filter
        if (!selectedMotorradProjects.includes(d.model_code || 'N/A')) return false;
        
        return true;
    });
    
    // Update summary statistics (all status including Rejected)
    const totalLogs = filteredRecords.length;
    const closedClaims = filteredRecords.filter(d => (d.status_8d || '').toLowerCase() === 'closed').length;
    const openClaims = filteredRecords.filter(d => (d.status_8d || '').toLowerCase() === 'open').length;
    const rejectedClaims = filteredRecords.filter(d => (d.status_8d || '').toLowerCase() === 'rejected').length;
    
    document.getElementById('stat-total-logs').textContent = totalLogs;
    document.getElementById('stat-closed-claims').textContent = closedClaims;
    document.getElementById('stat-open-claims').textContent = openClaims;
    document.getElementById('stat-rejected-claims').textContent = rejectedClaims;
    
    // 2. Filter records for charts (EXCLUDE REJECTED status)
    const chartRecords = filteredRecords.filter(d => (d.status_8d || '').toLowerCase() !== 'rejected');
    
    // 3. Group dates to build X-axis chronologically
    // We group by key depending on mode:
    // - Monthly: "YYYY-MM"
    // - Quarterly: "YYYY-[Q1/Q2/Q3/Q4]"
    const periodMap = {};
    chartRecords.forEach(d => {
        const parts = d.date.split('-');
        const y = parts[0];
        const m = parseInt(parts[1]);
        
        let periodKey = '';
        if (groupMode === 'Monthly') {
            periodKey = `${y}-${String(m).padStart(2, '0')}`;
        } else {
            const q = Math.floor((m - 1) / 3) + 1;
            periodKey = `${y}-Q${q}`;
        }
        periodMap[periodKey] = true;
    });
    
    // Sort period keys chronologically
    const sortedPeriods = Object.keys(periodMap).sort();
    
    // Generate tick labels (only Month/Quarter names, outer rows drawn by plugin)
    const xLabels = sortedPeriods.map(key => {
        const parts = key.split('-');
        if (groupMode === 'Monthly') {
            const mVal = parseInt(parts[1]);
            const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
            return monthNames[mVal - 1];
        } else {
            const qLabel = parts[1]; // "Q1", "Q2", etc.
            return `QTR${qLabel.substring(1)}`;
        }
    });
    
    // ----------------------------------------------------
    // GRAPH 1: CLAIM COUNT BY CAC P/N (MODEL CODE)
    // ----------------------------------------------------
    // Unique model codes from chart dataset
    const modelCodes = [...new Set(chartRecords.map(d => d.model_code || 'N/A'))].sort();
    
    // Build datasets for stacked bars
    const modelColors = {
        'KM3': '#86efac', // light green
        'K69': '#d8b4fe', // light purple/pink
        'K67': '#7dd3fc', // light blue
        'K66': '#fcd34d', // soft yellow/orange (warm color)
        'N/A': '#cbd5e1'  // slate grey
    };
    
    const datasetsModel = modelCodes.map(code => {
        const dataValues = sortedPeriods.map(period => {
            return chartRecords.filter(d => {
                const parts = d.date.split('-');
                const y = parts[0];
                const m = parseInt(parts[1]);
                let pKey = '';
                if (groupMode === 'Monthly') {
                    pKey = `${y}-${String(m).padStart(2, '0')}`;
                } else {
                    const q = Math.floor((m - 1) / 3) + 1;
                    pKey = `${y}-Q${q}`;
                }
                return pKey === period && (d.model_code || 'N/A') === code;
            }).length;
        });
        
        return {
            label: code,
            data: dataValues,
            backgroundColor: modelColors[code] || '#a7f3d0',
            borderColor: isDark ? '#1e293b' : '#ffffff',
            borderWidth: 1.5,
            borderRadius: 4
        };
    });
    
    const ctxModel = document.getElementById('chartModelCode').getContext('2d');
    if (chartModelCodeInstance) chartModelCodeInstance.destroy();
    chartModelCodeInstance = new Chart(ctxModel, {
        type: 'bar',
        data: {
            labels: xLabels,
            datasets: datasetsModel
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: legendColor,
                        font: { family: 'Outfit', weight: '600', size: 14 }
                    }
                },
                datalabels: {
                    color: '#1f2937',
                    font: { family: 'Inter', weight: '700', size: 12 },
                    formatter: (value) => value > 0 ? value : '',
                    anchor: 'center',
                    align: 'center'
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleFont: { family: 'Outfit', size: 14, weight: '700' },
                    bodyFont: { family: 'Inter', size: 13 },
                    padding: 10,
                    cornerRadius: 8
                }
            },
            scales: {
                x: {
                    stacked: true,
                    grid: { color: gridColor },
                    ticks: { 
                        color: textColor, 
                        font: { family: 'Outfit', size: 12, weight: '600' },
                        minRotation: groupMode === 'Monthly' ? 90 : 0,
                        maxRotation: groupMode === 'Monthly' ? 90 : 0
                    },
                    afterFit: function(scaleInstance) {
                        scaleInstance.height += groupMode === 'Monthly' ? 48 : 24;
                    }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    grid: { color: gridColor },
                    ticks: { 
                        color: textColor, 
                        font: { family: 'Inter', size: 13 },
                        stepSize: 1
                    }
                }
            }
        },
        plugins: [...activePlugins, motorradXAxisPlugin]
    });
    chartModelCodeInstance.$periods = sortedPeriods;
    chartModelCodeInstance.$groupMode = groupMode;
    
    // ----------------------------------------------------
    // GRAPH 2: CLAIM STATUS BY 8D STATUS
    // ----------------------------------------------------
    // Legend: Closed (Green), NTF (Grey), Open (Yellow)
    const statusTypes = ['Closed', 'NTF', 'Open'];
    const statusColors = {
        'Closed': '#4ade80', // green
        'NTF': '#9ca3af',    // grey
        'Open': '#fef08a'    // yellow
    };
    
    const datasetsStatus = statusTypes.map(status => {
        const dataValues = sortedPeriods.map(period => {
            return chartRecords.filter(d => {
                const parts = d.date.split('-');
                const y = parts[0];
                const m = parseInt(parts[1]);
                let pKey = '';
                if (groupMode === 'Monthly') {
                    pKey = `${y}-${String(m).padStart(2, '0')}`;
                } else {
                    const q = Math.floor((m - 1) / 3) + 1;
                    pKey = `${y}-Q${q}`;
                }
                return pKey === period && (d.status_8d || '').toLowerCase() === status.toLowerCase();
            }).length;
        });
        
        return {
            label: status,
            data: dataValues,
            backgroundColor: statusColors[status] || '#9ca3af',
            borderColor: isDark ? '#1e293b' : '#ffffff',
            borderWidth: 1.5,
            borderRadius: 4
        };
    });
    
    const ctxStatus = document.getElementById('chartStatus8d').getContext('2d');
    if (chartStatus8dInstance) chartStatus8dInstance.destroy();
    chartStatus8dInstance = new Chart(ctxStatus, {
        type: 'bar',
        data: {
            labels: xLabels,
            datasets: datasetsStatus
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: legendColor,
                        font: { family: 'Outfit', weight: '600', size: 14 }
                    }
                },
                datalabels: {
                    color: '#1f2937',
                    font: { family: 'Inter', weight: '700', size: 12 },
                    formatter: (value) => value > 0 ? value : '',
                    anchor: 'center',
                    align: 'center'
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleFont: { family: 'Outfit', size: 14, weight: '700' },
                    bodyFont: { family: 'Inter', size: 13 },
                    padding: 10,
                    cornerRadius: 8
                }
            },
            scales: {
                x: {
                    stacked: true,
                    grid: { color: gridColor },
                    ticks: { 
                        color: textColor, 
                        font: { family: 'Outfit', size: 12, weight: '600' },
                        minRotation: groupMode === 'Monthly' ? 90 : 0,
                        maxRotation: groupMode === 'Monthly' ? 90 : 0
                    },
                    afterFit: function(scaleInstance) {
                        scaleInstance.height += groupMode === 'Monthly' ? 48 : 24;
                    }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    grid: { color: gridColor },
                    ticks: { 
                        color: textColor, 
                        font: { family: 'Inter', size: 13 },
                        stepSize: 1
                    }
                }
            }
        },
        plugins: [...activePlugins, motorradXAxisPlugin]
    });
    chartStatus8dInstance.$periods = sortedPeriods;
    chartStatus8dInstance.$groupMode = groupMode;
    
    // ----------------------------------------------------
    // GRAPH 3: CLAIM TYPE PROPORTIONS (PIE/DOUGHNUT)
    // ----------------------------------------------------
    const typeCounts = {};
    chartRecords.forEach(d => {
        const type = d.claim_type || 'Others';
        typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    
    const claimTypes = Object.keys(typeCounts).sort();
    const claimTypeData = claimTypes.map(t => typeCounts[t]);
    
    // Muted plum/purple colors matching Image 3
    const typeColors = [
        '#a89f9e', // Appearance (light greyish plum)
        '#8c5b8c', // Deformation (muted purple)
        '#702963', // Dimension (medium magenta)
        '#581c87', // Function (dark purple)
        '#3b0764'  // Others (deep violet)
    ];
    
    const ctxType = document.getElementById('chartClaimType').getContext('2d');
    if (chartClaimTypeInstance) chartClaimTypeInstance.destroy();
    
    chartClaimTypeInstance = new Chart(ctxType, {
        type: 'doughnut',
        data: {
            labels: claimTypes,
            datasets: [{
                data: claimTypeData,
                backgroundColor: typeColors,
                borderColor: isDark ? '#131c2e' : '#ffffff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '40%',
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: legendColor,
                        font: { family: 'Outfit', weight: '600', size: 13 }
                    }
                },
                datalabels: {
                    color: isDark ? '#ffffff' : '#1f2937',
                    backgroundColor: isDark ? '#1e293b' : '#f3f4f6',
                    borderColor: isDark ? '#334155' : '#cbd5e1',
                    borderWidth: 1,
                    borderRadius: 6,
                    padding: 6,
                    font: { family: 'Outfit', weight: '700', size: 11 },
                    formatter: (value, ctx) => {
                        const total = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                        const pct = total > 0 ? Math.round((value / total) * 100) : 0;
                        return pct > 0 ? `${ctx.chart.data.labels[ctx.dataIndex]}\n${pct}%` : '';
                    },
                    textAlign: 'center',
                    align: 'end',
                    anchor: 'end',
                    offset: 10
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleFont: { family: 'Outfit', size: 13, weight: '700' },
                    bodyFont: { family: 'Inter', size: 12 },
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const val = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
                            return ` ${label}: ${val} logs (${pct}%)`;
                        }
                    }
                }
            }
        },
        plugins: activePlugins
    });
    
    // ----------------------------------------------------
    // POPULATE DETAIL RECORDS TABLE
    // ----------------------------------------------------
    const tbody = document.getElementById('motorrad-table-body');
    tbody.innerHTML = '';
    
    // Sort records descending by date
    const tableRecords = [...filteredRecords].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    tableRecords.forEach(item => {
        const row = document.createElement('tr');
        
        // Formatted status pill class
        let statusClass = 'tag-grey'; // default
        const status = (item.status_8d || '').toLowerCase();
        if (status === 'closed') statusClass = 'tag-green';
        else if (status === 'open') statusClass = 'tag-yellow';
        else if (status === 'rejected') statusClass = 'tag-red';
        else if (status === 'ntf') statusClass = 'tag-grey';
        
        // Setup simple tags style in CSS if needed, else inline styling for maximum safety
        const pillStyles = {
            'tag-green': 'background-color: rgba(16, 185, 129, 0.12); color: var(--color-success); border: 1px solid rgba(16, 185, 129, 0.25);',
            'tag-yellow': 'background-color: rgba(245, 158, 11, 0.12); color: var(--color-warning); border: 1px solid rgba(245, 158, 11, 0.25);',
            'tag-red': 'background-color: rgba(239, 68, 68, 0.12); color: var(--color-danger); border: 1px solid rgba(239, 68, 68, 0.25);',
            'tag-grey': 'background-color: rgba(107, 114, 128, 0.12); color: var(--text-secondary); border: 1px solid rgba(107, 114, 128, 0.25);'
        };
        const activePillStyle = pillStyles[statusClass] || pillStyles['tag-grey'];
        
        // Clean quantity representation
        const displayQty = item.qty ? item.qty : '-';
        
        row.innerHTML = `
            <td>${item.no}</td>
            <td style="font-family: 'Outfit', sans-serif; font-weight: 600;">${item.code_8d || '-'}</td>
            <td>${formatMonthYear(item.date)}</td>
            <td>${item.cust || '-'}</td>
            <td title="${item.description || ''}" style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.title || '-'}</td>
            <td style="text-align: center; font-weight: 700; color: var(--accent-blue);">${item.model_code || '-'}</td>
            <td>${item.claim_type || '-'}</td>
            <td style="text-align: center; font-weight: 600;">${displayQty}</td>
            <td style="text-align: center;">
                <span class="status-pill" style="display: inline-block; padding: 0.25rem 0.6rem; border-radius: 50px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; ${activePillStyle}">
                    ${item.status_8d || 'N/A'}
                </span>
            </td>
        `;
        tbody.appendChild(row);
    });
}
