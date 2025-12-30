require('dotenv').config();

const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');

const folderName = process.env.FOLDER_NAME || 'raporty';

async function updateExcelFile(user, entry = null, options = {}) {
    const { noAppend = false } = options;
    const today = new Date().toISOString().slice(0, 10);

    const reportsDir = path.join(__dirname, folderName, today);

    if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
    }

    const fileName = `${user.username}-${today}.xlsx`;
    const filePath = path.join(reportsDir, fileName);

    const workbook = new ExcelJS.Workbook();
    let sheet;

    // File exists → load it
    if (fs.existsSync(filePath)) {
        await workbook.xlsx.readFile(filePath);
        sheet = workbook.worksheets[0];
    } 
    // File doesn't exist → create workbook + header
    else {
        sheet = workbook.addWorksheet('Work Log');
        sheet.addRow([
            'Os. Wyk.',
            'Data',
            'Rodzaj Usługi',
            'Nazwa Zadania',
            'Osoba zlecająca',
            'Klient/Projekt',
            'Dział IT',
            'Czas'
        ]);
    }

    // Append entry only when requested
    if (!noAppend && entry) {
        sheet.addRow([
            user.username,
            entry.date,
            entry.service,
            entry.task,
            entry.ordering,
            entry.client,
            entry.it,
            entry.time
        ]);
    }

    await workbook.xlsx.writeFile(filePath);
    return filePath;
}

async function zipDailyReports(date) {
    const reportsDir = path.join(__dirname, folderName, date);
    const zipPath = path.join(__dirname, folderName, `reports_${date}.zip`);

    if (!fs.existsSync(reportsDir)) {
        throw new Error('No reports found for the specified date.');
    }

    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.pipe(output);
    archive.directory(reportsDir, false);

    await archive.finalize();

    return zipPath;
}

module.exports = {
    updateExcelFile,
    zipDailyReports
};