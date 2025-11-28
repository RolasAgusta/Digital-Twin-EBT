/* ========================================
   DIGITAL TWIN CAPACITOR BANK MONITORING
   JavaScript Application Logic
   ======================================== */

// ========================================
// GLOBAL VARIABLES
// ========================================
let allDataLog = [];
let breakerStatus = {
    incoming: true,  // CB Incoming (Utama)
    outgoing: true,  // CB Outgoing (Feeder)
    capacitor: true  // Capacitor Bank
};
let chartData = {
    labels: [],
    datasets: [{
        label: 'Qinjected (kVAr)',
        data: [],
        borderColor: '#00bfff',
        backgroundColor: 'rgba(0, 191, 255, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#00bfff',
        pointBorderColor: '#fff',
        pointBorderWidth: 2
    }]
};

// ========================================
// INITIALIZE CHART.JS
// ========================================
const ctx = document.getElementById('reactivePowerChart').getContext('2d');
const myChart = new Chart(ctx, {
    type: 'line',
    data: chartData,
    options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 750,
            easing: 'easeInOutQuart'
        },
        scales: {
            x: {
                grid: {
                    color: '#333',
                    borderColor: '#555'
                },
                ticks: {
                    color: '#b0b0b0',
                    font: {
                        size: 11
                    }
                }
            },
            y: {
                beginAtZero: true,
                grid: {
                    color: '#333',
                    borderColor: '#555'
                },
                ticks: {
                    color: '#b0b0b0',
                    font: {
                        size: 11
                    },
                    callback: function(value) {
                        return value + ' kVAr';
                    }
                }
            }
        },
        plugins: {
            legend: {
                display: true,
                labels: {
                    color: '#00bfff',
                    font: {
                        size: 13,
                        weight: 'bold'
                    }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#00bfff',
                bodyColor: '#fff',
                borderColor: '#00bfff',
                borderWidth: 1,
                padding: 12,
                displayColors: true
            }
        }
    }
});

// ========================================
// TOGGLE BREAKER FUNCTION
// ========================================
function toggleBreaker(type) {
    const btn = document.getElementById(`btn${type.charAt(0).toUpperCase() + type.slice(1)}`);
    const statusDisplay = document.getElementById(`status${type.charAt(0).toUpperCase() + type.slice(1)}`);
    
    // Get equipment name for display
    const equipmentNames = {
        incoming: 'Circuit Breaker Incoming (Utama)',
        outgoing: 'Circuit Breaker Outgoing (Feeder)',
        capacitor: 'Capacitor Bank'
    };
    
    // Confirmation dialog
    const currentStatus = breakerStatus[type] ? 'ON' : 'OFF';
    const newStatus = breakerStatus[type] ? 'OFF' : 'ON';
    const action = breakerStatus[type] ? 'MEMATIKAN' : 'MENGHIDUPKAN';
    
    let confirmMessage = `KONFIRMASI OPERASI\n\n`;
    confirmMessage += `Equipment: ${equipmentNames[type]}\n`;
    confirmMessage += `Status saat ini: ${currentStatus}\n`;
    confirmMessage += `Status baru: ${newStatus}\n\n`;
    
    if (type === 'incoming' && breakerStatus[type]) {
        confirmMessage += `⚠️ PERINGATAN:\nMematikan CB Incoming akan otomatis mematikan:\n• CB Outgoing\n• Capacitor Bank\n\n`;
    }
    
    confirmMessage += `Apakah Anda yakin ingin ${action} ${equipmentNames[type]}?`;
    
    const confirmed = confirm(confirmMessage);
    
    if (!confirmed) {
        console.log(`Operasi dibatalkan: ${equipmentNames[type]}`);
        return; // Cancel operation
    }
    
    // Toggle status
    breakerStatus[type] = !breakerStatus[type];
    
    // Update UI
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
    
    // Logic: If CB Incoming OFF, automatically turn OFF Outgoing and Capacitor
    if (type === 'incoming' && !breakerStatus.incoming) {
        if (breakerStatus.outgoing) toggleBreakerSilent('outgoing');
        if (breakerStatus.capacitor) toggleBreakerSilent('capacitor');
        setTimeout(() => {
            alert('⚠️ PERHATIAN: CB Incoming dimatikan!\n\nTindakan Otomatis:\n• CB Outgoing → OFF (de-energized)\n• Capacitor Bank → OFF (de-energized)\n\nAlasan: Prosedur keamanan sistem distribusi.\nSeluruh beban telah diputus dari sumber.');
        }, 100);
    }
    
    // Logic: If CB Incoming OFF, cannot turn ON others
    if (type !== 'incoming' && breakerStatus[type] && !breakerStatus.incoming) {
        breakerStatus[type] = false;
        btn.textContent = 'Turn ON';
        btn.className = 'btn-control btn-off';
        statusDisplay.innerHTML = '<span class="status-badge off">OFF</span>';
        alert(`⚠️ OPERASI DITOLAK!\n\n${equipmentNames[type]} tidak dapat dihidupkan.\n\nAlasan:\nCircuit Breaker Incoming (Utama) dalam kondisi OFF.\n\nSolusi:\nHidupkan CB Incoming terlebih dahulu sebelum menghidupkan equipment lainnya.`);
    }
    
    console.log('Breaker Status:', breakerStatus);
}

// ========================================
// TOGGLE BREAKER SILENT (without confirmation/alert)
// ========================================
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
    // Check if system is energized (CB Incoming must be ON)
    if (!breakerStatus.incoming) {
        console.log('System OFF - CB Incoming is OFF');
        return; // Skip simulation if main breaker is OFF
    }
    
    // 1. Generate dummy data
    // If CB Outgoing is OFF, no load (P_load and Q_load = 0)
    let P_load, Q_load;
    if (!breakerStatus.outgoing) {
        P_load = 0; // No active power if outgoing is OFF
        Q_load = 0; // No reactive power if outgoing is OFF
    } else {
        P_load = Math.random() * (1000 - 800) + 800; // 800-1000 kW
        Q_load = Math.random() * (600 - 400) + 400; // 400-600 kVAr
    }
    
    // 2. Calculate initial power factor
    let pf_initial;
    if (P_load === 0 && Q_load === 0) {
        pf_initial = 0; // No load, no power factor
    } else {
        const S = Math.sqrt(Math.pow(P_load, 2) + Math.pow(Q_load, 2));
        pf_initial = P_load / S;
    }
    
    // 3. Target power factor
    const pf_target = 0.95;
    
    // 4. Calculate target angle
    const phi_target = Math.acos(pf_target);
    
    // 5. Calculate target reactive power
    const Q_target = P_load * Math.tan(phi_target);
    
    // 6. Calculate injected reactive power (compensation)
    // If Capacitor Bank is OFF or no load, no compensation
    let Q_injected = 0;
    if (breakerStatus.capacitor && P_load > 0) {
        Q_injected = Q_load - Q_target;
        Q_injected = Q_injected < 0 ? 0 : Q_injected;
    }
    
    // 7. Get current time
    const now = new Date();
    const timeStr = now.getHours().toString().padStart(2, '0') + ':' + 
                   now.getMinutes().toString().padStart(2, '0') + ':' +
                   now.getSeconds().toString().padStart(2, '0');
    
    // 8. Create data object
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
    
    // 9. Store in global log (for Excel export)
    allDataLog.push(dataPoint);
    
    // 10. Update Chart (max 10 points)
    updateChart(timeStr, Q_injected);
    
    // 11. Update Table (max 10 rows)
    updateTable(dataPoint);
}

// ========================================
// UPDATE CHART FUNCTION
// ========================================
function updateChart(timeStr, Q_injected) {
    chartData.labels.push(timeStr);
    chartData.datasets[0].data.push(parseFloat(Q_injected.toFixed(2)));
    
    // Keep only last 10 data points
    if (chartData.labels.length > 10) {
        chartData.labels.shift();
        chartData.datasets[0].data.shift();
    }
    
    myChart.update();
}

// ========================================
// UPDATE TABLE FUNCTION
// ========================================
function updateTable(dataPoint) {
    const tableBody = document.getElementById('tableBody');
    const newRow = tableBody.insertRow(0);
    
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
    
    // Keep only last 10 rows
    while (tableBody.rows.length > 10) {
        tableBody.deleteRow(10);
    }
}

// ========================================
// EXPORT TO EXCEL FUNCTION
// ========================================
function exportToExcel() {
    if (allDataLog.length === 0) {
        alert('Tidak ada data untuk diekspor!');
        return;
    }
    
    // Prepare data for Excel
    const wsData = [
        ['Waktu', 'Pload (kW)', 'Qload (kVAr)', 'pf_initial', 'pf_target', 'Qtarget (kVAr)', 'Qinjected (kVAr)', 'Status CB']
    ];
    
    allDataLog.forEach(item => {
        wsData.push([
            item.waktu,
            parseFloat(item.P_load),
            parseFloat(item.Q_load),
            parseFloat(item.pf_initial),
            parseFloat(item.pf_target),
            parseFloat(item.Q_target),
            parseFloat(item.Q_injected),
            item.cb_status || 'N/A'
        ]);
    });
    
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Set column widths
    ws['!cols'] = [
        {wch: 12},  // Waktu
        {wch: 15},  // P_load
        {wch: 15},  // Q_load
        {wch: 12},  // pf (awal)
        {wch: 12},  // pf_target
        {wch: 18},  // Q_target
        {wch: 20},  // Q_injected
        {wch: 30}   // Status CB
    ];
    
    XLSX.utils.book_append_sheet(wb, ws, 'Capacitor Bank Data');
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `CapacitorBank_Data_${timestamp}.xlsx`;
    
    // Export file
    XLSX.writeFile(wb, filename);
    
    console.log(`Data exported: ${allDataLog.length} records`);
}

// ========================================
// INITIALIZATION
// ========================================
// Start simulation when page loads
// Using 5 seconds interval
startSimulation(); // Run immediately on page load
setInterval(startSimulation, 5000); // Then repeat every 5 seconds

console.log('Digital Twin Capacitor Bank Monitoring System - Started');
console.log('Simulation interval: 5 seconds');