'use client'

import { useState } from 'react'
import { updateVkLink } from '@/app/actions/profile'
import { ExternalLink, Pencil, Check, X } from 'lucide-react'

export default function VkLinkEditor({ currentVkLink }: { currentVkLink: string | null }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(currentVkLink || '')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setLoading(true)
    const res = await updateVkLink(value)
    setLoading(false)
    if (res.success) {
      setEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  if (!editing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
        {currentVkLink ? (
          <a href={currentVkLink.startsWith('http') ? currentVkLink : `https://vk.com/${currentVkLink}`} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
            <ExternalLink size={12} /> ВК
          </a>
        ) : (
          <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>ВК не указан</span>
        )}
        <button 
          onClick={() => setEditing(true)}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
          title="Изменить ВК-ссылку"
        >
          <Pencil size={12} />
        </button>
        {saved && <span style={{ color: '#34d399', fontSize: '0.75rem' }}>✓</span>}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="vk.com/username"
        style={{ 
          background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)', 
          borderRadius: '6px', padding: '4px 8px', color: 'var(--text-primary)', 
          fontSize: '0.8rem', width: '180px' 
        }}
      />
      <button 
        onClick={handleSave} 
        disabled={loading}
        style={{ background: 'transparent', border: 'none', color: '#34d399', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
      >
        <Check size={14} />
      </button>
      <button 
        onClick={() => { setEditing(false); setValue(currentVkLink || '') }}
        style={{ background: 'transparent', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
      >
        <X size={14} />
      </button>
    </div>
  )
}
