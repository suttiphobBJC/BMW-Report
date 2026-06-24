// Top Process Scrap Controller
let topScrapChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    injectLayout("Top Process Scrap Analysis");
    
    // Bind listeners
    document.getElementById('scrap-year').addEventListener('change', renderTopScrapReport);
    document.getElementById('scrap-quarter').addEventListener('change', renderTopScrapReport);
    
    // Load initial report
    renderTopScrapReport();
});

// Classification and Helper Functions
function getErpType(erpCode) {
    if (!erpCode) return null;
    const clean = String(erpCode).trim().toUpperCase();
    if (clean.startsWith('G8X-013') || clean.startsWith('G8X-015') || clean.startsWith('G8X-017') || clean.startsWith('G8X-019')) {
        return 'MIRROR CAPS';
    }
    if (clean.startsWith('G8X-011')) {
        return 'DIFFUSER';
    }
    return null;
}

function normalizeProcess(proc) {
    if (!proc) return "";
    const p = String(proc).toLowerCase().replace(/\s/g, '');
    if (p === 'trim' || p === 'trimming') return 'trimming';
    if (p === 'dry' || p === 'drysanding' || p === 'dry_sanding') return 'drysanding';
    return p;
}

function isDateInPeriod(dateStr, year, quarter) {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (d.getFullYear() !== year) return false;
    const month = d.getMonth();
    if (quarter === 'All') return true;
    if (quarter === 'Q1') return month >= 0 && month <= 2;
    if (quarter === 'Q2') return month >= 3 && month <= 5;
    if (quarter === 'Q3') return month >= 6 && month <= 8;
    if (quarter === 'Q4') return month >= 9 && month <= 11;
    return false;
}

function renderTopScrapReport() {
    const activePlugins = [];
    if (typeof ChartDataLabels !== 'undefined') {
        activePlugins.push(ChartDataLabels);
    }

    const currYear = parseInt(document.getElementById('scrap-year').value) || 2026;
    const prevYear = currYear - 1;
    const quarter = document.getElementById('scrap-quarter').value;

    // Update banner title
    const periodLabel = quarter === 'All' ? `${currYear}` : `${quarter} ${currYear}`;
    const prevPeriodLabel = quarter === 'All' ? `${prevYear}` : `${quarter} ${prevYear}`;
    document.getElementById('top-scrap-header').textContent = `TOP 5 SCRAP RATE (${periodLabel})`;

    // Retrieve database tables
    const dailyLogs = db.get('scrap_daily') || [];
    const invenLogs = db.get('scrap_inven') || [];

    // 1. Group daily defect quantities
    // defectsData: "ERPType" -> "Defect" -> { process, currQty, prevQty }
    const defectsData = { 'MIRROR CAPS': {}, 'DIFFUSER': {} };

    dailyLogs.forEach(item => {
        const erpType = getErpType(item.erp_code);
        if (!erpType) return; // skip other types

        const defect = item.defect || 'Unknown';
        const process = item.process || '';
        const qty = Number(item.qty || 0);

        if (!defectsData[erpType][defect]) {
            defectsData[erpType][defect] = { process: process, currQty: 0, prevQty: 0 };
        }

        if (isDateInPeriod(item.date, currYear, quarter)) {
            defectsData[erpType][defect].currQty += qty;
        } else if (isDateInPeriod(item.date, prevYear, quarter)) {
            defectsData[erpType][defect].prevQty += qty;
        }
    });

    // 2. Sum inventory process totals OK + Scrap
    // invenTotals: "ERPType" -> "normalizedProcess" -> { currTotal, prevTotal }
    const invenTotals = { 'MIRROR CAPS': {}, 'DIFFUSER': {} };

    invenLogs.forEach(item => {
        const erpType = getErpType(item.erp_code);
        if (!erpType) return;

        const normProc = normalizeProcess(item.process);
        const qty = Number(item.qty || 0);

        if (!invenTotals[erpType][normProc]) {
            invenTotals[erpType][normProc] = { currTotal: 0, prevTotal: 0 };
        }

        if (isDateInPeriod(item.date, currYear, quarter)) {
            invenTotals[erpType][normProc].currTotal += qty;
        } else if (isDateInPeriod(item.date, prevYear, quarter)) {
            invenTotals[erpType][normProc].prevTotal += qty;
        }
    });

    // 3. Compile rates and details
    const compiled = { 'MIRROR CAPS': [], 'DIFFUSER': [] };

    ['MIRROR CAPS', 'DIFFUSER'].forEach(erpType => {
        const defects = defectsData[erpType];
        for (const defect in defects) {
            const dInfo = defects[defect];
            const normProc = normalizeProcess(dInfo.process);
            const currTotal = invenTotals[erpType][normProc]?.currTotal || 0;
            const prevTotal = invenTotals[erpType][normProc]?.prevTotal || 0;

            const currRate = currTotal > 0 ? (dInfo.currQty / currTotal) * 100 : 0;
            const prevRate = prevTotal > 0 ? (dInfo.prevQty / prevTotal) * 100 : 0;

            compiled[erpType].push({
                defect: defect,
                process: dInfo.process,
                currQty: dInfo.currQty,
                currTotal: currTotal,
                currRate: currRate,
                prevQty: dInfo.prevQty,
                prevTotal: prevTotal,
                prevRate: prevRate
            });
        }

        // Sort descending by current year's rate and slice top 5
        compiled[erpType].sort((a, b) => b.currRate - a.currRate);
        compiled[erpType] = compiled[erpType].slice(0, 5);
    });

    // Pad each category to exactly 5 elements for chart alignment
    function padDefectsList(list) {
        const padded = [...list];
        while (padded.length < 5) {
            padded.push({
                defect: `(No Defect ${padded.length + 1})`,
                process: '-',
                currQty: 0,
                currTotal: 0,
                currRate: 0,
                prevQty: 0,
                prevTotal: 0,
                prevRate: 0,
                isPlaceholder: true
            });
        }
        return padded;
    }

    const mirrorCapsPadded = padDefectsList(compiled['MIRROR CAPS']);
    const diffuserPadded = padDefectsList(compiled['DIFFUSER']);

    // Combine for Chart.js X axis (Mirror Caps at indices 0-4, Diffuser at indices 5-9)
    const allChartItems = [...mirrorCapsPadded, ...diffuserPadded];

    const chartLabels = allChartItems.map(item => item.isPlaceholder ? '' : item.defect.toUpperCase());
    const ratesPrev = allChartItems.map(item => item.prevRate);
    const ratesCurr = allChartItems.map(item => item.currRate);

    // Update table headers
    document.getElementById('th-prev-qty').textContent = `${prevPeriodLabel} Defect Qty (pcs)`;
    document.getElementById('th-prev-total').textContent = `${prevPeriodLabel} Process Total (pcs)`;
    document.getElementById('th-prev-rate').textContent = `${prevPeriodLabel} Scrap Rate (%)`;
    document.getElementById('th-curr-qty').textContent = `${periodLabel} Defect Qty (pcs)`;
    document.getElementById('th-curr-total').textContent = `${periodLabel} Process Total (pcs)`;
    document.getElementById('th-curr-rate').textContent = `${periodLabel} Scrap Rate (%)`;

    // Populate Table
    const tableBody = document.getElementById('top-scrap-table-body');
    tableBody.innerHTML = '';

    ['MIRROR CAPS', 'DIFFUSER'].forEach(erpType => {
        const list = compiled[erpType].filter(item => !item.isPlaceholder);
        if (list.length === 0) {
            tableBody.innerHTML += `
                <tr>
                    <td style="font-weight:bold; color:var(--text-secondary);">${erpType}</td>
                    <td colspan="8" style="text-align:center; color:var(--text-muted);">No daily scrap defects recorded for this period.</td>
                </tr>
            `;
        } else {
            list.forEach((item, index) => {
                tableBody.innerHTML += `
                    <tr>
                        ${index === 0 ? `<td rowspan="${list.length}" style="font-weight:bold; color:var(--accent-blue); vertical-align:middle;">${erpType}</td>` : ''}
                        <td style="font-weight:600; color:var(--text-primary);">${item.defect}</td>
                        <td>${item.process}</td>
                        <td>${item.prevQty.toLocaleString()}</td>
                        <td>${item.prevTotal.toLocaleString()}</td>
                        <td style="font-weight:bold; color:var(--color-info);">${item.prevRate.toFixed(2)}%</td>
                        <td>${item.currQty.toLocaleString()}</td>
                        <td>${item.currTotal.toLocaleString()}</td>
                        <td style="font-weight:bold; color:var(--color-warning);">${item.currRate.toFixed(2)}%</td>
                    </tr>
                `;
            });
        }
    });

    // 4. Render clustered Chart.js Chart
    const ctx = document.getElementById('topScrapChart').getContext('2d');
    if (topScrapChartInstance) {
        topScrapChartInstance.destroy();
    }

    const theme = document.documentElement.getAttribute('data-theme') || 'light';
    const gridColor = theme === 'dark' ? '#1f293d' : '#e2e8f0';
    const textColor = theme === 'dark' ? '#94a3b8' : '#475569';
    const titleTextColor = theme === 'dark' ? '#f8fafc' : '#0f172a';

    // Custom separator plugin drawing code
    const separatorPlugin = {
        id: 'separatorPlugin',
        afterDraw(chart) {
            const { ctx, chartArea: { top, bottom }, scales: { x } } = chart;
            ctx.save();
            
            if (x && x.getPixelForValue) {
                // Separator line between index 4 and 5
                const xPos = (x.getPixelForValue(4) + x.getPixelForValue(5)) / 2;
                ctx.strokeStyle = theme === 'dark' ? '#334155' : '#cbd5e1';
                ctx.lineWidth = 2;
                ctx.setLineDash([6, 6]);
                ctx.beginPath();
                ctx.moveTo(xPos, top);
                ctx.lineTo(xPos, bottom + 120);
                ctx.stroke();
                ctx.setLineDash([]);
                
                // Draw category labels
                const xMirror = (x.getPixelForValue(0) + x.getPixelForValue(4)) / 2;
                const xDiffuser = (x.getPixelForValue(5) + x.getPixelForValue(9)) / 2;
                
                ctx.fillStyle = titleTextColor;
                ctx.font = 'bold 15px Outfit, sans-serif';
                ctx.textAlign = 'center';
                
                ctx.fillText('MIRROR CAPS', xMirror, bottom + 125);
                ctx.fillText('DIFFUSER', xDiffuser, bottom + 125);
            }
            ctx.restore();
        }
    };

    const maxVal = Math.max(...ratesPrev, ...ratesCurr, 0.5);
    const yMax = Math.ceil(maxVal * 1.25 * 10) / 10; // buffer 25% for datalabels

    topScrapChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartLabels,
            datasets: [
                {
                    label: `Scrap rate ${prevPeriodLabel}`,
                    data: ratesPrev,
                    backgroundColor: theme === 'dark' ? '#1e3a8a' : '#90e0ef',
                    borderColor: '#3b82f6',
                    borderWidth: 1,
                    borderRadius: 4
                },
                {
                    label: `Scrap rate ${periodLabel}`,
                    data: ratesCurr,
                    backgroundColor: '#ff9f43',
                    borderColor: '#f39c12',
                    borderWidth: 1,
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 25,
                    bottom: 140
                }
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: textColor,
                        font: {
                            family: 'Outfit',
                            size: 14,
                            weight: '600'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                    titleColor: titleTextColor,
                    bodyColor: textColor,
                    borderColor: gridColor,
                    borderWidth: 1,
                    cornerRadius: 8,
                    titleFont: { family: 'Outfit', size: 14, weight: 'bold' },
                    bodyFont: { family: 'Inter', size: 13 },
                    callbacks: {
                        title: (tooltipItems) => {
                            const index = tooltipItems[0].dataIndex;
                            const item = allChartItems[index];
                            if (item.isPlaceholder) return '';
                            const erpType = index < 5 ? 'MIRROR CAPS' : 'DIFFUSER';
                            return `${erpType}: ${item.defect}`;
                        },
                        label: (context) => {
                            const val = context.raw;
                            const index = context.dataIndex;
                            const item = allChartItems[index];
                            if (item.isPlaceholder) return '';
                            return ` ${context.dataset.label}: ${val.toFixed(3)}% (${context.datasetIndex === 0 ? item.prevQty : item.currQty} scrap / ${context.datasetIndex === 0 ? item.prevTotal : item.currTotal} total)`;
                        }
                    }
                },
                datalabels: {
                    anchor: 'end',
                    align: 'top',
                    formatter: (value, context) => {
                        const item = allChartItems[context.dataIndex];
                        if (item.isPlaceholder || value === 0) return '';
                        return value.toFixed(2) + '%';
                    },
                    font: {
                        family: 'Outfit',
                        weight: 'bold',
                        size: 12
                    },
                    color: textColor
                }
            },
            scales: {
                y: {
                    max: yMax,
                    grid: {
                        color: gridColor
                    },
                    ticks: {
                        color: textColor,
                        font: { size: 13 },
                        callback: (value) => value.toFixed(1) + '%'
                    },
                    title: {
                        display: true,
                        text: 'Scrap Rate (%)',
                        color: textColor,
                        font: { family: 'Outfit', size: 14, weight: 'bold' }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: textColor,
                        font: {
                            family: 'Outfit',
                            size: 11,
                            weight: '700'
                        },
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        },
        plugins: [separatorPlugin, ...activePlugins]
    });
}
