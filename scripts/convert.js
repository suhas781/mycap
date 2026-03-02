import * as XLSX from "xlsx";
import fs from "fs";

const workbook = XLSX.readFile("colleges.xlsx");
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const csv = XLSX.utils.sheet_to_csv(sheet);

fs.writeFileSync("colleges.csv", csv);

console.log("CSV created: colleges.csv");