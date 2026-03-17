//Objeto padre
export class FinalReportClass {
    "metaData": FinalReportMetaData
    "tableData": FinalReportTableData[]
}

//metadata del documento
export class FinalReportMetaData {
    "to": string
    "consigne": string
    "etd": string
    "eta": string
    "ref": string
    "awb": string
    "airline": string
    "flight": string
    "awbArrival": string
    "observations": string
}

//Objeto de cabeceras
export class FinalReportTableHeaders {
    "consigne": string
    "destin": string
    "farm": string
    "hawb": string
    "variety": string
    "units": string
    "value": string
    "hb": string
    "qb": string
    "sb": string
    "eqFull": string
    "pieces": string
    "temp": string
    "wheight": string
}

//Objeto de datos de la tabla para procesar
export class FinalReportTableData {
    "consigne": string
    "destin": string
    "farm": string
    "hawb": string
    "variety": string
    "units": number
    "value": number
    "hb": number
    "qb": number
    "sb": number
    "eqFull": number
    "pieces": number
    "temp": string
    "wheight": number
}