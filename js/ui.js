// File: js/ui.js
// Tugas: Membangun dan memperbarui semua elemen utility & global di halaman.
/**

/**
 * Render Dashboard Harian (daily) secara lengkap ke container tertentu.
 * @param {object} data - Data hasil fetch dari server.
 * @param {JQuery<HTMLElement>} dashboardContent - Kontainer dashboard harian (misal: $('#daily-dashboard-content'))
 * @param {DataTable.Api|null} dailyTable - Instance DataTable sebelumnya (biar bisa destroy).
 * @returns {DataTable.Api} - Instance DataTable terbaru (return supaya bisa dipakai lagi).
 */

// --- ALERT ---
export function showAlert(alertBox, message, type = 'info') {
    if (!alertBox || alertBox.length === 0) return;
    alertBox
        .removeClass('alert-info alert-warning alert-success alert-danger')
        .addClass(`alert-${type}`)
        .text(message)
        .show();
}


/** Utility global: Penjumlahan satu kolom array object */
export function sumField(arr, key) {
    return arr.reduce((a, b) => a + (parseFloat(b[key]) || 0), 0);
}


/** Utility tambahan opsional */
export function formatNumber(num) {
    return (num || 0).toLocaleString('id-ID');
}
