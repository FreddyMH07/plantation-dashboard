// File: js/main_harian.js
import { postToServer } from './api.js';
import { showAlert } from './ui.js'; // <-- Import dari ui.js

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
            showAlert(data?.message || 'Tidak ada data untuk filter ini.', 'warning');
            if ($.fn.DataTable.isDataTable('#daily-data-table')) {
                $('#daily-data-table').DataTable().clear().draw();
            }
            return;
        }

        // TAHAP 1: Olah data mentah dari server untuk tabel
        const tableData = data.detailed_table.map((row, index) => {
            const budgetHarian = parseFloat(row.Budget_Harian) || 0;
            const realisasiPKS = parseFloat(row.Timbang_PKS) || 0;
            const acvHarian = budgetHarian > 0 ? (realisasiPKS / budgetHarian) * 100 : 0;
            return {
                ...row,
                NO: index + 1,
                ACV_Prod_Harian: acvHarian,
                Realisasi_PKS_Harian: realisasiPKS,
            };
        });

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
            if (data.daily_comparison) {
                const chartData = google.visualization.arrayToDataTable([
                    ['Metrik', 'Nilai (Kg)', { role: 'style' }],
                    ['Budget Harian', data.daily_comparison.budget, '#6c757d'],
                    ['Realisasi Kebun', data.daily_comparison.kebun, '#17a2b8'],
                    ['Realisasi PKS', data.daily_comparison.pks, '#0d6efd']
                ]);
                new google.visualization.ColumnChart(document.getElementById('daily-main-chart'))
                    .draw(chartData, { legend: { position: 'top' } });
            } else {
                $('#daily-main-chart').html(`<div class="alert alert-warning">Data chart tidak tersedia.</div>`);
            }
        } catch(e) {
            $('#daily-main-chart').html(`<div class="alert alert-warning">Gagal memuat grafik.</div>`);
        }
        
        // Render Tabel Data
        if ($.fn.DataTable.isDataTable('#daily-data-table')) {
            $('#daily-data-table').DataTable().destroy();
        }

        dailyTable = $('#daily-data-table').DataTable({
            data: tableData,
            columns: [
                { title: 'No', data: 'NO' },
                { title: 'Kebun', data: 'Kebun' },
                { title: 'Budget Harian', data: 'Budget_Harian', className: 'text-end', render: $.fn.dataTable.render.number('.', ',', 0, '', ' Kg') },
                { title: 'Realisasi PKS Harian', data: 'Realisasi_PKS_Harian', className: 'text-end fw-bold', render: $.fn.dataTable.render.number('.', ',', 0, '', ' Kg') },
                { title: 'Refraksi (Kg)', data: 'Refraksi_Kg', className: 'text-end' },
                { title: 'Refraksi (%)', data: 'Refraksi_Persen', className: 'text-end' },
                { title: 'BJR Hari Ini', data: 'BJR_Hari_Ini', className: 'text-end' },
                { title: 'ACV Prod Harian', data: 'ACV_Prod_Harian', className: 'text-end', render: function(data) { return data.toFixed(2) + ' %'; } },
                // --- Kolom tersembunyi (bisa dipilih user via colvis) ---
                { title: 'Tanggal', data: 'Tanggal' },
                { title: 'Divisi', data: 'Divisi' },
                { title: 'AKP Panen', data: 'AKP_Panen' },
                { title: 'TK Panen', data: 'TK_Panen' },
                { title: 'Luas Panen', data: 'Luas_Panen' },
                { title: 'JJG Panen', data: 'JJG_Panen' },
                { title: 'JJG Kirim', data: 'JJG_Kirim' },
                { title: 'Ketrek', data: 'Ketrek' },
                { title: 'Total JJG Kirim', data: 'Total_JJG_Kirim' },
                { title: 'Tonase Panen (Kg)', data: 'Tonase_Panen_Kg' },
                { title: 'Restant Jjg', data: 'Restant_Jjg' },
                { title: 'Output Kg/HK', data: 'Output_Kg_HK' },
                { title: 'Output Ha/HK', data: 'Output_Ha_HK' },
                { title: 'Timbang Kebun', data: 'Timbang_Kebun' }
            ],
            responsive: true,
            dom: "Bfrtip",
            buttons: ['copy', 'csv', 'excel', 'pdf', 'print', { extend: 'colvis', text: 'Pilih Kolom' }],
            language: { url: '//cdn.datatables.net/plug-ins/2.0.8/i18n/id.json' },
            columnDefs: [
                { visible: false, targets: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21] }
            ],
            createdRow: function(row, data, dataIndex) {
                // Pewarnaan berdasarkan ACV Prod Harian
                const acvCell = $('td', row).eq(7);
                const acvValue = parseFloat(data.ACV_Prod_Harian);
                if (!isNaN(acvValue)) {
                    if (acvValue >= 100) {
                        acvCell.addClass('acv-good');
                    } else if (acvValue >= 80) {
                        acvCell.addClass('acv-warning');
                    } else {
                        acvCell.addClass('acv-bad');
                    }
                }
            }
        });
    }

    // --- FUNGSI PENGATUR ---
    async function fetchData() {
        loader.show();
        const filters = {
            startDate: startDate.startOf('day').toISOString(),
            endDate: endDate.endOf('day').toISOString(),
            kebun: kebunFilter.val(),
            divisi: divisiFilter.val()
        };
        const data = await postToServer({ action: 'getDashboardData', filters: filters }, alertBox);
        loader.hide();
        if (!data || data.success === false) {
            showAlert(data?.message || 'Gagal mengambil data.', 'danger');
            dashboardContent.empty();
            return;
        }
        renderDashboard(data);
    }

    async function initializePage() {
        showAlert('Mengambil data filter...', 'info');
        loader.show();
        const data = await postToServer({ action: 'getInitialData' }, alertBox);
        loader.hide();
        if (data) {
            data.kebun.forEach(item => kebunFilter.append(`<option value="${item}">${item}</option>`));
            data.divisi.forEach(item => divisiFilter.append(`<option value="${item}">${item}</option>`));

            startDate = moment();
            endDate = moment();
            dateFilter.daterangepicker({
                startDate, endDate,
                locale: { format: 'DD MMMM YYYY' },
                ranges: {
                    'Hari Ini': [moment(), moment()],
                    'Kemarin': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
                    '7 Hari Terakhir': [moment().subtract(6, 'days'), moment()],
                    'Bulan Ini': [moment().startOf('month'), moment().endOf('month')],
                    'Bulan Lalu': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
                }
            }, (start, end) => { startDate = start; endDate = end; });

            // Aktifkan semua filter dan tombol di dalam view harian
            $('#daily-view').find('[disabled]').prop('disabled', false);
            showAlert('Aplikasi siap. Memuat data untuk hari ini...', 'success');
            
            // Otomatis muat data untuk pertama kali
            fetchData();
        } else {
            showAlert('Gagal memuat filter data.', 'danger');
        }
    }

    // --- EVENT LISTENERS ---
    applyBtn.on('click', fetchData);
    initializePage();
});
