/* ========================================
   DIGITAL TWIN IEEE 13 BUS MONITORING
   JavaScript Application Logic
   ======================================== */

// ========================================
// BUS DEFINITION (Bus 1 through Bus 13)
// ========================================
const busIds = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13'];

// Distinct hex colors for 13 buses
const busColors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
    '#FF9F40', '#E7E9ED', '#8B5CF6', '#10B981', '#F59E0B',
    '#EF4444', '#3B82F6', '#8B5CF6'
];

// ========================================
// GLOBAL VARIABLES
// ========================================
let allDataLog = [];
let perBusLog = [];
let breakerStatus = {
    incoming: true,
    outgoing: true,
    capacitor: true
};

// Bus status array (true = ON, false = OFF)
let busStatus = Array(13).fill(true);

// Chart instances
let myChart = null;
let busLineChart = null;

// ========================================
// INITIALIZE AFTER DOM READY
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Ready - Initializing charts...');
    initializeCharts();
    generateColoredCheckboxes();
    attachCheckboxListeners();
    generateBusToggles();
    attachSidebarListeners();
    initializeSidebarToggle();
    startSimulation();
    setInterval(startSimulation, 5000);
    console.log('System started successfully');
});

// ========================================
// TEXT FORMATTER (Plain Text for Canvas)
// ========================================
function formatVariable(text) {
    // Return clean standard text for Chart.js canvas rendering
    return text;
}

// ========================================
// INITIALIZE CHARTS
// ========================================
function initializeCharts() {
    // Total Q_injected Line Chart
    const ctx = document.getElementById('reactivePowerChart');
    if (!ctx) {
        console.error('Canvas reactivePowerChart not found!');
        return;
    }
    
    myChart = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Total Qᵢₙⱼ (kVAr)',
                data: [],
                borderColor: '#00bfff',
                backgroundColor: 'rgba(0, 191, 255, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { 
                duration: 600, 
                easing: 'easeInOutQuart' 
            },
            interaction: {
                mode: 'index',
                intersect: false
            },
            layout: {
                padding: {
                    left: 10,
                    right: 20,
                    top: 0,
                    bottom: 0
                }
            },
            scales: {
                x: {
                    grid: { color: '#333' },
                    ticks: { 
                        color: '#b0b0b0', 
                        font: { size: 11 },
                        padding: 0
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: { color: '#333' },
                    ticks: {
                        color: '#b0b0b0',
                        callback: function(value) { return value + ' kVAr'; }
                    },
                    afterFit: function(scale) {
                        scale.width = 60; // Lock Y-axis width for alignment
                    }
                }
            },
            plugins: {
                legend: {
                    display: false  // Disable legend to avoid clickable confusion
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#00bfff',
                    bodyColor: '#e0e0e0',
                    borderColor: '#00bfff',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            return 'Total Qᵢₙⱼ: ' + context.parsed.y.toFixed(2) + ' kVAr';
                        }
                    }
                }
            }
        }
    });

    // Bus Multi-Line Chart (13 lines)
    const busCtx = document.getElementById('busLineChart');
    if (!busCtx) {
        console.error('Canvas busLineChart not found!');
        return;
    }
    
    const busDatasets = busIds.map((busId, index) => ({
        label: `Bus ${busId}`,
        data: [],
        borderColor: busColors[index],
        backgroundColor: 'transparent',
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 5,
        hidden: index >= 3 // Hide Bus 4-13 by default
    }));

    busLineChart = new Chart(busCtx.getContext('2d'), {
        type: 'line',
        data: {
            labels: [],
            datasets: busDatasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { 
                duration: 600, 
                easing: 'easeInOutQuart' 
            },
            interaction: {
                mode: 'index',
                intersect: false
            },
            layout: {
                padding: {
                    left: 10,
                    right: 20,
                    top: 0,
                    bottom: 0
                }
            },
            scales: {
                x: {
                    grid: { color: '#333' },
                    ticks: { color: '#b0b0b0', font: { size: 9 } }
                },
                y: {
                    beginAtZero: true,
                    grid: { color: '#333' },
                    ticks: {
                        color: '#b0b0b0',
                        callback: function(value) { return value + ' kVAr'; }
                    },
                    afterFit: function(scale) {
                        scale.width = 60; // Lock Y-axis width for alignment
                    }
                }
            },
            plugins: {
                legend: {
                    display: false  // Disable default legend, use custom checkboxes
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#00bfff',
                    bodyColor: '#e0e0e0',
                    borderColor: '#00bfff',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true,
                    callbacks: {
                        title: function(tooltipItems) {
                            // Display timestamp as title
                            return tooltipItems[0].label;
                        },
                        label: function(context) {
                            // Display each bus with its value using Unicode subscript
                            const busLabel = context.dataset.label;
                            const value = context.parsed.y.toFixed(2);
                            return busLabel + ' Qᵢₙⱼ: ' + value + ' kVAr';
                        }
                    }
                }
            }
        }
    });
    
    console.log('Charts initialized successfully');
}

// ========================================
// GENERATE COLORED CHECKBOXES
// ========================================
function generateColoredCheckboxes() {
    const container = document.getElementById('busFilterContainer');
    if (!container) return;
    
    container.innerHTML = ''; // Clear existing content
    
    busIds.forEach((busId, index) => {
        const label = document.createElement('label');
        label.className = 'bus-checkbox-label';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'bus-checkbox';
        checkbox.setAttribute('data-bus', busId);
        checkbox.checked = index < 3; // Bus 1-3 checked by default
        
        const span = document.createElement('span');
        span.textContent = `Bus ${busId}`;
        span.style.color = busColors[index]; // Apply bus color to text
        span.style.fontWeight = '600';
        
        label.appendChild(checkbox);
        label.appendChild(span);
        container.appendChild(label);
    });
    
    console.log('Colored checkboxes generated');
}

// ========================================
// ATTACH CHECKBOX EVENT LISTENERS
// ========================================
function attachCheckboxListeners() {
    const checkboxes = document.querySelectorAll('.bus-checkbox');
    checkboxes.forEach((checkbox) => {
        checkbox.addEventListener('change', function() {
            const busIndex = parseInt(this.getAttribute('data-bus')) - 1;
            const isChecked = this.checked;
            
            // Show or hide the corresponding dataset
            if (busLineChart && busLineChart.data.datasets[busIndex]) {
                busLineChart.data.datasets[busIndex].hidden = !isChecked;
                busLineChart.update();
            }
        });
    });
    console.log('Checkbox listeners attached');
}

// ========================================
// GENERATE BUS TOGGLES IN SIDEBAR
// ========================================
function generateBusToggles() {
    const container = document.getElementById('busToggles');
    if (!container) return;
    
    container.innerHTML = '';
    
    busIds.forEach((busId, index) => {
        const toggleItem = document.createElement('div');
        toggleItem.className = 'toggle-item bus-toggle-item';
        
        const label = document.createElement('span');
        label.className = 'toggle-label';
        label.textContent = `Bus ${busId}`;
        label.style.color = busColors[index];
        
        const toggleSwitch = document.createElement('label');
        toggleSwitch.className = 'toggle-switch toggle-switch-small';
        
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.id = `toggleBus${busId}`;
        input.checked = true;
        input.setAttribute('data-bus-index', index);
        
        const slider = document.createElement('span');
        slider.className = 'toggle-slider';
        
        toggleSwitch.appendChild(input);
        toggleSwitch.appendChild(slider);
        
        toggleItem.appendChild(label);
        toggleItem.appendChild(toggleSwitch);
        container.appendChild(toggleItem);
    });
    
    console.log('Bus toggles generated');
}

// ========================================
// ATTACH SIDEBAR TOGGLE LISTENERS
// ========================================
function attachSidebarListeners() {
    // Main Grid Toggle
    const mainGridToggle = document.getElementById('toggleMainGrid');
    if (mainGridToggle) {
        mainGridToggle.addEventListener('change', function() {
            breakerStatus.incoming = this.checked;
            console.log('Main Grid:', this.checked ? 'ON' : 'OFF');
        });
    }
    
    // Capacitor Bank Toggle
    const capacitorToggle = document.getElementById('toggleCapacitor');
    if (capacitorToggle) {
        capacitorToggle.addEventListener('change', function() {
            breakerStatus.capacitor = this.checked;
            console.log('Capacitor Bank:', this.checked ? 'ON' : 'OFF');
        });
    }
    
    // Outgoing Feeder Toggle
    const outgoingToggle = document.getElementById('toggleOutgoing');
    if (outgoingToggle) {
        outgoingToggle.addEventListener('change', function() {
            breakerStatus.outgoing = this.checked;
            console.log('Outgoing Feeder:', this.checked ? 'ON' : 'OFF');
        });
    }
    
    // Bus Toggles
    busIds.forEach((busId, index) => {
        const busToggle = document.getElementById(`toggleBus${busId}`);
        if (busToggle) {
            busToggle.addEventListener('change', function() {
                busStatus[index] = this.checked;
                console.log(`Bus ${busId}:`, this.checked ? 'ON' : 'OFF');
            });
        }
    });
}

// ========================================
// SIDEBAR TOGGLE FUNCTIONALITY
// ========================================
function initializeSidebarToggle() {
    const hamburgerBtn = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('overlayBackdrop');
    
    if (!hamburgerBtn || !sidebar || !backdrop) {
        console.warn('Sidebar toggle elements not found');
        return;
    }
    
    // Toggle sidebar on hamburger click
    hamburgerBtn.addEventListener('click', function() {
        sidebar.classList.toggle('active');
        backdrop.classList.toggle('active');
        hamburgerBtn.classList.toggle('active');
    });
    
    // Close sidebar on backdrop click
    backdrop.addEventListener('click', function() {
        sidebar.classList.remove('active');
        backdrop.classList.remove('active');
        hamburgerBtn.classList.remove('active');
    });
    
    console.log('Sidebar toggle initialized');
}

// ========================================
// TOGGLE BREAKER FUNCTION
// ========================================
function toggleBreaker(type) {
    const btn = document.getElementById(`btn${type.charAt(0).toUpperCase() + type.slice(1)}`);
    const statusDisplay = document.getElementById(`status${type.charAt(0).toUpperCase() + type.slice(1)}`);
    
    const equipmentNames = {
        incoming: 'Circuit Breaker Incoming (Utama)',
        outgoing: 'Circuit Breaker Outgoing (Feeder)',
        capacitor: 'Capacitor Bank'
    };
    
    const currentStatus = breakerStatus[type] ? 'ON' : 'OFF';
    const newStatus = breakerStatus[type] ? 'OFF' : 'ON';
    const action = breakerStatus[type] ? 'MEMATIKAN' : 'MENGHIDUPKAN';
    
    let confirmMessage = `KONFIRMASI OPERASI\n\nEquipment: ${equipmentNames[type]}\nStatus saat ini: ${currentStatus}\nStatus baru: ${newStatus}\n\n`;
    
    if (type === 'incoming' && breakerStatus[type]) {
        confirmMessage += `⚠️ PERINGATAN:\nMematikan CB Incoming akan otomatis mematikan:\n• CB Outgoing\n• Capacitor Bank\n\n`;
    }
    
    confirmMessage += `Apakah Anda yakin ingin ${action} ${equipmentNames[type]}?`;
    
    if (!confirm(confirmMessage)) {
        console.log(`Operasi dibatalkan: ${equipmentNames[type]}`);
        return;
    }
    
    breakerStatus[type] = !breakerStatus[type];
    
    if (breakerStatus[type]) {
        btn.textContent = 'Turn OFF';
        btn.className = 'btn-control btn-on';
        statusDisplay.innerHTML = '<span class="status-badge on">ON</span>';
        alert(`✓ ${equipmentNames[type]} telah DIHIDUPKAN\n\nStatus: ENERGIZED\nSistem aktif dan beroperasi normal.`);
    } else {
        btn.textContent = 'Turn ON';
        btn.className = 'btn-control btn-off';
        statusDisplay.innerHTML = '<span class="status-badge off">OFF</span>';
        alert(`⚠ ${equipmentNames[type]} telah DIMATIKAN\n\nStatus: DE-ENERGIZED\nSistem tidak aktif.`);
    }
    
    if (type === 'incoming' && !breakerStatus.incoming) {
        if (breakerStatus.outgoing) toggleBreakerSilent('outgoing');
        if (breakerStatus.capacitor) toggleBreakerSilent('capacitor');
        setTimeout(() => {
            alert('⚠️ PERHATIAN: CB Incoming dimatikan!\n\nTindakan Otomatis:\n• CB Outgoing → OFF\n• Capacitor Bank → OFF\n\nAlasan: Prosedur keamanan sistem distribusi.');
        }, 100);
    }
    
    if (type !== 'incoming' && breakerStatus[type] && !breakerStatus.incoming) {
        breakerStatus[type] = false;
        btn.textContent = 'Turn ON';
        btn.className = 'btn-control btn-off';
        statusDisplay.innerHTML = '<span class="status-badge off">OFF</span>';
        alert(`⚠️ OPERASI DITOLAK!\n\n${equipmentNames[type]} tidak dapat dihidupkan.\n\nAlasan: CB Incoming dalam kondisi OFF.`);
    }
}

function toggleBreakerSilent(type) {
    const btn = document.getElementById(`btn${type.charAt(0).toUpperCase() + type.slice(1)}`);
    const statusDisplay = document.getElementById(`status${type.charAt(0).toUpperCase() + type.slice(1)}`);
    
    breakerStatus[type] = false;
    btn.textContent = 'Turn ON';
    btn.className = 'btn-control btn-off';
    statusDisplay.innerHTML = '<span class="status-badge off">OFF</span>';
}

// ========================================
// SIMULATION FUNCTION
// ========================================
function startSimulation() {
    if (!breakerStatus.incoming) {
        console.log('System OFF - CB Incoming is OFF');
        return;
    }
    
    // Generate data for each bus
    const busData = busIds.map((busId, index) => {
        // Check if both outgoing feeder AND specific bus are ON
        const isBusActive = breakerStatus.outgoing && busStatus[index];
        const P = isBusActive ? (Math.random() * 150 + 50) : 0; // 50-200 kW per bus
        const Q = isBusActive ? (Math.random() * 100 + 20) : 0; // 20-120 kVAr per bus
        return { id: busId, P_load: P, Q_load: Q };
    });
    
    // Aggregate totals
    const P_load = busData.reduce((sum, b) => sum + b.P_load, 0);
    const Q_load = busData.reduce((sum, b) => sum + b.Q_load, 0);
    
    // Calculate power factor
    let pf_initial;
    if (P_load === 0 && Q_load === 0) {
        pf_initial = 0;
    } else {
        const S = Math.sqrt(P_load ** 2 + Q_load ** 2);
        pf_initial = P_load / S;
    }
    
    const pf_target = 0.95;
    const phi_target = Math.acos(pf_target);
    const Q_target = P_load * Math.tan(phi_target);
    
    let Q_injected = 0;
    if (breakerStatus.capacitor && P_load > 0) {
        Q_injected = Q_load - Q_target;
        Q_injected = Q_injected < 0 ? 0 : Q_injected;
    }
    
    // Per-bus Q_injected (proportional distribution)
    const totalBusQ = busData.reduce((sum, b) => sum + b.Q_load, 0);
    const perBusInjected = busData.map(b => {
        const injected = (totalBusQ > 0) ? (b.Q_load / totalBusQ) * Q_injected : 0;
        return { id: b.id, Q_injected: injected };
    });
    
    // Get timestamp
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    
    // Create total data point
    const dataPoint = {
        waktu: timeStr,
        P_load: P_load.toFixed(2),
        Q_load: Q_load.toFixed(2),
        pf_initial: pf_initial.toFixed(3),
        pf_target: pf_target.toFixed(2),
        Q_target: Q_target.toFixed(2),
        Q_injected: Q_injected.toFixed(2),
        cb_status: `IN:${breakerStatus.incoming?'ON':'OFF'} | OUT:${breakerStatus.outgoing?'ON':'OFF'} | CAP:${breakerStatus.capacitor?'ON':'OFF'}`
    };
    
    // Store data
    allDataLog.push(dataPoint);
    
    // Update charts
    updateTotalChart(timeStr, Q_injected);
    updateBusLineChart(timeStr, perBusInjected);
    
    // Update tables
    updateTotalTable(dataPoint);
    updateWideBusTable(timeStr, perBusInjected);
    
    // Log per-bus for export
    const busLogEntry = { waktu: timeStr };
    perBusInjected.forEach(b => {
        busLogEntry[`q_${b.id}`] = b.Q_injected.toFixed(2);
    });
    perBusLog.push(busLogEntry);
}

// ========================================
// UPDATE TOTAL CHART
// ========================================
function updateTotalChart(timeStr, Q_injected) {
    myChart.data.labels.push(timeStr);
    myChart.data.datasets[0].data.push(parseFloat(Q_injected.toFixed(2)));
    
    if (myChart.data.labels.length > 10) {
        myChart.data.labels.shift();
        myChart.data.datasets[0].data.shift();
    }
    
    myChart.update(); // Enable smooth animation
}

// ========================================
// UPDATE BUS MULTI-LINE CHART
// ========================================
function updateBusLineChart(timeStr, perBusInjected) {
    busLineChart.data.labels.push(timeStr);
    
    perBusInjected.forEach((b, index) => {
        busLineChart.data.datasets[index].data.push(parseFloat(b.Q_injected.toFixed(2)));
    });
    
    if (busLineChart.data.labels.length > 10) {
        busLineChart.data.labels.shift();
        busLineChart.data.datasets.forEach(dataset => {
            dataset.data.shift();
        });
    }
    
    busLineChart.update(); // Enable smooth animation
}

// ========================================
// UPDATE TOTAL TABLE
// ========================================
function updateTotalTable(dataPoint) {
    const tableBody = document.getElementById('tableBody');
    const tableWrapper = document.getElementById('totalTableWrapper');
    const newRow = tableBody.insertRow(0);
    
    // Using standard text display - HTML already has <sub> tags in headers
    newRow.innerHTML = `
        <td>${dataPoint.waktu}</td>
        <td>${dataPoint.P_load}</td>
        <td>${dataPoint.Q_load}</td>
        <td>${dataPoint.pf_initial}</td>
        <td>${dataPoint.pf_target}</td>
        <td>${dataPoint.Q_target}</td>
        <td>${dataPoint.Q_injected}</td>
        <td style="font-size: 0.75em;">${dataPoint.cb_status}</td>
    `;
    
    // Add smooth slide-in animation
    newRow.classList.add('new-row-animate');
    
    while (tableBody.rows.length > 10) {
        tableBody.deleteRow(10);
    }
    
    if (tableBody.rows.length > 5) {
        tableWrapper.classList.add('scrollable');
    } else {
        tableWrapper.classList.remove('scrollable');
    }
}

// ========================================
// UPDATE WIDE BUS TABLE
// ========================================
function updateWideBusTable(timeStr, perBusInjected) {
    const busTableBody = document.getElementById('busTableBody');
    const row = busTableBody.insertRow(0);
    
    let rowHtml = `<td>${timeStr}</td>`;
    
    busIds.forEach(busId => {
        const busData = perBusInjected.find(b => b.id === busId);
        const qValue = busData ? busData.Q_injected.toFixed(2) : '0.00';
        rowHtml += `<td>${qValue}</td>`;
    });
    
    row.innerHTML = rowHtml;
    
    // Add smooth slide-in animation
    row.classList.add('new-row-animate');
    
    while (busTableBody.rows.length > 10) {
        busTableBody.deleteRow(10);
    }
}

// ========================================
// EXPORT TO EXCEL
// ========================================
function exportToExcel() {
    if (allDataLog.length === 0) {
        alert('Tidak ada data untuk diekspor!');
        return;
    }
    
    const wb = XLSX.utils.book_new();
    
    // Sheet 1: Total Monitoring Data
    const wsTotalData = [
        ['Waktu', 'P_total (kW)', 'Q_total (kVAr)', 'pf_initial', 'pf_target', 'Q_target (kVAr)', 'Q_injected (kVAr)', 'Status CB']
    ];
    allDataLog.forEach(item => {
        wsTotalData.push([
            item.waktu,
            parseFloat(item.P_load),
            parseFloat(item.Q_load),
            parseFloat(item.pf_initial),
            parseFloat(item.pf_target),
            parseFloat(item.Q_target),
            parseFloat(item.Q_injected),
            item.cb_status
        ]);
    });
    const ws1 = XLSX.utils.aoa_to_sheet(wsTotalData);
    ws1['!cols'] = [{wch: 12},{wch: 15},{wch: 15},{wch: 12},{wch: 12},{wch: 18},{wch: 20},{wch: 30}];
    XLSX.utils.book_append_sheet(wb, ws1, 'Total Monitoring Data');
    
    // Sheet 2: Bus Injection Log (Wide Format)
    const wsBusData = [
        ['Waktu', ...busIds.map(id => `Bus ${id}`)]
    ];
    perBusLog.forEach(item => {
        const row = [item.waktu];
        busIds.forEach(busId => {
            row.push(parseFloat(item[`q_${busId}`] || '0'));
        });
        wsBusData.push(row);
    });
    const ws2 = XLSX.utils.aoa_to_sheet(wsBusData);
    ws2['!cols'] = [{wch: 12}, ...busIds.map(() => ({wch: 12}))];
    XLSX.utils.book_append_sheet(wb, ws2, 'Bus Injection Log');
    
    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `IEEE13Bus_CapBank_${timestamp}.xlsx`;
    
    XLSX.writeFile(wb, filename);
    console.log(`Data exported: ${allDataLog.length} total records, ${perBusLog.length} bus records`);
}

console.log('Script loaded successfully');
