// File: js/ui_pivot.js
import { showAlert } from './ui.js';

/**
 * Render Pivot/Analytic Chart (harian/bulanan).
 * @param {array} tableData - Array hasil filter (raw summary dari backend).
 * @param {string} groupBy  - Kolom untuk di-group (misal: 'Kebun', 'Divisi', 'Tanggal').
 * @param {string} metric   - Metode/kolom yang diukur/di-chart.
 * @param {string} chartType- Jenis chart: 'bar', 'line', atau 'pie'.
 * @param {string} containerId - ID kontainer chart (HTML).
 */
export function renderPivotChart(tableData, groupBy, metric, chartType, containerId = 'pivot-chart-container') {
    // Validasi data
    if (!Array.isArray(tableData) || tableData.length === 0) {
        showAlert($('#alert-box-pivot'), 'Tidak ada data untuk pivot chart.', 'warning');
        $(`#${containerId}`).html('<div class="alert alert-warning">Tidak ada data untuk pivot chart.</div>');
        return;
    }

    const metricTitle = metric.replace(/_/g, ' ');
    const groupByTitle = groupBy.replace(/_/g, ' ');
    const pivotTitle = `Analisis ${metricTitle} per ${groupByTitle}`;

    // --- Aggregate: sum per group ---
    const aggregatedData = tableData.reduce((acc, row) => {
        const groupKey = row[groupBy] || 'Lainnya';
        const value = parseFloat(row[metric]) || 0;
        if (!acc[groupKey]) acc[groupKey] = 0;
        acc[groupKey] += value;
        return acc;
    }, {});

    const chartDataArray = [[groupByTitle, metricTitle, { role: 'style' }]];
    const colors = ['#4285F4', '#DB4437', '#F4B400', '#0F9D58', '#AB47BC', '#00ACC1', '#FF7043', '#9E9D24'];
    let colorIndex = 0;
    for (const key in aggregatedData) {
        chartDataArray.push([key, aggregatedData[key], colors[colorIndex % colors.length]]);
        colorIndex++;
    }

    if (chartDataArray.length <= 1) {
        $(`#${containerId}`).html('<div class="alert alert-warning">Tidak ada data yang bisa diproses untuk chart.</div>');
        return;
    }

    // --- Render Google Chart ---
    try {
        const chartData = google.visualization.arrayToDataTable(chartDataArray);
        let chart;
        const options = {
            title: pivotTitle,
            height: 370,
            chartArea: { width: '80%', height: '70%' },
            legend: { position: (chartType === 'pie') ? 'right' : 'none' }
        };
        const chartContainer = document.getElementById(containerId);

        if (chartType === 'line') chart = new google.visualization.LineChart(chartContainer);
        else if (chartType === 'pie') chart = new google.visualization.PieChart(chartContainer);
        else chart = new google.visualization.ColumnChart(chartContainer);

        chart.draw(chartData, options);
    } catch (e) {
        $(`#${containerId}`).html(`<div class="alert alert-danger">Gagal membuat chart: ${e.message}</div>`);
    }
}
