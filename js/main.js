// File: js/main.js
// Tugas: Sebagai manajer proyek, mengatur alur kerja aplikasi.

import { postToServer } from './api.js';
import { showAlert, renderDailyDashboard, renderMonthlyDashboard, renderPivotChart } from './ui.js';

$(document).ready(function() {
    // --- KONFIGURASI DAN ELEMEN UI ---
    moment.locale('id');
    google.charts.load('current', {'packages':['corechart', 'line']});

    const mainNav = $('#main-nav');
    const dailyView = $('#daily-view');
    const monthlyView = $('#monthly-view');

    // Elemen Harian
    const kebunFilterDaily = $('#kebun-filter');
    const divisiFilterDaily = $('#divisi-filter');
    const dateFilter = $('#date-filter');
    const applyBtnDaily = $('#apply-filter-daily');
    const pivotGroupBy = $('#pivot-group-by');
    const pivotMetric = $('#pivot-metric');
    const pivotChartType = $('#pivot-chart-type');
    let fullDailyData, dailyTable, dailyStartDate, dailyEndDate;

    // Elemen Bulanan
    const kebunFilterMonthly = $('#kebun-filter-monthly');
    const divisiFilterMonthly = $('#divisi-filter-monthly');
    const yearFilter = $('#year-filter');
    const monthFilter = $('#month-filter');
    const applyBtnMonthly = $('#apply-filter-monthly');
    let monthlyTable;
    
    // --- FUNGSI ORKESTRASI ---
    async function fetchAndRenderDailyData() {
        const filters = {
            startDate: dailyStartDate.startOf('day').toISOString(),
            endDate: dailyEndDate.endOf('day').toISOString(),
            kebun: kebunFilterDaily.val(),
            divisi: divisiFilterDaily.val()
        };
        const data = await postToServer({ action: 'getDashboardData', filters: filters });
        if (data) {
            fullDailyData = data.detailed_table; // Simpan data untuk pivot
            dailyTable = renderDailyDashboard(data, dailyTable);
            // Gambar pivot chart awal
            renderPivotChart(fullDailyData, pivotGroupBy.val(), pivotMetric.val(), pivotChartType.val());
        }
    }

    async function fetchAndRenderMonthlyData() {
        const filters = {
            year: yearFilter.val(),
            month: monthFilter.val(),
            kebun: kebunFilterMonthly.val(),
            divisi: divisiFilterMonthly.val()
        };
        const data = await postToServer({ action: 'getMonthlyData', filters: filters });
        if (data) {
            monthlyTable = renderMonthlyDashboard(data, monthlyTable);
        }
    }

    // --- INISIALISASI ---
    function initializeMonthlyFilters() {
        if (yearFilter.children().length > 0) return; // Hanya inisialisasi sekali
        const currentYear = new Date().getFullYear();
        for (let i = currentYear; i >= currentYear - 5; i--) { yearFilter.append($('<option>', { value: i, text: i })); }
        for (let i = 1; i <= 12; i++) { monthFilter.append($('<option>', { value: i, text: moment.months(i - 1) })); }
        monthFilter.val(new Date().getMonth() + 1);
    }

    function switchView(view) {
        mainNav.find('.nav-link').removeClass('active');
        mainNav.find(`[data-view="${view}"]`).addClass('active');
        showAlert('', 'info'); // Sembunyikan alert
        if (view === 'daily') {
            monthlyView.hide(); dailyView.show();
        } else {
            dailyView.hide(); monthlyView.show();
            initializeMonthlyFilters();
        }
    }

    async function initializeApp() {
        showAlert('Mengambil data filter...', 'info');
        const data = await postToServer({ action: 'getInitialData' });
        if (data) {
            [kebunFilterDaily, kebunFilterMonthly].forEach(filterEl => {
                filterEl.empty().append($('<option>').val('SEMUA KEBUN').text('SEMUA KEBUN'));
                data.kebun.forEach(item => filterEl.append($('<option>', { value: item, text: item })));
            });
            [divisiFilterDaily, divisiFilterMonthly].forEach(filterEl => {
                filterEl.empty().append($('<option>').val('SEMUA DIVISI').text('SEMUA DIVISI'));
                data.divisi.forEach(item => filterEl.append($('<option>', { value: item, text: item })));
            });

            dailyStartDate = moment();
            dailyEndDate = moment();
            dateFilter.daterangepicker({ startDate: dailyStartDate, endDate: dailyEndDate, locale: { format: 'DD MMMM YYYY' },
                ranges: { 'Hari Ini': [moment(), moment()], 'Bulan Ini': [moment().startOf('month'), moment().endOf('month')], 'Bulan Lalu': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')] }
            }, (start, end) => { dailyStartDate = start; dailyEndDate = end; });

            $('[disabled]').prop('disabled', false);
            showAlert('Aplikasi siap. Memuat data untuk hari ini...');
            fetchAndRenderDailyData();
        }
    }

    // --- EVENT LISTENERS ---
    applyBtnDaily.on('click', fetchAndRenderDailyData);
    applyBtnMonthly.on('click', fetchAndRenderMonthlyData);
    mainNav.on('click', '.nav-link', function(e) { e.preventDefault(); switchView($(this).data('view')); });



        // Jika filter pivot diubah, gambar ulang HANYA pivot chart tanpa panggil API lagi
    $('#pivot-group-by, #pivot-metric, #pivot-chart-type').on('change', function() {
        if (fullDailyData) {
            renderPivotChart(fullDailyData, pivotGroupBy.val(), pivotMetric.val(), pivotChartType.val());
        }
    });

    
    initializeApp();
});
