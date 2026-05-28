export const translations = {
  'pt-BR': {
    // Nav
    appName: 'QuickFlow',
    appTagline: 'Métricas de fluxo em segundos',
    lang: 'pt-BR',
    langToggle: 'EN',

    // Upload
    uploadTitle: 'Analise seu fluxo de trabalho',
    uploadSubtitle: 'Suba uma planilha exportada do Jira, Azure DevOps, Trello ou qualquer ferramenta ágil.',
    uploadDrag: 'Arraste seu arquivo aqui',
    uploadOr: 'ou',
    uploadButton: 'Selecionar arquivo',
    uploadFormats: 'Aceita .csv, .xlsx, .xls',
    uploadWarning: '⚠️ Seus dados não são salvos. Ao reiniciar ou fechar a aba, a análise será perdida.',

    // Mapping
    mappingTitle: 'Confirme o mapeamento das colunas',
    mappingSubtitle: 'Identificamos automaticamente as colunas abaixo. Corrija se necessário.',
    mappingField: 'Campo',
    mappingColumn: 'Coluna da planilha',
    mappingRequired: 'Obrigatório',
    mappingOptional: 'Opcional',
    mappingGenerate: 'Gerar análise',
    mappingNotMapped: 'Não mapeado',
    fields: {
      id: 'ID do item',
      type: 'Tipo de item',
      entryDate: 'Data de entrada no fluxo',
      exitDate: 'Data de conclusão',
      currentStatus: 'Status atual',
    },

    // Dashboard
    dashboardTitle: 'Análise de Fluxo',
    newAnalysis: 'Nova análise',
    newAnalysisConfirm: 'Tem certeza? A análise atual será perdida.',
    downloadChart: 'Baixar gráfico',
    downloading: 'Baixando...',
    chartNotAvailable: 'Gráfico não disponível',
    missingColumns: 'Colunas necessárias:',
    howToExport: 'Como exportar essa informação da sua ferramenta:',

    // Chart titles
    charts: {
      cfd: 'Diagrama de Fluxo Cumulativo',
      scatterplot: 'Dispersão de Cycle Time',
      breakdown: 'Breakdown de Cycle Time por Etapa',
      histogram: 'Histograma de Cycle Time',
      aging: 'Aging Chart (WIP em Andamento)',
      throughputRun: 'Throughput Run Chart',
      throughputHistogram: 'Histograma de Throughput',
    },

    // Chart descriptions
    descriptions: {
      cfd: 'O CFD mostra a quantidade de itens em cada estado do processo ao longo do tempo. Áreas que se expandem indicam gargalos. Em um sistema estável, as bandas crescem de forma paralela e uniforme.',
      scatterplot: 'Cada ponto é um item concluído. O eixo Y mostra quantos dias levou (cycle time) e o eixo X mostra quando foi entregue. As linhas de percentil (50/70/85/95) mostram a distribuição do seu desempenho. Pontos acima do percentil 85 são outliers — merecem investigação.',
      breakdown: 'Mostra quanto tempo médio os itens passam em cada etapa do fluxo. Etapas com barras longas são candidatas a otimização. Diferencie tempo ativo (trabalhando) de tempo em fila (aguardando).',
      histogram: 'Distribuição de frequência dos cycle times. Um histograma com grande concentração à esquerda e cauda longa à direita indica alta variabilidade no processo — sinal de falta de padronização ou WIP excessivo.',
      aging: 'Mostra os itens que ainda estão em andamento e quanto tempo já passaram no fluxo. Itens acima das linhas de percentil estão demorando mais do que o histórico indica como normal — risco de bloqueio.',
      throughputRun: 'Quantidade de itens entregues por semana ao longo do tempo. A linha de tendência indica se sua capacidade de entrega está aumentando, estável ou caindo.',
      throughputHistogram: 'Distribuição de frequência do throughput semanal. Use a mediana como base para comprometimentos de capacidade futura — é mais confiável que a média.',
    },

    // Reading guide labels
    readingGuide: 'Como ler este gráfico',
    insights: 'Insights',
    items: 'itens',
    days: 'dias',
    weeks: 'semanas',
    percentile: 'Percentil',
    median: 'Mediana',
    mean: 'Média',
    mode: 'Moda',
    status: 'Status',
    count: 'Quantidade',
    cycleTimeDays: 'Cycle Time (dias)',
    completionDate: 'Data de conclusão',
    throughput: 'Throughput',
    itemsPerWeek: 'itens/semana',
    stage: 'Etapa',
    avgDays: 'Média (dias)',
    ageInDays: 'Idade (dias)',

    // Insight messages
    insightHighVariability: 'Alta variabilidade detectada: o percentil 85 é mais de 2x a mediana. Revise seus limites de WIP.',
    insightStableFlow: 'Fluxo estável: a diferença entre percentil 85 e mediana é saudável.',
    insightThroughputDown: 'Tendência de queda no throughput. Verifique acúmulo de WIP ou bloqueios.',
    insightThroughputUp: 'Tendência de crescimento no throughput. Bom sinal de melhoria contínua.',
    insightAgingWarning: (count: number) => `${count} ${count === 1 ? 'item está' : 'itens estão'} acima do percentil 85 — risco de bloqueio.`,

    // Missing column messages
    missingEntryDate: 'Data de entrada no fluxo',
    missingExitDate: 'Data de conclusão',
    missingStatus: 'Status atual dos itens',
    exportTip: {
      jira: 'No Jira: Backlog > Exportar Issues > CSV (todas as colunas)',
      azure: 'No Azure DevOps: Queries > Exportar para CSV com campos de data',
      trello: 'No Trello: use o Power-Up "Export for Trello" e inclua datas de movimentação',
    },
  },

  'en-US': {
    appName: 'QuickFlow',
    appTagline: 'Flow metrics in seconds',
    lang: 'en-US',
    langToggle: 'PT',

    uploadTitle: 'Analyze your workflow',
    uploadSubtitle: 'Upload a spreadsheet exported from Jira, Azure DevOps, Trello, or any agile tool.',
    uploadDrag: 'Drag your file here',
    uploadOr: 'or',
    uploadButton: 'Select file',
    uploadFormats: 'Accepts .csv, .xlsx, .xls',
    uploadWarning: '⚠️ Your data is not saved. If you restart or close this tab, your analysis will be lost.',

    mappingTitle: 'Confirm column mapping',
    mappingSubtitle: 'We automatically identified the columns below. Correct if needed.',
    mappingField: 'Field',
    mappingColumn: 'Spreadsheet column',
    mappingRequired: 'Required',
    mappingOptional: 'Optional',
    mappingGenerate: 'Generate analysis',
    mappingNotMapped: 'Not mapped',
    fields: {
      id: 'Item ID',
      type: 'Item type',
      entryDate: 'Flow entry date',
      exitDate: 'Completion date',
      currentStatus: 'Current status',
    },

    dashboardTitle: 'Flow Analysis',
    newAnalysis: 'New analysis',
    newAnalysisConfirm: 'Are you sure? The current analysis will be lost.',
    downloadChart: 'Download chart',
    downloading: 'Downloading...',
    chartNotAvailable: 'Chart not available',
    missingColumns: 'Required columns:',
    howToExport: 'How to export this information from your tool:',

    charts: {
      cfd: 'Cumulative Flow Diagram',
      scatterplot: 'Cycle Time Scatterplot',
      breakdown: 'Cycle Time Breakdown by Stage',
      histogram: 'Cycle Time Histogram',
      aging: 'Aging Chart (WIP in Progress)',
      throughputRun: 'Throughput Run Chart',
      throughputHistogram: 'Throughput Histogram',
    },

    descriptions: {
      cfd: 'The CFD shows the number of items in each process state over time. Expanding bands indicate bottlenecks. In a stable system, bands grow in parallel and uniformly.',
      scatterplot: 'Each dot is a completed item. The Y-axis shows how many days it took (cycle time) and the X-axis shows when it was delivered. Percentile lines (50/70/85/95) show your performance distribution. Dots above the 85th percentile are outliers worth investigating.',
      breakdown: 'Shows how much average time items spend in each flow stage. Stages with long bars are candidates for optimization. Differentiate active time (being worked on) from queue time (waiting).',
      histogram: 'Frequency distribution of cycle times. A histogram concentrated on the left with a long right tail indicates high process variability — a sign of lack of standardization or excessive WIP.',
      aging: 'Shows items still in progress and how long they have been in the flow. Items above percentile lines are taking longer than history suggests is normal — risk of blockage.',
      throughputRun: 'Number of items delivered per week over time. The trend line indicates whether your delivery capacity is growing, stable, or declining.',
      throughputHistogram: 'Frequency distribution of weekly throughput. Use the median as a basis for future capacity commitments — it\'s more reliable than the mean.',
    },

    readingGuide: 'How to read this chart',
    insights: 'Insights',
    items: 'items',
    days: 'days',
    weeks: 'weeks',
    percentile: 'Percentile',
    median: 'Median',
    mean: 'Mean',
    mode: 'Mode',
    status: 'Status',
    count: 'Count',
    cycleTimeDays: 'Cycle Time (days)',
    completionDate: 'Completion date',
    throughput: 'Throughput',
    itemsPerWeek: 'items/week',
    stage: 'Stage',
    avgDays: 'Avg (days)',
    ageInDays: 'Age (days)',

    insightHighVariability: 'High variability detected: the 85th percentile is more than 2x the median. Review your WIP limits.',
    insightStableFlow: 'Stable flow: the difference between the 85th percentile and median is healthy.',
    insightThroughputDown: 'Declining throughput trend. Check for WIP accumulation or blockers.',
    insightThroughputUp: 'Growing throughput trend. Good sign of continuous improvement.',
    insightAgingWarning: (count: number) => `${count} ${count === 1 ? 'item is' : 'items are'} above the 85th percentile — risk of blockage.`,

    missingEntryDate: 'Flow entry date',
    missingExitDate: 'Completion date',
    missingStatus: 'Current status of items',
    exportTip: {
      jira: 'In Jira: Backlog > Export Issues > CSV (all columns)',
      azure: 'In Azure DevOps: Queries > Export to CSV with date fields',
      trello: 'In Trello: use the "Export for Trello" Power-Up and include movement dates',
    },
  },
}

export type TranslationKey = typeof translations['pt-BR']
