// File: js/ui.js
// Tugas: Membangun dan memperbarui semua elemen di halaman.
/**
 * Menampilkan notifikasi di halaman.
 * @param {JQuery<HTMLElement>} alertBox - Elemen JQuery dari kotak alert.
 * @param {string} message - Pesan yang ingin ditampilkan.
 * @param {string} type - Tipe alert (info, success, warning, danger).
 */

export function showAlert(alertBox, message, type = 'info') {
    if (!alertBox || alertBox.length === 0) return;
    alertBox
        .removeClass('alert-info alert-warning alert-success alert-danger')
        .addClass(`alert-${type}`)
        .text(message)
        .show();
}

/**
 * Merender seluruh konten untuk Dashboard Harian.
 * @param {object} data - Data yang diterima dari API.
 * @param {DataTable.Api} dailyTable - Instance DataTable yang sudah ada.
 * @returns {DataTable.Api} - Instance DataTable yang baru.
 */


export function renderDailyDashboard(data, dailyTable) {
    const dailyDashboardContent = $('#daily-dashboard-content');
    dailyDashboardContent.empty().hide();

    if (!data || data.isEmpty) {
        showAlert(data.message || 'Tidak ada data untuk kombinasi filter yang dipilih.', 'warning');
        if (dailyTable) dailyTable.clear().draw();
        return;
    }

    // TAHAP 1: Olah data untuk tabel, tambahkan kolom kalkulasi baru
    const tableData = data.detailed_table.map((row, index) => {
        const budgetHarian = parseFloat(row.Budget_Harian) || 0;
        const realisasiPKS = parseFloat(row.Timbang_PKS) || 0;
        const acvHarian = budgetHarian > 0 ? (realisasiPKS / budgetHarian) * 100 : 0;
        return {
            ...row,
            NO: index + 1,
            ACV_Prod_Harian: acvHarian,
            Realisasi_PKS_Harian: realisasiPKS,
        };
    });

 // HTML KPI dan Chart
    const kpiHtml = `
        <div class="col-lg-3 col-md-6 mb-4">
            <div class="kpi-box"><div class="title">ACV Production</div><div class="value">${data.kpi_acv.value}</div></div>
        </div>
        <div class="col-lg-9 col-md-6 mb-4">
            <div class="card master-data-card h-100"><div class="card-body row text-center align-items-center">
                <div class="col"><div class="title">SPH</div><div class="value">${data.master_data_display.sph}</div></div>
                <div class="col"><div class="title">Luas TM (Ha)</div><div class="value">${data.master_data_display.luas_tm}</div></div>
                <div class="col"><div class="title">Pokok (Pkk)</div><div class="value">${data.master_data_display.pkk}</div></div>
                <div class="col"><div class="title">Budget Bulan Ini</div><div class="value">${parseFloat(data.master_data_display.budget_monthly).toLocaleString('id-ID')}</div></div>
            </div></div>
        </div>`;

         const chartHtml = `
        <div class="col-lg-12 mb-4">
            <div class="card shadow-sm"><div class="card-body">
                <h5 class="card-title">Budget Harian vs Realisasi</h5>
                <div id="daily-main-chart" style="height: 350px;"></div>
            </div></div>
        </div>`;

    const tableHtml = `
        <div class="col-12">
            <div class="card shadow-sm"><div class="card-body">
                <h5 class="card-title fw-bold">Detail Data Harian</h5>
                <div class="table-responsive">
                    <table id="daily-data-table" class="table table-striped table-hover" style="width:100%"></table>
                </div>
            </div></div>
        </div>`;
    
    dailyDashboardContent.html(kpiHtml + chartHtml + tableHtml).show();


     // Render Chart
    try {
        if (data.daily_comparison) {
            const chartData = google.visualization.arrayToDataTable([
                ['Metrik', 'Nilai (Kg)', { role: 'style' }],
                ['Budget Harian', data.daily_comparison.budget, '#6c757d'],
                ['Realisasi Kebun', data.daily_comparison.kebun, '#17a2b8'],
                ['Realisasi PKS', data.daily_comparison.pks, '#0d6efd']
            ]);
            new google.visualization.ColumnChart(document.getElementById('daily-main-chart'))
                .draw(chartData, { legend: { position: 'top' } });
        } else {
            $('#daily-main-chart').html(`<div class="alert alert-warning">Data chart tidak tersedia.</div>`);
        }
    } catch (e) {
        $('#daily-main-chart').html(`<div class="alert alert-warning">Gagal memuat grafik.</div>`);
    }
    

     // DataTable: destroy jika sudah ada
    if ($.fn.DataTable.isDataTable('#daily-data-table')) {
        $('#daily-data-table').DataTable().destroy();
    }



    // DataTable: inisialisasi ulang
    return $('#daily-data-table').DataTable({
        data: tableData,
        columns: [
            { title: 'No', data: 'NO' },
            { title: 'Kebun', data: 'Kebun' },
            { title: 'Budget Harian', data: 'Budget_Harian', className: 'text-end', render: $.fn.dataTable.render.number('.', ',', 0, '', ' Kg') },
            { title: 'Realisasi PKS Harian', data: 'Realisasi_PKS_Harian', className: 'text-end fw-bold', render: $.fn.dataTable.render.number('.', ',', 0, '', ' Kg') },
            { title: 'Refraksi (Kg)', data: 'Refraksi_Kg', className: 'text-end' },
            { title: 'Refraksi (%)', data: 'Refraksi_Persen', className: 'text-end' },
            { title: 'BJR Hari Ini', data: 'BJR_Hari_Ini', className: 'text-end' },
            { title: 'ACV Prod Harian', data: 'ACV_Prod_Harian', className: 'text-end', render: function(data) { return data.toFixed(2) + ' %'; } },
            // --- Kolom tersembunyi (bisa di-colvis) ---
            { title: 'Tanggal', data: 'Tanggal' },
            { title: 'Divisi', data: 'Divisi' },
            { title: 'AKP Panen', data: 'AKP_Panen' },
            { title: 'TK Panen', data: 'TK_Panen' },
            { title: 'Luas Panen', data: 'Luas_Panen' },
            { title: 'JJG Panen', data: 'JJG_Panen' },
            { title: 'JJG Kirim', data: 'JJG_Kirim' },
            { title: 'Ketrek', data: 'Ketrek' },
            { title: 'Total JJG Kirim', data: 'Total_JJG_Kirim' },
            { title: 'Tonase Panen (Kg)', data: 'Tonase_Panen_Kg' },
            { title: 'Restant Jjg', data: 'Restant_Jjg' },
            { title: 'Output Kg/HK', data: 'Output_Kg_HK' },
            { title: 'Output Ha/HK', data: 'Output_Ha_HK' },
            { title: 'Timbang Kebun', data: 'Timbang_Kebun' }
        ],
        responsive: true,
        dom: "Bfrtip",
        buttons: ['copy', 'csv', 'excel', 'pdf', 'print', { extend: 'colvis', text: 'Pilih Kolom' }],
        language: { url: '//cdn.datatables.net/plug-ins/2.0.8/i18n/id.json' },
        columnDefs: [
            { visible: false, targets: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21] }
        ],
        createdRow: function(row, data) {
            // Pewarnaan berdasarkan ACV Prod Harian
            const acvCell = $('td', row).eq(7);
            const acvValue = parseFloat(data.ACV_Prod_Harian);
            if (!isNaN(acvValue)) {
                if (acvValue >= 100) {
                    acvCell.addClass('acv-good');
                } else if (acvValue >= 80) {
                    acvCell.addClass('acv-warning');
                } else {
                    acvCell.addClass('acv-bad');
                }
            }
        }
    });
}


    
// --- FUNGSI BARU UNTUK PIVOT CHART ---
export function renderPivotChart(tableData, groupBy, metric, chartType) {
    const metricTitle = metric.replace(/_/g, ' ');
    const groupByTitle = groupBy.replace(/_/g, ' ');
    const pivotTitle = `Analisis ${metricTitle} per ${groupByTitle}`;
    
    try {
        const aggregatedData = tableData.reduce((acc, row) => {
            const groupKey = (groupBy === 'Tanggal') ? moment(row[groupBy], "DD MMM YYYY").format("D MMM") : (row[groupBy] || 'Lainnya');
            const value = parseFloat(row[metric]) || 0;
            if (!acc[groupKey]) acc[groupKey] = 0;
            acc[groupKey] += value;
            return acc;
        }, {});

        const chartDataArray = [[groupByTitle, metricTitle, { role: 'style' }]];
        const colors = ['#4285F4', '#DB4437', '#F4B400', '#0F9D58', '#AB47BC', '#00ACC1', '#FF7043', '#9E9D24'];
        let colorIndex = 0;
        for (const key in aggregatedData) {
            chartDataArray.push([key, aggregatedData[key], colors[colorIndex % colors.length]]);
            colorIndex++;
        }

        if (chartDataArray.length <= 1) throw new Error("Data tidak cukup untuk diagregasi.");

        const chartData = google.visualization.arrayToDataTable(chartDataArray);
        let chart;
        const options = { title: pivotTitle, height: 350, chartArea: { width: '80%', height: '70%' }, legend: { position: 'none' } };
        const chartContainer = document.getElementById('daily-pivot-chart');

        if (chartType === 'line') chart = new google.visualization.LineChart(chartContainer);
        else if (chartType === 'pie') chart = new google.visualization.PieChart(chartContainer);
        else chart = new google.visualization.ColumnChart(chartContainer);
        
        chart.draw(chartData, options);
    } catch (e) {
        console.error("Gagal membuat pivot chart:", e);
        $('#daily-pivot-chart').html(`<div class="alert alert-warning">Gagal memuat pivot chart: ${e.message}</div>`);
    }
}


export function renderMonthlyDashboard(data, monthlyTable) {
    const monthlyDashboardContent = $('#monthly-dashboard-content');
    monthlyDashboardContent.empty().hide();

    if (!data || data.isEmpty) {
        showAlert(data.message || 'Tidak ada data.', 'warning');
        if (monthlyTable) monthlyTable.clear().draw();
        return;
    }

    
    monthlyDashboardContent.html(kpiHtml + chartHtml + tableHtml).show();

    try {
        const chartData = google.visualization.arrayToDataTable([['Metrik', 'Nilai (Kg)'], ['Realisasi PKS', data.realisasi_vs_budget.realisasi], ['Budget Bulanan', data.realisasi_vs_budget.budget]]);
        new google.visualization.ColumnChart(document.getElementById('monthly-chart-div')).draw(chartData, { title: 'Realisasi Bulanan vs Budget (Kg)' });
    } catch(e) { $('#monthly-chart-div').html(`<div class="alert alert-warning">Gagal memuat grafik.</div>`); }

    if (monthlyTable) monthlyTable.destroy();
    
    const columns = data.summary_table.length > 0 ? Object.keys(data.summary_table[0]).map(key => ({ title: key, data: key })) : [];
    return $('#monthly-data-table').DataTable({ 
        data: data.summary_table, 
        columns: columns, 
        responsive: true, 
        dom: "Bfrtip", 
        buttons: ['excel', 'pdf', 'print'] 
    });
}
