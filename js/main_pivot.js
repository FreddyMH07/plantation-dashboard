import { postToServer } from './api.js';
import { showAlert } from './ui.js';
import { renderPivotChart } from './ui_pivot.js';

$(document).ready(function () {
    // --- Elemen UI ---
    const loader           = $('#loader');
    const alertBox         = $('#alert-box-pivot');
    const dateFilter       = $('#date-filter-pivot');
    const kebunFilter      = $('#kebun-filter-pivot');
    const divisiFilter     = $('#divisi-filter-pivot');
    const groupBySelect    = $('#pivot-group-by');
    const metricSelect     = $('#pivot-metric');
    const chartTypeSelect  = $('#pivot-chart-type');
    const applyBtn         = $('#apply-filter-pivot');
    const chartContainer   = $('#pivot-chart-container');

    let fullData = []; // Data untuk chart (tidak dipanggil server berulang2)
    let startDate, endDate;

    // --- Cek Login ---
    if (!localStorage.getItem('isLogin')) window.location.href = "login.html";
    $('#logout-btn').on('click', function () {
        localStorage.clear();
        window.location.replace("login.html");
    });

    // --- Sidebar & Dark Mode Logic (optional, bisa import dari global js juga) ---
    // [Copy saja logic sidebar/darkmode dari main_harian/main_bulanan agar konsisten]

    // --- Inisialisasi Filter & Range Tanggal ---
    async function initializePage() {
        showAlert(alertBox, 'Mengambil data filter...', 'info');
        loader.show();
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

        // Inisialisasi tanggal (default bulan ini)
        const now = moment();
        const awalBulan = moment().startOf('month');
        dateFilter.daterangepicker({
            startDate: awalBulan,
            endDate: now,
            locale: { format: 'DD MMMM YYYY' },
            ranges: {
                'Hari Ini': [now, now],
                'Bulan Ini': [awalBulan, now],
                'Bulan Lalu': [
                    moment().subtract(1, 'month').startOf('month'),
                    moment().subtract(1, 'month').endOf('month')
                ]
            }
        }, (start, end) => { startDate = start; endDate = end; });
        startDate = awalBulan; endDate = now;

        $('[disabled]').prop('disabled', false);

        // Load pertama kali
        fetchData();
    }

    // --- Ambil & Render Data Pivot ---
    async function fetchData() {
        loader.show();
        showAlert(alertBox, 'Mengambil data pivot...', 'info');
        const filters = {
            startDate: startDate.startOf('day').toISOString(),
            endDate: endDate.endOf('day').toISOString(),
            kebun: kebunFilter.val(),
            divisi: divisiFilter.val()
        };
        const data = await postToServer({ action: 'getDashboardData', filters: filters }, alertBox);
        loader.hide();
        if (data && data.detailed_table && data.detailed_table.length) {
            fullData = data.detailed_table;
            // Render chart
            renderPivotChart(fullData, groupBySelect.val(), metricSelect.val(), chartTypeSelect.val());
            showAlert(alertBox, 'Pivot dashboard berhasil dimuat.', 'success');
        } else {
            chartContainer.html('<div class="alert alert-warning">Tidak ada data pivot ditemukan.</div>');
            showAlert(alertBox, data?.message || 'Data tidak ditemukan.', 'warning');
        }
    }

    // --- Event ---
    applyBtn.on('click', fetchData);
    groupBySelect.on('change', function() {
        renderPivotChart(fullData, groupBySelect.val(), metricSelect.val(), chartTypeSelect.val());
    });
    metricSelect.on('change', function() {
        renderPivotChart(fullData, groupBySelect.val(), metricSelect.val(), chartTypeSelect.val());
    });
    chartTypeSelect.on('change', function() {
        renderPivotChart(fullData, groupBySelect.val(), metricSelect.val(), chartTypeSelect.val());
    });

    initializePage();
});
