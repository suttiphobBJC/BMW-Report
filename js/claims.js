// Claims Report Controller
let claimTypeChartInstance = null;
let claimLocationChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    injectLayout("Claim Part Returned");
    populateProjectFilter();
    renderClaimsReport();
    
    document.getElementById('claims-quarter').addEventListener('change', renderClaimsReport);
    document.getElementById('claims-project').addEventListener('change', renderClaimsReport);
});

function populateProjectFilter() {
    const claimsData = db.get('claims_data') || [];
    const projects = [...new Set(claimsData.map(d => d.project || 'N/A'))].sort();
    
    const dropdown = document.getElementById('claims-project');
    if (!dropdown) return;
    
    dropdown.innerHTML = '<option value="All">All Projects</option>';
    
    projects.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p;
        opt.textContent = p;
        dropdown.appendChild(opt);
    });
}

function renderClaimsReport() {
    const activePlugins = [];
    if (typeof ChartDataLabels !== 'undefined') {
        activePlugins.push(ChartDataLabels);
    }

    const selectedQ = document.getElementById('claims-quarter').value;
    const selectedProj = document.getElementById('claims-project') ? document.getElementById('claims-project').value : 'All';
    const claimsData = db.get('claims_data') || [];
    
    // Update labels
    const qText = selectedQ === 'All' ? 'All Quarters' : selectedQ;
    const projText = selectedProj === 'All' ? '' : ` (${selectedProj})`;
    document.getElementById('title-type-quarter').textContent = `Total for ${qText}${projText}`;
    document.getElementById('title-location-quarter').textContent = `Location distribution with % labels for ${qText}${projText}`;

    // Helper to check if a date is in a quarter
    const checkQuarter = (dateStr, q) => {
        if (q === 'All') return true;
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return false;
        const m = date.getMonth();
        if (q === 'Q1') return m >= 0 && m <= 2;
        if (q === 'Q2') return m >= 3 && m <= 5;
        if (q === 'Q3') return m >= 6 && m <= 8;
        if (q === 'Q4') return m >= 9 && m <= 11;
        return false;
    };

    // Filter records
    const records = claimsData.filter(d => {
        const matchQ = checkQuarter(d.date, selectedQ);
        const matchP = selectedProj === 'All' || (d.project || 'N/A') === selectedProj;
        return matchQ && matchP;
    });

    // Get unique types and locations for the selected project
    const projectRecords = claimsData.filter(d => selectedProj === 'All' || (d.project || 'N/A') === selectedProj);
    const claimTypes = [...new Set(projectRecords.map(d => d.claim_type || 'N/A'))].sort();
    const locations = [...new Set(projectRecords.map(d => d.location || 'N/A'))].sort();

    // Aggregations
    const typeAgg2025 = {};
    const typeAgg2026 = {};
    const locAgg2025 = {};
    const locAgg2026 = {};

    claimTypes.forEach(t => {
        typeAgg2025[t] = 0;
        typeAgg2026[t] = 0;
    });
    locations.forEach(l => {
        locAgg2025[l] = 0;
        locAgg2026[l] = 0;
    });

    let total2025 = 0;
    let total2026 = 0;

    records.forEach(row => {
        const yr = new Date(row.date).getFullYear();
        if (yr === 2025) {
            typeAgg2025[row.claim_type] += Number(row.qty);
            locAgg2025[row.location] += Number(row.qty);
            total2025 += Number(row.qty);
        } else if (yr === 2026) {
            typeAgg2026[row.claim_type] += Number(row.qty);
            locAgg2026[row.location] += Number(row.qty);
            total2026 += Number(row.qty);
        }
    });

    // Update totals in UI
    document.getElementById('total-2025-type').textContent = total2025;
    document.getElementById('total-2026-type').textContent = total2026;
    document.getElementById('total-2025-loc').textContent = total2025;
    document.getElementById('total-2026-loc').textContent = total2026;

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
                    label: 'Q\'ty 2026',
                    data: claimTypes.map(t => typeAgg2026[t]),
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
                    label: 'Q\'ty 2025',
                    data: claimTypes.map(t => typeAgg2025[t]),
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
                        font: { family: 'Outfit', weight: '600', size: 16 } // Increased from default to 16px
                    }
                },
                datalabels: {
                    color: isDark ? '#ffffff' : '#000000',
                    anchor: 'end',
                    align: 'right',
                    font: { family: 'Inter', weight: '700', size: 14 }, // Increased from 11px to 14px
                    formatter: (value) => value > 0 ? value : ''
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
                    ticks: { color: textColor, font: { family: 'Inter', size: 14 } } // Increased size to 14px
                },
                y: {
                    grid: { display: false },
                    ticks: { color: textColor, font: { family: 'Outfit', size: 14, weight: '600' } } // Increased size to 14px and weight to 600
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
                    label: 'Q\'ty 2026',
                    data: locations.map(l => locAgg2026[l]),
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
                    label: 'Q\'ty 2025',
                    data: locations.map(l => locAgg2025[l]),
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
                        font: { family: 'Outfit', weight: '600', size: 16 } // Increased from default to 16px
                    }
                },
                datalabels: {
                    color: isDark ? '#ffffff' : '#000000',
                    anchor: 'end',
                    align: 'right',
                    offset: 4,
                    font: { family: 'Inter', weight: '700', size: 13 }, // Increased from 10px to 13px
                    formatter: (value, context) => {
                        if (value === 0) return '';
                        const yrLabel = context.dataset.label;
                        const total = yrLabel.includes('2025') ? total2025 : total2026;
                        const pct = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                        return `${value} (${pct}%)`;
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
                    ticks: { color: textColor, font: { family: 'Inter', size: 14 } } // Increased size to 14px
                },
                y: {
                    grid: { display: false },
                    ticks: { color: textColor, font: { family: 'Outfit', size: 14, weight: '600' } } // Increased size to 14px and weight to 600
                }
            }
        },
        plugins: activePlugins
    });

    // 3. Populate Details Table
    const tbody = document.getElementById('claims-table-body');
    tbody.innerHTML = '';
    
    // Aggregate by date, project, claim_type, location
    const dateMap = {};
    const tableFiltered = claimsData.filter(row => selectedProj === 'All' || (row.project || 'N/A') === selectedProj);
    
    tableFiltered.forEach(row => {
        const dateObj = new Date(row.date);
        const yr = dateObj.getFullYear();
        const dateKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
        
        // Grouping key is Year + Month + Project + Claim Type + Location
        const projVal = row.project || 'N/A';
        const key = `${dateKey}_${projVal}_${row.claim_type}_${row.location}`;
        if (!dateMap[key]) {
            dateMap[key] = {
                date: row.date,
                q: `Q${Math.floor(dateObj.getMonth() / 3) + 1}`,
                project: projVal,
                type: row.claim_type,
                loc: row.location,
                q2025: 0,
                q2026: 0
            };
        }
        if (yr === 2025) dateMap[key].q2025 += Number(row.qty);
        if (yr === 2026) dateMap[key].q2026 += Number(row.qty);
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
                <td>${item.q2025 > 0 ? item.q2025 : '-'}</td>
                <td style="font-weight: 700; color: var(--accent-blue);">${item.q2026 > 0 ? item.q2026 : '-'}</td>
            `;
            tbody.appendChild(row);
        });
}
