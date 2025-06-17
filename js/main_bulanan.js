// File: js/main_bulanan.js
import { postToServer } from './api.js';
import { showAlert } from './ui.js';
import { renderMonthlyDashboard } from './ui_monthly.js';

$(document).ready(function () {
    // --- Elemen UI ---
    const loader           = $('#loader');
    const alertBox         = $('#alert-box-monthly');
    const yearFilter       = $('#year-filter');
    const monthFilter      = $('#month-filter');
    const kebunFilter      = $('#kebun-filter-monthly');
    const divisiFilter     = $('#divisi-filter-monthly');
    const applyBtn         = $('#apply-filter-monthly');
    const dashboardContent = $('#monthly-dashboard-content');

    let monthlyTable = null;

    // --- Google Charts ---
    google.charts.load('current', { 'packages': ['corechart', 'table'] });

    // --- Cek Login ---
    if (!localStorage.getItem('isLogin')) window.location.href = "login.html";
    $('#logout-btn').on('click', function () {
        localStorage.clear();
        window.location.replace("login.html");
    });

    // --- Sidebar & Dark Mode Logic ---
    function updateSidebarState() {
        if (window.innerWidth > 991) {
            $('#sidebar').addClass('sidebar-collapsed').removeClass('sidebar-expanded');
        } else {
            $('#sidebar').removeClass('sidebar-collapsed').addClass('sidebar-expanded');
        }
    }
    updateSidebarState();
    $('#sidebar').on('mouseenter', function () {
        if (window.innerWidth > 991) $(this).removeClass('sidebar-collapsed').addClass('sidebar-expanded');
    }).on('mouseleave', function () {
        if (window.innerWidth > 991) $(this).addClass('sidebar-collapsed').removeClass('sidebar-expanded');
    });
    $('#sidebar-toggle').on('click', function () {
        $('#sidebar').toggleClass('sidebar-expanded');
    });
    $('.sidebar-menu-link').on('click', function () {
        if (window.innerWidth <= 991) $('#sidebar').removeClass('sidebar-expanded').addClass('sidebar-collapsed');
    });
    $(window).on('resize', updateSidebarState);

    // --- Dark Mode ---
    function setDarkMode(on) {
        if (on) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('theme', 'light');
        }
    }
    let theme = localStorage.getItem('theme');
    if (!theme) theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    setDarkMode(theme === 'dark');
    $('#dark-mode-toggle').on('click', function () {
        setDarkMode(!document.body.classList.contains('dark-mode'));
    });

    // --- Inisialisasi Filter ---
    async function initializePage() {
        showAlert(alertBox, 'Mengambil data filter...', 'info');
        loader.show();
        const data = await postToServer({ action: 'getInitialData' }, alertBox);
        loader.hide();
        if (!data || !data.kebun || !data.divisi) {
            showAlert(alertBox, 'Gagal memuat data filter.', 'danger');
            return;
        }

        // Isi filter Tahun/Bulan
        yearFilter.empty().append('<option value="">(Semua Tahun)</option>');
        monthFilter.empty().append('<option value="">(Semua Bulan)</option>');
        let currYear = new Date().getFullYear();
        for (let i = currYear; i >= currYear - 5; i--) yearFilter.append(`<option value="${i}">${i}</option>`);
        for (let i = 1; i <= 12; i++) monthFilter.append(`<option value="${i}">${moment.months(i - 1)}</option>`);
        yearFilter.val(currYear); monthFilter.val(new Date().getMonth() + 1);

        // Isi filter Kebun & Divisi (dengan PT SAG sebagai "semua")
        kebunFilter.empty().append('<option value="">(Semua Kebun)</option>');
        kebunFilter.append('<option value="PT SAG">(PT SAG)</option>');
        data.kebun.forEach(item => kebunFilter.append(`<option value="${item}">${item}</option>`));
        divisiFilter.empty().append('<option value="">(Semua Divisi)</option>');
        divisiFilter.append('<option value="PT SAG">(PT SAG)</option>');
        data.divisi.forEach(item => divisiFilter.append(`<option value="${item}">${item}</option>`));
        $('[disabled]').prop('disabled', false);

        // Auto load data pertama kali
        fetchData();
    }

    // --- Ambil & Render Data Dashboard Bulanan ---
    async function fetchData() {
        loader.show();
        showAlert(alertBox, 'Memuat data bulanan...', 'info');
        let kebunVal  = kebunFilter.val() === "PT SAG" ? "" : kebunFilter.val();
        let divisiVal = divisiFilter.val() === "PT SAG" ? "" : divisiFilter.val();
        const filters = {
            year: yearFilter.val(),
            month: monthFilter.val(),
            kebun: kebunVal,
            divisi: divisiVal
        };
        const data = await postToServer({ action: 'getMonthlyData', filters: filters }, alertBox);
        loader.hide();
        if (data && !data.isEmpty) {
            google.charts.setOnLoadCallback(function () {
                monthlyTable = renderMonthlyDashboard(data, dashboardContent, alertBox, monthlyTable);
            });
            showAlert(alertBox, 'Dashboard bulanan berhasil dimuat.', 'success');
        } else {
            dashboardContent.empty();
            showAlert(alertBox, data?.message || 'Data tidak ditemukan.', 'warning');
            if (monthlyTable) monthlyTable.clear().draw();
        }
    }

    // --- Listener ---
    applyBtn.on('click', fetchData);

    // --- Inisialisasi halaman ---
    initializePage();
});
