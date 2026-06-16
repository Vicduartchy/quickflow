import * as XLSX from 'xlsx'
import { readFileSync } from 'fs'

const data = new Uint8Array(readFileSync('/home/ubuntu/upload/Victeste.csv'))

// Detectar se é CSV pelo conteúdo
const text = Buffer.from(data).toString('utf-8', 0, 100)
const isCSV = text.includes(',') && !text.startsWith('PK')

let rows
if (isCSV) {
  // Para CSV: ler como texto puro, sem inferência de tipos
  const wb = XLSX.read(data, { type: 'array', raw: true })
  const ws = wb.Sheets[wb.SheetNames[0]]
  rows = XLSX.utils.sheet_to_json(ws, { defval: '', raw: true })
} else {
  // Para XLSX: usar cellDates
  const wb = XLSX.read(data, { type: 'array', cellDates: true })
  const ws = wb.Sheets[wb.SheetNames[0]]
  rows = XLSX.utils.sheet_to_json(ws, { defval: '' })
}

console.log('Total de linhas:', rows.length)
console.log('\nPrimeira linha:')
console.log(JSON.stringify(rows[0], null, 2))
console.log('\nSegunda linha:')
console.log(JSON.stringify(rows[1], null, 2))
