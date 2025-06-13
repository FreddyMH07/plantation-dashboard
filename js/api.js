// File: js/api.js
// Tugas: Hanya untuk berbicara dengan Google Apps Script API.

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxs_A3jUSpJ34L2IjNjsiQEPbuhc4UDBLxiN_BgMqnjcaV_8LGFkMUdBoui9VFCevw/exec"; // <-- PASTIKAN INI URL API ANDA YANG BENAR
const loader = $('#loader');

export async function postToServer(requestBody) {
    loader.show();
    $('#alert-box').hide();
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(requestBody),
            headers: { 'Content-Type': 'text/plain' },
            mode: 'cors',
            redirect: 'follow'
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        return data;
    } catch (error) {
        $('#alert-box').removeClass('alert-info alert-warning alert-danger').addClass('alert-danger').text(`Error: ${error.message}`).show();
        console.error('Error in postToServer:', error);
        return null;
    } finally {
        loader.hide();
    }
}
