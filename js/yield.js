// Yield Report Controller
let yieldChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    injectLayout("Yield Performance Report");
    populateProjectFilter();
    renderYieldReport();
    
    // Bind listeners
    document.getElementById('yield-project').addEventListener('change', renderYieldReport);
    document.getElementById('yield-report-type').addEventListener('change', () => {
        const qFilter = document.getElementById('quarter-filter-group');
        const reportType = document.getElementById('yield-report-type').value;
        if (qFilter) {
            qFilter.style.display = reportType === 'Quarterly' ? 'flex' : 'none';
        }
        renderYieldReport();
    });
    document.getElementById('yield-quarter').addEventListener('change', renderYieldReport);
    document.getElementById('yield-process').addEventListener('change', renderYieldReport);
});

function populateProjectFilter() {
    const fpyData = db.get('yield_fpy_data') || [];
    const fyData = db.get('yield_fy_data') || [];
    const projects = [...new Set([
        ...fpyData.map(d => d.project || 'N/A'),
        ...fyData.map(d => d.project || 'N/A')
    ])].sort();
    
    const dropdown = document.getElementById('yield-project');
    if (!dropdown) return;
    
    const prevVal = dropdown.value;
    dropdown.innerHTML = '';
    
    if (projects.length === 0) {
        const opt = document.createElement('option');
        opt.value = 'G8X';
        opt.textContent = 'G8X';
        dropdown.appendChild(opt);
        return;
    }
    
    projects.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p;
        opt.textContent = p;
        dropdown.appendChild(opt);
    });
    
    if (projects.includes(prevVal)) {
        dropdown.value = prevVal;
    } else {
        dropdown.value = projects[0];
    }
}

function renderYieldReport() {
    const activePlugins = [];
    if (typeof ChartDataLabels !== 'undefined') {
        activePlugins.push(ChartDataLabels);
    }

    const project = document.getElementById('yield-project').value;
    const reportType = document.getElementById('yield-report-type').value;
    const process = document.getElementById('yield-process').value;
    const selectedQuarter = document.getElementById('yield-quarter') ? document.getElementById('yield-quarter').value : 'All';
    
    // Update chart header banner
    document.getElementById('yield-chart-header').textContent = process;

    const fpyData = db.get('yield_fpy_data');
    const fyData = db.get('yield_fy_data');
    const targets = db.get('yield_targets');
    
    // Target for this process
    const targetRow = targets.find(t => t.project === project && t.process.toLowerCase() === process.toLowerCase());
    const targetVal = targetRow ? Number(targetRow.target) : 90;

    // Filter project and process
    const filterFn = d => d.project === project && d.process.toLowerCase() === process.toLowerCase();
    const fpyFiltered = fpyData.filter(filterFn);
    const fyFiltered = fyData.filter(filterFn);

    const fpyUseYield = fpyFiltered.some(row => row.yield !== undefined && row.yield !== null);
    const fyUseYield = fyFiltered.some(row => row.yield !== undefined && row.yield !== null);

    // Month lists
    const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Determine active months based on selected quarter
    let activeMonths = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    if (selectedQuarter === 'Q1') activeMonths = [1, 2, 3];
    else if (selectedQuarter === 'Q2') activeMonths = [4, 5, 6];
    else if (selectedQuarter === 'Q3') activeMonths = [7, 8, 9];
    else if (selectedQuarter === 'Q4') activeMonths = [10, 11, 12];

    // We will aggregate FPY & FY by year and month
    const aggregateData = (dataset) => {
        const result = {}; // key: YYYY-MM
        dataset.forEach(row => {
            if (!row.date) return;
            const parts = row.date.split('-');
            if (parts.length < 2) return;
            const key = `${parts[0]}-${parts[1].padStart(2, '0')}`;
            if (!result[key]) {
                result[key] = { ins: 0, ok: 0, yieldSum: 0, yieldCount: 0 };
            }
            result[key].ins += Number(row.ins || 0);
            result[key].ok += Number(row.ok || 0);

            if (row.yield !== undefined && row.yield !== null) {
                result[key].yieldSum += Number(row.yield);
                result[key].yieldCount += 1;
            } else {
                const calculatedYield = (row.ins > 0) ? (row.ok / row.ins * 100) : 0;
                result[key].yieldSum += calculatedYield;
                result[key].yieldCount += 1;
            }
        });
        return result;
    };

    const getMonthlyYield = (monthObj, useYield) => {
        if (!monthObj) return null;
        if (useYield) {
            return monthObj.yieldCount > 0 ? (monthObj.yieldSum / monthObj.yieldCount) : null;
        } else {
            return monthObj.ins > 0 ? (monthObj.ok / monthObj.ins * 100) : null;
        }
    };

    const fpyAgg = aggregateData(fpyFiltered);
    const fyAgg = aggregateData(fyFiltered);

    // Table data and Chart arrays
    let tableHeaders = [];
    let tableRows = [];
    
    let chartLabels = [];
    let chartFpyVals = [];
    let chartFyDiffVals = []; // stacked diff
    let chartFyFullVals = []; // original full FY
    let chartTargetVals = [];

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    if (reportType === 'Monthly') {
        tableHeaders = ['Month', 'FPY Yield (%)', 'Final Yield (%)', 'Target (%)'];
        
        // 1. 2025 Total
        let totalFpy2025 = 0;
        let totalFy2025 = 0;
        
        if (fpyUseYield) {
            let sum = 0, count = 0;
            for (const m of activeMonths) {
                const key = `2025-${String(m).padStart(2, '0')}`;
                const val = getMonthlyYield(fpyAgg[key], true);
                if (val !== null) {
                    sum += val;
                    count++;
                }
            }
            totalFpy2025 = count > 0 ? (sum / count) : 0;
        } else {
            let totalFpyIns2025 = 0, totalFpyOk2025 = 0;
            for (const m of activeMonths) {
                const key = `2025-${String(m).padStart(2, '0')}`;
                if (fpyAgg[key]) {
                    totalFpyIns2025 += fpyAgg[key].ins;
                    totalFpyOk2025 += fpyAgg[key].ok;
                }
            }
            totalFpy2025 = totalFpyIns2025 > 0 ? (totalFpyOk2025 / totalFpyIns2025 * 100) : 0;
        }
        
        if (fyUseYield) {
            let sum = 0, count = 0;
            for (const m of activeMonths) {
                const key = `2025-${String(m).padStart(2, '0')}`;
                const val = getMonthlyYield(fyAgg[key], true);
                if (val !== null) {
                    sum += val;
                    count++;
                }
            }
            totalFy2025 = count > 0 ? (sum / count) : 0;
        } else {
            let totalFyIns2025 = 0, totalFyOk2025 = 0;
            for (const m of activeMonths) {
                const key = `2025-${String(m).padStart(2, '0')}`;
                if (fyAgg[key]) {
                    totalFyIns2025 += fyAgg[key].ins;
                    totalFyOk2025 += fyAgg[key].ok;
                }
            }
            totalFy2025 = totalFyIns2025 > 0 ? (totalFyOk2025 / totalFyIns2025 * 100) : 0;
        }
        
        tableRows.push({
            label: '2025 Total',
            fpy: totalFpy2025,
            fy: totalFy2025,
            target: targetVal,
            isYtm: false
        });
        
        chartLabels.push('2025 Total');
        chartFpyVals.push(parseFloat(totalFpy2025.toFixed(1)));
        chartFyFullVals.push(parseFloat(totalFy2025.toFixed(1)));
        chartFyDiffVals.push(parseFloat(Math.max(0, totalFy2025 - totalFpy2025).toFixed(1)));
        chartTargetVals.push(targetVal);

        // 2. 2026 Monthly (Jan 26 to Dec 26, or max available, let's list all 12 months for 2026)
        let totalFpyIns2026 = 0, totalFpyOk2026 = 0;
        let totalFyIns2026 = 0, totalFyOk2026 = 0;
        
        for (const m of activeMonths) {
            const key = `2026-${String(m).padStart(2, '0')}`;
            
            // Calculate FPY / FY for this month
            const monthFpyObj = fpyAgg[key];
            const monthFyObj = fyAgg[key];
            
            const monthFpy = getMonthlyYield(monthFpyObj, fpyUseYield);
            const monthFy = getMonthlyYield(monthFyObj, fyUseYield);
            
            const monthLabel = `${monthsShort[m-1]} 26`;
            
            if (monthFpy !== null || monthFy !== null) {
                const fVal = monthFpy || 0;
                const yVal = monthFy || 0;
                
                tableRows.push({
                    label: monthLabel,
                    fpy: fVal,
                    fy: yVal,
                    target: targetVal,
                    isYtm: false
                });

                chartLabels.push(monthLabel);
                chartFpyVals.push(parseFloat(fVal.toFixed(1)));
                chartFyFullVals.push(parseFloat(yVal.toFixed(1)));
                chartFyDiffVals.push(parseFloat(Math.max(0, yVal - fVal).toFixed(1)));
                chartTargetVals.push(targetVal);

                if (monthFpyObj) {
                    totalFpyIns2026 += monthFpyObj.ins;
                    totalFpyOk2026 += monthFpyObj.ok;
                }
                if (monthFyObj) {
                    totalFyIns2026 += monthFyObj.ins;
                    totalFyOk2026 += monthFyObj.ok;
                }
            } else {
                // Future months (still add to chart labels but empty values)
                chartLabels.push(monthLabel);
                chartFpyVals.push(null);
                chartFyFullVals.push(null);
                chartFyDiffVals.push(null);
                chartTargetVals.push(targetVal);
            }
        }
        
        // 3. YTM 2026
        let ytmFpy = 0;
        if (fpyUseYield) {
            let sum = 0, count = 0;
            for (const m of activeMonths) {
                const key = `2026-${String(m).padStart(2, '0')}`;
                const val = getMonthlyYield(fpyAgg[key], true);
                if (val !== null) {
                    sum += val;
                    count++;
                }
            }
            ytmFpy = count > 0 ? (sum / count) : 0;
        } else {
            ytmFpy = totalFpyIns2026 > 0 ? (totalFpyOk2026 / totalFpyIns2026 * 100) : 0;
        }

        let ytmFy = 0;
        if (fyUseYield) {
            let sum = 0, count = 0;
            for (const m of activeMonths) {
                const key = `2026-${String(m).padStart(2, '0')}`;
                const val = getMonthlyYield(fyAgg[key], true);
                if (val !== null) {
                    sum += val;
                    count++;
                }
            }
            ytmFy = count > 0 ? (sum / count) : 0;
        } else {
            ytmFy = totalFyIns2026 > 0 ? (totalFyOk2026 / totalFyIns2026 * 100) : 0;
        }
        
        tableRows.push({
            label: 'YTM',
            fpy: ytmFpy,
            fy: ytmFy,
            target: targetVal,
            isYtm: true
        });

    } else {
        // Quarterly / Comparative Page
        tableHeaders = ['Month', '2025 FPY (%)', '2025 FY (%)', '2026 FPY (%)', '2026 FY (%)', 'Target (%)'];
        
        // Loop through months to list Jan25 vs Jan26, Feb25 vs Feb26 etc.
        const quartersData = {
            Q1: { fpy25Sum: 0, fpy25Count: 0, fy25Sum: 0, fy25Count: 0, fpy26Sum: 0, fpy26Count: 0, fy26Sum: 0, fy26Count: 0, insFpy25: 0, okFpy25: 0, insFy25: 0, okFy25: 0, insFpy26: 0, okFpy26: 0, insFy26: 0, okFy26: 0 },
            Q2: { fpy25Sum: 0, fpy25Count: 0, fy25Sum: 0, fy25Count: 0, fpy26Sum: 0, fpy26Count: 0, fy26Sum: 0, fy26Count: 0, insFpy25: 0, okFpy25: 0, insFy25: 0, okFy25: 0, insFpy26: 0, okFpy26: 0, insFy26: 0, okFy26: 0 },
            Q3: { fpy25Sum: 0, fpy25Count: 0, fy25Sum: 0, fy25Count: 0, fpy26Sum: 0, fpy26Count: 0, fy26Sum: 0, fy26Count: 0, insFpy25: 0, okFpy25: 0, insFy25: 0, okFy25: 0, insFpy26: 0, okFpy26: 0, insFy26: 0, okFy26: 0 },
            Q4: { fpy25Sum: 0, fpy25Count: 0, fy25Sum: 0, fy25Count: 0, fpy26Sum: 0, fpy26Count: 0, fy26Sum: 0, fy26Count: 0, insFpy25: 0, okFpy25: 0, insFy25: 0, okFy25: 0, insFpy26: 0, okFpy26: 0, insFy26: 0, okFy26: 0 }
        };

        for (const m of activeMonths) {
            const key25 = `2025-${String(m).padStart(2, '0')}`;
            const key26 = `2026-${String(m).padStart(2, '0')}`;
            
            const fpy25Obj = fpyAgg[key25] || { ins: 0, ok: 0 };
            const fy25Obj = fyAgg[key25] || { ins: 0, ok: 0 };
            const fpy26Obj = fpyAgg[key26] || { ins: 0, ok: 0 };
            const fy26Obj = fyAgg[key26] || { ins: 0, ok: 0 };
            
            const fpy25 = getMonthlyYield(fpyAgg[key25], fpyUseYield) || 0;
            const fy25 = getMonthlyYield(fyAgg[key25], fyUseYield) || 0;
            const fpy26 = getMonthlyYield(fpyAgg[key26], fpyUseYield) || 0;
            const fy26 = getMonthlyYield(fyAgg[key26], fyUseYield) || 0;
            
            // Add to table rows
            if (fpy25 > 0 || fpy26 > 0) {
                tableRows.push({
                    label: monthsShort[m-1],
                    fpy25: fpy25,
                    fy25: fy25,
                    fpy26: fpy26,
                    fy26: fy26,
                    target: targetVal
                });

                // Chart labels Jan 25 & Jan 26 side-by-side
                chartLabels.push(`${monthsShort[m-1]} 25`);
                chartFpyVals.push(parseFloat(fpy25.toFixed(1)));
                chartFyFullVals.push(parseFloat(fy25.toFixed(1)));
                chartFyDiffVals.push(parseFloat(Math.max(0, fy25 - fpy25).toFixed(1)));
                chartTargetVals.push(targetVal);

                chartLabels.push(`${monthsShort[m-1]} 26`);
                chartFpyVals.push(fpy26 > 0 ? parseFloat(fpy26.toFixed(1)) : null);
                chartFyFullVals.push(fy26 > 0 ? parseFloat(fy26.toFixed(1)) : null);
                chartFyDiffVals.push(fy26 > 0 ? parseFloat(Math.max(0, fy26 - fpy26).toFixed(1)) : null);
                chartTargetVals.push(targetVal);
            }

            // Accumulate Quarters
            const qKey = `Q${Math.floor((m-1) / 3) + 1}`;
            const qData = quartersData[qKey];
            
            // FPY 2025
            const valFpy25 = getMonthlyYield(fpyAgg[key25], fpyUseYield);
            if (valFpy25 !== null) {
                qData.fpy25Sum += valFpy25;
                qData.fpy25Count++;
            }
            if (fpy25Obj) {
                qData.insFpy25 += fpy25Obj.ins;
                qData.okFpy25 += fpy25Obj.ok;
            }
            
            // FY 2025
            const valFy25 = getMonthlyYield(fyAgg[key25], fyUseYield);
            if (valFy25 !== null) {
                qData.fy25Sum += valFy25;
                qData.fy25Count++;
            }
            if (fy25Obj) {
                qData.insFy25 += fy25Obj.ins;
                qData.okFy25 += fy25Obj.ok;
            }
            
            // FPY 2026
            const valFpy26 = getMonthlyYield(fpyAgg[key26], fpyUseYield);
            if (valFpy26 !== null) {
                qData.fpy26Sum += valFpy26;
                qData.fpy26Count++;
            }
            if (fpy26Obj) {
                qData.insFpy26 += fpy26Obj.ins;
                qData.okFpy26 += fpy26Obj.ok;
            }
            
            // FY 2026
            const valFy26 = getMonthlyYield(fyAgg[key26], fyUseYield);
            if (valFy26 !== null) {
                qData.fy26Sum += valFy26;
                qData.fy26Count++;
            }
            if (fy26Obj) {
                qData.insFy26 += fy26Obj.ins;
                qData.okFy26 += fy26Obj.ok;
            }
        }

        // Add Quarter summaries
        Object.keys(quartersData).forEach(q => {
            const qd = quartersData[q];
            
            const fpy25 = fpyUseYield 
                ? (qd.fpy25Count > 0 ? qd.fpy25Sum / qd.fpy25Count : 0)
                : (qd.insFpy25 > 0 ? (qd.okFpy25 / qd.insFpy25 * 100) : 0);
                
            const fy25 = fyUseYield 
                ? (qd.fy25Count > 0 ? qd.fy25Sum / qd.fy25Count : 0)
                : (qd.insFy25 > 0 ? (qd.okFy25 / qd.insFy25 * 100) : 0);
                
            const fpy26 = fpyUseYield 
                ? (qd.fpy26Count > 0 ? qd.fpy26Sum / qd.fpy26Count : 0)
                : (qd.insFpy26 > 0 ? (qd.okFpy26 / qd.insFpy26 * 100) : 0);
                
            const fy26 = fyUseYield 
                ? (qd.fy26Count > 0 ? qd.fy26Sum / qd.fy26Count : 0)
                : (qd.insFy26 > 0 ? (qd.okFy26 / qd.insFy26 * 100) : 0);

            if (fpy25 > 0 || fpy26 > 0) {
                // Push Quarter summary row
                tableRows.push({
                    label: `<strong>${q} Total</strong>`,
                    fpy25: fpy25,
                    fy25: fy25,
                    fpy26: fpy26,
                    fy26: fy26,
                    target: targetVal,
                    isQuarterSummary: true
                });

                chartLabels.push(`${q} 25`);
                chartFpyVals.push(parseFloat(fpy25.toFixed(1)));
                chartFyFullVals.push(parseFloat(fy25.toFixed(1)));
                chartFyDiffVals.push(parseFloat(Math.max(0, fy25 - fpy25).toFixed(1)));
                chartTargetVals.push(targetVal);

                chartLabels.push(`${q} 26`);
                chartFpyVals.push(fpy26 > 0 ? parseFloat(fpy26.toFixed(1)) : null);
                chartFyFullVals.push(fy26 > 0 ? parseFloat(fy26.toFixed(1)) : null);
                chartFyDiffVals.push(fy26 > 0 ? parseFloat(Math.max(0, fy26 - fpy26).toFixed(1)) : null);
                chartTargetVals.push(targetVal);
            }
        });
    }

    // Render Table
    const tableHeaderEl = document.getElementById('yield-table-header');
    tableHeaderEl.innerHTML = '';
    tableHeaders.forEach(th => {
        const thEl = document.createElement('th');
        thEl.innerHTML = th;
        tableHeaderEl.appendChild(thEl);
    });

    const tableBodyEl = document.getElementById('yield-table-body');
    tableBodyEl.innerHTML = '';
    tableRows.forEach(row => {
        const trEl = document.createElement('tr');
        if (row.isYtm || row.isQuarterSummary) {
            trEl.className = 'ytm-row';
        }
        
        if (reportType === 'Monthly') {
            trEl.innerHTML = `
                <td><strong>${row.label}</strong></td>
                <td>${row.fpy.toFixed(1)}%</td>
                <td>${row.fy.toFixed(1)}%</td>
                <td>${row.target.toFixed(1)}%</td>
            `;
        } else {
            trEl.innerHTML = `
                <td><strong>${row.label}</strong></td>
                <td>${row.fpy25 > 0 ? row.fpy25.toFixed(1) + '%' : '-'}</td>
                <td>${row.fy25 > 0 ? row.fy25.toFixed(1) + '%' : '-'}</td>
                <td>${row.fpy26 > 0 ? row.fpy26.toFixed(1) + '%' : '-'}</td>
                <td>${row.fy26 > 0 ? row.fy26.toFixed(1) + '%' : '-'}</td>
                <td>${row.target.toFixed(1)}%</td>
            `;
        }
        tableBodyEl.appendChild(trEl);
    });

    // Render Chart.js
    const ctx = document.getElementById('yieldChart').getContext('2d');
    if (yieldChartInstance) {
        yieldChartInstance.destroy();
    }

    // Chart colors based on Report Type (Vibrant luxury palette)
    const fpyColor = '#0284c7'; // Luminous Sky Blue
    const fyDiffColor = '#f59e0b'; // Vibrant Amber

    const gridColor = isDark ? '#1f293d' : '#e2e8f0';
    const tickTextColor = isDark ? '#94a3b8' : '#64748b';

    yieldChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartLabels,
            datasets: [
                {
                    label: '% FPY (First Part Yield)',
                    data: chartFpyVals,
                    backgroundColor: fpyColor,
                    borderColor: fpyColor,
                    borderWidth: 1,
                    stack: 'yieldStack',
                    datalabels: {
                        display: false // Hide datalabels for FPY stack to prevent vertical/center overlap
                    }
                },
                {
                    label: '% FY Rework Share',
                    data: chartFyDiffVals,
                    backgroundColor: fyDiffColor,
                    borderColor: fyDiffColor,
                    borderWidth: 1,
                    stack: 'yieldStack',
                    datalabels: {
                        color: isDark ? '#f8fafc' : '#0f172a',
                        anchor: 'end',
                        align: 'top',
                        offset: 4,
                        font: { family: 'Outfit', size: 16, weight: '700' }, // Increased from 14px to 16px
                        formatter: function(value, context) {
                            const index = context.dataIndex;
                            const fullFy = chartFyFullVals[index];
                            return fullFy ? fullFy.toFixed(1) + '%' : '';
                        }
                    }
                },
                {
                    label: '% Target',
                    data: chartTargetVals,
                    type: 'line',
                    borderColor: '#34d399', // Luminous Mint Target line
                    borderWidth: 3,
                    fill: false,
                    pointStyle: 'none',
                    pointRadius: 0,
                    datalabels: {
                        display: false // no target labels on chart
                    }
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 25 // Added layout padding at top to prevent label clipping when bars are 100%
                }
            },
            plugins: {
                legend: {
                    display: true, // Enabled legend
                    position: 'bottom',
                    labels: {
                        color: isDark ? '#f8fafc' : '#0f172a',
                        font: { family: 'Outfit', weight: '600', size: 16 } // Legend text size 16px
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleFont: { family: 'Outfit', size: 14, weight: '700' },
                    bodyFont: { family: 'Inter', size: 13 },
                    padding: 10,
                    cornerRadius: 8,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            const index = context.dataIndex;
                            if (context.datasetIndex === 0) {
                                return `FPY: ${chartFpyVals[index]}%`;
                            } else if (context.datasetIndex === 1) {
                                return `Final Yield: ${chartFyFullVals[index]}% (Rework +${chartFyDiffVals[index]}%)`;
                            } else {
                                return `Target: ${chartTargetVals[index]}%`;
                            }
                        }
                    }
                }
            },
            scales: {
                y: {
                    min: 40,
                    max: 102, // Set max to 102% to prevent datalabels overlapping legend
                    grid: { color: gridColor },
                    ticks: {
                        stepSize: 10,
                        color: tickTextColor,
                        font: { family: 'Inter', size: 16 }, // Axis scale ticks 16px
                        callback: function(value) {
                            if (value > 100) return ''; // Hide ticks above 100%
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
