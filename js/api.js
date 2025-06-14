// File: js/api.js
// Tugas: Hanya untuk berbicara dengan Google Apps Script API.

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbylE6mYK4S_7B2MOlulDgYXEE-esoytFthln3ZGV4HY7_-VQY8OqaF3ga2-85bh-igo/exec";
const loader = $('#loader');

export async function postToServer(requestBody, alertBox) {
    loader.show();
    if(alertBox) alertBox.hide();
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(requestBody),
            headers: { 'Content-Type': 'text/plain' },
            mode: 'cors',
            redirect: 'follow'
        });
       if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        return data;
    } catch (error) {
        const message = `Error: ${error.message}`;
        if (alertBox && alertBox.length) alertBox.removeClass('alert-info alert-warning').addClass('alert-danger').text(message).show();
        console.error('Error in postToServer:', error);
        return null;
    } finally {
        loader.hide();
    }
}
