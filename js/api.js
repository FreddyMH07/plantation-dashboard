// File: js/api.js
// Tugas: Hanya untuk berbicara dengan Google Apps Script API.

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxWSW8Phxl1ZPltuwfYnj0I0GLZ5TfXiHSy7Bl07gNrM6AzTcCqLDDv3PdbKk_zQv18/exec";
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
