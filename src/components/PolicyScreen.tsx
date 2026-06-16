import { useApp } from "../lib/context"
import type { StatusCategory } from "../types"

const CATEGORY_COLORS: Record<StatusCategory, string> = {
  backlog: "bg-blue-100 text-blue-800",
  wip: "bg-yellow-100 text-yellow-800",
  done: "bg-green-100 text-green-800",
  unclassified: "bg-gray-100 text-gray-600",
}

export default function PolicyScreen() {
  const { t, workItems, flowPolicy, setFlowPolicy, setStep } = useApp()
  const statuses = [...new Set(workItems.map(i => i.currentStatus).filter(Boolean) as string[])].sort()

  function getConfig(status: string) {
    return flowPolicy.statusConfigs.find(c => c.status === status) ?? {
      status, category: "unclassified" as StatusCategory, layer: "none" as const,
    }
  }

  function updateCategory(status: string, category: StatusCategory) {
    const existing = flowPolicy.statusConfigs.filter(c => c.status !== status)
    const current = getConfig(status)
    setFlowPolicy({ statusConfigs: [...existing, { ...current, status, category }] })
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-[#092140] mb-2">{t.policy.title}</h1>
      <p className="text-[#D99789] mb-8">{t.policy.subtitle}</p>
      {statuses.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm mb-6">
          Nenhum status encontrado. Verifique o mapeamento da coluna de status.
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-[#F2C5BB] overflow-hidden mb-6">
          {statuses.map(status => {
            const cfg = getConfig(status)
            return (
              <div key={status} className="flex items-center gap-4 px-6 py-4 border-b border-[#F2F2F2] last:border-0">
                <div className="flex-1 text-sm font-medium text-[#092140]">{status}</div>
                <div className="flex gap-2 flex-wrap">
                  {(["backlog", "wip", "done", "unclassified"] as StatusCategory[]).map(cat => (
                    <button
                      key={cat}
                      onClick={() => updateCategory(status, cat)}
                      className={cfg.category === cat ? CATEGORY_COLORS[cat] + " px-3 py-1 rounded-full text-xs font-medium ring-2 ring-offset-1 ring-current" : "px-3 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-400 hover:bg-gray-100"}
                    >
                      {t.policy[cat as keyof typeof t.policy] as string}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
      <div className="flex gap-3">
        <button onClick={() => setStep("mapping")} className="px-6 py-2 rounded-lg border border-[#D99789] text-[#092140] hover:bg-[#F2C5BB]/20 transition-colors">
          {t.policy.back}
        </button>
        <button onClick={() => setStep("dashboard")} className="px-6 py-2 rounded-lg bg-[#BF452A] text-white font-medium hover:bg-[#a33a22] transition-colors">
          {t.policy.next}
        </button>
      </div>
    </div>
  )
}
