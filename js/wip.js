// WIP Report Controller
let wipChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    injectLayout("Work In Process (WIP)");
    initWipTargets();
    renderWipReport();
    
    document.getElementById('wip-type').addEventListener('change', renderWipReport);
    document.getElementById('save-wip-targets-btn').addEventListener('click', saveWipTargets);
});

// Load WIP Targets into inputs
function initWipTargets() {
    const targets = db.get('wip_targets');
    targets.forEach(t => {
        const input = document.getElementById(`target-wip-${t.type.toLowerCase()}`);
        if (input) {
            input.value = t.target;
        }
    });
}

// Save WIP Targets to LocalStorage
function saveWipTargets() {
    const targets = [
        { type: "LHD", target: Number(document.getElementById('target-wip-lhd').value) },
        { type: "RHD", target: Number(document.getElementById('target-wip-rhd').value) },
        { type: "Diffuser", target: Number(document.getElementById('target-wip-diffuser').value) }
    ];
    
    db.set('wip_targets', targets);
    toast.success("WIP Est. targets updated successfully.");
    renderWipReport();
}

function renderWipReport() {
    const activePlugins = [];
    if (typeof ChartDataLabels !== 'undefined') {
        activePlugins.push(ChartDataLabels);
    }

    const selectedType = document.getElementById('wip-type').value;
    const wipData = db.get('wip_data');
    const targets = db.get('wip_targets');
    
    // Update chart banner title
    const typeText = selectedType === 'LHD' ? 'LHD Mirror Caps' : (selectedType === 'RHD' ? 'RHD Mirror Caps' : 'Diffuser');
    document.getElementById('wip-chart-header').textContent = `TOTAL WIP - ${typeText.toUpperCase()}`;

    // Get current target for this type
    const targetRow = targets.find(t => t.type === selectedType);
    const estWipVal = targetRow ? Number(targetRow.target) : 0;

    // Filter data by selected type and sort by date
    const filtered = wipData.filter(d => d.type === selectedType).sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Group daily records into monthly averages
    const monthlyGroups = {};
    filtered.forEach(d => {
        if (!d.date) return;
        const parts = d.date.split('-');
        if (parts.length < 2) return;
        const monthKey = `${parts[0]}-${parts[1].padStart(2, '0')}`;
        
        if (!monthlyGroups[monthKey]) {
            monthlyGroups[monthKey] = {
                monthKey: monthKey,
                date: `${monthKey}-01`,
                total_wip_sum: 0,
                pending_rework_sum: 0,
                active_wip_sum: 0,
                count: 0
            };
        }
        
        monthlyGroups[monthKey].total_wip_sum += Number(d.total_wip || 0);
        monthlyGroups[monthKey].pending_rework_sum += Number(d.pending_rework || 0);
        monthlyGroups[monthKey].active_wip_sum += Number(d.active_wip || 0);
        monthlyGroups[monthKey].count += 1;
    });

    const monthlyRecords = Object.values(monthlyGroups).map(g => {
        const count = g.count > 0 ? g.count : 1;
        return {
            date: g.date,
            total_wip: g.total_wip_sum / count,
            pending_rework: g.pending_rework_sum / count,
            active_wip: g.active_wip_sum / count
        };
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    const months = monthlyRecords.map(d => formatMonthYear(d.date).split(' ')[0]); // "Jan", "Feb", etc.
    const totalWipList = monthlyRecords.map(d => Number(d.total_wip));
    const pendingReworkList = monthlyRecords.map(d => Number(d.pending_rework));
    const activeWipList = monthlyRecords.map(d => Number(d.active_wip));
    const estWipList = Array(monthlyRecords.length).fill(estWipVal);

    // Populate Table
    const tbody = document.getElementById('wip-table-body');
    tbody.innerHTML = '';
    
    monthlyRecords.forEach((d, i) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${formatMonthYear(d.date)}</strong></td>
            <td>${Math.round(d.total_wip).toLocaleString()}</td>
            <td style="color: var(--color-warning);">${Math.round(d.pending_rework).toLocaleString()}</td>
            <td style="color: var(--accent-blue);">${Math.round(d.active_wip).toLocaleString()}</td>
            <td style="font-weight: 600; border-left: 1px solid var(--border-color);">${estWipVal.toLocaleString()}</td>
        `;
        tbody.appendChild(row);
    });

    // Calculate dynamic max with 15% padding to prevent datalabel overlap with legend
    let maxWipVal = estWipVal;
    totalWipList.forEach(v => { if (v > maxWipVal) maxWipVal = v; });
    pendingReworkList.forEach(v => { if (v > maxWipVal) maxWipVal = v; });
    activeWipList.forEach(v => { if (v > maxWipVal) maxWipVal = v; });
    const wipMaxY = Math.ceil((maxWipVal * 1.15) / 100) * 100 || 1000;

    // Render Chart.js
    const ctx = document.getElementById('wipChart').getContext('2d');
    if (wipChartInstance) wipChartInstance.destroy();

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? '#1f293d' : '#e2e8f0';
    const tickTextColor = isDark ? '#94a3b8' : '#64748b';

    wipChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Total WIP',
                    data: totalWipList,
                    borderColor: '#0077b6', // Luminous Sapphire Blue
                    backgroundColor: 'rgba(0, 119, 182, 0.1)',
                    borderWidth: 3,
                    fill: false,
                    tension: 0.25,
                    pointRadius: 5,
                    pointBackgroundColor: '#0077b6',
                    datalabels: {
                        color: isDark ? '#ffffff' : '#000000',
                        anchor: 'end',
                        align: 'top',
                        offset: 4,
                        font: { family: 'Inter', weight: '700', size: 15 },
                        formatter: (value) => Math.round(value).toLocaleString()
                    }
                },
                {
                    label: 'Pending Rework Plastic Insert',
                    data: pendingReworkList,
                    borderColor: '#ff9f43', // Luminous Orange Gold
                    backgroundColor: 'rgba(255, 159, 67, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.25,
                    pointRadius: 4,
                    pointBackgroundColor: '#ff9f43',
                    datalabels: {
                        color: isDark ? '#ffffff' : '#000000',
                        anchor: 'end',
                        align: 'top',
                        offset: 4,
                        font: { family: 'Inter', weight: '700', size: 15 },
                        formatter: (value) => Math.round(value).toLocaleString()
                    }
                },
                {
                    label: 'Active',
                    data: activeWipList,
                    borderColor: '#00d2d3', // Bright Cyan
                    backgroundColor: 'rgba(0, 210, 211, 0.1)',
                    borderWidth: 3,
                    fill: false,
                    tension: 0.25,
                    pointRadius: 5,
                    pointBackgroundColor: '#00d2d3',
                    datalabels: {
                        color: isDark ? '#ffffff' : '#000000',
                        anchor: 'start',
                        align: 'bottom',
                        offset: 4,
                        font: { family: 'Inter', weight: '700', size: 15 },
                        formatter: (value) => Math.round(value).toLocaleString()
                    }
                },
                {
                    label: 'Est. WIP',
                    data: estWipList,
                    borderColor: '#d4af37', // Luminous Gold Target line
                    borderWidth: 2.5,
                    borderDash: [6, 6],
                    fill: false,
                    pointStyle: 'none',
                    pointRadius: 0,
                    datalabels: {
                        display: false
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
                    position: 'bottom',
                    labels: { color: isDark ? '#f8fafc' : '#0f172a', font: { family: 'Outfit', weight: '600', size: 16 } } // Increased to 16px
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
                    max: wipMaxY, // Set max with dynamic padding
                    grid: { color: gridColor },
                    ticks: { color: tickTextColor, font: { family: 'Inter', size: 16 } } // Scaled up to 16px
                },
                x: {
                    grid: { display: false },
                    ticks: { color: tickTextColor, font: { family: 'Outfit', size: 16, weight: '600' } } // Increased to 16px
                }
            }
        },
        plugins: activePlugins
    });
}
