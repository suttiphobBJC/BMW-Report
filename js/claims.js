// Claims Report Controller
let claimTypeChartInstance = null;
let claimLocationChartInstance = null;
let selectedClaimsProjects = [];
let allClaimsProjects = [];

document.addEventListener('DOMContentLoaded', () => {
    injectLayout("Claim Part Returned");
    populateProjectFilter();
    renderClaimsReport();
    
    document.getElementById('claims-quarter').addEventListener('change', renderClaimsReport);
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('claims-project-dropdown');
        const options = document.getElementById('claims-project-options');
        if (dropdown && options && !dropdown.contains(e.target)) {
            options.style.display = 'none';
        }
    });
});

function populateProjectFilter() {
    const claimsData = db.get('claims_data') || [];
    const projects = [...new Set(claimsData.map(d => d.project || 'N/A'))].sort();
    
    allClaimsProjects = projects;
    selectedClaimsProjects = [...projects]; // Default select all
    
    const btn = document.getElementById('claims-project-btn');
    const optionsDiv = document.getElementById('claims-project-options');
    if (!btn || !optionsDiv) return;
    
    optionsDiv.innerHTML = '';
    
    // Select All option
    const selectAllLabel = document.createElement('label');
    selectAllLabel.className = 'multiselect-item';
    selectAllLabel.innerHTML = `
        <input type="checkbox" id="claims-select-all" checked>
        <span><strong>Select All</strong></span>
    `;
    optionsDiv.appendChild(selectAllLabel);
    
    // Individual Project options
    projects.forEach(p => {
        const label = document.createElement('label');
        label.className = 'multiselect-item';
        label.innerHTML = `
            <input type="checkbox" value="${p}" class="claims-proj-checkbox" checked>
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
    
    const selectAllCheckbox = document.getElementById('claims-select-all');
    const projCheckboxes = optionsDiv.querySelectorAll('.claims-proj-checkbox');
    
    // Select All logic
    selectAllCheckbox.addEventListener('change', () => {
        const isChecked = selectAllCheckbox.checked;
        projCheckboxes.forEach(cb => {
            cb.checked = isChecked;
        });
        updateClaimsSelection();
    });
    
    // Individual checkboxes logic
    projCheckboxes.forEach(cb => {
        cb.addEventListener('change', () => {
            const allChecked = Array.from(projCheckboxes).every(c => c.checked);
            const noneChecked = Array.from(projCheckboxes).every(c => !c.checked);
            selectAllCheckbox.checked = allChecked;
            selectAllCheckbox.indeterminate = !allChecked && !noneChecked;
            updateClaimsSelection();
        });
    });
    
    function updateClaimsSelection() {
        selectedClaimsProjects = Array.from(projCheckboxes)
            .filter(c => c.checked)
            .map(c => c.value);
        updateClaimsBtnText();
        renderClaimsReport();
    }
    
    function updateClaimsBtnText() {
        if (selectedClaimsProjects.length === 0) {
            btn.textContent = 'None Selected';
        } else if (selectedClaimsProjects.length === allClaimsProjects.length) {
            btn.textContent = 'All Projects';
        } else if (selectedClaimsProjects.length <= 2) {
            btn.textContent = selectedClaimsProjects.join(', ');
        } else {
            btn.textContent = `${selectedClaimsProjects.length} Selected`;
        }
    }
    
    updateClaimsBtnText();
}

function renderClaimsReport() {
    const activePlugins = [];
    if (typeof ChartDataLabels !== 'undefined') {
        activePlugins.push(ChartDataLabels);
    }

    const selectedQ = document.getElementById('claims-quarter').value;
    const claimsData = db.get('claims_data') || [];
    
    // Detect years dynamically based on uploaded data (using timezone-immune parsing)
    const years = claimsData.map(d => {
        if (!d.date) return null;
        const p = d.date.split('-');
        const y = parseInt(p[0]);
        return isNaN(y) ? null : y;
    }).filter(y => y);
    const currentYear = years.length > 0 ? Math.max(...years) : 2026;
    const previousYear = currentYear - 1;

    // Update HTML labels dynamically to match the actual years
    const prevYearLabelType = document.getElementById('label-prev-year-type');
    const currYearLabelType = document.getElementById('label-curr-year-type');
    const prevYearLabelLoc = document.getElementById('label-prev-year-loc');
    const currYearLabelLoc = document.getElementById('label-curr-year-loc');
    const thPrevYearQty = document.getElementById('th-prev-year-qty');
    const thCurrYearQty = document.getElementById('th-curr-year-qty');

    if (prevYearLabelType) prevYearLabelType.textContent = `Total ${previousYear}`;
    if (currYearLabelType) currYearLabelType.textContent = `Total ${currentYear}`;
    if (prevYearLabelLoc) prevYearLabelLoc.textContent = `Total ${previousYear}`;
    if (currYearLabelLoc) currYearLabelLoc.textContent = `Total ${currentYear}`;
    if (thPrevYearQty) thPrevYearQty.textContent = `Quantity (${previousYear})`;
    if (thCurrYearQty) thCurrYearQty.textContent = `Quantity (${currentYear})`;

    // Update labels
    const qText = selectedQ === 'All' ? 'All Quarters' : selectedQ;
    let projText = '';
    if (selectedClaimsProjects.length === 0) {
        projText = ' (None)';
    } else if (selectedClaimsProjects.length !== allClaimsProjects.length) {
        projText = ` (${selectedClaimsProjects.join(', ')})`;
    }
    document.getElementById('title-type-quarter').textContent = `Total for ${qText}${projText}`;
    document.getElementById('title-location-quarter').textContent = `Location distribution with % labels for ${qText}${projText}`;

    // Helper to check if a date is in a quarter (using timezone-immune parsing)
    const checkQuarter = (dateStr, q) => {
        if (q === 'All') return true;
        if (!dateStr) return false;
        const parts = dateStr.split('-');
        if (parts.length < 2) return false;
        const m = parseInt(parts[1]) - 1; // 0-indexed month
        if (isNaN(m)) return false;
        if (q === 'Q1') return m >= 0 && m <= 2;
        if (q === 'Q2') return m >= 3 && m <= 5;
        if (q === 'Q3') return m >= 6 && m <= 8;
        if (q === 'Q4') return m >= 9 && m <= 11;
        return false;
    };

    // Filter records
    const records = claimsData.filter(d => {
        const matchQ = checkQuarter(d.date, selectedQ);
        const matchP = selectedClaimsProjects.includes(d.project || 'N/A');
        return matchQ && matchP;
    });

    // Get unique types and locations for the selected projects
    const projectRecords = claimsData.filter(d => selectedClaimsProjects.includes(d.project || 'N/A'));
    const claimTypes = [...new Set(projectRecords.map(d => d.claim_type || 'N/A'))].sort();
    const locations = [...new Set(projectRecords.map(d => d.location || 'N/A'))].sort();

    // Aggregations
    const typeAggPrev = {};
    const typeAggCurr = {};
    const locAggPrev = {};
    const locAggCurr = {};

    claimTypes.forEach(t => {
        typeAggPrev[t] = 0;
        typeAggCurr[t] = 0;
    });
    locations.forEach(l => {
        locAggPrev[l] = 0;
        locAggCurr[l] = 0;
    });

    let totalPrev = 0;
    let totalCurr = 0;

    records.forEach(row => {
        if (!row.date) return;
        const yr = parseInt(row.date.split('-')[0]);
        if (yr === previousYear) {
            typeAggPrev[row.claim_type] += Number(row.qty);
            locAggPrev[row.location] += Number(row.qty);
            totalPrev += Number(row.qty);
        } else if (yr === currentYear) {
            typeAggCurr[row.claim_type] += Number(row.qty);
            locAggCurr[row.location] += Number(row.qty);
            totalCurr += Number(row.qty);
        }
    });

    // Update totals in UI
    document.getElementById('total-2025-type').textContent = totalPrev.toLocaleString();
    document.getElementById('total-2026-type').textContent = totalCurr.toLocaleString();
    document.getElementById('total-2025-loc').textContent = totalPrev.toLocaleString();
    document.getElementById('total-2026-loc').textContent = totalCurr.toLocaleString();

    // 1. Render Chart by Type (Horizontal)
    const typeChartHeight = Math.max(450, claimTypes.length * 55);
    document.getElementById('claimTypeChart').parentElement.style.height = `${typeChartHeight}px`;

    const ctxType = document.getElementById('claimTypeChart').getContext('2d');
    if (claimTypeChartInstance) claimTypeChartInstance.destroy();
    
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? '#1f293d' : '#e2e8f0';
    const textColor = isDark ? '#94a3b8' : '#64748b';

    claimTypeChartInstance = new Chart(ctxType, {
        type: 'bar',
        data: {
            labels: claimTypes,
            datasets: [
                {
                    label: `Q'ty ${currentYear}`,
                    data: claimTypes.map(t => typeAggCurr[t]),
                    backgroundColor: function(context) {
                        const chart = context.chart;
                        const {ctx, chartArea} = chart;
                        if (!chartArea) return null;
                        const gradient = ctx.createLinearGradient(chartArea.left, 0, chartArea.right, 0);
                        gradient.addColorStop(0, '#ff9f43'); // Vibrant Orange Gold
                        gradient.addColorStop(1, '#feca57'); // Warm Amber Gold
                        return gradient;
                    },
                    borderColor: '#ff9f43',
                    borderWidth: 1.5,
                    borderRadius: 4
                },
                {
                    label: `Q'ty ${previousYear}`,
                    data: claimTypes.map(t => typeAggPrev[t]),
                    backgroundColor: function(context) {
                        const chart = context.chart;
                        const {ctx, chartArea} = chart;
                        if (!chartArea) return null;
                        const gradient = ctx.createLinearGradient(chartArea.left, 0, chartArea.right, 0);
                        gradient.addColorStop(0, '#00b4d8'); // Sapphire Sky
                        gradient.addColorStop(1, '#90e0ef'); // Bright Ice Blue
                        return gradient;
                    },
                    borderColor: '#00b4d8',
                    borderWidth: 1.5,
                    borderRadius: 4
                }
            ]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            categoryPercentage: 0.8,
            barPercentage: 0.85,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: isDark ? '#f8fafc' : '#0f172a',
                        font: { family: 'Outfit', weight: '600', size: 16 }
                    }
                },
                datalabels: {
                    color: isDark ? '#ffffff' : '#000000',
                    anchor: 'end',
                    align: 'right',
                    font: { family: 'Inter', weight: '700', size: 14 },
                    formatter: (value) => value > 0 ? value.toLocaleString() : ''
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleFont: { family: 'Outfit', size: 14, weight: '700' },
                    bodyFont: { family: 'Inter', size: 13 },
                    padding: 10,
                    cornerRadius: 8,
                    displayColors: true
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    grid: { color: gridColor },
                    ticks: { color: textColor, font: { family: 'Inter', size: 14 } }
                },
                y: {
                    grid: { display: false },
                    ticks: { color: textColor, font: { family: 'Outfit', size: 14, weight: '600' } }
                }
            }
        },
        plugins: activePlugins
    });

    // 2. Render Chart by Location (Horizontal with percentage)
    const locChartHeight = Math.max(450, locations.length * 55);
    document.getElementById('claimLocationChart').parentElement.style.height = `${locChartHeight}px`;

    const ctxLoc = document.getElementById('claimLocationChart').getContext('2d');
    if (claimLocationChartInstance) claimLocationChartInstance.destroy();

    claimLocationChartInstance = new Chart(ctxLoc, {
        type: 'bar',
        data: {
            labels: locations,
            datasets: [
                {
                    label: `Q'ty ${currentYear}`,
                    data: locations.map(l => locAggCurr[l]),
                    backgroundColor: function(context) {
                        const chart = context.chart;
                        const {ctx, chartArea} = chart;
                        if (!chartArea) return null;
                        const gradient = ctx.createLinearGradient(chartArea.left, 0, chartArea.right, 0);
                        gradient.addColorStop(0, '#ff9f43'); // Vibrant Orange Gold
                        gradient.addColorStop(1, '#feca57'); // Warm Amber Gold
                        return gradient;
                    },
                    borderColor: '#ff9f43',
                    borderWidth: 1.5,
                    borderRadius: 4
                },
                {
                    label: `Q'ty ${previousYear}`,
                    data: locations.map(l => locAggPrev[l]),
                    backgroundColor: function(context) {
                        const chart = context.chart;
                        const {ctx, chartArea} = chart;
                        if (!chartArea) return null;
                        const gradient = ctx.createLinearGradient(chartArea.left, 0, chartArea.right, 0);
                        gradient.addColorStop(0, '#00b4d8'); // Sapphire Sky
                        gradient.addColorStop(1, '#90e0ef'); // Bright Ice Blue
                        return gradient;
                    },
                    borderColor: '#00b4d8',
                    borderWidth: 1.5,
                    borderRadius: 4
                }
            ]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            categoryPercentage: 0.8,
            barPercentage: 0.85,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: isDark ? '#f8fafc' : '#0f172a',
                        font: { family: 'Outfit', weight: '600', size: 16 }
                    }
                },
                datalabels: {
                    color: isDark ? '#ffffff' : '#000000',
                    anchor: 'end',
                    align: 'right',
                    offset: 4,
                    font: { family: 'Inter', weight: '700', size: 13 },
                    formatter: (value, context) => {
                        if (value === 0) return '';
                        const yrLabel = context.dataset.label;
                        const total = yrLabel.includes(String(previousYear)) ? totalPrev : totalCurr;
                        const pct = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                        return `${value.toLocaleString()} (${pct}%)`;
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleFont: { family: 'Outfit', size: 14, weight: '700' },
                    bodyFont: { family: 'Inter', size: 13 },
                    padding: 10,
                    cornerRadius: 8,
                    displayColors: true
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    grid: { color: gridColor },
                    ticks: { color: textColor, font: { family: 'Inter', size: 14 } }
                },
                y: {
                    grid: { display: false },
                    ticks: { color: textColor, font: { family: 'Outfit', size: 14, weight: '600' } }
                }
            }
        },
        plugins: activePlugins
    });

    // 3. Populate Details Table
    const tbody = document.getElementById('claims-table-body');
    tbody.innerHTML = '';
    
    // Aggregate by date, project, claim_type, location (using timezone-immune parsing)
    const dateMap = {};
    const tableFiltered = claimsData.filter(row => selectedClaimsProjects.includes(row.project || 'N/A'));
    
    tableFiltered.forEach(row => {
        if (!row.date) return;
        const parts = row.date.split('-');
        if (parts.length < 2) return;
        const yr = parseInt(parts[0]);
        const dateKey = `${parts[0]}-${parts[1]}`;
        const m = parseInt(parts[1]) - 1;
        const qStr = `Q${Math.floor(m / 3) + 1}`;
        
        const projVal = row.project || 'N/A';
        const key = `${dateKey}_${projVal}_${row.claim_type}_${row.location}`;
        if (!dateMap[key]) {
            dateMap[key] = {
                date: row.date,
                q: qStr,
                project: projVal,
                type: row.claim_type,
                loc: row.location,
                qPrev: 0,
                qCurr: 0
            };
        }
        if (yr === previousYear) dateMap[key].qPrev += Number(row.qty);
        if (yr === currentYear) dateMap[key].qCurr += Number(row.qty);
    });

    // Convert map to list and filter/sort
    Object.values(dateMap)
        .filter(item => selectedQ === 'All' || item.q === selectedQ)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formatMonthYear(item.date)}</td>
                <td><strong>${item.q}</strong></td>
                <td>${item.project}</td>
                <td>${item.type}</td>
                <td>${item.loc}</td>
                <td>${item.qPrev > 0 ? item.qPrev.toLocaleString() : '-'}</td>
                <td style="font-weight: 700; color: var(--accent-blue);">${item.qCurr > 0 ? item.qCurr.toLocaleString() : '-'}</td>
            `;
            tbody.appendChild(row);
        });
}
