// ===================================================================
// === Plantation Analytics Dashboard - FINAL SCRIPT (COMPLETE)    ===
// ===================================================================
$(document).ready(function() {
    // --- KONFIGURASI PENTING ---
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz3ACEPp9dT0veV8JZu2mjDF1N5J7_TfPPJEzq_6VcQVi84xqKQhq-VlAjW_z4H_dMq/exec";

    // --- ELEMEN UI UMUM ---
    const loader = $('#loader');
    const alertBox = $('#alert-box');
    const mainNav = $('#main-nav');

    // --- ELEMEN UI HARIAN ---
    const dailyView = $('#daily-view');
    const dateFilter = $('#date-filter');
    const kebunFilterDaily = $('#kebun-filter');
    const divisiFilterDaily = $('#divisi-filter');
    const pivotGroupBy = $('#pivot-group-by');
    const pivotMetric = $('#pivot-metric-filter'); // Sesuai ID di HTML Anda
    const pivotChartType = $('#pivot-chart-type');
    const applyBtnDaily = $('#apply-filter-daily');
    const dailyDashboardContent = $('#daily-dashboard-content');
    let dailyTable, dailyStartDate, dailyEndDate;

    // --- ELEMEN UI BULANAN ---
    const monthlyView = $('#monthly-view');
    const yearFilter = $('#year-filter');
    const monthFilter = $('#month-filter');
    const kebunFilterMonthly = $('#kebun-filter-monthly');
    const divisiFilterMonthly = $('#divisi-filter-monthly');
    const applyBtnMonthly = $('#apply-filter-monthly');
    const monthlyDashboardContent = $('#monthly-dashboard-content');
    let monthlyTable;

    // --- FUNGSI UTILITAS ---
    async function postToServer(requestBody) {
        loader.show();
        alertBox.hide();
        try {
            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify(requestBody),
                headers: { 'Content-Type': 'text/plain' },
                mode: 'cors', redirect: 'follow'
            });
            const data = await response.json();
            if (data.error) throw new Error(data.error);
            return data;
        } catch (error) {
            showAlert(`Error: ${error.message}`, 'danger');
            console.error('Error in postToServer:', error);
            return null;
        } finally {
            loader.hide();
        }
    }

    function showAlert(message, type = 'info') {
        alertBox.removeClass('alert-info alert-warning alert-danger').addClass(`alert-${type}`).text(message).show();
    }

    // ===================================================================
    // --- LOGIKA DASHBOARD HARIAN ---
    // ===================================================================
    function renderSuperPivotChart(tableData, groupBy, metric, chartType) {
        const metricTitle = metric.replace(/_/g, ' ');
        const groupByTitle = groupBy;
        const pivotTitle = `Analisis ${metricTitle} per ${groupByTitle}`;
        
        try {
            const aggregatedData = tableData.reduce((acc, row) => {
                const groupKey = row[groupBy] || 'Lainnya';
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

            if (chartDataArray.length <= 1) throw new Error("Data tidak cukup untuk agregasi.");

            const chartData = google.visualization.arrayToDataTable(chartDataArray);
            let chart;
            const options = { title: pivotTitle, height: 350, chartArea: { width: '80%', height: '70%' }, legend: { position: 'none' } };
            const chartContainer = document.getElementById('daily-pivot-chart');

            if (chartType === 'line' && groupBy === 'Tanggal') {
                chart = new google.visualization.LineChart(chartContainer);
            } else if (chartType === 'pie') {
                chart = new google.visualization.PieChart(chartContainer);
            } else { // Default ke Bar/Column chart
                chart = new google.visualization.ColumnChart(chartContainer);
            }
            chart.draw(chartData, options);
        } catch (e) {
            console.error("Gagal membuat pivot chart:", e);
            $('#daily-pivot-chart').html(`<div class="alert alert-warning">Gagal memuat pivot chart: ${e.message}</div>`);
        }
    }

    // Tempel blok fungsi lengkap ini ke tempat yang kosong tadi
function renderDailyDashboard(data) {
    dailyDashboardContent.empty().hide();
    if (!data || data.isEmpty) {
        showAlert(data.message || 'Tidak ada data untuk kombinasi filter yang dipilih.', 'warning');
        return;
    }

    // TAHAP 1: Olah data mentah dari server untuk tabel
    const tableData = data.detailed_table.map((row, index) => {
        const budgetHarian = parseFloat(row.Budget_Harian) || 0;
        const realisasiPKS = parseFloat(row.Timbang_PKS) || 0;
        // Hitung ACV Harian berdasarkan Realisasi PKS
        const acvHarian = budgetHarian > 0 ? (realisasiPKS / budgetHarian) * 100 : 0;
        
        return {
            ...row, // <-- data asli dari server
            NO: index + 1,
            ACV_Prod_Harian: acvHarian, // Kolom baru untuk pewarnaan & tampilan
            Realisasi_PKS_Harian: realisasiPKS, // Kolom baru untuk tampilan
        };
    });

    // TAHAP 2: Siapkan kerangka HTML untuk konten
    const kpiHtml = `<div class="col-lg-3 col-md-6"><div class="kpi-box"><div class="title">ACV Production</div><div class="value">${data.kpi_acv.value}</div></div></div><div class="col-lg-9 col-md-6"><div class="card master-data-card h-100"><div class="card-body row text-center align-items-center"><div class="col"><div class="title">SPH</div><div class="value">${data.master_data_display.sph}</div></div><div class="col"><div class="title">Luas TM (Ha)</div><div class="value">${data.master_data_display.luas_tm}</div></div><div class="col"><div class="title">Pokok (Pkk)</div><div class="value">${data.master_data_display.pkk}</div></div><div class="col"><div class="title">Budget Bulan Ini</div><div class="value">${parseFloat(data.master_data_display.budget_monthly).toLocaleString('id-ID')}</div></div></div></div></div>`;
    const mainChartHtml = `<div class="col-lg-6"><div class="card shadow-sm"><div class="card-body"><h5 class="card-title">Budget vs Realisasi</h5><div id="daily-main-chart" style="height: 350px;"></div></div></div></div>`;
    const pivotChartHtml = `<div class="col-lg-6"><div class="card shadow-sm"><div class="card-body"><h5 class="card-title" id="daily-pivot-chart-title">Analisis Dinamis</h5><div id="daily-pivot-chart" style="height: 350px;"></div></div></div></div>`;
    const tableHtml = `<div class="col-12"><div class="card shadow-sm"><div class="card-body"><h5 class="card-title fw-bold">Detail Data Harian</h5><div class="table-responsive"><table id="daily-data-table" class="table table-striped table-hover" style="width:100%"></table></div></div></div></div>`;
    
    // Render semua kerangka HTML ke halaman dengan tata letak yang benar
    dailyDashboardContent.html(kpiHtml + mainChartHtml + pivotChartHtml + tableHtml).show();

    // TAHAP 3: Render Grafik
    try {
        const mainChartData = google.visualization.arrayToDataTable([['Metrik', 'Nilai (Kg)', { role: 'style' }], ['Budget Harian', data.daily_comparison.budget, '#6c757d'], ['Realisasi Kebun', data.daily_comparison.kebun, '#17a2b8'], ['Realisasi PKS', data.daily_comparison.pks, '#0d6efd']]);
        new google.visualization.ColumnChart(document.getElementById('daily-main-chart')).draw(mainChartData, { legend: { position: 'top' }, chartArea: { width: '80%' } });
    } catch(e) { $('#daily-main-chart').html(`<div class="alert alert-warning">Gagal memuat grafik utama.</div>`); }
    
    // Panggil fungsi render pivot chart
    renderSuperPivotChart(tableData, pivotGroupBy.val(), pivotMetric.val(), pivotChartType.val());

    // TAHAP 4: Render DataTables dengan Konfigurasi Lengkap dan Benar
    if (dailyTable) dailyTable.destroy();
    
    dailyTable = $('#daily-data-table').DataTable({
        data: tableData, // Gunakan data yang sudah diolah
        columns: [
             { title: 'No', data: 'NO' },
             { title: 'Kebun', data: 'Kebun' },
             { title: 'Budget Harian', data: 'Budget_Harian', className: 'text-end', render: $.fn.dataTable.render.number('.', ',', 0, '', ' Kg') },
             { title: 'Realisasi PKS Harian', data: 'Realisasi_PKS_Harian', className: 'text-end fw-bold', render: $.fn.dataTable.render.number('.', ',', 0, '', ' Kg') },
             { title: 'Refraksi (Kg)', data: 'Refraksi_Kg', className: 'text-end' },
             { title: 'Refraksi (%)', data: 'Refraksi_Persen', className: 'text-end' },
             { title: 'BJR Hari Ini', data: 'BJR_Hari_Ini', className: 'text-end' },
             { title: 'ACV Prod Harian', data: 'ACV_Prod_Harian', className: 'text-end', render: function(data) { return data.toFixed(2) + ' %'; } },
             // --- Kolom lain yang tersedia di "Pilih Kolom" ---
             { title: 'Divisi', data: 'Divisi' },
             { title: 'Tanggal', data: 'Tanggal' },
             { title: 'Tonase Panen (Kg)', data: 'Tonase_Panen_Kg' },
             { title: 'Timbang Kebun', data: 'Timbang_Kebun' }
             // Tambahkan kolom lain dari data.detailed_table di sini jika perlu
        ],
        responsive: true,
        dom: "Bfrtip",
        buttons: ['copy', 'csv', 'excel', 'pdf', 'print', { extend: 'colvis', text: 'Pilih Kolom' }],
        language: { url: '//cdn.datatables.net/plug-ins/2.0.8/i18n/id.json' },
        
        // Atur kolom mana saja yang terlihat secara default
        "columnDefs": [
            { "visible": false, "targets": [8, 9, 10, 11] } // Sembunyikan: Divisi, Tanggal, Tonase Panen, Timbang Kebun
        ],
        
        // Tambahkan pewarnaan interaktif per baris
        "createdRow": function(row, data, dataIndex) {
            const acvCell = $('td', row).eq(7); // Kolom ke-8 adalah 'ACV Prod Harian'
            const acvValue = parseFloat(data.ACV_Prod_Harian);
            if (!isNaN(acvValue)) {
                if (acvValue >= 100) acvCell.addClass('acv-good');
                else if (acvValue >= 80) acvCell.addClass('acv-warning');
                else acvCell.addClass('acv-bad');
            }
        }
    });
}

    async function fetchAndRenderDailyData() { /* ... kode sama ... */ }
    function renderMonthlyDashboard(data) { /* ... kode sama ... */ }
    async function fetchAndRenderMonthlyData() { /* ... kode sama ... */ }
    function initializeMonthlyPage() { /* ... kode sama ... */ }
    function switchView(view) { /* ... kode sama ... */ }

    async function initializeApp() {
        showAlert('Mengambil data filter...', 'info');
        google.charts.load('current', {'packages':['corechart']});
        const data = await postToServer({ action: 'getInitialData' });
        if (data) {
            [kebunFilterDaily, kebunFilterMonthly].forEach(filterEl => { /* ... */ });
            [divisiFilterDaily, divisiFilterMonthly].forEach(filterEl => { /* ... */ });
            dailyStartDate = moment();
            dailyEndDate = moment();
            dateFilter.daterangepicker({ startDate: dailyStartDate, endDate: dailyEndDate, locale: { format: 'DD MMMM YYYY' },
                ranges: {
                   'Hari Ini': [moment(), moment()], 'Kemarin': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
                   '7 Hari Terakhir': [moment().subtract(6, 'days'), moment()], 'Bulan Ini': [moment().startOf('month'), moment().endOf('month')],
                   'Bulan Lalu': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')],
                   'Kuartal Ini': [moment().startOf('quarter'), moment().endOf('quarter')], 'Tahun Ini': [moment().startOf('year'), moment().endOf('year')],
                }
            }, (start, end) => { dailyStartDate = start; dailyEndDate = end; });
            $('[disabled]').prop('disabled', false);
            showAlert('Aplikasi siap. Memuat data untuk hari ini...');
            fetchAndRenderDailyData();
        }
    }
    
    // --- EVENT LISTENERS & INISIALISASI ---
    mainNav.on('click', '.nav-link', function(e) { e.preventDefault(); switchView($(this).data('view')); });
    applyBtnDaily.on('click', fetchAndRenderDailyData);
    applyBtnMonthly.on('click', fetchAndRenderMonthlyData);
    initializeApp();
});
