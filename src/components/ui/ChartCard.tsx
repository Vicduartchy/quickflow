import { useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import { useApp } from '../../lib/context'

interface ChartCardProps {
  id: string
  title: string
  description: string
  available: boolean
  missing: string[]
  children?: React.ReactNode
  insights?: string[]
}

export function ChartCard({ id, title, description, available, missing, children, insights }: ChartCardProps) {
  const { t } = useApp()
  const chartRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)
  const [showGuide, setShowGuide] = useState(false)

  const handleDownload = async () => {
    if (!chartRef.current) return
    setDownloading(true)
    try {
      // Scroll into view and wait for render
      chartRef.current.scrollIntoView({ behavior: 'instant' })
      await new Promise(r => setTimeout(r, 300))
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        windowWidth: chartRef.current.scrollWidth,
        windowHeight: chartRef.current.scrollHeight,
      })
      const link = document.createElement('a')
      link.download = `quickflow-${id}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (e) {
      console.error('Download error:', e)
    }
    setDownloading(false)
  }

  const missingLabels: Record<string, string> = {
    entryDate: t.missingEntryDate,
    exitDate: t.missingExitDate,
    currentStatus: t.missingStatus,
  }

  return (
    <div className="bg-white border border-[#F2C5BB] rounded-2xl overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#F2C5BB]">
        <h2 className="text-[#092140] font-semibold text-lg">{title}</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowGuide(g => !g)} className="p-2 rounded-lg text-[#D99789] hover:text-[#BF452A] hover:bg-[#F2C5BB]/20 transition-colors" title={t.readingGuide}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          {available && (
            <button onClick={handleDownload} disabled={downloading}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#F2F2F2] hover:bg-[#BF452A] text-[#092140] hover:text-white rounded-lg text-xs font-medium transition-colors border border-[#D99789] hover:border-[#BF452A]">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {downloading ? t.downloading : t.downloadChart}
            </button>
          )}
        </div>
      </div>

      {showGuide && (
        <div className="px-6 py-4 bg-[#F2C5BB]/20 border-b border-[#F2C5BB] text-sm text-[#092140] leading-relaxed">
          <p className="font-medium text-[#BF452A] mb-1">{t.readingGuide}</p>
          <p>{description}</p>
        </div>
      )}

      <div ref={chartRef} className="p-6 bg-white">
        {available ? (
          <>
            {children}
            {insights && insights.length > 0 && (
              <div className="mt-4 space-y-2">
                {insights.map((insight, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 bg-[#F2C5BB]/20 border border-[#F2C5BB] rounded-xl text-sm text-[#092140]">
                    <span className="text-[#BF452A] mt-0.5 font-bold">→</span>
                    <span>{insight}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="py-8 text-center">
            <div className="w-12 h-12 bg-[#F2C5BB]/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-[#D99789]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <p className="text-[#092140] font-medium mb-2">{t.chartNotAvailable}</p>
            <p className="text-[#D99789] text-sm mb-3">{t.missingColumns}</p>
            <div className="flex flex-wrap gap-2 justify-center mb-4">
              {missing.map(m => (
                <span key={m} className="px-3 py-1 bg-[#F2C5BB]/40 border border-[#D99789] text-[#BF452A] text-xs rounded-full">{missingLabels[m] ?? m}</span>
              ))}
            </div>
            <p className="text-[#D99789] text-xs">{t.howToExport}</p>
            <div className="mt-2 text-[#D99789] text-xs space-y-1">
              <p>{t.exportTip.jira}</p>
              <p>{t.exportTip.azure}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
