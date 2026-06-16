import * as XLSX from 'xlsx'
import { readFileSync } from 'fs'

const data = new Uint8Array(readFileSync('/home/ubuntu/upload/Victeste.csv'))
const wb = XLSX.read(data, { type: 'array', cellDates: false, raw: false })
const ws = wb.Sheets[wb.SheetNames[0]]
const rows = XLSX.utils.sheet_to_json(ws, { defval: '', raw: false })

console.log('Total de linhas:', rows.length)
console.log('\nPrimeira linha (raw:false):')
console.log(JSON.stringify(rows[0], null, 2))
console.log('\nSegunda linha (raw:false):')
console.log(JSON.stringify(rows[1], null, 2))
