// File: js/ui_monthly.js
import { showAlert, sumField, formatNumber } from './ui.js';

/**
 * Render Dashboard Bulanan (monthly) ke kontainer tertentu.
 * @param {object} data - Data dari API (sudah summary_table dsb).
 * @param {JQuery<HTMLElement>} dashboardContent - Kontainer dashboard bulanan.
 * @param {JQuery<HTMLElement>} alertBox - Tempat alert.
 * @param {DataTable.Api|null} monthlyTable - Instance DataTable sebelumnya.
 * @returns {DataTable.Api} - Instance DataTable terbaru.
 */
export function renderMonthlyDashboard(data, dashboardContent, alertBox, monthlyTable) {
    dashboardContent.empty().hide();

    if (!data || data.isEmpty) {
        showAlert(alertBox, data?.message || 'Tidak ada data.', 'warning');
        if (monthlyTable) monthlyTable.clear().draw();
        return;
    }

    // Sum bulanan (ambil langsung dari summary_table tanpa formula aneh)
    const t = data.summary_table || [];

    // --- KPI Custom ---
    const totalRefraksiKg   = sumField(t, 'Refraksi_Kg');
    const totalTonasePanen  = sumField(t, 'Tonase_Panen_Kg');
    const totalTimbangPKS   = sumField(t, 'Timbang_PKS');
    const totalTimbangKebun = sumField(t, 'Timbang_Kebun');
    const totalJJGKirim     = sumField(t, 'JJG_Kirim');

    const refraksiBulanan = totalTonasePanen ? (totalRefraksiKg / totalTonasePanen * 100) : 0;
    const selisihTonase   = totalTimbangPKS - totalTimbangKebun;
    const bjrBulanan      = totalJJGKirim ? (totalTonasePanen / totalJJGKirim) : 0;

    // KPI Area
    const kpiHtml = `
        <div class="row g-2 mb-3">
            <div class="col-md-3"><div class="kpi-box"><div class="title">Tonase PKS</div><div class="value">${formatNumber(totalTimbangPKS)} Kg</div></div></div>
            <div class="col-md-3"><div class="kpi-box"><div class="title">Tonase Kebun</div><div class="value">${formatNumber(totalTimbangKebun)} Kg</div></div></div>
            <div class="col-md-3"><div class="kpi-box"><div class="title">Selisih Tonase</div><div class="value">${formatNumber(selisihTonase)} Kg</div></div></div>
            <div class="col-md-3"><div class="kpi-box"><div class="title">BJR Bulanan</div><div class="value">${bjrBulanan.toFixed(2)}</div></div></div>
            <div class="col-md-3"><div class="kpi-box"><div class="title">Refraksi Bulanan</div><div class="value">${refraksiBulanan.toFixed(2)} %</div></div></div>
        </div>
    `;

    // Chart Area
    const chartHtml = `
        <div class="col-lg-12 mb-4">
            <div class="card shadow-sm"><div class="card-body">
                <h5 class="card-title">Realisasi Bulanan vs Budget</h5>
                <div id="monthly-chart-div" style="height: 350px;"></div>
            </div></div>
        </div>
    `;

    // Table Area
    const tableHtml = `
        <div class="col-12">
            <div class="card shadow-sm"><div class="card-body">
                <h5 class="card-title fw-bold">Ringkasan Data Bulanan</h5>
                <div class="table-responsive">
                    <table id="monthly-data-table" class="table table-striped" style="width:100%"></table>
                </div>
            </div></div>
        </div>
    `;

    dashboardContent.html(kpiHtml + chartHtml + tableHtml).show();

    // --- Render Chart ---
    try {
        const chartData = google.visualization.arrayToDataTable([
            ['Metrik', 'Nilai (Kg)'],
            ['Realisasi PKS', data.realisasi_vs_budget.realisasi],
            ['Budget Bulanan', data.realisasi_vs_budget.budget]
        ]);
        new google.visualization.ColumnChart(document.getElementById('monthly-chart-div')).draw(chartData, {
            title: 'Realisasi Bulanan vs Budget (Kg)',
            legend: { position: 'top' }
        });
    } catch(e) {
        $('#monthly-chart-div').html(`<div class="alert alert-warning">Gagal memuat grafik.</div>`);
    }

    // --- Render DataTable ---
    if ($.fn.DataTable.isDataTable('#monthly-data-table')) {
        $('#monthly-data-table').DataTable().destroy();
    }

    const columns = t.length > 0
        ? Object.keys(t[0]).map(key => ({
            title: key.replace(/_/g, ' '),
            data: key
        }))
        : [];
    return $('#monthly-data-table').DataTable({
        data: t,
        columns: columns,
        responsive: true,
        dom: "Bfrtip",
        buttons: ['copy','csv','excel','pdf','print',{ extend: 'colvis', text: 'Pilih Kolom' }],
        language: { url: '//cdn.datatables.net/plug-ins/2.0.8/i18n/id.json' }
    });
}
