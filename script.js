$(document).ready(function() {
    // --- KONFIGURASI PENTING ---
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
    const pivotMetricFilter = $('#pivot-metric-filter');
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
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                mode: 'cors',
                redirect: 'follow'
            });
            // Selalu parse respons sebagai JSON, karena server kita selalu mengirim JSON
            const data = await response.json();
            // Jika ada properti 'error' di dalam JSON, lemparkan sebagai error
            if (data.error) {
                throw new Error(data.error);
            }
            return data;
        } catch (error) {
            showAlert(`Error fetching data: ${error.message}`, 'danger');
            console.error('Error in postToServer:', error);
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
    function renderDailyDashboard(data) {
        dailyDashboardContent.empty().hide();
        if (!data || data.isEmpty) {
            showAlert(data ? data.message : 'Tidak ada data untuk kombinasi filter yang dipilih.', 'warning');
            return;
        }
        
        const kpiHtml = `<div class="col-lg-3 col-md-6"><div class="kpi-box"><div class="title">ACV Production</div><div class="value">${data.kpi_acv.value}</div></div></div><div class="col-lg-9 col-md-6"><div class="card master-data-card h-100"><div class="card-body row text-center align-items-center"><div class="col"><div class="title">SPH</div><div class="value">${data.master_data_display.sph}</div></div><div class="col"><div class="title">Luas TM (Ha)</div><div class="value">${data.master_data_display.luas_tm}</div></div><div class="col"><div class="title">Pokok (Pkk)</div><div class="value">${data.master_data_display.pkk}</div></div><div class="col"><div class="title">Budget Bulan Ini</div><div class="value">${parseFloat(data.master_data_display.budget_monthly).toLocaleString('id-ID')}</div></div></div></div></div>`;
        const mainChartHtml = `<div class="col-lg-6"><div class="card shadow-sm"><div class="card-body"><div id="daily-main-chart" style="height: 350px;"></div></div></div></div>`;
        const pivotChartHtml = `<div class="col-lg-6"><div class="card shadow-sm"><div class="card-body"><div id="daily-pivot-chart" style="height: 350px;"></div></div></div></div>`;
        const tableHtml = `<div class="col-12"><div class="card shadow-sm"><div class="card-body"><h5 class="card-title fw-bold">Detail Data Harian</h5><table id="daily-data-table" class="table table-striped table-bordered" style="width:100%"></table></div></div></div>`;
        
        dailyDashboardContent.html(kpiHtml + mainChartHtml + pivotChartHtml + tableHtml).show();

        try {
            const mainChartData = google.visualization.arrayToDataTable([['Metrik', 'Nilai (Kg)', { role: 'style' }], ['Budget Harian', data.daily_comparison.budget, '#6c757d'], ['Realisasi Kebun', data.daily_comparison.kebun, '#17a2b8'], ['Realisasi PKS', data.daily_comparison.pks, '#0d6efd']]);
            new google.visualization.ColumnChart(document.getElementById('daily-main-chart')).draw(mainChartData, { title: 'Budget Harian vs Realisasi (Kg)', legend: { position: 'top' }, chartArea: { width: '80%' } });
        } catch(e) { $('#daily-main-chart').html(`<div class="alert alert-warning">Gagal memuat grafik utama. Error: ${e.message}</div>`); }
        
        try {
            const metricY = pivotMetricFilter.val();
            const metricYTitle = pivotMetricFilter.find('option:selected').text();
            const pivotChartDataArray = [['Tanggal', metricYTitle]];
            data.detailed_table.forEach(row => {
                const dateObj = moment(row['Tanggal'], "DD MMM YYYY", 'id').toDate();
                const valueY = parseFloat(row[metricY]) || 0;
                pivotChartDataArray.push([dateObj, valueY]);
            });
            const pivotChartData = google.visualization.arrayToDataTable(pivotChartDataArray);
            new google.visualization.LineChart(document.getElementById('daily-pivot-chart')).draw(pivotChartData, { title: `${metricYTitle} vs Tanggal`, hAxis: { title: 'Tanggal', format: 'd MMM' }, vAxis: { title: metricYTitle }, legend: { position: 'none' }, pointSize: 5, series: { 0: { color: '#dc3545' } } });
        } catch(e) { $('#daily-pivot-chart').html(`<div class="alert alert-warning">Gagal memuat pivot chart. Error: ${e.message}</div>`); }

        if (dailyTable) dailyTable.destroy();
        const columns = data.detailed_table.length > 0 ? Object.keys(data.detailed_table[0]).map(key => ({ title: key.replace(/_/g, ' '), data: key })) : [];
        dailyTable = $('#daily-data-table').DataTable({ data: data.detailed_table, columns: columns, responsive: true, dom: "Bfrtip", buttons: ['copy', 'csv', 'excel', 'pdf', 'print', { extend: 'colvis', text: 'Pilih Kolom' }], language: { url: '//cdn.datatables.net/plug-ins/2.0.8/i18n/id.json' }});
    }

    async function fetchAndRenderDailyData() {
        const filters = { startDate: dailyStartDate.startOf('day').toISOString(), endDate: dailyEndDate.endOf('day').toISOString(), kebun: kebunFilterDaily.val(), divisi: divisiFilterDaily.val() };
        const data = await postToServer({ action: 'getDashboardData', filters: filters });
        if (data) renderDailyDashboard(data);
    }
    
    // ===================================================================
    // --- LOGIKA DASHBOARD BULANAN ---
    // ===================================================================
    function renderMonthlyDashboard(data) {
        monthlyDashboardContent.empty().hide();
        if (!data || data.isEmpty) {
            showAlert(data ? data.message : 'Tidak ada data.', 'warning');
            return;
        }

        const kpiHtml = `<div class="col-md-4"><div class="kpi-box"><div class="title">ACV Produksi Bulanan</div><div class="value">${data.kpi.acv_monthly}</div></div></div><div class="col-md-4"><div class="kpi-box"><div class="title">Total Tonase (PKS)</div><div class="value">${data.kpi.total_tonase_pks} <small>Kg</small></div></div></div><div class="col-md-4"><div class="kpi-box"><div class="title">Total Janjang Terkirim</div><div class="value">${data.kpi.total_jjg}</div></div></div>`;
        const chartHtml = `<div class="col-12"><div class="card shadow-sm"><div class="card-body"><div id="monthly-chart-div" style="height: 350px;"></div></div></div></div>`;
        const tableHtml = `<div class="col-12"><div class="card shadow-sm"><div class="card-body"><h5 class="card-title fw-bold">Ringkasan Data Bulanan</h5><table id="monthly-data-table" class="table table-striped" style="width:100%"></table></div></div></div>`;
        
        monthlyDashboardContent.html(kpiHtml + chartHtml + tableHtml).show();

        try {
            const chartData = google.visualization.arrayToDataTable([['Metrik', 'Nilai (Kg)'], ['Realisasi PKS', data.realisasi_vs_budget.realisasi], ['Budget Bulanan', data.realisasi_vs_budget.budget]]);
            new google.visualization.ColumnChart(document.getElementById('monthly-chart-div')).draw(chartData, { title: 'Realisasi Bulanan vs Budget (Kg)' });
        } catch(e) { $('#monthly-chart-div').html(`<div class="alert alert-warning">Gagal memuat grafik. Error: ${e.message}</div>`); }

        if (monthlyTable) monthlyTable.destroy();
        const columns = data.summary_table.length > 0 ? Object.keys(data.summary_table[0]).map(key => ({ title: key, data: key })) : [];
        monthlyTable = $('#monthly-data-table').DataTable({ data: data.summary_table, columns: columns, responsive: true, dom: "Bfrtip", buttons: ['excel', 'pdf', 'print'] });
    }

    async function fetchAndRenderMonthlyData() {
        const filters = {
            year: yearFilter.val(),
            month: monthFilter.val(),
            kebun: kebunFilterMonthly.val(),
            divisi: divisiFilterMonthly.val()
        };
        // ===== INI BAGIAN YANG DIPERBAIKI =====
        const data = await postToServer({ action: 'getMonthlyData', filters: filters });
        if (data) renderMonthlyDashboard(data);
    }

    function initializeMonthlyPage() {
        const currentYear = new Date().getFullYear();
        if (yearFilter.children().length === 0) {
            for (let i = currentYear; i >= currentYear - 5; i--) { yearFilter.append($('<option>', { value: i, text: i })); }
            for (let i = 1; i <= 12; i++) { monthFilter.append($('<option>', { value: i, text: moment.months(i - 1) })); }
        }
        monthFilter.val(new Date().getMonth() + 1);
    }

    // ===================================================================
    // --- MANAJEMEN VIEW & INISIALISASI AWAL ---
    // ===================================================================
    function switchView(view) {
        mainNav.find('.nav-link').removeClass('active');
        mainNav.find(`[data-view="${view}"]`).addClass('active');
        alertBox.hide();
        if (view === 'daily') {
            monthlyView.hide();
            dailyView.show();
        } else {
            dailyView.hide();
            monthlyView.show();
            initializeMonthlyPage();
        }
    }

    mainNav.on('click', '.nav-link', function(e) { e.preventDefault(); switchView($(this).data('view')); });
    
    async function initializeApp() {
        showAlert('Mengambil data filter...', 'info');
        google.charts.load('current', {'packages':['corechart']});

        const data = await postToServer({ action: 'getInitialData' });
        if (data) {
            [kebunFilterDaily, kebunFilterMonthly].forEach(filterEl => {
                filterEl.empty().append($('<option>', { text: 'SEMUA KEBUN' }));
                data.kebun.forEach(item => filterEl.append($('<option>', { value: item, text: item })));
            });
            [divisiFilterDaily, divisiFilterMonthly].forEach(filterEl => {
                filterEl.empty().append($('<option>', { text: 'SEMUA DIVISI' }));
                data.divisi.forEach(item => filterEl.append($('<option>', { value: item, text: item })));
            });
            
            dailyStartDate = moment().startOf('month');
            dailyEndDate = moment();
            dateFilter.daterangepicker({ startDate: dailyStartDate, endDate: dailyEndDate, locale: { format: 'DD MMMM YYYY' }, ranges: { 'Hari Ini': [moment(), moment()], 'Bulan Ini': [moment().startOf('month'), moment().endOf('month')], 'Bulan Lalu': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')] } }, (start, end) => { dailyStartDate = start; dailyEndDate = end; });
            
            $('[disabled]').prop('disabled', false);
            showAlert('Aplikasi siap. Silakan pilih filter.');
        }
    }
    
    // Event Listeners
    applyBtnDaily.on('click', fetchAndRenderDailyData);
    applyBtnMonthly.on('click', fetchAndRenderMonthlyData);

    // Mulai Aplikasi
    initializeApp();
});
