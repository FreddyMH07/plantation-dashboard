import { postToServer } from './api.js';

$(document).ready(function () {
    // Elemen
    const alertBox     = $('#alert-box-monthly');
    const yearFilter   = $('#year-filter');
    const monthFilter  = $('#month-filter');
    const kebunFilter  = $('#kebun-filter-monthly');
    const divisiFilter = $('#divisi-filter-monthly');
    const applyBtn     = $('#apply-filter-monthly');
    const metricSelect = $('#monthly-metric');
    const chartTypeSelect = $('#monthly-chart-type');
    const dashboardContent = $('#monthly-dashboard-content');
    const chartContainer   = $('#monthly-chart-div');
    let monthlyTable;

    google.charts.load('current', {'packages':['corechart']});

    // --- LOGIN ---
    if (!localStorage.getItem('isLogin')) window.location.href = "login.html";
    $('#logout-btn').on('click', function () {
        localStorage.clear();
        window.location.replace("login.html");
    });

    // --- INIT FILTERS ---
    async function initializePage() {
        const initialData = await postToServer({ action: 'getInitialData' }, alertBox);
        if (initialData) {
            // Tahun/Bulan
            yearFilter.empty().append('<option value="">(Semua Tahun)</option>');
            monthFilter.empty().append('<option value="">(Semua Bulan)</option>');
            let currYear = new Date().getFullYear();
            for (let i = currYear; i >= currYear - 5; i--) yearFilter.append(`<option value="${i}">${i}</option>`);
            for (let i = 1; i <= 12; i++) monthFilter.append(`<option value="${i}">${moment.months(i - 1)}</option>`);
            yearFilter.val(currYear); monthFilter.val(new Date().getMonth() + 1);

            // Kebun & Divisi (dengan PT SAG = semua)
            kebunFilter.empty().append('<option value="">(Semua Kebun)</option>');
            kebunFilter.append('<option value="PT SAG">(PT SAG)</option>');
            initialData.kebun.forEach(item => kebunFilter.append(`<option value="${item}">${item}</option>`));
            divisiFilter.empty().append('<option value="">(Semua Divisi)</option>');
            divisiFilter.append('<option value="PT SAG">(PT SAG)</option>');
            initialData.divisi.forEach(item => divisiFilter.append(`<option value="${item}">${item}</option>`));
            $('[disabled]').prop('disabled', false);

            // Default metric (Tonase PKS)
            metricSelect.val('Tonase_PKS');
            chartTypeSelect.val('bar');
        }
    }

    // --- HITUNG METRIK (SESUAI PILIHAN USER) ---
    function calculateMetric(data, metric) {
        const sum = arr => arr.reduce((a,b)=>a+safeNum(b),0);
        if (!data || data.length === 0) return 0;
        switch(metric) {
            case 'Tonase_PKS':
                return sum(data.map(row => row.Timbang_PKS));
            case 'Tonase_Kebun':
                return sum(data.map(row => row.Timbang_Kebun));
            case 'Selisih_Tonase':
                return sum(data.map(row => row.Timbang_PKS)) - sum(data.map(row => row.Timbang_Kebun));
            case 'Output_Ha':
                return sum(data.map(row => row.Tonase_Panen_Kg)) / sum(data.map(row => row.Luas_Panen));
            case 'Output_HK':
                return sum(data.map(row => row.Tonase_Panen_Kg)) / sum(data.map(row => row.TK_Panen));
            case 'AKP_Bulanan':
                return sum(data.map(row => row.JJG_Panen)) / (sum(data.map(row => row.Luas_Panen)) * safeNum(data[0].SPH_Panen || 1));
            case 'ACV_Produksi':
                let budget = safeNum(data[0].Budget_Bulanan || 1);
                return sum(data.map(row => row.Timbang_PKS)) / budget * 100;
            case 'Refraksi_Bulanan':
                return sum(data.map(row => row.Refraksi_Kg)) / sum(data.map(row => row.Tonase_Panen_Kg));
            case 'BJR_Bulanan':
                return sum(data.map(row => row.Timbang_Kebun)) / sum(data.map(row => row.JJG_Panen));
            case 'Deviasi_Budget':
                let rls = sum(data.map(row => row.Timbang_PKS));
                let bdg = safeNum(data[0].Budget_Bulanan || 1);
                return (rls-bdg)/bdg*100;
            case 'Restan_Bulanan':
                return sum(data.map(row => row.Restan_Jjg));
            default: return 0;
        }
    }
    function safeNum(x) { return typeof x === "number" ? x : (Number(String(x).replace(/[^0-9.-]/g,''))||0); }

    // --- RENDER DASHBOARD ---
    function renderDashboard(data) {
        dashboardContent.empty().hide();
        if (!data || data.isEmpty) {
            showAlert(data.message || 'Tidak ada data.', 'warning');
            return;
        }

        // KPI area: semua metrik
        const kpi = {
            'Tonase_PKS': calculateMetric(data.summary_table, 'Tonase_PKS'),
            'Tonase_Kebun': calculateMetric(data.summary_table, 'Tonase_Kebun'),
            'Selisih_Tonase': calculateMetric(data.summary_table, 'Selisih_Tonase'),
            'Output_Ha': calculateMetric(data.summary_table, 'Output_Ha'),
            'Output_HK': calculateMetric(data.summary_table, 'Output_HK'),
            'AKP_Bulanan': calculateMetric(data.summary_table, 'AKP_Bulanan'),
            'ACV_Produksi': calculateMetric(data.summary_table, 'ACV_Produksi'),
            'Refraksi_Bulanan': calculateMetric(data.summary_table, 'Refraksi_Bulanan'),
            'BJR_Bulanan': calculateMetric(data.summary_table, 'BJR_Bulanan'),
            'Deviasi_Budget': calculateMetric(data.summary_table, 'Deviasi_Budget'),
            'Restan_Bulanan': calculateMetric(data.summary_table, 'Restan_Bulanan')
        };

        // KPI HTML (bisa grid 2 kolom)
        let kpiHtml = `
        <div class="row g-2 mb-3">
            <div class="col-md-3"><div class="kpi-box"><div class="title">Tonase PKS</div><div class="value">${kpi.Tonase_PKS.toLocaleString('id-ID')} Kg</div></div></div>
            <div class="col-md-3"><div class="kpi-box"><div class="title">Tonase Kebun</div><div class="value">${kpi.Tonase_Kebun.toLocaleString('id-ID')} Kg</div></div></div>
            <div class="col-md-3"><div class="kpi-box"><div class="title">Selisih Tonase</div><div class="value">${kpi.Selisih_Tonase.toLocaleString('id-ID')} Kg</div></div></div>
            <div class="col-md-3"><div class="kpi-box"><div class="title">Output/Ha</div><div class="value">${(kpi.Output_Ha||0).toFixed(2)}</div></div></div>
            <div class="col-md-3"><div class="kpi-box"><div class="title">Output/HK</div><div class="value">${(kpi.Output_HK||0).toFixed(2)}</div></div></div>
            <div class="col-md-3"><div class="kpi-box"><div class="title">AKP Bulanan</div><div class="value">${(kpi.AKP_Bulanan*100||0).toFixed(2)} %</div></div></div>
            <div class="col-md-3"><div class="kpi-box"><div class="title">ACV Produksi</div><div class="value">${(kpi.ACV_Produksi||0).toFixed(2)} %</div></div></div>
            <div class="col-md-3"><div class="kpi-box"><div class="title">Refraksi Bulanan</div><div class="value">${(kpi.Refraksi_Bulanan*100||0).toFixed(2)} %</div></div></div>
            <div class="col-md-3"><div class="kpi-box"><div class="title">BJR Bulanan</div><div class="value">${(kpi.BJR_Bulanan||0).toFixed(2)}</div></div></div>
            <div class="col-md-3"><div class="kpi-box"><div class="title">Deviasi Budget</div><div class="value">${(kpi.Deviasi_Budget||0).toFixed(2)} %</div></div></div>
            <div class="col-md-3"><div class="kpi-box"><div class="title">Restan Bulanan</div><div class="value">${kpi.Restan_Bulanan.toLocaleString('id-ID')}</div></div></div>
        </div>`;

        // Tabel data bulanan
        const tableHtml = `<div class="col-12"><div class="card shadow-sm"><div class="card-body"><h5 class="card-title fw-bold">Ringkasan Data Bulanan</h5><div class="table-responsive"><table id="monthly-data-table" class="table table-striped" style="width:100%"></table></div></div></div></div>`;

        dashboardContent.html(kpiHtml + '<div class="mb-4"></div>' + '<div id="monthly-chart-div"></div>' + tableHtml).show();

        // CHART: perbandingan metrik
        try {
            const metric = metricSelect.val();
            const val = kpi[metric];
            const chartType = chartTypeSelect.val();
            // Bar/Pie/Line (single value, tapi pakai bar chart atau pie chart)
            const chartDataArr = [[ 'Label', metricSelect.find(':selected').text() ], [ 'Nilai', val ]];
            const chartData = google.visualization.arrayToDataTable(chartDataArr);
            let chart;
            const opts = { height: 350, title: `Perbandingan ${metricSelect.find(':selected').text()}` };
            if (chartType === 'pie')      chart = new google.visualization.PieChart(chartContainer[0]);
            else if (chartType === 'line')chart = new google.visualization.LineChart(chartContainer[0]);
            else                          chart = new google.visualization.ColumnChart(chartContainer[0]);
            chart.draw(chartData, opts);
        } catch(e) { chartContainer.html(`<div class="alert alert-warning">Gagal memuat grafik.</div>`); }

        // DataTables: summary_table
        if (monthlyTable) monthlyTable.destroy();
        const columns = data.summary_table.length > 0 ? Object.keys(data.summary_table[0]).map(key => ({ title: key.replace(/_/g, ' '), data: key })) : [];
        monthlyTable = $('#monthly-data-table').DataTable({
            data: data.summary_table,
            columns: columns,
            responsive: true,
            dom: "Bfrtip",
            buttons: ['excel', 'pdf', 'print']
        });
    }

    // --- FETCH DATA ---
    async function fetchData() {
        // PT SAG: if dipilih, treat as empty (artinya all)
        let kebunVal = kebunFilter.val() === "PT SAG" ? "" : kebunFilter.val();
        let divisiVal = divisiFilter.val() === "PT SAG" ? "" : divisiFilter.val();
        const filters = {
            year: yearFilter.val(),
            month: monthFilter.val(),
            kebun: kebunVal,
            divisi: divisiVal
        };
        const data = await postToServer({ action: 'getMonthlyData', filters: filters }, alertBox);
        if (data) renderDashboard(data);
    }

    // --- EVENT ---
    applyBtn.on('click', fetchData);
    metricSelect.on('change', fetchData);
    chartTypeSelect.on('change', fetchData);

    initializePage();
});
