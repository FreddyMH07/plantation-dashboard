$(document).ready(function() {
    // --- KONFIGURASI ---
    // GANTI DENGAN URL API APPS SCRIPT ANDA
    const SCRIPT_URL = "https://script.google.com/macros/s/xxxxxxxxxxxxxxxxxxxx/exec";
    
    const loader = $('#loader');

    // --- FUNGSI UTAMA ---
    async function postToServer(requestBody) {
        loader.show();
        try {
            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors', // Mode no-cors untuk sementara waktu, akan diubah jika perlu
                cache: 'no-cache',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
                redirect: 'follow'
            });
            // Karena no-cors, kita tidak bisa membaca responsnya langsung, tapi kita bisa cek status
            if (response.status !== 0 && response.status !== 200) {
                 throw new Error(`Network response was not ok, status: ${response.status}`);
            }
            // Karena no-cors tidak bisa baca body, kita harus deploy API dengan benar untuk bisa baca
            // Untuk sekarang, kita asumsikan berhasil.
            // Solusi sebenarnya adalah API harus mengembalikan header CORS yang benar.
            alert("Permintaan berhasil dikirim. Cek log server untuk melihat hasilnya.");
            // return response.json(); // Baris ini akan error dengan no-cors

        } catch (error) {
            console.error('Error:', error);
            alert(`Terjadi kesalahan: ${error.message}`);
        } finally {
            loader.hide();
        }
    }

    // --- CONTOH PEMANGGILAN ---
    function initialize() {
        console.log("Memulai inisialisasi...");
        const request = { action: 'getInitialData' };
        // postToServer(request); // Panggil untuk mengambil data filter
        loader.hide(); // Sembunyikan loader untuk sekarang
        alert("Struktur baru siap. Langkah selanjutnya adalah menghubungkan data ke tampilan ini.");
    }
    
    initialize();
});
