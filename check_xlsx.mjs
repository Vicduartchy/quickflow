import * as XLSX from 'xlsx'
import { readFileSync } from 'fs'

const data = new Uint8Array(readFileSync('/home/ubuntu/upload/Victeste.csv'))
const wb = XLSX.read(data, { type: 'array', cellDates: false })
const ws = wb.Sheets[wb.SheetNames[0]]
const rows = XLSX.utils.sheet_to_json(ws, { defval: '' })

console.log('Total de linhas:', rows.length)
console.log('\nPrimeira linha (raw):')
console.log(JSON.stringify(rows[0], null, 2))
console.log('\nSegunda linha (raw):')
console.log(JSON.stringify(rows[1], null, 2))

// Verificar tipos dos valores de data
const sample = rows[0]
for (const [k, v] of Object.entries(sample)) {
  if (String(k).toLowerCase().includes('date') || String(k).toLowerCase().includes('date')) {
    console.log(`\n${k}: valor="${v}" tipo=${typeof v}`)
  }
}
