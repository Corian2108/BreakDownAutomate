import { Component } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CdkDragDrop, CdkDropList, CdkDrag, moveItemInArray } from '@angular/cdk/drag-drop';
import { saveAs } from 'file-saver';
import { HttpClient } from '@angular/common/http';;
import * as ExcelJS from 'exceljs';

import { ExcelReader } from '../../services/excel-reader';
import { FinalReportMetaData, FinalReportTableData } from '../../entities/FinalReportEntity';
import { breakDownClass, breakDownMetaData, breakDownTableData } from '../../entities/BreakDownEntity';

@Component({
  selector: 'app-home',
  imports: [NgIf, ReactiveFormsModule, CdkDrag, CdkDropList],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})

export class HomeComponent {

  constructor(private excelReader: ExcelReader, private fb: FormBuilder, private http: HttpClient) { }

  loading: boolean = false
  fileSelected: boolean = false
  excelData: any[] = []
  metaData: FinalReportMetaData = new FinalReportMetaData()
  finalReportHeaders: string[] = []
  breakDownHeaders: string[] = ['MAWB', 'HAWB', 'STEM COUNT', 'FARMS', 'FLOWER', 'QTY', 'BXS']
  dataStart: number = 0
  cleanData: any[] = []
  tableData: FinalReportTableData[] = []

  //result
  bdwnMetaData: breakDownMetaData = new breakDownMetaData()
  bdwnTableData: breakDownTableData[] = []
  bdwnReport: breakDownClass = new breakDownClass()

  //form
  form!: FormGroup;

  ngOnInit() {
    this.form = this.fb.group({
      airline: [this.bdwnMetaData.airline],
      flight: [this.bdwnMetaData.flight],
      date: [this.bdwnMetaData.date],
      origin: [this.bdwnMetaData.origin],
      flower: [this.bdwnMetaData.flower]
    });
    // ELIMINAR ANTES DE PRODUCCIÓN
    //función colocada para verificar cambios del formulario
    this.form.valueChanges.subscribe(value => {
      console.log(value);
    })
  }

  onFileChange(event: any) {
    this.loading = true
    this.fileSelected = true

    const file: File = event.target.files[0];

    this.excelReader.ReadExcel(file).then(data => {
      this.excelData = data;

      //formatear json plano a objeto para separar meta data de datos duros
      this.metaDataExtract()

      //extraer cabeceras de tabla
      this.headersExtract()

      //separa los datos limpios
      this.extractCleanData()

      //normalizar los daos de la tabla en objetos
      this.normalizeObjects()

      //sumar filas y transformar a objeto resultado
      this.reduceLines()

      this.loading = false
    })
  }

  /*reglas para metadata:
    -El objeto que llega tiene solo 2 atributos con valor los demás están vacíos
    -Todos los valores y atributos están en formato string
    -El primer atributo es la clave, el segundo es el valor
    -Traducri el primer objeto al primer par (clave:valor) de mi objeto dinámico 
    -Hasta encontrar dónde se rompe el patron
  */
  metaDataExtract(colection: any[] = this.excelData) {
    let metaAtributes: any[] = []

    colection.forEach((item: Object) => {
      let entries = Object.entries(item)
      let values = Object.values(item)
      let notNullValues = values.filter(val => val != null)
      let key = ''
      let value = ''
      let count = 0

      for (const entry of entries) {
        if (notNullValues.length == values.length) {
          break
        }
        if (entry[1] !== null && entry[1] !== '') {
          count += 1
          if (count == 1) {
            key = entry[1]
          } else if (count == 2) {
            value = entry[1]
            metaAtributes.push([key, value])
            break
          }
        }
      }
    })

    //transformar metaAtributes a objeto
    metaAtributes.forEach(atribute => {
      switch (atribute[0].toString().toLowerCase()) {
        case 'to':
          this.metaData.to = atribute[1].trim()
          break;
        case 'consignee':
          this.metaData.consigne = atribute[1].trim()
          break;
        case 'e.t.d.':
          this.metaData.etd = atribute[1].trim()
          break;
        case 'e.t.a.':
          this.metaData.eta = atribute[1].trim()
          break;
        case 'ref':
          this.metaData.ref = atribute[1].trim()
          break;
        case 'awb':
          this.metaData.awb = atribute[1].trim()
          break;
        case 'airline':
          this.metaData.airline = atribute[1].trim()
          break;
        case 'flight':
          this.metaData.flight = atribute[1].trim()
          break;
        case 'awb arrival':
          this.metaData.awbArrival = atribute[1].trim()
          break;
      }
    })
  }

  /*lógica para buscar los headers, voy a tener que hacer una función recursiva 
  para romper el bucle en cuanto tenga los headers
  primero puedo analizar directamente los values de los objetos con filter como hice arriba
  cuando detecte la fila donde están todos los valores guardo en headers y salgo del bucle
  */

  headersExtract(colection: any[] = this.excelData, index = 0) {
    let values = Object.values(colection[index])//para ir uno por uno
    let noNullValues = values.filter(val => val != null)

    if (values.length == noNullValues.length) {
      values.forEach((val: any) => {
        this.finalReportHeaders.push(val.toString())
      })
      this.dataStart = index
      return
    }
    if (index <= colection.length) {
      this.headersExtract(colection, index += 1)
    }
  }

  //aquí separamos los datos de trabajo basados en la posición de los headers
  extractCleanData() {
    this.cleanData = this.excelData.slice(this.dataStart + 1)

    this.cleanData = this.cleanData.filter(row => {
      const values = Object.values(row)
      return !values.some(val => typeof val === 'string' && val.toLowerCase().includes("total"))
    })
    //////////////////Hoy, lunes 23 cumplí :)
  }

  //normalizar los nombres de los atributos para un manejo más limpio de los objetos
  normalizeObjects() {
    this.cleanData.forEach(row => {
      const values = Object.values(row)
      const reportRow = new FinalReportTableData
      reportRow.consigne = values[0]!.toString()
      reportRow.destin = values[1]!.toString()
      reportRow.farm = values[2]!.toString()
      reportRow.hawb = values[3]!.toString()
      reportRow.variety = values[4]!.toString()
      reportRow.units = parseInt(values[5]!.toString())
      reportRow.value = parseFloat(values[6]!.toString())
      reportRow.hb = parseFloat(values[7]!.toString())
      reportRow.qb = parseFloat(values[8]!.toString())
      reportRow.sb = parseFloat(values[9]!.toString())
      reportRow.eqFull = parseFloat(values[10]!.toString())
      reportRow.pieces = parseInt(values[11]!.toString())
      reportRow.temp = values[12]!.toString()
      reportRow.wheight = parseFloat(values[13]!.toString())
      this.tableData.push(reportRow)
    })
    ////////////////Hoy, miércoles 25 cumplí :)
  }

  //sumar líneas por: finca, hawb, y variedad, luego sumar pices, units, eqFull
  reduceLines() {
    let result = this.tableData.reduce((acc, val) => {

      const key = `${val.hawb}_${val.variety}`

      if (!acc[key]) {
        acc[key] = {
          mawb: this.metaData.awb,
          hawb: val.hawb,
          stems: 0,
          farms: val.farm,
          flower: val.variety,
          qty: 0,
          bxs: 0,
          rows: []
        }
      }

      acc[key].stems += Number(val.units) || 0
      acc[key].qty += Number(val.pieces) || 0
      acc[key].bxs += Number(val.eqFull) || 0
      acc[key].rows.push(val)

      return acc
    }, {} as Record<string, any>)
    /////////////////////////Hoy, sábado 28 cumplí ;)

    //luego de sacar el result tengo que mapear a los nuevos objetos
    this.bdwnTableData = Object.values(result)

    //finalmente formateamos la metadata y el objeto final
    const today = new Date();
    const localDate = new Date(
      today.getTime() - today.getTimezoneOffset() * 60000
    )

    this.bdwnMetaData.airline = this.metaData.airline
    this.bdwnMetaData.flight = this.metaData.flight
    this.bdwnMetaData.date = localDate
    this.bdwnMetaData.origin = this.bdwnTableData[0].hawb.split('-')[0]
    this.bdwnMetaData.flower = ''

    this.bdwnReport.metaData = this.bdwnMetaData
    this.bdwnReport.tableData = this.bdwnTableData

    this.updateForm()
  }

  //utilidad para actualizar la metadata
  updateForm() {
    this.form.patchValue({
      airline: this.bdwnMetaData.airline,
      flight: this.bdwnMetaData.flight,
      date: this.bdwnMetaData.date? this.bdwnMetaData.date.toISOString().split('T')[0]: '',
      origin: this.bdwnMetaData.origin,
      flower: this.bdwnMetaData.flower
    })
    ///////////////////////////////Hoy Domingo 1 de marzo, cumplí, :P
  }

  //función para detectar los cambios de posición en el array y guardarlos
  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.bdwnTableData, event.previousIndex, event.currentIndex);
    /////////////////////////////Hoy, Lunes 3, cumplí =)
  }

  //Meter en formato excel y descargar
  //Estilizar excel de salida
  async buildReport() {

    this.loading = true

    const template = await fetch('/assets/template.xlsx')
    const buffer = await template.arrayBuffer()

    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer)

    const worksheet = workbook.getWorksheet(1)

    //escribir metadata
    worksheet!.getCell('A3').value = this.form.value.airline
    worksheet!.getCell('C3').value = this.form.value.flight
    worksheet!.getCell('D3').value = this.form.value.date
    worksheet!.getCell('E3').value = this.form.value.origin
    worksheet!.getCell('F3').value = this.form.value.flower

    //escribir los datos de la tabla
    let startline = 5

    this.bdwnTableData.forEach((row, index) => {
      const excelRow = worksheet!.getRow(startline + index)
      excelRow.getCell(1).value = row.mawb
      excelRow.getCell(2).value = row.hawb
      excelRow.getCell(3).value = row.stems
      excelRow.getCell(4).value = row.farms
      excelRow.getCell(5).value = row.flower
      excelRow.getCell(6).value = row.qty
      excelRow.getCell(7).value = row.bxs
      excelRow.commit()
    })

    //limpieza de metadata
    workbook.creator = 'BreakDown Automate Demo';
    workbook.lastModifiedBy = 'BreakDown Automate Demo';
    workbook.created = new Date();
    workbook.modified = new Date();

    const fileBuffer = await workbook.xlsx.writeBuffer()

    saveAs(
      new Blob([fileBuffer]),
      `DEMO_REPORT_${this.bdwnTableData[0].mawb}.xlsx`
    );
    this.loading = false
    //////////////////Hoy miércoles 4 de marzo, cumplí :)
  }

  //Anonimizar datos de documentos de prueba
  //Colocar documentos de prueba en Demo
  downloadExample() {
    this.loading = true
    this.http.get('/assets/EXAMPLE_REPORT.xlsx', { responseType: 'blob' })
      .subscribe(blob => {
        saveAs(blob, 'EXAMPLE_REPORT.xlsx');
        this.loading = false
      });
    /////////////////////////////Hoy 5 de marzo, cumplí =P
  }

  resetReport() {
    this.loading = true
    this.fileSelected = false
    this.excelData = []
    this.metaData = new FinalReportMetaData()
    this.dataStart = 0
    this.cleanData = []
    this.tableData = []
    this.bdwnMetaData = new breakDownMetaData()
    this.bdwnTableData = []
    this.bdwnReport = new breakDownClass()
    this.updateForm()
    this.loading = false
  }
}
