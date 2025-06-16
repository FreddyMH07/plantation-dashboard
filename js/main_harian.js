// File: js/main_harian.js

import { postToServer } from './api.js';
import { showAlert, renderDailyDashboard } from './ui.js';

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


$(document).ready(function() {
    // --- Variabel Elemen UI ---
    const loader           = $('#loader'); // Loader/spinner (optional)
    const alertBox         = $('#alert-box-daily');
    const dateFilter       = $('#date-filter-daily');
    const kebunFilter      = $('#kebun-filter-daily');
    const divisiFilter     = $('#divisi-filter-daily');
    const applyBtn         = $('#apply-filter-daily');
    const dashboardContent = $('#daily-dashboard-content');

    let dailyTable = null;
    let startDate, endDate;

    // --- Inisialisasi Google Charts (wajib sebelum render chart) ---
    google.charts.load('current', { 'packages': ['corechart', 'table'] });

    // --- Inisialisasi page dan filter ---
    async function initializePage() {
        showAlert(alertBox, 'Mengambil data filter...', 'info');
        loader.show();

        // Ambil data awal (kebun, divisi)
        const data = await postToServer({ action: 'getInitialData' }, alertBox);
        loader.hide();

        if (!data || !data.kebun || !data.divisi) {
            showAlert(alertBox, 'Gagal memuat data filter.', 'danger');
            return;
        }

        // Isi dropdown kebun & divisi
        kebunFilter.empty().append('<option value="">(Semua Kebun)</option>');
        divisiFilter.empty().append('<option value="">(Semua Divisi)</option>');
        data.kebun.forEach(item => kebunFilter.append(`<option value="${item}">${item}</option>`));
        data.divisi.forEach(item => divisiFilter.append(`<option value="${item}">${item}</option>`));

        // Tanggal awal: hari ini
         const now = moment();
        const awalBulan = moment().startOf('month');
        dateFilter.daterangepicker({
        startDate: awalBulan,
        endDate: now,
        locale: { format: 'DD MMMM YYYY' },
        ranges: {
        'Hari Ini': [now, now],
        'Kemarin': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
        '7 Hari Terakhir': [moment().subtract(6, 'days'), now],
        'Bulan Ini': [awalBulan, now],
        'Bulan Lalu': [
            moment().subtract(1, 'month').startOf('month'),
            moment().subtract(1, 'month').endOf('month')
            ]
        }
        }, (start, end) => { startDate = start; endDate = end; });

        startDate = awalBulan;
        endDate = now;


        // Aktifkan filter & tombol
        $('#daily-view').find('[disabled]').prop('disabled', false);
        showAlert(alertBox, 'Aplikasi siap. Memuat data hari ini...', 'success');
        fetchData(); // auto load pertama kali
    }

    // --- Ambil dan render data dashboard harian ---
    async function fetchData() {
        loader.show();
        showAlert(alertBox, 'Memuat data harian...', 'info');

        const filters = {
            startDate: startDate.startOf('day').toISOString(),
            endDate: endDate.endOf('day').toISOString(),
            kebun: kebunFilter.val(),
            divisi: divisiFilter.val()
        };

        const data = await postToServer({ action: 'getDashboardData', filters: filters }, alertBox);
        loader.hide();

        if (!data || data.success === false || data.isEmpty) {
            showAlert(alertBox, data?.message || 'Data tidak ditemukan.', 'warning');
            if (dailyTable) { dailyTable.clear().draw(); }
            dashboardContent.empty();
            return;
        }

        // Tunggu Google Charts benar2 loaded sebelum render chart (prevent error race condition)
        google.charts.setOnLoadCallback(function() {
            dailyTable = renderDailyDashboard(data, dashboardContent, dailyTable);
        });
        showAlert(alertBox, 'Dashboard harian berhasil dimuat.', 'success');
    }

    // --- Listener ---
    applyBtn.on('click', fetchData);

    // --- Inisialisasi pertama kali ---
    initializePage();
});
