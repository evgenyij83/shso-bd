'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, FileSpreadsheet, FileText, X } from 'lucide-react'

type Squad = { id: string, name: string }

export default function ExportModal({ squads, isGlobal = true }: { squads: Squad[], isGlobal?: boolean }) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedSquads, setSelectedSquads] = useState<Set<string>>(new Set())
  const [exportAll, setExportAll] = useState(isGlobal)
  const [loading, setLoading] = useState(false)

  const toggleSquad = (id: string) => {
    const newSet = new Set(selectedSquads)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setSelectedSquads(newSet)
  }

  const handleExport = async (format: 'excel' | 'docx') => {
    if (isGlobal && !exportAll && selectedSquads.size === 0) {
      alert('Выберите хотя бы один отряд')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/export/${format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          all: isGlobal ? exportAll : false,
          squadIds: isGlobal ? Array.from(selectedSquads) : squads.map(s => s.id)
        })
      })

      if (!res.ok) {
        throw new Error('Ошибка при экспорте')
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Сводка_по_отрядам.${format === 'excel' ? 'xlsx' : 'docx'}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setIsOpen(false)
    } catch (error) {
      alert('Произошла ошибка при формировании файла')
    }
    setLoading(false)
  }

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Download size={18} /> {loading ? '...' : 'Скачать сводку'}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '2rem', background: 'var(--bg-color)', position: 'relative' }}>
              <button onClick={() => setIsOpen(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={24} />
              </button>

              <h2 style={{ marginBottom: '1.5rem', marginTop: 0 }}>Экспорт данных</h2>

              {isGlobal ? (
                <div style={{ marginBottom: '2rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: '1rem', fontWeight: 'bold' }}>
                    <input type="checkbox" checked={exportAll} onChange={e => setExportAll(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                    Выгрузить все отряды ({squads.length})
                  </label>

                  {!exportAll && (
                    <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--glass-border)', padding: '1rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(0,0,0,0.2)' }}>
                      {squads.map(s => (
                        <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                          <input type="checkbox" checked={selectedSquads.has(s.id)} onChange={() => toggleSquad(s.id)} />
                          {s.name}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>
                  Будет сформирована сводка только по вашему отряду.
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  onClick={() => handleExport('excel')} 
                  disabled={loading}
                  className="btn-primary" 
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: '#10b981' }}
                >
                  <FileSpreadsheet size={20} /> В Excel
                </button>
                <button 
                  onClick={() => handleExport('docx')} 
                  disabled={loading}
                  className="btn-primary" 
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: '#3b82f6' }}
                >
                  <FileText size={20} /> В Word
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
