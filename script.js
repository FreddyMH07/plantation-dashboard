// Jalankan semua kode setelah halaman siap
$(document).ready(function() {
    // --- KONFIGURASI PENTING ---
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzwVP2V-I73WqIkKaTQmWkb40Qhf_xJKjxMGEK2AqISjhG4ii-R9fvWtKgWGVgxRDk6/exec";

    // --- ELEMEN UI ---
    const loader = $('#loader');
    const alertBox = $('#alert-box');
    const dateFilter = $('#date-filter');
    const kebunFilter = $('#kebun-filter');
    const divisiFilter = $('#divisi-filter');
    const applyBtn = $('#apply-filter');
    const dashboardContent = $('#dashboard-content');

    let dailyTable;
    let dailyStartDate, dailyEndDate;

    // --- FUNGSI-FUNGSI ---

    async function postToServer(requestBody) {
        loader.show();
        try {
            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify(requestBody),
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            });
            const data = await response.json();
            if (data.error) throw new Error(data.error);
            return data;
        } catch (error) {
            showAlert(`Error: ${error.message}`, 'danger');
            console.error('Error fetching data:', error);
        } finally {
            loader.hide();
        }
    }

    function showAlert(message, type = 'info') {
        alertBox.removeClass('alert-info alert-warning alert-danger').addClass(`alert-${type}`).text(message).show();
    }

    function renderDashboard(data) {
        dashboardContent.empty().hide(); // Kosongkan konten lama
        if (!data || data.isEmpty) {
            showAlert(data ? data.message : 'Tidak ada data.', 'warning');
            return;
        }

        // 1. Render KPI dan Master Data
        const kpiHtml = `
            <div class="col-lg-3 col-md-6">
                <div class="kpi-box"><div class="title">ACV Production</div><div class="value">${data.kpi_acv.value}</div></div>
            </div>
            <div class="col-lg-9 col-md-6">
                <div class="card master-data-card h-100"><div class="card-body row text-center align-items-center">
                    <div class="col"><div class="title">SPH</div><div class="value">${data.master_data_display.sph}</div></div>
                    <div class="col"><div class="title">Luas TM (Ha)</div><div class="value">${data.master_data_display.luas_tm}</div></div>
                    <div class="col"><div class="title">Pokok (Pkk)</div><div class="value">${data.master_data_display.pkk}</div></div>
                    <div class="col"><div class="title">Budget Bulan Ini</div><div class="value">${parseFloat(data.master_data_display.budget_monthly).toLocaleString('id-ID')}</div></div>
                </div></div>
            </div>
        `;

        // 2. Render Chart
        const chartHtml = `
            <div class="col-12">
                <div class="card shadow-sm"><div class="card-body"><div id="chart-div" style="height: 350px;"></div></div></div>
            </div>
        `;
        
        // 3. Render Tabel
        const tableHtml = `
            <div class="col-12">
                <div class="card shadow-sm"><div class="card-body">
                    <h5 class="card-title fw-bold">Detail Data Harian</h5>
                    <table id="data-table" class="table table-striped table-bordered" style="width:100%"></table>
                </div></div>
            </div>
        `;

        dashboardContent.html(kpiHtml + chartHtml + tableHtml).show();

        // Gambar Chart setelah elemennya ada di halaman
        try {
            const chartData = google.visualization.arrayToDataTable([
                ['Metrik', 'Nilai (Kg)', { role: 'style' }],
                ['Budget Harian', data.daily_comparison.budget, '#6c757d'],
                ['Realisasi Kebun', data.daily_comparison.kebun, '#17a2b8'],
                ['Realisasi PKS', data.daily_comparison.pks, '#0d6efd']
            ]);
            const chartOptions = { title: 'Budget Harian vs Realisasi (Kg)', legend: { position: 'none' }, chartArea: { width: '85%' } };
            const chart = new google.visualization.ColumnChart(document.getElementById('chart-div'));
            chart.draw(chartData, chartOptions);
        } catch (e) {
            console.error("Gagal memuat Google Chart:", e);
            $('#chart-div').html('<div class="alert alert-warning">Gagal memuat grafik.</div>');
        }

        // Inisialisasi DataTables
        if (dailyTable) { dailyTable.destroy(); }
        const columns = data.detailed_table.length > 0 ? Object.keys(data.detailed_table[0]).map(key => ({ title: key.replace(/_/g, ' '), data: key })) : [];
        dailyTable = $('#data-table').DataTable({
            data: data.detailed_table,
            columns: columns,
            responsive: true,
            dom: "Bfrtip",
            buttons: ['copy', 'csv', 'excel', 'pdf', 'print', { extend: 'colvis', text: 'Pilih Kolom' }],
            language: { url: '//cdn.datatables.net/plug-ins/2.0.8/i18n/id.json' }
        });
    }

    async function fetchAndRenderData() {
        const filters = {
            startDate: dailyStartDate.startOf('day').toISOString(),
            endDate: dailyEndDate.endOf('day').toISOString(),
            kebun: kebunFilter.val(),
            divisi: divisiFilter.val()
        };
        const data = await postToServer({ action: 'getDashboardData', filters: filters });
        renderDashboard(data);
    }
    
    async function initializePage() {
        showAlert('Mengambil data filter...');
        google.charts.load('current', {'packages':['corechart']});

        const data = await postToServer({ action: 'getInitialData' });
        
        if (data) {
            ['kebun', 'divisi'].forEach(type => {
                const filterEl = $(`#${type}-filter`);
                filterEl.empty().append($('<option>', { text: `SEMUA ${type.toUpperCase()}` }));
                data[type].forEach(item => filterEl.append($('<option>', { value: item, text: item })));
            });
            
            dailyStartDate = moment().startOf('month');
            dailyEndDate = moment();
            dateFilter.daterangepicker({
                startDate: dailyStartDate, endDate: dailyEndDate, locale: { format: 'DD MMMM YYYY' },
                ranges: {
                   'Hari Ini': [moment(), moment()], 'Bulan Ini': [moment().startOf('month'), moment().endOf('month')],
                   'Bulan Lalu': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
                }
            }, (start, end) => { dailyStartDate = start; dailyEndDate = end; });
            
            $('[disabled]').prop('disabled', false);
            showAlert('Silakan pilih filter dan klik Terapkan.');
        }
    }
    
    // --- EVENT LISTENERS & INISIALISASI ---
    applyBtn.on('click', fetchAndRenderData);
    initializePage();
});
