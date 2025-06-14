// File: js/api.js
// Tugas: Hanya untuk berbicara dengan Google Apps Script API.

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyIWO6vVfTIywJuPf-bPplPTNqQaT00dtEAVOqfjKPgRVw48-8KGCEKL9Nz_sZ7SxfR/exec";
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
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        return data;
    } catch (error) {
        const message = `Error: ${error.message}`;
        if(alertBox) alertBox.removeClass('alert-info alert-warning').addClass('alert-danger').text(message).show();
        console.error('Error in postToServer:', error);
        return null;
    } finally {
        loader.hide();
    }
}
