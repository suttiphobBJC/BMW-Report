// PPM Report Controller
let ppmChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    injectLayout("PPM Performance Report");
    initPpmTargetsTable();
    
    // Setup filter visibility and change listeners
    const reportTypeSelect = document.getElementById('ppm-report-type');
    const quarterGroup = document.getElementById('ppm-quarter-group');
    
    const updateFilterVisibility = () => {
        if (reportTypeSelect.value === 'Quarterly') {
            quarterGroup.style.display = 'flex';
        } else {
            quarterGroup.style.display = 'none';
        }
    };
    
    updateFilterVisibility();
    renderPpmReport();
    
    // Bind change listeners
    reportTypeSelect.addEventListener('change', () => {
        updateFilterVisibility();
        renderPpmReport();
    });
    document.getElementById('ppm-year').addEventListener('change', renderPpmReport);
    document.getElementById('ppm-quarter').addEventListener('change', renderPpmReport);
    document.getElementById('save-targets-btn').addEventListener('click', savePpmTargets);
});

// Initialize PPM Target Master Data UI
function initPpmTargetsTable() {
    const targets = db.get('ppm_targets');
    const tbody = document.getElementById('ppm-targets-body');
    tbody.innerHTML = '';
    
    targets.forEach((t, i) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="font-weight: 600;">${t.code}</td>
            <td>
                <input type="number" class="ppm-target-input" data-index="${i}" value="${t.target}" style="width: 100px; min-width: 80px;" min="0">
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Save PPM Targets to LocalStorage
function savePpmTargets() {
    const inputs = document.querySelectorAll('.ppm-target-input');
    const targets = db.get('ppm_targets');
    
    inputs.forEach(input => {
        const index = parseInt(input.dataset.index);
        const value = parseFloat(input.value);
        if (!isNaN(value)) {
            targets[index].target = value;
        }
    });
    
    db.set('ppm_targets', targets);
    toast.success("PPM Targets updated successfully.");
    renderPpmReport(); // Redraw with new targets
}

// Render PPM Report and Chart
function renderPpmReport() {
    const selectedYear = Number(document.getElementById('ppm-year').value);
    const reportType = document.getElementById('ppm-report-type').value;
    const selectedQuarter = document.getElementById('ppm-quarter') ? document.getElementById('ppm-quarter').value : 'Q1';
    
    // Update chart card title dynamically
    const titleEl = document.getElementById('ppm-chart-title');
    if (titleEl) {
        titleEl.textContent = reportType === 'Monthly' 
            ? `Monthly PPM by Customer ${selectedYear}`
            : `Quarterly Comparison PPM by Customer (${selectedQuarter} ${selectedYear - 1} vs ${selectedQuarter} ${selectedYear})`;
    }

    const ppmData = db.get('ppm_data');
    const targets = db.get('ppm_targets');
    
    // Get unique customers (normalize casing and spaces)
    const customers = [...new Set(ppmData.map(d => d.customer.trim()))];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    let xAxisLabels = [];
    let filterYears = [];
    
    if (reportType === 'Monthly') {
        filterYears = [selectedYear];
        const yearData = ppmData.filter(d => d.date.startsWith(selectedYear.toString()));
        // Dynamically calculate xAxisLabels containing only months that have data
        const activeMonthIndices = [...new Set(yearData.filter(d => Number(d.shipped_qty) > 0).map(d => new Date(d.date).getMonth()))];
        activeMonthIndices.sort((a, b) => a - b);
        
        // Fallback to avoid empty charts
        if (activeMonthIndices.length === 0) {
            activeMonthIndices.push(0, 1, 2); // Default to Jan, Feb, Mar
        }
        xAxisLabels = activeMonthIndices.map(idx => months[idx]);
    } else {
        // Quarterly comparison: Year vs Year - 1
        filterYears = [selectedYear - 1, selectedYear];
        const qMonthsMap = {
            'Q1': ['Jan', 'Feb', 'Mar'],
            'Q2': ['Apr', 'May', 'Jun'],
            'Q3': ['Jul', 'Aug', 'Sep'],
            'Q4': ['Oct', 'Nov', 'Dec']
        };
        const qMonths = qMonthsMap[selectedQuarter] || ['Jan', 'Feb', 'Mar'];
        
        const prevYearShort = String(selectedYear - 1).substring(2);
        const currYearShort = String(selectedYear).substring(2);
        
        qMonths.forEach(m => {
            xAxisLabels.push(`${m} ${prevYearShort}`);
            xAxisLabels.push(`${m} ${currYearShort}`);
        });
    }
    
    // Group and calculate PPM
    const grouped = {};
    xAxisLabels.forEach(label => {
        grouped[label] = {};
        customers.forEach(cust => {
            grouped[label][cust] = { defect: 0, shipped: 0, ppm: 0 };
        });
    });

    let totalDefectsYearly = 0;
    let totalShippedYearly = 0;
    
    ppmData.forEach(row => {
        const dateObj = new Date(row.date);
        const rYear = dateObj.getFullYear();
        
        if (!filterYears.includes(rYear)) return;
        
        const mIdx = dateObj.getMonth();
        const mLabel = months[mIdx];
        const custName = row.customer.trim();
        
        let key = '';
        if (reportType === 'Monthly') {
            key = mLabel;
        } else {
            const yrShort = String(rYear).substring(2);
            key = `${mLabel} ${yrShort}`;
        }
        
        if (grouped[key] && grouped[key][custName]) {
            grouped[key][custName].defect += Number(row.defect_qty);
            grouped[key][custName].shipped += Number(row.shipped_qty);
            
            // Only sum for the selected Year (not the prior year)
            if (rYear === selectedYear) {
                totalDefectsYearly += Number(row.defect_qty);
                totalShippedYearly += Number(row.shipped_qty);
            }
        }
    });
    
    // Calculate final PPM per customer/month
    xAxisLabels.forEach(label => {
        customers.forEach(cust => {
            const data = grouped[label][cust];
            if (data.shipped > 0) {
                data.ppm = parseFloat(((data.defect / data.shipped) * 1000000).toFixed(2));
            } else {
                data.ppm = null; // No shipping data
            }
        });
    });

    // Populate details table
    const tableBody = document.getElementById('ppm-table-body');
    tableBody.innerHTML = '';
    
    xAxisLabels.forEach(label => {
        customers.forEach(cust => {
            const data = grouped[label][cust];
            if (data.shipped > 0) {
                const row = document.createElement('tr');
                const displayLabel = reportType === 'Monthly' 
                    ? `${label} ${selectedYear.toString().substring(2)}` 
                    : label;
                row.innerHTML = `
                    <td><strong>${displayLabel}</strong></td>
                    <td>${cust}</td>
                    <td>${data.shipped.toLocaleString()}</td>
                    <td>${data.defect}</td>
                    <td style="font-weight: 700; color: var(--accent-blue);">${Math.round(data.ppm).toLocaleString()}</td>
                `;
                tableBody.appendChild(row);
            }
        });
    });
    
    // Yearly benchmark calculations
    const yearlyAvgPpm = totalShippedYearly > 0 ? ((totalDefectsYearly / totalShippedYearly) * 1000000) : 0;
    const avgTargetPpm = targets.reduce((sum, t) => sum + Number(t.target), 0) / targets.length;

    // Calculate maximum PPM value present in chart data to scale Y-axis dynamically
    let maxVal = 35000; // default minimum Y-axis max
    xAxisLabels.forEach(label => {
        customers.forEach(cust => {
            const val = grouped[label][cust].ppm;
            if (val !== null && val > maxVal) {
                maxVal = val;
            }
        });
    });
    if (yearlyAvgPpm > maxVal) maxVal = yearlyAvgPpm;
    if (avgTargetPpm > maxVal) maxVal = avgTargetPpm;

    // dynamic max with 15% top padding for staggered datalabels, rounded up to nearest 5,000
    const roundedMax = Math.ceil((maxVal * 1.15) / 5000) * 5000;

    // Helper: Match colors exactly to luxury palette (Vibrant tones)
    const getCustomerColor = (cust, index) => {
        const norm = cust.replace(/\s+/g, '').toLowerCase();
        if (norm.includes('hungary')) return { fill: 'rgba(255, 126, 103, 0.85)', stroke: '#ff7e67' };  // Luminous Coral Rose
        if (norm.includes('mexico')) return { fill: 'rgba(255, 170, 0, 0.85)', stroke: '#ffaa00' };   // Luminous Honey Amber
        if (norm.includes('smp')) return { fill: 'rgba(0, 180, 216, 0.85)', stroke: '#00b4d8' };      // Luminous Sapphire Sky
        if (norm.includes('rehau') || norm.includes('pro-x')) return { fill: 'rgba(162, 57, 202, 0.85)', stroke: '#a239ca' }; // Luminous Amethyst
        
        const defaults = [
            { fill: 'rgba(255, 126, 103, 0.85)', stroke: '#ff7e67' },
            { fill: 'rgba(255, 170, 0, 0.85)', stroke: '#ffaa00' },
            { fill: 'rgba(0, 180, 216, 0.85)', stroke: '#00b4d8' }
        ];
        return defaults[index % defaults.length];
    };

    // Prepare datasets for Chart.js
    const datasets = customers.map((cust, i) => {
        const color = getCustomerColor(cust, i);
        return {
            label: cust,
            data: xAxisLabels.map(label => grouped[label][cust].ppm),
            backgroundColor: color.fill,
            borderColor: color.stroke,
            borderWidth: 1.5,
            borderRadius: 4,
            yAxisID: 'y',
            order: 1, // Draw bars on top of lines
            datalabels: {
                color: color.stroke,
                anchor: 'end',
                align: 'top',
                // Scriptable staggered offsets to prevent label overlap for many categories
                offset: function(context) {
                    if (xAxisLabels.length > 4) {
                        return context.datasetIndex % 2 === 0 ? 2 : 22;
                    }
                    return 2;
                },
                font: {
                    family: 'Inter',
                    weight: 'bold',
                    size: 15 // Increased text size from 14px to 15px
                },
                formatter: function(value) {
                    return value > 0 ? Math.round(value).toLocaleString() : '';
                }
            }
        };
    });

    // Add dashed lines as line datasets with right-aligned callout datalabels
    datasets.push({
        label: 'Yearly Avg.',
        data: Array(xAxisLabels.length).fill(yearlyAvgPpm),
        type: 'line',
        borderColor: '#d4af37', // Bright Luminous Gold
        borderWidth: 3,
        borderDash: [6, 6],
        fill: false,
        pointStyle: 'none',
        pointRadius: 0,
        yAxisID: 'y',
        order: 2, // Draw lines underneath bars
        datalabels: {
            display: (context) => context.dataIndex === context.dataset.data.length - 1,
            color: '#d4af37',
            backgroundColor: '#ffffff',
            borderColor: '#d4af37',
            borderWidth: 2,
            borderRadius: 4,
            padding: { top: 4, bottom: 4, left: 6, right: 6 },
            anchor: 'end',
            // Stagger callout alignment angle (330 deg = up-right) if too close to target callout
            align: Math.abs(yearlyAvgPpm - avgTargetPpm) < 4000 ? 330 : 'right',
            offset: Math.abs(yearlyAvgPpm - avgTargetPpm) < 4000 ? 18 : 12,
            font: { family: 'Outfit', weight: 'bold', size: 15 },
            formatter: () => Math.round(yearlyAvgPpm).toLocaleString()
        }
    });

    // Add CAC Target line
    datasets.push({
        label: 'CAC Target Yearly Avg.',
        data: Array(xAxisLabels.length).fill(avgTargetPpm),
        type: 'line',
        borderColor: '#03dac6', // Luminous Mint Teal
        borderWidth: 3,
        borderDash: [6, 6],
        fill: false,
        pointStyle: 'none',
        pointRadius: 0,
        yAxisID: 'y',
        order: 2, // Draw lines underneath bars
        datalabels: {
            display: (context) => context.dataIndex === context.dataset.data.length - 1,
            color: '#03dac6',
            backgroundColor: '#ffffff',
            borderColor: '#03dac6',
            borderWidth: 2,
            borderRadius: 4,
            padding: { top: 4, bottom: 4, left: 6, right: 6 },
            anchor: 'end',
            // Stagger callout alignment angle (30 deg = down-right) if too close to average callout
            align: Math.abs(yearlyAvgPpm - avgTargetPpm) < 4000 ? 30 : 'right',
            offset: Math.abs(yearlyAvgPpm - avgTargetPpm) < 4000 ? 18 : 12,
            font: { family: 'Outfit', weight: 'bold', size: 15 },
            formatter: () => Math.round(avgTargetPpm).toLocaleString()
        }
    });

    // Render Chart.js
    const ctx = document.getElementById('ppmChart').getContext('2d');
    
    if (ppmChartInstance) {
        ppmChartInstance.destroy();
    }

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? '#1f293d' : '#e2e8f0';
    const textColor = isDark ? '#94a3b8' : '#64748b';

    const activePlugins = [];
    if (typeof ChartDataLabels !== 'undefined') {
        activePlugins.push(ChartDataLabels);
    }

    ppmChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: xAxisLabels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    right: 75 // Increased right padding to prevent label clipping
                }
            },
            plugins: {
                legend: {
                    position: 'bottom', // Legend at the bottom
                    labels: {
                        color: isDark ? '#f8fafc' : '#0f172a',
                        padding: 15,
                        font: {
                            family: 'Outfit',
                            weight: '600',
                            size: 16 // Increased from 13px to 16px
                        }
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
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += Math.round(context.parsed.y).toLocaleString() + ' PPM';
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    min: 0,
                    max: roundedMax,
                    grid: {
                        color: gridColor
                    },
                    ticks: {
                        stepSize: 5000,
                        color: textColor,
                        font: {
                            family: 'Inter',
                            size: 14 // Increased from 12px to 14px
                        },
                        callback: function(value) {
                            return value === 0 ? '-' : value.toLocaleString();
                        }
                    },
                    title: {
                        display: true,
                        text: 'PPM (Parts Per Million)',
                        color: isDark ? '#f8fafc' : '#0f172a',
                        font: {
                            family: 'Outfit',
                            size: 16, // Increased from 13px to 16px
                            weight: '600'
                        }
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
                            size: 16, // Increased from 14px to 16px
                            weight: '600'
                        }
                    }
                }
            }
        },
        plugins: activePlugins
    });
}
