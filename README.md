# QuickFlow ⚡

**Flow metrics in seconds** — Analise seu fluxo de trabalho ágil sem integração com ferramentas externas.

## O que é

QuickFlow é uma ferramenta web open-source que transforma qualquer planilha exportada do Jira, Azure DevOps, Trello ou qualquer ferramenta ágil em dashboards de métricas de fluxo com insights baseados em boas práticas Kanban.

## Funcionalidades

- Upload de `.csv`, `.xlsx`, `.xls`
- Mapeamento automático de colunas (heurística PT-BR + EN-US)
- 7 gráficos: CFD, Cycle Time Scatterplot, Cycle Time Breakdown, Cycle Time Histogram, Aging Chart, Throughput Run Chart, Throughput Histogram
- Insights automáticos por gráfico
- Guia de leitura de cada gráfico
- Download de cada gráfico como PNG
- Interface em PT-BR e EN-US
- Sem banco de dados, sem login, sem rastreamento

## Tech Stack

React + TypeScript + Vite + Recharts + SheetJS + html2canvas + Tailwind CSS v4 + GitHub Pages

## Rodando localmente

```bash
npm install
npm run dev
```

## URL de produção

https://vicduartchy.github.io/quickflow/
