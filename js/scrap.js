// Scrap Analysis Reports Controller
let scrapRateChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    injectLayout("Scrap Analysis Dashboard");
    
    // Bind listeners
    document.getElementById('scrap-process').addEventListener('change', renderScrapRateReport);
    document.getElementById('scrap-grouping').addEventListener('change', () => {
        const grouping = document.getElementById('scrap-grouping').value;
        const qGroup = document.getElementById('scrap-quarter-filter-group');
        if (qGroup) {
            qGroup.style.display = grouping === 'Quarterly' ? 'flex' : 'none';
        }
        renderScrapRateReport();
    });
    if (document.getElementById('scrap-quarter')) {
        document.getElementById('scrap-quarter').addEventListener('change', renderScrapRateReport);
    }
    document.getElementById('scrap-target-pct').addEventListener('input', renderScrapRateReport);
    
    // Load initial report
    renderScrapRateReport();
});

// Helper to get calendar week of year for a date
function getWeekNumber(dateStr) {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'W0';
    d.setHours(0, 0, 0, 0);
    // Set to nearest Thursday: current date + 4 - current day number
    // Make Sunday's day number 7
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return `W${weekNo}`;
}

// ----------------------------------------------------
// REPORT 1: SCRAP RATE
// ----------------------------------------------------
function renderScrapRateReport() {
    const activePlugins = [];
    if (typeof ChartDataLabels !== 'undefined') {
        activePlugins.push(ChartDataLabels);
    }

    const process = document.getElementById('scrap-process').value;
    const grouping = document.getElementById('scrap-grouping').value;
    const targetScrap = parseFloat(document.getElementById('scrap-target-pct').value) || 2.0;

    // Update banner header
    document.getElementById('scrap-chart-header').textContent = process.toUpperCase();

    const rawLogs = db.get('scrap_data');

    // Filter logs by selected process prefix (e.g. "Layup" matches "Layup:OK" and "Layup:Scrap")
    const processLogs = rawLogs.filter(row => {
        const rowProcess = row.process_status.split(':')[0].toLowerCase();
        return rowProcess === process.toLowerCase();
    });

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Structure of group accumulator: { label: { ok: 0, scrap: 0 } }
    const groups = {};

    // Grouping calculations
    if (grouping === 'Monthly') {
        // 1. Group 2025 Total
        groups['2025 Total'] = { ok: 0, scrap: 0 };
        // 2. Group 2026 Monthly (Jan 26 to Dec 26)
        months.forEach(m => {
            groups[`${m} 26`] = { ok: 0, scrap: 0 };
        });
        
        processLogs.forEach(row => {
            const date = new Date(row.date);
            const yr = date.getFullYear();
            const isOk = row.process_status.endsWith(':OK');
            const isScrap = row.process_status.endsWith(':Scrap');
            
            if (yr === 2025) {
                if (isOk) groups['2025 Total'].ok += Number(row.qty);
                if (isScrap) groups['2025 Total'].scrap += Number(row.qty);
            } else if (yr === 2026) {
                const mLabel = `${months[date.getMonth()]} 26`;
                if (groups[mLabel]) {
                    if (isOk) groups[mLabel].ok += Number(row.qty);
                    if (isScrap) groups[mLabel].scrap += Number(row.qty);
                }
            }
        });
    } else if (grouping === 'Quarterly') {
        const activeQuarter = document.getElementById('scrap-quarter').value;
        let qMonths = [];
        if (activeQuarter === 'Q1') qMonths = [0, 1, 2];
        else if (activeQuarter === 'Q2') qMonths = [3, 4, 5];
        else if (activeQuarter === 'Q3') qMonths = [6, 7, 8];
        else if (activeQuarter === 'Q4') qMonths = [9, 10, 11];

        const qLabel25 = `2025 ${activeQuarter}`;
        groups[qLabel25] = { ok: 0, scrap: 0 };
        qMonths.forEach(m => {
            groups[`${months[m]} 26`] = { ok: 0, scrap: 0 };
        });

        processLogs.forEach(row => {
            const date = new Date(row.date);
            const yr = date.getFullYear();
            const m = date.getMonth();
            const isOk = row.process_status.endsWith(':OK');
            const isScrap = row.process_status.endsWith(':Scrap');

            if (yr === 2025 && qMonths.includes(m)) {
                if (isOk) groups[qLabel25].ok += Number(row.qty);
                if (isScrap) groups[qLabel25].scrap += Number(row.qty);
            } else if (yr === 2026 && qMonths.includes(m)) {
                const mLabel = `${months[m]} 26`;
                if (groups[mLabel]) {
                    if (isOk) groups[mLabel].ok += Number(row.qty);
                    if (isScrap) groups[mLabel].scrap += Number(row.qty);
                }
            }
        });
    }

    // Populate Report Table
    const tableBody = document.getElementById('scrap-rate-table-body');
    tableBody.innerHTML = '';

    const chartLabels = [];
    const chartOkVals = [];
    const chartScrapVals = [];
    const chartTargetVals = [];

    let totalOk2026 = 0;
    let totalScrap2026 = 0;

    // Populate rows
    Object.keys(groups).forEach(label => {
        const data = groups[label];
        const total = data.ok + data.scrap;
        
        let pctOk = 100;
        let pctScrap = 0;
        
        if (total > 0) {
            pctOk = (data.ok / total) * 100;
            pctScrap = (data.scrap / total) * 100;
        }

        // Keep running totals for 2026 YTM
        if (label.endsWith('26') && !label.startsWith('2025')) {
            totalOk2026 += data.ok;
            totalScrap2026 += data.scrap;
            
            // Add monthly/quarterly rows to table (only if there is data, or if it's monthly/quarterly we print placeholder)
            if (total > 0 || grouping === 'Monthly' || grouping === 'Quarterly') {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${label}</strong></td>
                    <td>${data.ok.toLocaleString()}</td>
                    <td>${data.scrap.toLocaleString()}</td>
                    <td>${pctOk.toFixed(2)}%</td>
                    <td style="font-weight: 700; color: var(--color-danger);">${pctScrap.toFixed(2)}%</td>
                    <td>${targetScrap.toFixed(1)}%</td>
                `;
                tableBody.appendChild(tr);
            }
            
            // Add to chart lists
            chartLabels.push(label);
            chartOkVals.push(total > 0 ? parseFloat(pctOk.toFixed(2)) : null);
            chartScrapVals.push(total > 0 ? parseFloat(pctScrap.toFixed(2)) : null);
            // Draw Target line at (100 - Target Scrap) since chart shows OK stacked with Scrap up to 100
            chartTargetVals.push(parseFloat((100 - targetScrap).toFixed(2)));
            
        } else if (label.startsWith('2025')) {
            // Draw 2025 row at top
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${label}</strong></td>
                <td>${data.ok.toLocaleString()}</td>
                <td>${data.scrap.toLocaleString()}</td>
                <td>${pctOk.toFixed(2)}%</td>
                <td style="font-weight: 700; color: var(--color-danger);">${pctScrap.toFixed(2)}%</td>
                <td>${targetScrap.toFixed(1)}%</td>
            `;
            tableBody.insertBefore(tr, tableBody.firstChild); // Place at top

            // Also add 2025 to start of chart
            chartLabels.unshift(label);
            chartOkVals.unshift(total > 0 ? parseFloat(pctOk.toFixed(2)) : null);
            chartScrapVals.unshift(total > 0 ? parseFloat(pctScrap.toFixed(2)) : null);
            chartTargetVals.unshift(parseFloat((100 - targetScrap).toFixed(2)));
        }
    });

    // Append 2026 YTM row at bottom
    const ytmTotal = totalOk2026 + totalScrap2026;
    let ytmPctOk = 100;
    let ytmPctScrap = 0;
    if (ytmTotal > 0) {
        ytmPctOk = (totalOk2026 / ytmTotal) * 100;
        ytmPctScrap = (totalScrap2026 / ytmTotal) * 100;
    }

    const trYtm = document.createElement('tr');
    trYtm.className = 'ytm-row';
    const ytmLabel = grouping === 'Quarterly' ? `YTM 2026 (${document.getElementById('scrap-quarter').value})` : 'YTM 2026 (Total)';
    trYtm.innerHTML = `
        <td><strong>${ytmLabel}</strong></td>
        <td>${totalOk2026.toLocaleString()}</td>
        <td>${totalScrap2026.toLocaleString()}</td>
        <td>${ytmPctOk.toFixed(2)}%</td>
        <td style="font-weight: 700; color: var(--color-danger);">${ytmPctScrap.toFixed(2)}%</td>
        <td>${targetScrap.toFixed(1)}%</td>
    `;
    tableBody.appendChild(trYtm);

    // Render Chart.js
    const ctx = document.getElementById('scrapRateChart').getContext('2d');
    if (scrapRateChartInstance) scrapRateChartInstance.destroy();

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? '#1f293d' : '#e2e8f0';
    const tickTextColor = isDark ? '#94a3b8' : '#64748b';

    scrapRateChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartLabels,
            datasets: [
                {
                    label: '% OK Yield',
                    data: chartOkVals,
                    backgroundColor: '#2ecc71', // Vibrant Emerald / Luminous Green
                    stack: 'scrapStack',
                    datalabels: {
                        display: false // only show Scrap label
                    }
                },
                {
                    label: '% Scrap Defect',
                    data: chartScrapVals,
                    backgroundColor: '#ff7e67', // Vibrant Coral Rose
                    stack: 'scrapStack',
                    datalabels: {
                        color: isDark ? '#f8fafc' : '#0f172a',
                        anchor: 'end',
                        align: 'top',
                        offset: 4,
                        font: { family: 'Outfit', size: 19, weight: '700' }, // Increased to 19px
                        formatter: function(value, context) {
                            return value ? value.toFixed(2) + '%' : '';
                        }
                    }
                },
                {
                    label: `% Target (${(100 - targetScrap).toFixed(1)}% Benchmark)`,
                    data: chartTargetVals,
                    type: 'line',
                    borderColor: '#3498db', // Bright Blue Target line
                    borderWidth: 3,
                    fill: false,
                    pointStyle: 'none',
                    pointRadius: 0,
                    datalabels: { display: false }
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 30 // Keep labels and legend separated
                }
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: isDark ? '#f8fafc' : '#0f172a', font: { family: 'Outfit', weight: '600', size: 16 } } // Increased to 16px
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const index = context.dataIndex;
                            if (context.datasetIndex === 0) {
                                return `OK Yield: ${chartOkVals[index]}%`;
                            } else if (context.datasetIndex === 1) {
                                return `Scrap Rate: ${chartScrapVals[index]}%`;
                            } else {
                                return `Target Line: ${chartTargetVals[index]}% (Scrap limit ${targetScrap}%)`;
                            }
                        }
                    }
                }
            },
            scales: {
                y: {
                    min: 80,
                    max: 102, // Set max to 102% to leave space above the 100% line for labels
                    grid: { color: gridColor },
                    ticks: {
                        stepSize: 5,
                        color: tickTextColor,
                        font: { family: 'Inter', size: 16 }, // Axis scale ticks 16px
                        callback: function(value) {
                            if (value > 100) return ''; // Hide labels above 100%
                            return value + '%';
                        }
                    }
                },
                x: {
                    grid: { display: false },
                    stacked: true,
                    ticks: {
                        color: tickTextColor,
                        font: { family: 'Outfit', size: 16, weight: '600' } // Month labels 16px
                    }
                }
            }
        },
        plugins: activePlugins
    });
}


