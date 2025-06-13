$(document).ready(function() {
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzwVP2V-I73WqIkKaTQmWkb40Qhf_xJKjxMGEK2AqISjhG4ii-R9fvWtKgWGVgxRDk6/exec";

    // --- ELEMEN UI UMUM ---
    const loader = $('#loader');
    const alertBox = $('#alert-box');
    const mainNav = $('#main-nav');

    // --- ELEMEN UI HARIAN ---
    const dailyView = $('#daily-view');
    const dateFilter = $('#date-filter');
    const kebunFilterDaily = $('#kebun-filter');
    const divisiFilterDaily = $('#divisi-filter');
    const applyBtnDaily = $('#apply-filter-daily');
    const dailyDashboardContent = $('#daily-dashboard-content');
    let dailyTable;
    let dailyStartDate, dailyEndDate;

    // --- ELEMEN UI BULANAN ---
    const monthlyView = $('#monthly-view');
    const yearFilter = $('#year-filter');
    const monthFilter = $('#month-filter');
    const kebunFilterMonthly = $('#kebun-filter-monthly');
    const applyBtnMonthly = $('#apply-filter-monthly');
    const monthlyDashboardContent = $('#monthly-dashboard-content');

    // --- FUNGSI UTILITAS ---
    async function postToServer(requestBody) { /* ... sama seperti sebelumnya ... */ }
    function showAlert(message, type = 'info') { /* ... sama seperti sebelumnya ... */ }
    
    // ===================================================================
    // --- LOGIKA UNTUK DASHBOARD HARIAN ---
    // ===================================================================
    function renderDailyDashboard(data) { /* ... Fungsi renderDashboard harian Anda yang sudah lengkap ada di sini ... */ }
    async function fetchAndRenderDailyData() {
        const filters = {
            startDate: dailyStartDate.startOf('day').toISOString(),
            endDate: dailyEndDate.endOf('day').toISOString(),
            kebun: kebunFilterDaily.val(),
            divisi: divisiFilterDaily.val()
        };
        const data = await postToServer({ action: 'getDashboardData', filters: filters });
        // renderDailyDashboard(data); // Panggil fungsi render harian
    }

    // ===================================================================
    // --- LOGIKA UNTUK DASHBOARD BULANAN ---
    // ===================================================================
    function renderMonthlyDashboard(data) {
        monthlyDashboardContent.empty().hide();
        if (!data || data.isEmpty) {
            showAlert(data ? data.message : 'Tidak ada data.', 'warning');
            return;
        }

        const kpiHtml = `
            <div class="col-md-4"><div class="kpi-box h-100"><div class="title">ACV Produksi Bulanan</div><div class="value">${data.kpi.acv_monthly}</div></div></div>
            <div class="col-md-4"><div class="kpi-box h-100"><div class="title">Total Tonase (PKS)</div><div class="value">${data.kpi.total_tonase_pks} Kg</div></div></div>
            <div class="col-md-4"><div class="kpi-box h-100"><div class="title">Total Janjang Terkirim</div><div class="value">${data.kpi.total_jjg}</div></div></div>
        `;
        const chartHtml = `<div class="col-12"><div class="card shadow-sm"><div class="card-body"><div id="monthly-chart-div" style="height: 350px;"></div></div></div></div>`;
        const tableHtml = `<div class="col-12"><div class="card shadow-sm"><div class="card-body"><h5 class="card-title fw-bold">Ringkasan Data Bulanan</h5><table id="monthly-data-table" class="table table-striped" style="width:100%"></table></div></div></div>`;
        
        monthlyDashboardContent.html(kpiHtml + chartHtml + tableHtml).show();

        // Gambar Chart Bulanan
        try {
            const chartData = google.visualization.arrayToDataTable([
                ['Metrik', 'Nilai (Kg)'],
                ['Realisasi PKS', data.realisasi_vs_budget.realisasi],
                ['Budget Bulanan', data.realisasi_vs_budget.budget],
            ]);
            const chart = new google.visualization.ColumnChart(document.getElementById('monthly-chart-div'));
            chart.draw(chartData, { title: 'Realisasi Bulanan vs Budget (Kg)' });
        } catch(e) { $('#monthly-chart-div').html('<div class="alert alert-warning">Gagal memuat grafik.</div>'); }

        // Inisialisasi Tabel Bulanan
        $('#monthly-data-table').DataTable({
            data: data.summary_table,
            columns: Object.keys(data.summary_table[0]).map(key => ({ title: key, data: key })),
            responsive: true, dom: "Bfrtip", buttons: ['excel', 'pdf', 'print']
        });
    }

    async function fetchAndRenderMonthlyData() {
        showAlert('Memproses data bulanan...', 'info');
        const filters = {
            year: yearFilter.val(),
            month: monthFilter.val(),
            kebun: kebunFilterMonthly.val()
        };
        const data = await postToServer({ action: 'getMonthlyData', filters: filters });
        renderMonthlyDashboard(data);
    }

    function initializeMonthlyPage() {
        const currentYear = new Date().getFullYear();
        for (let i = currentYear; i >= currentYear - 5; i--) {
            yearFilter.append($('<option>', { value: i, text: i }));
        }
        for (let i = 1; i <= 12; i++) {
            monthFilter.append($('<option>', { value: i, text: moment.months(i - 1) }));
        }
        monthFilter.val(new Date().getMonth() + 1);
    }

    // ===================================================================
    // --- MANAJEMEN VIEW & INISIALISASI AWAL ---
    // ===================================================================
    function switchView(view) {
        $('.nav-link').removeClass('active');
        $(`[data-view="${view}"]`).addClass('active');
        if (view === 'daily') {
            monthlyView.hide(); dailyView.show();
        } else {
            dailyView.hide(); monthlyView.show();
        }
    }

    mainNav.on('click', '.nav-link', function(e) {
        e.preventDefault();
        switchView($(this).data('view'));
    });
    
    async function initializeApp() {
        showAlert('Mengambil data filter...');
        google.charts.load('current', {'packages':['corechart']});
        const data = await postToServer({ action: 'getInitialData' });
        if (data) {
            // ... (Kode inisialisasi filter harian & bulanan) ...
        }
        loader.hide();
    }
    
    // Event Listeners
    applyBtnDaily.on('click', fetchAndRenderDailyData);
    applyBtnMonthly.on('click', fetchAndRenderMonthlyData);

    // Mulai Aplikasi
    // initializeApp();
    // Untuk sementara, kita sederhanakan inisialisasi agar tidak terlalu banyak
    loader.hide();
    alert('Aplikasi siap. Silakan lengkapi logika inisialisasi dan rendering sesuai kebutuhan.');
});
