import { postToServer } from './api.js';

$(document).ready(function() {
    // --- ELEMEN UI ---
    const loader = $('#loader');
    const alertBox = $('#alert-box-daily');
    const dateFilter = $('#date-filter-daily');
    const kebunFilter = $('#kebun-filter-daily');
    const divisiFilter = $('#divisi-filter-daily');
    const applyBtn = $('#apply-filter-daily');
    const dashboardContent = $('#daily-dashboard-content');
    
    let dailyTable, startDate, endDate;

    // Inisialisasi Google Charts
    google.charts.load('current', {'packages':['corechart', 'table']});

    // --- FUNGSI RENDER ---
    function renderDashboard(data) {
        dashboardContent.empty().hide();
        if (!data || data.isEmpty) {
            showAlert(data.message || 'Tidak ada data untuk filter ini.', 'warning');
            return;
        }

        const kpiHtml = `
            <div class="col-lg-3 col-md-6 mb-4">
                <div class="kpi-box"><div class="title">ACV Production</div><div class="value">${data.kpi_acv.value}</div></div>
            </div>
            <div class="col-lg-9 col-md-6 mb-4">
                <div class="card master-data-card h-100"><div class="card-body row text-center align-items-center">
                    <div class="col"><div class="title">SPH</div><div class="value">${data.master_data_display.sph}</div></div>
                    <div class="col"><div class="title">Luas TM (Ha)</div><div class="value">${data.master_data_display.luas_tm}</div></div>
                    <div class="col"><div class="title">Pokok (Pkk)</div><div class="value">${data.master_data_display.pkk}</div></div>
                    <div class="col"><div class="title">Budget Bulan Ini</div><div class="value">${parseFloat(data.master_data_display.budget_monthly).toLocaleString('id-ID')}</div></div>
                </div></div>
            </div>`;

        const chartHtml = `
            <div class="col-lg-12 mb-4">
                <div class="card shadow-sm"><div class="card-body">
                    <h5 class="card-title">Budget Harian vs Realisasi</h5>
                    <div id="daily-main-chart" style="height: 350px;"></div>
                </div></div>
            </div>`;

        const tableHtml = `
            <div class="col-12">
                <div class="card shadow-sm"><div class="card-body">
                    <h5 class="card-title fw-bold">Detail Data Harian</h5>
                    <div class="table-responsive">
                        <table id="daily-data-table" class="table table-striped table-hover" style="width:100%"></table>
                    </div>
                </div></div>
            </div>`;
        
        dashboardContent.html(kpiHtml + chartHtml + tableHtml).show();

        // Render Grafik Utama
        try {
            const chartData = google.visualization.arrayToDataTable([
                ['Metrik', 'Nilai (Kg)', { role: 'style' }],
                ['Budget Harian', data.daily_comparison.budget, '#6c757d'],
                ['Realisasi Kebun', data.daily_comparison.kebun, '#17a2b8'],
                ['Realisasi PKS', data.daily_comparison.pks, '#0d6efd']
            ]);
            new google.visualization.ColumnChart(document.getElementById('daily-main-chart')).draw(mainChartData, { legend: { position: 'top' } });
        } catch(e) { $('#daily-main-chart').html(`<div class="alert alert-warning">Gagal memuat grafik.</div>`); }
        
        // Render Tabel Data
        if (dailyTable) dailyTable.destroy();
        const columns = data.detailed_table.length > 0 ? Object.keys(data.detailed_table[0]).map(key => ({ title: key.replace(/_/g, ' '), data: key })) : [];
        dailyTable = $('#daily-data-table').DataTable({
            data: data.detailed_table,
            columns: columns,
            responsive: true,
            dom: "Bfrtip",
            buttons: ['copy', 'csv', 'excel', 'pdf', 'print', { extend: 'colvis', text: 'Pilih Kolom' }],
            language: { url: '//cdn.datatables.net/plug-ins/2.0.8/i18n/id.json' }
        });
    }

    // --- FUNGSI PENGATUR ---
    async function fetchData() {
        const filters = {
            startDate: startDate.startOf('day').toISOString(),
            endDate: endDate.endOf('day').toISOString(),
            kebun: kebunFilter.val(),
            divisi: divisiFilter.val()
        };
        const data = await postToServer({ action: 'getDashboardData', filters: filters }, alertBox);
        if (data) {
            renderDashboard(data);
        }
    }

    async function initializePage() {
        showAlert('Mengambil data filter...', 'info');
        const data = await postToServer({ action: 'getInitialData' }, alertBox);
        if (data) {
            data.kebun.forEach(item => kebunFilter.append(`<option value="${item}">${item}</option>`));
            data.divisi.forEach(item => divisiFilter.append(`<option value="${item}">${item}</option>`));

            startDate = moment();
            endDate = moment();
            dateFilter.daterangepicker({ startDate, endDate, locale: { format: 'DD MMMM YYYY' },
                ranges: {
                   'Hari Ini': [moment(), moment()], 'Kemarin': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
                   '7 Hari Terakhir': [moment().subtract(6, 'days'), moment()], 'Bulan Ini': [moment().startOf('month'), moment().endOf('month')],
                   'Bulan Lalu': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
                }
            }, (start, end) => { startDate = start; endDate = end; });

            $('[disabled]').prop('disabled', false);
            showAlert('Aplikasi siap. Memuat data untuk hari ini...', 'success');
            fetchData(); // Otomatis muat data hari ini
        }
    }

    // --- EVENT LISTENERS ---
    applyBtn.on('click', fetchData);
    initializeApp();
});
