// File: js/main_harian.js

import { postToServer } from './api.js';
import { showAlert } from './ui.js';
import { renderDailyDashboard } from './ui_daily.js';

// --- LOGIN CHECK + LOGOUT ---
if (!localStorage.getItem('isLogin')) window.location.href = "login.html";
$('#logout-btn').on('click', function () {
    localStorage.clear();
    window.location.replace("login.html");
});

// --- SIDEBAR HANDLING (Collapse/Expand on hover/mouseout) ---
$(document).ready(function () {
    function updateSidebarState() {
        if (window.innerWidth > 991) {
            $('#sidebar').addClass('sidebar-collapsed').removeClass('sidebar-expanded');
        } else {
            $('#sidebar').removeClass('sidebar-collapsed').addClass('sidebar-expanded');
        }
    }
    updateSidebarState();
    $('#sidebar').on('mouseenter', function () {
        if (window.innerWidth > 991) {
            $(this).removeClass('sidebar-collapsed').addClass('sidebar-expanded');
        }
    });
    $('#sidebar').on('mouseleave', function () {
        if (window.innerWidth > 991) {
            $(this).addClass('sidebar-collapsed').removeClass('sidebar-expanded');
        }
    });
    $('#sidebar-toggle').on('click', function () {
        $('#sidebar').toggleClass('sidebar-expanded');
    });
    $('.sidebar-menu-link').on('click', function () {
        if (window.innerWidth <= 991) {
            $('#sidebar').removeClass('sidebar-expanded').addClass('sidebar-collapsed');
        }
    });
    $(window).on('resize', updateSidebarState);
});

// --- ELEMENTS & VARIABEL UTAMA ---
const loader           = $('#loader'); // Loader/spinner
const alertBox         = $('#alert-box-daily');
const dateFilter       = $('#date-filter-daily');
const kebunFilter      = $('#kebun-filter-daily');
const divisiFilter     = $('#divisi-filter-daily');
const applyBtn         = $('#apply-filter-daily');
const dashboardContent = $('#daily-dashboard-content');

let dailyTable = null;
let startDate, endDate;

// --- INIT Google Chart ---
google.charts.load('current', { 'packages': ['corechart', 'table'] });

// --- INISIALISASI FILTER & PAGE ---
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

    kebunFilter.empty().append('<option value="">(Semua Kebun)</option>');
    divisiFilter.empty().append('<option value="">(Semua Divisi)</option>');
    data.kebun.forEach(item => kebunFilter.append(`<option value="${item}">${item}</option>`));
    data.divisi.forEach(item => divisiFilter.append(`<option value="${item}">${item}</option>`));

    // Default range = awal bulan s/d hari ini
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

    $('#daily-view').find('[disabled]').prop('disabled', false);
    showAlert(alertBox, 'Aplikasi siap. Memuat data hari ini...', 'success');
    fetchData(); // auto-load pertama
}

// --- FETCH DATA & RENDER ---
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
        if (dailyTable) dailyTable.clear().draw();
        dashboardContent.empty();
        return;
    }
    // Pastikan Google Charts loaded sebelum render chart/table
    google.charts.setOnLoadCallback(function() {
        dailyTable = renderDailyDashboard(data, dashboardContent, alertBox, dailyTable);
    });
    showAlert(alertBox, 'Dashboard harian berhasil dimuat.', 'success');
}

// --- LISTENER ---
applyBtn.on('click', fetchData);

// --- INISIALISASI PERTAMA ---
$(document).ready(initializePage);

