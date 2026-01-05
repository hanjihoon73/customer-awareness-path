import * as XLSX from 'xlsx';
import * as fs from 'fs';

const filePath = 'd:/SynologyDrive/dev_projects/customer-awareness-path/docs/회원_가입_인지_경로_2026_01_05.xlsx';
const buffer = fs.readFileSync(filePath);
const workbook = XLSX.read(buffer, { type: 'buffer' });
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

console.log("Checking rows for '광고' or '지인'...");

jsonData.forEach((row, idx) => {
    if (!row || row.length < 1) return;
    const cellA = String(row[0]);
    if (cellA.includes("광고") || cellA.includes("지인")) {
        console.log(`Row ${idx}: '${cellA}'`);
        // Print character codes for the first few chars
        const codes = cellA.slice(0, 10).split('').map(c => c.charCodeAt(0));
        console.log(`   Codes: ${codes.join(', ')}`);
    }
});
