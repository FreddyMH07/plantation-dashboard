// js/login.js
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('login-form');
    const alertBox = document.getElementById('login-alert');
    const apiUrl = 'https://script.google.com/macros/s/AKfycbzp1J9xsvkD0EJgYzq9p5B7r0WCXpbDEpYg00gGLE00KsIsM9asuGL9VUkASUdlFiEC/exec'; // Ganti sesuai Web App Script kamu

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
                headers: { 'Content-Type': 'application/json' },
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
