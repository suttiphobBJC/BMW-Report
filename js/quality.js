// Quality Performance Report Controller
let qualityChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    injectLayout("Quality Performance");
    populateYearFilter();
    renderQualityReport();
    
    // Bind listeners
    document.getElementById('quality-year').addEventListener('change', renderQualityReport);
    document.getElementById('quality-report-type').addEventListener('change', renderQualityReport);
    
    // Listen for theme toggle to update chart colors
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            // Wait slightly for theme attribute to update
            setTimeout(renderQualityReport, 50);
        });
    }
});

function populateYearFilter() {
    const qualityData = db.get('quality_data') || [];
    const years = [...new Set(qualityData.map(d => {
        if (!d.date) return null;
        return d.date.split('-')[0];
    }).filter(y => y))].sort();
    
    const dropdown = document.getElementById('quality-year');
    if (!dropdown) return;
    
    dropdown.innerHTML = '<option value="All">All Years</option>';
    
    years.forEach(y => {
        const opt = document.createElement('option');
        opt.value = y;
        opt.textContent = y;
        dropdown.appendChild(opt);
    });
}

function renderQualityReport() {
    const activePlugins = [];
    if (typeof ChartDataLabels !== 'undefined') {
        activePlugins.push(ChartDataLabels);
    }

    const selectedYear = document.getElementById('quality-year').value;
    const reportType = document.getElementById('quality-report-type').value;
    const qualityData = db.get('quality_data') || [];

    // Filter by year
    const records = qualityData.filter(d => {
        if (!d.date) return false;
        if (selectedYear !== 'All') {
            return d.date.split('-')[0] === selectedYear;
        }
        return true;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    // Update Header Banner
    const bannerEl = document.getElementById('quality-chart-header');
    if (bannerEl) {
        if (selectedYear !== 'All') {
            bannerEl.textContent = `BMW QUALITY RATING ${selectedYear}`;
        } else {
            // Find year range
            const years = records.map(d => d.date.split('-')[0]);
            if (years.length > 0) {
                const minYear = Math.min(...years);
                const maxYear = Math.max(...years);
                bannerEl.textContent = minYear === maxYear ? `BMW QUALITY RATING ${minYear}` : `BMW QUALITY RATING ${minYear} - ${maxYear}`;
            } else {
                bannerEl.textContent = 'BMW QUALITY RATING';
            }
        }
    }

    // Process Chart Labels and Datasets
    let labels = [];
    let reports8dData = [];
    let sortingActionData = [];
    let incidentData = [];
    let qualityDataPoints = [];

    // Table rows data
    let tableRows = [];

    if (reportType === 'Monthly') {
        records.forEach(r => {
            const label = formatMonthYear(r.date);
            labels.push(label);
            reports8dData.push(Number(r.reports_8d));
            sortingActionData.push(Number(r.sorting_action));
            incidentData.push(Number(r.quality_incident));
            qualityDataPoints.push(Number(r.quality));

            tableRows.push({
                period: label,
                reports_8d: r.reports_8d,
                sorting_action: r.sorting_action,
                quality_incident: r.quality_incident,
                quality: r.quality
            });
        });
    } else {
        // Quarterly
        const qData = {};
        records.forEach(r => {
            const qKey = getQuarterStringHelper(r.date);
            if (!qData[qKey]) {
                qData[qKey] = { reports_8d: 0, sorting_action: 0, quality_incident: 0, quality: 0, count: 0 };
            }
            qData[qKey].reports_8d += Number(r.reports_8d);
            qData[qKey].sorting_action += Number(r.sorting_action);
            qData[qKey].quality_incident += Number(r.quality_incident);
            qData[qKey].quality += Number(r.quality);
            qData[qKey].count += 1;
        });

        // Sort quarter keys chronologically
        const quarterKeys = Object.keys(qData).sort((a, b) => {
            const aParts = a.split(' ');
            const bParts = b.split(' ');
            const aY = parseInt(aParts[1]);
            const bY = parseInt(bParts[1]);
            if (aY !== bY) return aY - bY;
            return aParts[0].localeCompare(bParts[0]);
        });

        quarterKeys.forEach(qKey => {
            const item = qData[qKey];
            const avg8d = item.reports_8d / item.count;
            const avgSorting = item.sorting_action / item.count;
            const avgIncident = item.quality_incident / item.count;
            const avgQuality = item.quality / item.count;

            labels.push(qKey);
            reports8dData.push(parseFloat(avg8d.toFixed(1)));
            sortingActionData.push(parseFloat(avgSorting.toFixed(1)));
            incidentData.push(parseFloat(avgIncident.toFixed(1)));
            qualityDataPoints.push(parseFloat(avgQuality.toFixed(1)));

            tableRows.push({
                period: qKey,
                reports_8d: avg8d,
                sorting_action: avgSorting,
                quality_incident: avgIncident,
                quality: avgQuality
            });
        });
    }

    // Populate Table
    const tbody = document.getElementById('quality-table-body');
    if (tbody) {
        tbody.innerHTML = '';
        tableRows.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${row.period}</strong></td>
                <td>${row.reports_8d.toFixed(1)}</td>
                <td>${row.sorting_action.toFixed(1)}</td>
                <td>${row.quality_incident.toFixed(1)}</td>
                <td style="font-weight: 700; color: #0284c7;">${row.quality.toFixed(1)}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Render Chart.js
    const ctx = document.getElementById('qualityChart').getContext('2d');
    if (qualityChartInstance) {
        qualityChartInstance.destroy();
    }

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? '#1f293d' : '#e2e8f0';
    const tickTextColor = isDark ? '#94a3b8' : '#64748b';

    // Premium luxury blues/teals palette
    const reports8dColor = isDark ? '#93c5fd' : '#bfdbfe'; // Light Slate Blue
    const sortingActionColor = isDark ? '#60a5fa' : '#93c5fd'; // Medium Soft Blue
    const incidentColor = isDark ? '#2563eb' : '#3b82f6'; // Bright Tech Blue
    const qualityLineColor = '#0d9488'; // Deep Teal for overall Quality

    qualityChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: '8D Reports',
                    data: reports8dData,
                    backgroundColor: reports8dColor,
                    borderColor: reports8dColor,
                    borderWidth: 1,
                    borderRadius: 4,
                    barPercentage: 0.8,
                    categoryPercentage: 0.7,
                    datalabels: { display: false }
                },
                {
                    label: 'Sorting Action',
                    data: sortingActionData,
                    backgroundColor: sortingActionColor,
                    borderColor: sortingActionColor,
                    borderWidth: 1,
                    borderRadius: 4,
                    barPercentage: 0.8,
                    categoryPercentage: 0.7,
                    datalabels: { display: false }
                },
                {
                    label: 'Quality Incident',
                    data: incidentData,
                    backgroundColor: incidentColor,
                    borderColor: incidentColor,
                    borderWidth: 1,
                    borderRadius: 4,
                    barPercentage: 0.8,
                    categoryPercentage: 0.7,
                    datalabels: { display: false }
                },
                {
                    label: 'Quality',
                    data: qualityDataPoints,
                    type: 'line',
                    borderColor: qualityLineColor,
                    backgroundColor: qualityLineColor,
                    borderWidth: 4,
                    fill: false,
                    pointStyle: 'circle',
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: qualityLineColor,
                    pointBorderWidth: 3,
                    tension: 0.25,
                    datalabels: {
                        color: isDark ? '#ffffff' : '#000000',
                        anchor: 'end',
                        align: 'top',
                        offset: 4,
                        font: { family: 'Outfit', size: 14, weight: '700' },
                        formatter: (val) => val ? val.toFixed(1) : ''
                    }
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 25
                }
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: isDark ? '#f8fafc' : '#0f172a',
                        font: { family: 'Outfit', weight: '600', size: 16 }
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
                y: {
                    min: 0,
                    max: 6,
                    grid: { color: gridColor },
                    ticks: {
                        stepSize: 1,
                        color: tickTextColor,
                        font: { family: 'Inter', size: 16 }
                    },
                    title: {
                        display: true,
                        text: 'Rating',
                        color: tickTextColor,
                        font: { family: 'Outfit', size: 16, weight: '600' }
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: {
                        color: tickTextColor,
                        font: { family: 'Outfit', size: 16, weight: '600' }
                    }
                }
            }
        },
        plugins: activePlugins
    });
}

function getQuarterStringHelper(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const q = Math.floor(date.getMonth() / 3) + 1;
    return `Q${q} ${date.getFullYear().toString().substring(2)}`; // e.g. Q1 25
}
