// js/login.js
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('login-form');
    const alertBox = document.getElementById('login-alert');
    const apiUrl = 'https://script.google.com/macros/s/AKfycby8TllBgSIGOYiFl4YOvfbhSXOY6TQm-bFzOAx536-5B5-g9Ez4Zrvo99-Z1_i6Xnlrpg/exec'; // Ganti sesuai Web App Script kamu

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        alertBox.style.display = 'none';
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const urlParams = new URLSearchParams(window.location.search);
        const nextPage = urlParams.get('next') || 'produksi.html';

        // Simple loader (optional)
        form.querySelector('button[type="submit"]').disabled = true;

        try {
            const resp = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({
                    action: "login",
                    username: username,
                    password: password
                })
            });
            const data = await resp.json();

            if (data.success) {
                // Simpan sesi di localStorage
                localStorage.setItem('isLogin', 'true');
                localStorage.setItem('username', data.username);
                localStorage.setItem('nama', data.nama);
                localStorage.setItem('role', data.role);
                // Redirect ke dashboard/menu utama
                window.location.replace(nextPage);
            } else {
                alertBox.textContent = data.message || "Login gagal!";
                alertBox.style.display = 'block';
            }
        } catch (err) {
            alertBox.textContent = "Terjadi error: " + err.message;
            alertBox.style.display = 'block';
        }
        form.querySelector('button[type="submit"]').disabled = false;
    });
});
