export class breakDownClass {
    "metaData": breakDownMetaData
    "tableData": breakDownTableData[]
}

export class breakDownMetaData {
    "airline": string
    "flight": string
    "date": Date
    "origin": string
    "flower": string
}

export class breakDownTableData {
    "mawb": string
    "hawb": string
    "stems": string
    "farms": string
    "flower": string
    "qty": number
    "bxs": number
}