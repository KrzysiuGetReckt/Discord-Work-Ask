const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

async function updateExcelFile(user, entry) {
    const today = new Date().toISOString().slice(0, 10);
    const fileName = `${user.username}${today}.xlsx`;
    const filePath = path.join(__dirname, fileName);

    const workbook = new ExcelJS.Workbook();
    let sheet;

    if (fs.existsSync(filePath)) {
        await workbook.xlsx.readFile(filePath);
        sheet = workbook.worksheets[0];
    } else {
        sheet = workbook.addWorksheet('Work Log');
        sheet.addRow([
            'Os. Wyk. ',
            'Data',
            'Rodzaj Usługi',
            'Nazwa Zadania',
            'Osoba zlecająca',
            'Klient/Projekt',
            'Dział IT',
            'Czas'
        ]);
    }

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

    await workbook.xlsx.writeFile(filePath);
    return filePath;
}

module.exports = {
    updateExcelFile
};