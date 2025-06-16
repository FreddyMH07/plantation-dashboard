import { postToServer } from './api.js';

const API_URL = "https://script.google.com/macros/s/AKfycbylE6mYK4S_7B2MOlulDgYXEE-esoytFthln3ZGV4HY7_-VQY8OqaF3ga2-85bh-igo/exec"; // Ganti jika beda

$(document).ready(function() {
  const form = $('#login-form');
  const alertBox = $('#login-alert');

  form.on('submit', async function(e) {
    e.preventDefault();
    alertBox.addClass('d-none');
    const username = $('#username').val().trim();
    const password = $('#password').val().trim();

    if (!username || !password) {
      alertBox.text('Username dan password wajib diisi.').removeClass('d-none');
      return;
    }

    try {
      const res = await postToServer({ action: 'login', username, password }, alertBox);
      if (res && res.success) {
        // Simpan session di localStorage (bisa dikembangkan pakai JWT/session)
        localStorage.setItem('isLogin', 'true');
        localStorage.setItem('username', res.username);
        localStorage.setItem('nama', res.nama);
        localStorage.setItem('role', res.role);
        // Redirect ke dashboard
        window.location.href = "index.html";
      } else {
        alertBox.text(res.message || 'Login gagal.').removeClass('d-none');
      }
    } catch (err) {
      alertBox.text('Terjadi kesalahan jaringan.').removeClass('d-none');
    }
  });
});
