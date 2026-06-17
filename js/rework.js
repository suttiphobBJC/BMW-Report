// Rework Rate Report Controller
let reworkTrendChartInstance = null;
let reworkCompChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    injectLayout("Rework Rate & Wait Time");
    renderReworkReports();
    
    document.getElementById('rework-quarter').addEventListener('change', renderReworkReports);
});

// Helper to get calendar week of year for a date
function getWeekNumber(dateStr) {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'W0';
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return `W${weekNo}`;
}

function renderReworkReports() {
    const activePlugins = [];
    if (typeof ChartDataLabels !== 'undefined') {
        activePlugins.push(ChartDataLabels);
    }

    const selectedQ = document.getElementById('rework-quarter').value;
    const reworkData = db.get('rework_data');

    // Update comparative subtitle
    document.getElementById('rework-comp-subtitle').textContent = `Comparative Trend for ${selectedQ} (2025 vs 2026)`;

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? '#1f293d' : '#e2e8f0';
    const textColor = isDark ? '#94a3b8' : '#64748b';

    // Group raw logs by Year and Month, calculating daily averages per category
    const monthlyAgg = {}; // key: "YYYY-MM" -> { waitSum, waitCount, insertSum, insertCount }
    
    // Group raw logs by date first to handle daily matrix format (summing quantities of the same category for each day)
    const dailySums = {}; // key: "YYYY-MM-DD" -> { waitSum, insertSum }
    
    reworkData.forEach(row => {
        const dateStr = row.date;
        if (!dateStr) return;
        const dObj = new Date(dateStr);
        if (isNaN(dObj.getTime())) return;
        
        const isWait = row.process_status.toLowerCase().includes('wait');
        const isInsert = row.process_status.toLowerCase().includes('insert') || (row.process_status.toLowerCase().includes('rework') && !row.process_status.toLowerCase().includes('wait'));
        
        const qty = Number(row.qty) || 0;
        
        if (!dailySums[dateStr]) {
            dailySums[dateStr] = { waitSum: 0, hasWait: false, insertSum: 0, hasInsert: false };
        }
        
        if (isWait) {
            dailySums[dateStr].waitSum += qty;
            dailySums[dateStr].hasWait = true;
        } else if (isInsert) {
            dailySums[dateStr].insertSum += qty;
            dailySums[dateStr].hasInsert = true;
        }
    });

    // Now group daily sums into monthly totals to calculate monthly averages
    Object.keys(dailySums).forEach(dateStr => {
        const dObj = new Date(dateStr);
        const y = dObj.getFullYear();
        const m = dObj.getMonth();
        const ymKey = `${y}-${String(m + 1).padStart(2, '0')}`;
        
        if (!monthlyAgg[ymKey]) {
            monthlyAgg[ymKey] = {
                waitSum: 0, waitDays: 0,
                insertSum: 0, insertDays: 0
            };
        }
        
        const dayData = dailySums[dateStr];
        if (dayData.hasWait) {
            monthlyAgg[ymKey].waitSum += dayData.waitSum;
            monthlyAgg[ymKey].waitDays += 1;
        }
        if (dayData.hasInsert) {
            monthlyAgg[ymKey].insertSum += dayData.insertSum;
            monthlyAgg[ymKey].insertDays += 1;
        }
    });

    // Flatten into array of monthly averages: { year, month, wait, insert }
    const flatMonthly = [];
    Object.keys(monthlyAgg).forEach(ymKey => {
        const [year, monthStr] = ymKey.split('-').map(Number);
        const data = monthlyAgg[ymKey];
        
        const avgWait = data.waitDays > 0 ? (data.waitSum / data.waitDays) : 0;
        const avgInsert = data.insertDays > 0 ? (data.insertSum / data.insertDays) : 0;
        
        flatMonthly.push({
            dateStr: `${ymKey}-15`, // for ordering
            year: year,
            month: monthStr - 1, // 0-indexed
            wait: Math.round(avgWait),
            insert: Math.round(avgInsert)
        });
    });

    // Sort chronologically
    flatMonthly.sort((a, b) => new Date(a.dateStr) - new Date(b.dateStr));

    // 1. Chart 1: Overall Monthly Trend (2026 data only, up to the maximum month populated)
    const data2026 = flatMonthly.filter(d => d.year === 2026);
    
    // We want the labels to be standard month names e.g. "Jan", "Feb" etc.
    const monthsName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Make sure we have values for at least up to the latest month in 2026 data
    let maxMonthIdx = 5; // default up to June
    data2026.forEach(d => {
        if (d.month > maxMonthIdx) maxMonthIdx = d.month;
    });

    const labels2026 = [];
    const wait2026 = [];
    const insert2026 = [];

    for (let m = 0; m <= maxMonthIdx; m++) {
        labels2026.push(monthsName[m]);
        const record = data2026.find(d => d.month === m);
        if (record) {
            wait2026.push(record.wait);
            insert2026.push(record.insert);
        } else {
            wait2026.push(null);
            insert2026.push(null);
        }
    }

    let maxReworkVal = 0;
    wait2026.forEach(v => { if (v !== null && v > maxReworkVal) maxReworkVal = v; });
    insert2026.forEach(v => { if (v !== null && v > maxReworkVal) maxReworkVal = v; });
    const reworkMaxY = Math.ceil((maxReworkVal * 1.15) / 10) * 10 || 100;

    const ctxTrend = document.getElementById('reworkTrendChart').getContext('2d');
    if (reworkTrendChartInstance) reworkTrendChartInstance.destroy();

    reworkTrendChartInstance = new Chart(ctxTrend, {
        type: 'line',
        data: {
            labels: labels2026,
            datasets: [
                {
                    label: 'Avg. Waiting for Rework (pcs)',
                    data: wait2026,
                    borderColor: '#ff9f43', // Luminous Orange Gold
                    backgroundColor: 'rgba(255, 159, 67, 0.1)',
                    borderWidth: 4,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 3, // Reduced point size
                    pointBackgroundColor: '#ff9f43',
                    pointHoverRadius: 5, // Reduced point hover size
                    datalabels: {
                        color: '#ff9f43',
                        align: 'top',
                        anchor: 'end',
                        offset: 4,
                        font: { family: 'Outfit', weight: '700', size: 16 } // Scaled up to 16px
                    }
                },
                {
                    label: 'Avg. Reworked Insert (pcs)',
                    data: insert2026,
                    borderColor: '#00b4d8', // Luminous Sapphire Blue
                    backgroundColor: 'rgba(0, 180, 216, 0.1)',
                    borderWidth: 4,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 3, // Reduced point size
                    pointBackgroundColor: '#00b4d8',
                    pointHoverRadius: 5, // Reduced point hover size
                    datalabels: {
                        color: '#00b4d8',
                        align: 'bottom',
                        anchor: 'start',
                        offset: 4,
                        font: { family: 'Outfit', weight: '700', size: 16 } // Scaled up to 16px
                    }
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 25 // Top padding to prevent label overlap with legend
                }
            },
            plugins: {
                legend: {
                    position: 'bottom', // Moved to bottom
                    labels: { color: isDark ? '#f8fafc' : '#0f172a', font: { family: 'Outfit', weight: '600', size: 13 } } // Reduced size to 13px
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleFont: { family: 'Outfit', size: 14, weight: '700' },
                    bodyFont: { family: 'Inter', size: 13 },
                    padding: 10,
                    cornerRadius: 8,
                    displayColors: true,
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                y: {
                    min: 0,
                    max: reworkMaxY, // Set max with dynamic padding
                    title: {
                        display: true,
                        text: 'Quantity',
                        color: textColor,
                        font: { family: 'Outfit', size: 16, weight: '600' } // Increased to 16px
                    },
                    grid: { color: gridColor },
                    ticks: { color: textColor, font: { family: 'Inter', size: 16 } } // Scaled up to 16px
                },
                x: {
                    grid: { display: false },
                    ticks: { color: textColor, font: { family: 'Outfit', size: 16, weight: '600' } } // Increased to 16px
                }
            }
        },
        plugins: activePlugins
    });

    // 2. Chart 2: Comparative Quarter Chart
    let qMonths = []; // 0-based month indices
    let qLabels = []; // e.g. ['Jan', 'Feb', 'Mar']
    if (selectedQ === 'Q1') { qMonths = [0, 1, 2]; qLabels = ['Jan', 'Feb', 'Mar']; }
    else if (selectedQ === 'Q2') { qMonths = [3, 4, 5]; qLabels = ['Apr', 'May', 'Jun']; }
    else if (selectedQ === 'Q3') { qMonths = [6, 7, 8]; qLabels = ['Jul', 'Aug', 'Sep']; }
    else if (selectedQ === 'Q4') { qMonths = [9, 10, 11]; qLabels = ['Oct', 'Nov', 'Dec']; }

    const data2025 = flatMonthly.filter(d => d.year === 2025);
    
    const wait2025Vals = qMonths.map(m => {
        const r = data2025.find(d => d.month === m);
        return r ? r.wait : null;
    });
    const insert2025Vals = qMonths.map(m => {
        const r = data2025.find(d => d.month === m);
        return r ? r.insert : null;
    });
    const wait2026Vals = qMonths.map(m => {
        const r = data2026.find(d => d.month === m);
        return r ? r.wait : null;
    });
    const insert2026Vals = qMonths.map(m => {
        const r = data2026.find(d => d.month === m);
        return r ? r.insert : null;
    });

    let maxReworkCompVal = 0;
    [...wait2025Vals, ...insert2025Vals, ...wait2026Vals, ...insert2026Vals].forEach(v => {
        if (v !== null && v > maxReworkCompVal) maxReworkCompVal = v;
    });
    const reworkCompMaxY = Math.ceil((maxReworkCompVal * 1.15) / 10) * 10 || 100;

    const ctxComp = document.getElementById('reworkCompChart').getContext('2d');
    if (reworkCompChartInstance) reworkCompChartInstance.destroy();

    reworkCompChartInstance = new Chart(ctxComp, {
        type: 'line',
        data: {
            labels: qLabels,
            datasets: [
                {
                    label: `${selectedQ} 2025 (Avg. Reworked Insert)`,
                    data: insert2025Vals,
                    borderColor: '#90e0ef', // Sapphire Ice dashed
                    borderWidth: 2,
                    borderDash: [5, 5],
                    fill: false,
                    pointRadius: 2, // Reduced point size
                    pointBackgroundColor: '#90e0ef',
                    tension: 0.3,
                    datalabels: {
                        color: '#90e0ef',
                        align: 'bottom',
                        font: { family: 'Outfit', weight: '700', size: 14 } // Increased to 14px
                    }
                },
                {
                    label: `${selectedQ} 2025 (Avg. Waiting for Rework)`,
                    data: wait2025Vals,
                    borderColor: '#ffb085', // Peach dashed
                    borderWidth: 2,
                    borderDash: [5, 5],
                    fill: false,
                    pointRadius: 2, // Reduced point size
                    pointBackgroundColor: '#ffb085',
                    tension: 0.3,
                    datalabels: {
                        color: '#ffb085',
                        align: 'bottom',
                        font: { family: 'Outfit', weight: '700', size: 14 } // Increased to 14px
                    }
                },
                {
                    label: `${selectedQ} 2026 (Avg. Reworked Insert)`,
                    data: insert2026Vals,
                    borderColor: '#00b4d8', // Luminous Sapphire Blue
                    borderWidth: 4,
                    fill: false,
                    pointRadius: 4, // Reduced point size
                    pointBackgroundColor: '#00b4d8',
                    tension: 0.3,
                    datalabels: {
                        color: '#00b4d8',
                        align: 'top',
                        font: { family: 'Outfit', weight: '700', size: 16 } // Scaled up to 16px
                    }
                },
                {
                    label: `${selectedQ} 2026 (Avg. Waiting for Rework)`,
                    data: wait2026Vals,
                    borderColor: '#ff7e67', // Vibrant Coral Rose
                    borderWidth: 4,
                    fill: false,
                    pointRadius: 4, // Reduced point size
                    pointBackgroundColor: '#ff7e67',
                    tension: 0.3,
                    datalabels: {
                        color: '#ff7e67',
                        align: 'top',
                        font: { family: 'Outfit', weight: '700', size: 16 } // Scaled up to 16px
                    }
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 25 // Top padding to prevent label overlap with legend
                }
            },
            plugins: {
                legend: {
                    position: 'bottom', // Moved to bottom
                    labels: { color: isDark ? '#f8fafc' : '#0f172a', font: { family: 'Outfit', weight: '600', size: 13 } } // Reduced size to 13px
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleFont: { family: 'Outfit', size: 14, weight: '700' },
                    bodyFont: { family: 'Inter', size: 13 },
                    padding: 10,
                    cornerRadius: 8,
                    displayColors: true,
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                y: {
                    min: 0,
                    max: reworkCompMaxY, // Set max with dynamic padding
                    title: {
                        display: true,
                        text: 'Quantity',
                        color: textColor,
                        font: { family: 'Outfit', size: 16, weight: '600' } // Increased to 16px
                    },
                    grid: { color: gridColor },
                    ticks: { color: textColor, font: { family: 'Inter', size: 16 } } // Scaled up to 16px
                },
                x: {
                    grid: { display: false },
                    ticks: { color: textColor, font: { family: 'Outfit', size: 16, weight: '600' } } // Increased to 16px
                }
            }
        },
        plugins: activePlugins
    });

    // 3. Populate Table
    const tbody = document.getElementById('rework-table-body');
    tbody.innerHTML = '';
    
    // Sort descending by date
    flatMonthly.slice().sort((a, b) => new Date(b.dateStr) - new Date(a.dateStr)).forEach(d => {
        const qStr = `Q${Math.floor(d.month / 3) + 1}`;
        const mLabel = monthsName[d.month];
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${mLabel} ${String(d.year).substring(2)}</strong></td>
            <td><strong>${qStr}</strong></td>
            <td>${d.year}</td>
            <td style="color: var(--color-warning); font-weight: 700;">${d.wait.toLocaleString()} pcs</td>
            <td style="color: var(--accent-blue); font-weight: 700;">${d.insert.toLocaleString()} pcs</td>
        `;
        tbody.appendChild(row);
    });
}
