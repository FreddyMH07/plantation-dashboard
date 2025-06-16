import { postToServer } from './api.js';

$(document).ready(function() {
    // --- ELEMEN UI ---
    const alertBox = $('#alert-box-pivot');
    const dateFilter = $('#date-filter-pivot');
    const kebunFilter = $('#kebun-filter-pivot');
    const divisiFilter = $('#divisi-filter-pivot');
    const pivotGroupBy = $('#pivot-group-by');
    const pivotMetric = $('#pivot-metric');
    const pivotChartType = $('#pivot-chart-type');
    const applyBtn = $('#apply-filter-pivot');
    const chartContainer = $('#pivot-chart-container');
    let startDate, endDate;

    google.charts.load('current', {'packages':['corechart']});


    //--Untuk Login --
    if (!localStorage.getItem('isLogin')) {
  window.location.href = "login.html";
}

    
    // --- FUNGSI RENDER ---
    function renderChart(data, groupBy, metric, chartType) {
        chartContainer.html('');
        try {
            const metricTitle = metric.replace(/_/g, ' ');
            const groupByTitle = groupBy;
            const aggregatedData = data.reduce((acc, row) => {
                const groupKey = (groupBy === 'Tanggal') ? moment(row[groupBy], "DD MMM YYYY", 'id').format("D MMM") : (row[groupBy] || 'Lainnya');
                const value = parseFloat(row[metric]) || 0;
                if (!acc[groupKey]) acc[groupKey] = 0;
                acc[groupKey] += value;
                return acc;
            }, {});
            const chartDataArray = [[groupByTitle, metricTitle]];
            Object.keys(aggregatedData).sort().forEach(key => chartDataArray.push([key, aggregatedData[key]]));
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
            chartContainer.html(`<div class="alert alert-danger">Gagal membuat grafik: ${e.message}</div>`);
        }
    }

    // --- FUNGSI PENGATUR ---
    async function fetchData() {
        const filters = { startDate: startDate.startOf('day').toISOString(), endDate: endDate.endOf('day').toISOString(), kebun: kebunFilter.val(), divisi: divisiFilter.val() };
        const data = await postToServer({ action: 'getDashboardData', filters: filters }, alertBox);
        if (data && data.detailed_table) {
            renderChart(data.detailed_table, pivotGroupBy.val(), pivotMetric.val(), pivotChartType.val());
        }
    }

    async function initializePage() {
        const initialData = await postToServer({ action: 'getInitialData' }, alertBox);
        if (initialData) {
            initialData.kebun.forEach(item => kebunFilter.append(`<option value="${item}">${item}</option>`));
            initialData.divisi.forEach(item => divisiFilter.append(`<option value="${item}">${item}</option>`));
            startDate = moment().subtract(29, 'days');
            endDate = moment();
            dateFilter.daterangepicker({ startDate, endDate, locale: { format: 'DD MMMM YYYY' } }, (start, end) => { startDate = start; endDate = end; });
            $('[disabled]').prop('disabled', false);
        }
    }

    // --- EVENT LISTENERS ---
    applyBtn.on('click', fetchData);
    initializePage();
});
