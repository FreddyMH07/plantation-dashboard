import { postToServer } from './api.js';

$(document).ready(function () {
    // === ELEMEN UI ===
    const alertBox = $('#alert-box-pivot');

    // Filter utama
    const yearFilter   = $('#year-filter-pivot');
    const monthFilter  = $('#month-filter-pivot');
    const kebunFilter  = $('#kebun-filter-pivot');
    const divisiFilter = $('#divisi-filter-pivot');
    const applyBtn     = $('#apply-filter-pivot');
    // Area summary
    const summaryContent = $('#pivot-summary-content');
    // Chart & Table
    const chartTrendContainer = $('#pivot-trend-chart');
    const chartBarContainer   = $('#pivot-bar-chart');
    const rankingTableContainer = $('#pivot-ranking-table');
    const masterDataPanel = $('#pivot-master-data');
    // Export
    const exportExcelBtn = $('#pivot-export-excel');
    const exportPdfBtn   = $('#pivot-export-pdf');

    let pivotTable = null;
    google.charts.load('current', {'packages':['corechart','bar']});

    // -- Cek login --
    if (!localStorage.getItem('isLogin')) window.location.href = "login.html";
    $('#logout-btn').on('click', function () {
        localStorage.clear();
        window.location.replace("login.html");
    });

    // === INISIALISASI FILTER ===
    async function initializePage() {
        const initialData = await postToServer({ action: 'getInitialData' }, alertBox);
        if (initialData) {
            // Tahun
            const currentYear = new Date().getFullYear();
            for (let i = currentYear; i >= currentYear - 5; i--) {
                yearFilter.append(`<option value="${i}">${i}</option>`);
            }
            // Bulan
            for (let i = 1; i <= 12; i++) {
                monthFilter.append(`<option value="${i}">${moment.months(i - 1)}</option>`);
            }
            // Kebun & Divisi
            kebunFilter.empty().append('<option value="">(Semua Kebun)</option>');
            divisiFilter.empty().append('<option value="">(Semua Divisi)</option>');
            initialData.kebun.forEach(item => kebunFilter.append(`<option value="${item}">${item}</option>`));
            initialData.divisi.forEach(item => divisiFilter.append(`<option value="${item}">${item}</option>`));

            // Default: bulan & tahun berjalan
            monthFilter.val(new Date().getMonth() + 1);
            yearFilter.val(currentYear);
            $('[disabled]').prop('disabled', false);
        }
    }

    // === FETCH DATA & RENDER ===
    async function fetchAndRenderPivot() {
        summaryContent.html('');
        chartTrendContainer.html('');
        chartBarContainer.html('');
        rankingTableContainer.html('');
        masterDataPanel.html('');
        if (pivotTable) { pivotTable.destroy(); }

        // 1. Ambil data dari backend
        const filters = {
            year: yearFilter.val(),
            month: monthFilter.val(),
            kebun: kebunFilter.val(),
            divisi: divisiFilter.val()
        };
        const data = await postToServer({ action: 'getMonthlyData', filters: filters }, alertBox);
        if (!data || data.isEmpty) {
            alertBox.text(data?.message || "Data tidak ditemukan").show();
            return;
        }

        // 2. === SUMMARY BOXES ===
        summaryContent.html(`
            <div class="row g-2">
                <div class="col-md-3"><div class="kpi-box"><div class="title">ACV Produksi</div><div class="value">${data.kpi.acv_monthly}</div></div></div>
                <div class="col-md-3"><div class="kpi-box"><div class="title">Tonase PKS</div><div class="value">${data.kpi.total_tonase_pks} <small>Kg</small></div></div></div>
                <div class="col-md-3"><div class="kpi-box"><div class="title">Janjang Kirim</div><div class="value">${data.kpi.total_jjg}</div></div></div>
                <div class="col-md-3"><div class="kpi-box"><div class="title">Budget Bulan Ini</div><div class="value">${data.realisasi_vs_budget.budget.toLocaleString('id-ID')} <small>Kg</small></div></div></div>
            </div>
        `);

        // 3. === PANEL MASTER DATA ===
        if (data.master_data_display) {
            masterDataPanel.html(`
                <div class="card mb-3 shadow-sm">
                  <div class="card-header">Master Data Bulan Ini</div>
                  <div class="card-body row text-center">
                    <div class="col"><div class="title">SPH</div><div class="value">${data.master_data_display.sph}</div></div>
                    <div class="col"><div class="title">Luas TM (Ha)</div><div class="value">${data.master_data_display.luas_tm}</div></div>
                    <div class="col"><div class="title">Pokok (PKK)</div><div class="value">${data.master_data_display.pkk}</div></div>
                  </div>
                </div>
            `);
        }

        // 4. === TREND CHART: Tonase PKS Per Tanggal ===
        try {
            const trendTable = data.summary_table;
            // Asumsi summary_table berisi data per hari pada bulan tsb (atau agregat sesuai kebutuhan)
            if (trendTable.length > 1) {
                const chartDataArr = [['Tanggal', 'Tonase PKS']];
                trendTable.forEach(row => chartDataArr.push([row.Tanggal, Number(row.Timbang_PKS) || 0]));
                const chartData = google.visualization.arrayToDataTable(chartDataArr);
                const options = { height: 350, title: 'Trend Tonase PKS', curveType: 'function', legend: { position: 'bottom' } };
                new google.visualization.LineChart(chartTrendContainer[0]).draw(chartData, options);
            }
        } catch (e) {
            chartTrendContainer.html('<div class="alert alert-warning">Gagal memuat trend chart.</div>');
        }

        // 5. === BAR CHART PERBANDINGAN (PT/Kebun atau Divisi) ===
        try {
            // Aggregasi per PT/Kebun/Divisi
            const perPT = {}, perDiv = {};
            data.summary_table.forEach(row => {
                if (!perPT[row.Kebun]) perPT[row.Kebun] = 0;
                perPT[row.Kebun] += Number(row.Timbang_PKS) || 0;
                if (!perDiv[row.Divisi]) perDiv[row.Divisi] = 0;
                perDiv[row.Divisi] += Number(row.Timbang_PKS) || 0;
            });
            const barPTData = [['PT/Kebun', 'Tonase PKS']];
            Object.entries(perPT).forEach(([pt, tonase]) => barPTData.push([pt, tonase]));
            const barDivData = [['Divisi', 'Tonase PKS']];
            Object.entries(perDiv).forEach(([div, tonase]) => barDivData.push([div, tonase]));

            if (barPTData.length > 1) {
                const chartData = google.visualization.arrayToDataTable(barPTData);
                new google.visualization.ColumnChart(chartBarContainer[0]).draw(chartData, { height: 350, title: 'Perbandingan Tonase PKS antar PT/Kebun' });
            }
            // Bisa render chartDivData juga jika ingin bar divisi
        } catch (e) {
            chartBarContainer.html('<div class="alert alert-warning">Gagal memuat bar chart.</div>');
        }

        // 6. === RANKING TABLE (Top/Bottom 3 Divisi/PT) ===
        try {
            // Ranking PT
            const ranking = Object.entries(perPT).sort((a,b) => b[1]-a[1]);
            let rankingHtml = `
                <div class="card mt-3 shadow-sm">
                  <div class="card-header">Ranking PT (Tonase PKS)</div>
                  <div class="card-body p-2">
                    <table class="table table-sm table-striped mb-0"><thead><tr><th>#</th><th>PT</th><th>Tonase PKS</th></tr></thead><tbody>
            `;
            ranking.slice(0,3).forEach((row, i) => {
                rankingHtml += `<tr><td>${i+1}</td><td>${row[0]}</td><td>${row[1].toLocaleString('id-ID')}</td></tr>`;
            });
            ranking.slice(-3).forEach((row, i) => {
                rankingHtml += `<tr><td>${ranking.length-2+i}</td><td>${row[0]}</td><td>${row[1].toLocaleString('id-ID')}</td></tr>`;
            });
            rankingHtml += `</tbody></table></div></div>`;
            rankingTableContainer.html(rankingHtml);
        } catch (e) {
            rankingTableContainer.html('<div class="alert alert-warning">Gagal memuat ranking table.</div>');
        }

        // 7. === DATA PIVOT / EXPORT (semua kolom summary_table) ===
        if (pivotTable) { pivotTable.destroy(); }
        pivotTable = $('#pivot-data-table').DataTable({
            data: data.summary_table,
            columns: data.summary_table.length > 0 ?
                Object.keys(data.summary_table[0]).map(key => ({ title: key.replace(/_/g, ' '), data: key })) : [],
            responsive: true,
            dom: "Bfrtip",
            buttons: ['copy', 'excel', 'pdf', 'print', { extend: 'colvis', text: 'Pilih Kolom' }],
            language: { url: '//cdn.datatables.net/plug-ins/2.0.8/i18n/id.json' },
        });

        // 8. === Export Button handler (optional, pakai DataTables button sudah cukup) ===
        // exportExcelBtn.on('click', function() { ... }); // Sudah by DataTables
        // exportPdfBtn.on('click', function() { ... }); // Sudah by DataTables
    }

    // === EVENT ===
    applyBtn.on('click', fetchAndRenderPivot);
    initializePage();
});
