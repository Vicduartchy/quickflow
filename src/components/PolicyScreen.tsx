import { useState, useMemo } from 'react'
import { useApp } from '../lib/context'
import type { StatusCategory, FlowLayer, StatusConfig } from '../types'

const CATEGORY_COLORS: Record<StatusCategory, string> = {
  backlog: '#6B7280',
  wip: '#1D4ED8',
  done: '#059669',
  unclassified: '#D99789',
}

const LAYER_COLORS: Record<FlowLayer, string> = {
  upstream: '#7C3AED',
  downstream: '#BF452A',
  none: '#D99789',
}

export function PolicyScreen() {
  const { t, lang, workItems, flowPolicy, setFlowPolicy, setStep } = useApp()

  const allStatuses = useMemo(() => {
    return [...new Set(workItems.map(i => i.currentStatus).filter(Boolean))] as string[]
  }, [workItems])

  const [configs, setConfigs] = useState<StatusConfig[]>(() => {
    if (flowPolicy.statusConfigs.length > 0) return flowPolicy.statusConfigs
    return allStatuses.map(status => ({
      status,
      category: 'unclassified' as StatusCategory,
      layer: 'none' as FlowLayer,
    }))
  })

  const updateCategory = (status: string, category: StatusCategory) => {
    setConfigs(prev => prev.map(c => c.status === status ? { ...c, category, layer: category === 'wip' ? c.layer : 'none' } : c))
  }

  const updateLayer = (status: string, layer: FlowLayer) => {
    setConfigs(prev => prev.map(c => c.status === status ? { ...c, layer } : c))
  }

  const handleGenerate = () => {
    setFlowPolicy({ statusConfigs: configs })
    setStep('dashboard')
  }

  const handleSkip = () => {
    setFlowPolicy({ statusConfigs: configs })
    setStep('dashboard')
  }

  const wipCount = configs.filter(c => c.category === 'wip').length
  const backlogCount = configs.filter(c => c.category === 'backlog').length
  const doneCount = configs.filter(c => c.category === 'done').length

  const labels = {
    title: lang === 'pt-BR' ? 'Política de Fluxo' : 'Flow Policy',
    subtitle: lang === 'pt-BR'
      ? 'Classifique os status da sua base para tornar os indicadores mais precisos.'
      : 'Classify the statuses from your data to make the metrics more accurate.',
    statusCol: lang === 'pt-BR' ? 'Status' : 'Status',
    categoryCol: lang === 'pt-BR' ? 'Categoria' : 'Category',
    layerCol: lang === 'pt-BR' ? 'Camada de Fluxo' : 'Flow Layer',
    backlog: 'Backlog',
    wip: 'WIP',
    done: lang === 'pt-BR' ? 'Concluído' : 'Done',
    unclassified: lang === 'pt-BR' ? 'Não classificado' : 'Unclassified',
    upstream: 'Upstream',
    downstream: 'Downstream',
    none: lang === 'pt-BR' ? 'Nenhuma' : 'None',
    upstreamHint: lang === 'pt-BR' ? '(Discovery / Análise)' : '(Discovery / Analysis)',
    downstreamHint: lang === 'pt-BR' ? '(Delivery / Desenvolvimento)' : '(Delivery / Development)',
    layerNote: lang === 'pt-BR' ? 'Disponível apenas para status WIP' : 'Available only for WIP statuses',
    generate: lang === 'pt-BR' ? 'Gerar análise' : 'Generate analysis',
    skip: lang === 'pt-BR' ? 'Pular configuração' : 'Skip configuration',
    back: lang === 'pt-BR' ? '← Voltar' : '← Back',
    summary: lang === 'pt-BR' ? 'Resumo da configuração' : 'Configuration summary',
    wipLabel: lang === 'pt-BR' ? 'status WIP' : 'WIP statuses',
    backlogLabel: lang === 'pt-BR' ? 'status Backlog' : 'Backlog statuses',
    doneLabel: lang === 'pt-BR' ? 'status Concluído' : 'Done statuses',
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16 bg-[#F2F2F2]">
      <div className="w-full max-w-3xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-[#092140] mb-2">{labels.title}</h1>
          <p className="text-[#D99789]">{labels.subtitle}</p>
        </div>

        {/* Summary badges */}
        <div className="flex gap-3 mb-6 flex-wrap justify-center">
          {[
            { label: `${backlogCount} ${labels.backlogLabel}`, color: CATEGORY_COLORS.backlog },
            { label: `${wipCount} ${labels.wipLabel}`, color: CATEGORY_COLORS.wip },
            { label: `${doneCount} ${labels.doneLabel}`, color: CATEGORY_COLORS.done },
          ].map((b, i) => (
            <div key={i} className="px-4 py-2 rounded-xl border text-sm font-semibold" style={{ borderColor: b.color, backgroundColor: b.color + '15', color: b.color }}>
              {b.label}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-[#F2C5BB] overflow-hidden shadow-sm">
          {/* Header */}
          <div className="grid grid-cols-3 text-xs font-semibold text-[#D99789] uppercase tracking-wider px-6 py-3 border-b border-[#F2C5BB] bg-[#F2F2F2]">
            <span>{labels.statusCol}</span>
            <span>{labels.categoryCol}</span>
            <span>{labels.layerCol}</span>
          </div>

          {configs.map((config) => (
            <div key={config.status} className="grid grid-cols-3 items-center px-6 py-3 border-b border-[#F2C5BB]/50 last:border-0 hover:bg-[#F2C5BB]/10 transition-colors gap-3">
              {/* Status name */}
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[config.category] }} />
                <span className="text-[#092140] text-sm font-medium truncate">{config.status}</span>
              </div>

              {/* Category selector */}
              <div className="flex gap-1 flex-wrap">
                {(['backlog', 'wip', 'done', 'unclassified'] as StatusCategory[]).map(cat => (
                  <button
                    key={cat}
                    onClick={() => updateCategory(config.status, cat)}
                    className="px-2 py-1 text-xs rounded-lg border font-medium transition-colors"
                    style={config.category === cat
                      ? { backgroundColor: CATEGORY_COLORS[cat], color: '#fff', borderColor: CATEGORY_COLORS[cat] }
                      : { backgroundColor: 'transparent', color: '#D99789', borderColor: '#F2C5BB' }
                    }
                  >
                    {labels[cat]}
                  </button>
                ))}
              </div>

              {/* Layer selector — only for WIP */}
              <div>
                {config.category === 'wip' ? (
                  <div className="flex gap-1 flex-wrap">
                    {(['upstream', 'downstream', 'none'] as FlowLayer[]).map(layer => (
                      <button
                        key={layer}
                        onClick={() => updateLayer(config.status, layer)}
                        className="px-2 py-1 text-xs rounded-lg border font-medium transition-colors"
                        style={config.layer === layer
                          ? { backgroundColor: LAYER_COLORS[layer], color: '#fff', borderColor: LAYER_COLORS[layer] }
                          : { backgroundColor: 'transparent', color: '#D99789', borderColor: '#F2C5BB' }
                        }
                      >
                        {labels[layer]}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-[#F2C5BB]">{labels.layerNote}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Layer legend */}
        <div className="mt-4 p-4 bg-white border border-[#F2C5BB] rounded-2xl">
          <p className="text-xs font-semibold text-[#D99789] mb-2">{lang === 'pt-BR' ? 'O que é cada camada?' : 'What is each layer?'}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="flex items-start gap-2">
              <span className="w-3 h-3 rounded-full mt-0.5 shrink-0" style={{ backgroundColor: LAYER_COLORS.upstream }} />
              <div>
                <p className="text-xs font-semibold text-[#092140]">Upstream {labels.upstreamHint}</p>
                <p className="text-xs text-[#D99789]">{lang === 'pt-BR' ? 'Etapas de descoberta, análise e refinamento antes do desenvolvimento.' : 'Discovery, analysis and refinement stages before development.'}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-3 h-3 rounded-full mt-0.5 shrink-0" style={{ backgroundColor: LAYER_COLORS.downstream }} />
              <div>
                <p className="text-xs font-semibold text-[#092140]">Downstream {labels.downstreamHint}</p>
                <p className="text-xs text-[#D99789]">{lang === 'pt-BR' ? 'Etapas de desenvolvimento, teste e entrega do valor ao cliente.' : 'Development, testing and value delivery stages.'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button onClick={() => setStep('mapping')} className="py-3 px-5 rounded-xl border border-[#D99789] text-[#D99789] hover:text-[#092140] hover:border-[#092140] transition-colors text-sm font-medium">{labels.back}</button>
          <button onClick={handleSkip} className="py-3 px-5 rounded-xl border border-[#D99789] text-[#D99789] hover:text-[#092140] hover:border-[#092140] transition-colors text-sm font-medium">{labels.skip}</button>
          <button onClick={handleGenerate} className="flex-1 py-3 rounded-xl bg-[#BF452A] hover:bg-[#092140] text-white font-semibold text-sm transition-all">{labels.generate} →</button>
        </div>
      </div>
    </div>
  )
}
