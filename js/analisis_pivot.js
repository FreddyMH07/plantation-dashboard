import { postToServer } from './api.js'; // Kita panggil lagi Tim Komunikasi

$(document).ready(function() {
    // --- Elemen UI Khusus Halaman Ini ---
    const dateFilter = $('#date-filter');
    const kebunFilter = $('#kebun-filter');
    const divisiFilter = $('#divisi-filter');
    const pivotGroupBy = $('#pivot-group-by');
    const pivotMetric = $('#pivot-metric');
    const pivotChartType = $('#pivot-chart-type');
    const applyBtn = $('#apply-filter-pivot');
    const chartContainer = $('#pivot-chart-container');
    const alertBox = $('#alert-box');

    let startDate, endDate;

    // Inisialisasi Google Charts
    google.charts.load('current', {'packages':['corechart']});

    // --- Fungsi Utama ---
    function renderChart(data, groupBy, metric, chartType) {
        chartContainer.html(''); // Kosongkan kontainer
        try {
            const metricTitle = metric.replace(/_/g, ' ');
            const groupByTitle = groupBy;

            const aggregatedData = data.reduce((acc, row) => {
                const groupKey = row[groupBy] || 'Lainnya';
                const value = parseFloat(row[metric]) || 0;
                if (!acc[groupKey]) acc[groupKey] = 0;
                acc[groupKey] += value;
                return acc;
            }, {});

            const chartDataArray = [[groupByTitle, metricTitle]];
            for (const key in aggregatedData) {
                chartDataArray.push([key, aggregatedData[key]]);
            }

            if (chartDataArray.length <= 1) {
                chartContainer.html('<p class="text-muted">Tidak ada data yang cukup untuk membuat grafik.</p>');
                return;
            }

            const chartData = google.visualization.arrayToDataTable(chartDataArray);
            let chart;
            const options = { height: 450, title: `Analisis ${metricTitle} per ${groupByTitle}` };

            if (chartType === 'line' && groupBy === 'Tanggal') chart = new google.visualization.LineChart(chartContainer[0]);
            else if (chartType === 'pie') chart = new google.visualization.PieChart(chartContainer[0]);
            else chart = new google.visualization.ColumnChart(chartContainer[0]);

            chart.draw(chartData, options);
        } catch (e) {
            console.error("Gagal membuat chart:", e);
            chartContainer.html(`<div class="alert alert-danger">Gagal membuat grafik: ${e.message}</div>`);
        }
    }

    async function fetchDataAndRender() {
        const filters = {
            startDate: startDate.startOf('day').toISOString(),
            endDate: endDate.endOf('day').toISOString(),
            kebun: kebunFilter.val(),
            divisi: divisiFilter.val()
        };
        const data = await postToServer({ action: 'getDashboardData', filters: filters });
        if (data && data.detailed_table) {
            renderChart(data.detailed_table, pivotGroupBy.val(), pivotMetric.val(), pivotChartType.val());
        } else {
            alertBox.text(data ? data.message : "Gagal mengambil data.").addClass('alert-warning').show();
        }
    }

    async function initializePage() {
        const initialData = await postToServer({ action: 'getInitialData' });
        if (initialData) {
            initialData.kebun.forEach(item => kebunFilter.append(`<option value="<span class="math-inline">\{item\}"\></span>{item}</option>`));
            initialData.divisi.forEach(item => divisiFilter.append(`<option value="<span class="math-inline">\{item\}"\></span>{item}</option>`));

            startDate = moment().subtract(29, 'days');
            endDate = moment();
            dateFilter.daterangepicker({ startDate, endDate, locale: { format: 'DD MMMM YYYY' },
                ranges: { '7 Hari Terakhir': [moment().subtract(6, 'days'), moment()], '30 Hari Terakhir': [moment().subtract(29, 'days'), moment()], 'Bulan Ini': [moment().startOf('month'), moment().endOf('month')] }
            }, (start, end) => { startDate = start; endDate = end; });

            $('[disabled]').prop('disabled', false);
        }
    }

    applyBtn.on('click', fetchDataAndRender);
    initializePage();
});
