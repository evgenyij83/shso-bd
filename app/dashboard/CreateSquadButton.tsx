'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { addSquad } from '@/app/actions/admin'

export default function CreateSquadButton() {
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    const name = window.prompt('Введите название нового отряда:')
    if (!name || name.trim() === '') return

    setLoading(true)
    const formData = new FormData()
    formData.append('name', name.trim())
    
    const res = await addSquad(formData)
    if (res.error) {
      alert(res.error)
    }
    setLoading(false)
  }

  return (
    <button 
      onClick={handleCreate}
      disabled={loading}
      className="btn-primary" 
      style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', width: 'fit-content' }}
    >
      <Plus size={16} />
      {loading ? 'Создание...' : 'Новый отряд'}
    </button>
  )
}
