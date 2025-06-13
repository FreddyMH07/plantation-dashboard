// File: js/ui.js
// Tugas: Membangun dan memperbarui semua elemen di halaman.

export function showAlert(message, type = 'info') {
    $('#alert-box').removeClass('alert-info alert-warning alert-danger').addClass(`alert-${type}`).text(message).show();
}

export function renderDailyDashboard(data, dailyTable) {
    const dailyDashboardContent = $('#daily-dashboard-content');
    dailyDashboardContent.empty().hide();

    if (!data || data.isEmpty) {
        showAlert(data.message || 'Tidak ada data.', 'warning');
        if (dailyTable) dailyTable.clear().draw();
        return;
    }

    const tableData = data.detailed_table.map((row, index) => {
        const budgetHarian = parseFloat(row.Budget_Harian) || 0;
        const realisasiPKS = parseFloat(row.Timbang_PKS) || 0;
        const acvHarian = budgetHarian > 0 ? (realisasiPKS / budgetHarian) * 100 : 0;
        return { ...row, NO: index + 1, ACV_Prod_Harian: acvHarian };
    });

    // PERBAIKAN: Menggunakan backtick `` ` `` untuk string HTML
    const kpiHtml = `
        <div class="col-lg-3 col-md-6"><div class="kpi-box"><div class="title">ACV Production</div><div class="value"><span class="math-inline">\{data\.kpi\_acv\.value\}</div\></div\></div\>
<div class\="col\-lg\-9 col\-md\-6"\><div class\="card master\-data\-card h\-100"\><div class\="card\-body row text\-center align\-items\-center"\>
<div class\="col"\><div class\="title"\>SPH</div\><div class\="value"\></span>{data.master_data_display.sph}</div></div>
            <div class="col"><div class="title">Luas TM (Ha)</div><div class="value"><span class="math-inline">\{data\.master\_data\_display\.luas\_tm\}</div\></div\>
<div class\="col"\><div class\="title"\>Pokok \(Pkk\)</div\><div class\="value"\></span>{data.master_data_display.pkk}</div></div>
            <div class="col"><div class="title">Budget Bulan Ini</div><div class="value">${parseFloat(data.master_data_display.budget_monthly).toLocaleString('id-ID')}</div></div>
        </div></div></div>`;
    
    const mainChartHtml = `<div class="col-lg-6"><div class="card shadow-sm"><div class="card-body"><h5 class="card-title">Budget vs Realisasi</h5><div id="daily-main-chart" style="height: 350px;"></div></div></div></div>`;
    const pivotChartHtml = `<div class="col-lg-6"><div class="card shadow-sm"><div class="card-body"><h5 class="card-title" id="daily-pivot-chart-title">Analisis Dinamis</h5><div id="daily-pivot-chart" style="height: 350px;"></div></div></div></div>`;
    const tableHtml = `<div class="col-12"><div class="card shadow-sm"><div class="card-body"><h5 class="card-title fw-bold">Detail Data Harian</h5><div class="table-responsive"><table id="daily-data-table" class="table table-striped table-hover" style="width:100%"></table></div></div></div></div>`;
    
    dailyDashboardContent.html(kpiHtml + tableHtml + mainChartHtml + pivotChartHtml).show();

    try {
        const mainChartData = google.visualization.arrayToDataTable([['Metrik', 'Nilai (Kg)', { role: 'style' }], ['Budget Harian', data.daily_comparison.budget, '#6c757d'], ['Realisasi Kebun', data.daily_comparison.kebun, '#17a2b8'], ['Realisasi PKS', data.daily_comparison.pks, '#0d6efd']]);
        new google.visualization.ColumnChart(document.getElementById('daily-main-chart')).draw(mainChartData, { legend: { position: 'top' }, chartArea: { width: '85%' } });
    } catch(e) { $('#daily-main-chart').html(`<div class="alert alert-warning">Gagal memuat grafik.</div>`); }
    
    // Inisialisasi DataTables
    if (dailyTable) dailyTable.destroy();
    const columns = [
        { title: 'No', data: 'NO', width: '5%' }, { title: 'Kebun', data: 'Kebun' },
        { title: 'Budget Harian', data: 'Budget_Harian', className: 'text-end', render: $.fn.dataTable.render.number('.', ',', 0, '', ' Kg') },
        { title: 'Realisasi PKS Harian', data: 'Timbang_PKS', className: 'text-end fw-bold', render: $.fn.dataTable.render.number('.', ',', 0, '', ' Kg') },
        { title: 'Refraksi (Kg)', data: 'Refraksi_Kg', className: 'text-end' }, { title: 'Refraksi (%)', data: 'Refraksi_Persen', className: 'text-end' },
        { title: 'BJR Hari Ini', data: 'BJR_Hari_Ini', className: 'text-end' },
        { title: 'ACV Prod Harian', data: 'ACV_Prod_Harian', className: 'text-end', render: data => data.toFixed(2) + ' %' },
        { title: 'Divisi', data: 'Divisi' }, { title: 'Tanggal', data: 'Tanggal' }, { title: 'Tonase Panen (Kg)', data: 'Tonase_Panen_Kg' }
    ];

    return $('#daily-data-table').DataTable({
        data: tableData, columns: columns, responsive: true, dom: "Bfrtip",
        buttons: ['copy', 'csv', 'excel', 'pdf', 'print', { extend: 'colvis', text: 'Pilih Kolom' }],
        language: { url: '//cdn.datatables.net/plug-ins/2.0.8/i18n/id.json' },
        columnDefs: [ { "visible": false, "targets": [8, 9, 10] } ],
        createdRow: function(row, data) {
            const acvCell = $('td', row).eq(7);
            const acvValue = parseFloat(data.ACV_Prod_Harian);
            if (!isNaN(acvValue)) {
                if (acvValue >= 100) acvCell.addClass('acv-good');
                else if (acvValue >= 80) acvCell.addClass('acv-warning');
                else acvCell.addClass('acv-bad');
            }
        }
    });
}

// FUNGSI BARU UNTUK MERENDER DASHBOARD BULANAN
export function renderMonthlyDashboard(data, monthlyTable) {
    const monthlyDashboardContent = $('#monthly-dashboard-content');
    monthlyDashboardContent.empty().hide();

    if (!data || data.isEmpty) {
        showAlert(data.message || 'Tidak ada data.', 'warning');
        if (monthlyTable) monthlyTable.clear().draw();
        return;
    }

    const kpiHtml = `<div class="col-md-4"><div class="kpi-box"><div class="title">ACV Produksi Bulanan</div><div class="value"><span class="math-inline">\{data\.kpi\.acv\_monthly\}</div\></div\></div\><div class\="col\-md\-4"\><div class\="kpi\-box"\><div class\="title"\>Total Tonase \(PKS\)</div\><div class\="value"\></span>{data.kpi.total_tonase_pks} <small>Kg</small></div></div></div><div class="col-md-4"><div class="kpi-box"><div class="title">Total Janjang Terkirim</div><div class="value">${data.kpi.total_jjg}</div></div></div>`;
    const chartHtml = `<div class="col-12"><div class="card shadow-sm"><div class="card-body"><div id="monthly-chart-div" style="height: 350px;"></div></div></div></div>`;
    const tableHtml = `<div class="col-12"><div class="card shadow-sm"><div class="card-body"><h5 class="card-title fw-bold">Ringkasan Data Bulanan</h5><div class="table-responsive"><table id="monthly-data-table" class="table table-striped" style="width:100%"></table></div></div></div></div>`;
    
    monthlyDashboardContent.html(kpiHtml + chartHtml + tableHtml).show();

    try {
        const chartData = google.visualization.arrayToDataTable([['Metrik', 'Nilai (Kg)'], ['Realisasi PKS', data.realisasi_vs_budget.realisasi], ['Budget Bulanan', data.realisasi_vs_budget.budget]]);
        new google.visualization.ColumnChart(document.getElementById('monthly-chart-div')).draw(chartData, { title: 'Realisasi Bulanan vs Budget (Kg)' });
    } catch(e) { $('#monthly-chart-div').html(`<div class="alert alert-warning">Gagal memuat grafik.</div>`); }

    if (monthlyTable) monthlyTable.destroy();
    
    const columns = data.summary_table.length > 0 ? Object.keys(data.summary_table[0]).map(key => ({ title: key, data: key })) : [];
    return $('#monthly-data-table').DataTable({ data: data.summary_table, columns: columns, responsive: true, dom: "Bfrtip", buttons: ['excel', 'pdf', 'print'] });
}
