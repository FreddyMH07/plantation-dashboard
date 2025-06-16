import { postToServer } from './api.js';

$(document).ready(function() {
    // --- ELEMEN UI ---
    const alertBox = $('#alert-box-monthly');
    const yearFilter = $('#year-filter');
    const monthFilter = $('#month-filter');
    const kebunFilter = $('#kebun-filter-monthly');
    const applyBtn = $('#apply-filter-monthly');
    const dashboardContent = $('#monthly-dashboard-content');
    const divisiFilter = $('#divisi-filter-monthly');

    let monthlyTable;

    google.charts.load('current', {'packages':['corechart']});


    //--Untuk Login --
    if (!localStorage.getItem('isLogin')) {
  window.location.href = "login.html";
}

    //--Untuk Logout --
    $(document).ready(function () {
  $('#logout-btn').on('click', function () {
    localStorage.removeItem('isLogin');
    localStorage.removeItem('username');
    localStorage.removeItem('nama');
    localStorage.removeItem('role');
    window.location.replace("login.html");


    //--Untuk Kembali Ke Halaman Login --
    // Redirect ke halaman login
    window.location.replace("login.html"); // pakai replace biar tidak bisa back ke dashboard
  });
}); 
    
    // --- FUNGSI RENDER ---
    function renderDashboard(data) {
        dashboardContent.empty().hide();
        if (!data || data.isEmpty) {
            showAlert(data.message || 'Tidak ada data.', 'warning');
            return;
        }
        const kpiHtml = `<div class="col-md-4"><div class="kpi-box"><div class="title">ACV Produksi Bulanan</div><div class="value">${data.kpi.acv_monthly}</div></div></div><div class="col-md-4"><div class="kpi-box"><div class="title">Total Tonase (PKS)</div><div class="value">${data.kpi.total_tonase_pks} <small>Kg</small></div></div></div><div class="col-md-4"><div class="kpi-box"><div class="title">Total Janjang Terkirim</div><div class="value">${data.kpi.total_jjg}</div></div></div>`;
        const chartHtml = `<div class="col-12"><div class="card shadow-sm"><div class="card-body"><div id="monthly-chart-div" style="height: 350px;"></div></div></div></div>`;
        const tableHtml = `<div class="col-12"><div class="card shadow-sm"><div class="card-body"><h5 class="card-title fw-bold">Ringkasan Data Bulanan</h5><div class="table-responsive"><table id="monthly-data-table" class="table table-striped" style="width:100%"></table></div></div></div></div>`;
        dashboardContent.html(kpiHtml + chartHtml + tableHtml).show();
        try {
            const chartData = google.visualization.arrayToDataTable([['Metrik', 'Nilai (Kg)'], ['Realisasi PKS', data.realisasi_vs_budget.realisasi], ['Budget Bulanan', data.realisasi_vs_budget.budget]]);
            new google.visualization.ColumnChart(document.getElementById('monthly-chart-div')).draw(chartData, { title: 'Realisasi Bulanan vs Budget (Kg)' });
        } catch(e) { $('#monthly-chart-div').html(`<div class="alert alert-warning">Gagal memuat grafik.</div>`); }
        if (monthlyTable) monthlyTable.destroy();
        const columns = data.summary_table.length > 0 ? Object.keys(data.summary_table[0]).map(key => ({ title: key, data: key })) : [];
        monthlyTable = $('#monthly-data-table').DataTable({ data: data.summary_table, columns: columns, responsive: true, dom: "Bfrtip", buttons: ['excel', 'pdf', 'print'] });
    }

    // --- FUNGSI PENGATUR ---
    async function fetchData() {
        const filters = { year: yearFilter.val(), month: monthFilter.val(), kebun: kebunFilter.val(), divisi: divisiFilter.val()};
        const data = await postToServer({ action: 'getMonthlyData', filters: filters }, alertBox);
        if (data) {
            renderDashboard(data);
        }
    }

    async function initializePage() {
        const initialData = await postToServer({ action: 'getInitialData' }, alertBox);
        if (initialData) {
            initialData.kebun.forEach(item => kebunFilter.append(`<option value="${item}">${item}</option>`));
            initialData.divisi.forEach(item => divisiFilter.append(`<option value="${item}">${item}</option>`)); 
            const currentYear = new Date().getFullYear();
            for (let i = currentYear; i >= currentYear - 5; i--) { yearFilter.append($('<option>', { value: i, text: i })); }
            for (let i = 1; i <= 12; i++) { monthFilter.append($('<option>', { value: i, text: moment.months(i - 1) })); }
            monthFilter.val(new Date().getMonth() + 1);
            $('[disabled]').prop('disabled', false);
        }
    }

    // --- EVENT LISTENERS ---
    applyBtn.on('click', fetchData);
    initializePage();
});
