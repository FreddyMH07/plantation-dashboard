// File: js/ui_daily.js
import { showAlert, sumField, formatNumber } from './ui.js';

/**
 * Render Dashboard Harian (daily) secara lengkap ke container tertentu.
 * @param {object} data - Data hasil fetch dari server.
 * @param {JQuery<HTMLElement>} dashboardContent - Kontainer dashboard harian (misal: $('#daily-dashboard-content'))
 * @param {DataTable.Api|null} dailyTable - Instance DataTable sebelumnya (biar bisa destroy).
 * @returns {DataTable.Api} - Instance DataTable terbaru (return supaya bisa dipakai lagi).
 */
export function renderDailyDashboard(data, dashboardContent, alertBox, dailyTable) {
    dashboardContent.empty().hide();

    if (!data || data.isEmpty) {
        showAlert(alertBox, data?.message || 'Tidak ada data untuk kombinasi filter yang dipilih.', 'warning');
        if (dailyTable) dailyTable.clear().draw();
        return;
    }

    // Proses data tabel: tambah kolom kalkulasi (ACV Harian, dsb.)
    const tableData = data.detailed_table.map((row, idx) => {
        const budgetHarian = parseFloat(row.Budget_Harian) || 0;
        const realisasiPKS = parseFloat(row.Timbang_PKS) || 0;
        const acvHarian = budgetHarian > 0 ? (realisasiPKS / budgetHarian) * 100 : 0;
        return {
            ...row,
            NO: idx + 1,
            ACV_Prod_Harian: acvHarian,
            Realisasi_PKS_Harian: realisasiPKS,
        };
    });

    // KPI BOX & Master Data
    const kpiHtml = `
        <div class="col-lg-3 col-md-6 mb-4">
            <div class="kpi-box"><div class="title">ACV Production</div><div class="value">${data.kpi_acv.value}</div></div>
        </div>
        <div class="col-lg-9 col-md-6 mb-4">
            <div class="card master-data-card h-100"><div class="card-body row text-center align-items-center">
                <div class="col"><div class="title">SPH</div><div class="value">${data.master_data_display.sph}</div></div>
                <div class="col"><div class="title">Luas TM (Ha)</div><div class="value">${data.master_data_display.luas_tm}</div></div>
                <div class="col"><div class="title">Pokok (Pkk)</div><div class="value">${data.master_data_display.pkk}</div></div>
                <div class="col"><div class="title">Budget Bulan Ini</div><div class="value">${formatNumber(data.master_data_display.budget_monthly)}</div></div>
            </div></div>
        </div>`;

    // Chart Area
    const chartHtml = `
        <div class="col-lg-12 mb-4">
            <div class="card shadow-sm"><div class="card-body">
                <h5 class="card-title">Budget Harian vs Realisasi</h5>
                <div id="daily-main-chart" style="height: 350px;"></div>
            </div></div>
        </div>`;

    // Table Area
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

    // Render Chart
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
    } catch (e) {
        $('#daily-main-chart').html(`<div class="alert alert-warning">Gagal memuat grafik.</div>`);
    }

    // Destroy & init DataTable
    if ($.fn.DataTable.isDataTable('#daily-data-table')) {
        $('#daily-data-table').DataTable().destroy();
    }

    return $('#daily-data-table').DataTable({
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
            // Kolom hidden/optional (colvis)
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
        createdRow: function(row, data) {
            // Highlight ACV harian
            const acvCell = $('td', row).eq(7);
            const acvValue = parseFloat(data.ACV_Prod_Harian);
            if (!isNaN(acvValue)) {
                if (acvValue >= 100)      acvCell.addClass('acv-good');
                else if (acvValue >= 80)  acvCell.addClass('acv-warning');
                else                      acvCell.addClass('acv-bad');
            }
        }
    });
}
