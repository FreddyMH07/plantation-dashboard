// File: js/main.js
// Tugas: Sebagai manajer proyek, mengatur alur kerja aplikasi.

import { postToServer } from './api.js';
import { showAlert, renderDailyDashboard } from './ui.js';

$(document).ready(function() {
    // --- KONFIGURASI DAN ELEMEN UI ---
    moment.locale('id');
    google.charts.load('current', {'packages':['corechart']});

    const kebunFilterDaily = $('#kebun-filter');
    const divisiFilterDaily = $('#divisi-filter');
    const dateFilter = $('#date-filter');
    const applyBtnDaily = $('#apply-filter-daily');

    let dailyTable;
    let dailyStartDate, dailyEndDate;

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
            dailyTable = renderDailyDashboard(data, dailyTable);
        }
    }

    async function initializeApp() {
        showAlert('Mengambil data filter...', 'info');
        const data = await postToServer({ action: 'getInitialData' });
        if (data) {
            [kebunFilterDaily, $('#kebun-filter-monthly')].forEach(filterEl => {
                filterEl.empty().append($('<option>', { text: 'SEMUA KEBUN' }));
                data.kebun.forEach(item => filterEl.append($('<option>', { value: item, text: item })));
            });
            [divisiFilterDaily, $('#divisi-filter-monthly')].forEach(filterEl => {
                filterEl.empty().append($('<option>', { text: 'SEMUA DIVISI' }));
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

    // --- MULAI APLIKASI ---
    initializeApp();
});
