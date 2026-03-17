import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx'

@Injectable({
  providedIn: 'root',
})

export class ExcelReader {

  ReadExcel(file: File): Promise<any[]> {
    return new Promise((res, rej) => {

      const reader = new FileReader();

      reader.onload = (e: any) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const json = XLSX.utils.sheet_to_json(sheet, { defval: null });
        res(json);
      }
      reader.onerror = err => rej(err);
      reader.readAsArrayBuffer(file)
    })
  }
  
}
