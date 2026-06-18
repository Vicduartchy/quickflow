import { useApp } from "../lib/context"
import type { StatusCategory } from "../types"
import { Button } from "./ui/button"
import { Alert, AlertDescription } from "./ui/alert"

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
        <Alert className="bg-yellow-50 border-yellow-200 text-yellow-800 mb-6">
          <AlertDescription>
            Nenhum status encontrado. Verifique o mapeamento da coluna de status.
          </AlertDescription>
        </Alert>
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
        <Button variant="outline" onClick={() => setStep("mapping")}>
          {t.policy.back}
        </Button>
        <Button onClick={() => setStep("dashboard")}>
          {t.policy.next}
        </Button>
      </div>
    </div>
  )
}
