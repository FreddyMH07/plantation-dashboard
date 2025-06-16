import { postToServer } from './api.js';

$(document).ready(function () {
    // --- ELEMEN UI ---
    const alertBox = $('#alert-box-pivot');
    // Filter 1 & 2
    const year1 = $('#year1'), month1 = $('#month1'), kebun1 = $('#kebun1'), divisi1 = $('#divisi1');
    const year2 = $('#year2'), month2 = $('#month2'), kebun2 = $('#kebun2'), divisi2 = $('#divisi2');
    // Metrik & Grafik
    const metricSelect = $('#pivot-metric');
    const chartTypeSelect = $('#pivot-chart-type');
    const applyBtn = $('#apply-filter-pivot');
    const chartContainer = $('#pivot-chart-container');
    // Ringkasan box (optional)
    const summaryBox = $('#pivot-summary-content');

    // Google Charts
    google.charts.load('current', {'packages':['corechart']});

    // -- Cek login --
    if (!localStorage.getItem('isLogin')) window.location.href = "login.html";
    $('#logout-btn').on('click', function () {
        localStorage.clear();
        window.location.replace("login.html");
    });

    // -- Inisialisasi filter --
async function initializePage() {
    const initialData = await postToServer({ action: 'getInitialData' }, alertBox);
    if (initialData) {
        // --- Tahun ---
        year1.empty().append('<option value="">(Semua Tahun)</option>');
        year2.empty().append('<option value="">(Semua Tahun)</option>');
        let currYear = new Date().getFullYear();
        for (let i = currYear; i >= currYear - 5; i--) {
            year1.append(`<option value="${i}">${i}</option>`);
            year2.append(`<option value="${i}">${i}</option>`);
        }
        // --- Bulan ---
        month1.empty().append('<option value="">(Semua Bulan)</option>');
        month2.empty().append('<option value="">(Semua Bulan)</option>');
        for (let i = 1; i <= 12; i++) {
            month1.append(`<option value="${i}">${moment.months(i - 1)}</option>`);
            month2.append(`<option value="${i}">${moment.months(i - 1)}</option>`);
        }
        // --- Kebun & Divisi ---
        kebun1.empty().append('<option value="">(Semua Kebun)</option>');
        kebun2.empty().append('<option value="">(Semua Kebun)</option>');
        divisi1.empty().append('<option value="">(Semua Divisi)</option>');
        divisi2.empty().append('<option value="">(Semua Divisi)</option>');
        initialData.kebun.forEach(item => {
            kebun1.append(`<option value="${item}">${item}</option>`);
            kebun2.append(`<option value="${item}">${item}</option>`);
        });
        initialData.divisi.forEach(item => {
            divisi1.append(`<option value="${item}">${item}</option>`);
            divisi2.append(`<option value="${item}">${item}</option>`);
        });

        // === Default: bulan & tahun sekarang (bukan "semua") ===
        month1.val(String(new Date().getMonth() + 1));
        year1.val(String(currYear));
        month2.val(String(new Date().getMonth() + 1));
        year2.val(String(currYear));
        $('[disabled]').prop('disabled', false);
    }
}


    // -- Mapping untuk kalkulasi metrik custom --
    function calculateMetric(data, metric) {
        // data = array row summary_table bulanan
        const sum = arr => arr.reduce((a,b)=>a+safeNum(b),0);
        if (!data || data.length === 0) return 0;
        switch(metric) {
            case 'Tonase_PKS':
                return sum(data.map(row => row.Timbang_PKS));
            case 'Tonase_Kebun':
                return sum(data.map(row => row.Timbang_Kebun));
            case 'Output_Ha':
                return sum(data.map(row => row.Tonase_Panen_Kg)) / sum(data.map(row => row.Luas_Panen));
            case 'Output_HK':
                return sum(data.map(row => row.Tonase_Panen_Kg)) / sum(data.map(row => row.TK_Panen));
            case 'AKP_Bulanan':
                // = SUM(JJG Panen) / (SUM(Luas Panen) * SPH Panen)
                return sum(data.map(row => row.JJG_Panen)) / (sum(data.map(row => row.Luas_Panen)) * safeNum(data[0].SPH_Panen || 1));
            case 'ACV_Produksi':
                // = SUM(Timbang PKS) / Budget Bulan * 100%
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

    // -- Ambil & render chart --
    async function fetchAndCompare() {
        summaryBox.html(''); chartContainer.html('');
        // Fetch data dari backend untuk kedua filter
        const filter1 = {
            year: year1.val(), month: month1.val(), kebun: kebun1.val(), divisi: divisi1.val()
        };
        const filter2 = {
            year: year2.val(), month: month2.val(), kebun: kebun2.val(), divisi: divisi2.val()
        };
        const [data1, data2] = await Promise.all([
            postToServer({ action: 'getMonthlyData', filters: filter1 }, alertBox),
            postToServer({ action: 'getMonthlyData', filters: filter2 }, alertBox),
        ]);
        if (!data1 || !data2 || !data1.summary_table || !data2.summary_table) {
            alertBox.text("Data tidak ditemukan di salah satu filter.").show();
            return;
        }
        // Pilihan metrik dan tipe chart
        const metric = metricSelect.val();
        const chartType = chartTypeSelect.val();

        // Kalkulasi nilai dari summary_table
        const value1 = calculateMetric(data1.summary_table, metric);
        const value2 = calculateMetric(data2.summary_table, metric);

        // Buat label filter
        function labelText(f) {
            return `${f.kebun || 'All PT'} / ${f.divisi || 'All Divisi'} (${moment.months(f.month-1)} ${f.year})`;
        }
        const labels = [labelText(filter1), labelText(filter2)];

        // Render Chart
        google.charts.setOnLoadCallback(function() {
            const dataArr = [[ 'Filter', metricSelect.find(':selected').text() ], [ labels[0], value1 ], [ labels[1], value2 ]];
            const chartData = google.visualization.arrayToDataTable(dataArr);
            const opts = {
                height: 400,
                title: `Perbandingan ${metricSelect.find(':selected').text()}`
            };
            let chart;
            if (chartType === 'pie')      chart = new google.visualization.PieChart(chartContainer[0]);
            else if (chartType === 'line')chart = new google.visualization.LineChart(chartContainer[0]);
            else                          chart = new google.visualization.ColumnChart(chartContainer[0]);
            chart.draw(chartData, opts);
        });

        // Optional: Summary box
        summaryBox.html(`
            <div class="row g-2">
                <div class="col-md-6"><div class="kpi-box"><div class="title">Filter 1</div><div class="value">${labels[0]}<br><b>${value1.toLocaleString('id-ID')}</b></div></div></div>
                <div class="col-md-6"><div class="kpi-box"><div class="title">Filter 2</div><div class="value">${labels[1]}<br><b>${value2.toLocaleString('id-ID')}</b></div></div></div>
            </div>
        `);
    }

    // -- Event --
    applyBtn.on('click', fetchAndCompare);
    initializePage();
});
