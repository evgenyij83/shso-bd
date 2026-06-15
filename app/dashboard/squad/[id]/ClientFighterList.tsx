'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UserPlus, Trash2, ExternalLink, Pencil, ArrowRightLeft } from 'lucide-react'
import { addFighter, deleteFighter, editFighter, transferFighter } from '@/app/actions/fighters'

type Fighter = { id: string, squadId: string, position: string, fullName: string, faculty: string, studyGroup: string, course: number, educationForm: string, phone: string, vkLink: string | null }

export default function ClientFighterList({ fighters, squadId, canEdit, userRole, allSquads = [] }: { fighters: Fighter[], squadId: string, canEdit: boolean, userRole: string, allSquads?: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add')
  const [editingFighter, setEditingFighter] = useState<Fighter | null>(null)
  const [transferModalOpen, setTransferModalOpen] = useState(false)
  const [transferFighterItem, setTransferFighterItem] = useState<Fighter | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const openAddModal = () => {
    setModalMode('add')
    setEditingFighter(null)
    setIsModalOpen(true)
  }

  const openEditModal = (fighter: Fighter) => {
    setModalMode('edit')
    setEditingFighter(fighter)
    setIsModalOpen(true)
  }

  const openTransferModal = (fighter: Fighter) => {
    setTransferFighterItem(fighter)
    setTransferModalOpen(true)
  }

  async function handleTransferSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!transferFighterItem) return
    setLoading(true)
    setError('')
    const formData = new FormData(e.currentTarget)
    const newSquadId = formData.get('newSquadId') as string
    const res = await transferFighter(transferFighterItem.id, newSquadId)
    if (res.error) {
      setError(res.error)
    } else {
      setTransferModalOpen(false)
    }
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const formData = new FormData(e.currentTarget)
    formData.append('squadId', squadId)
    const res = modalMode === 'add' ? await addFighter(formData) : await editFighter(formData)
    if (res.error) { 
      setError(res.error)
      setLoading(false) 
    } else { 
      setIsModalOpen(false)
      setLoading(false)
      if ((res as any).warning) alert((res as any).warning)
    }
  }

  const canAddCommander = userRole === 'DEVELOPER' || userRole === 'UNIVERSITY_ADMIN' || userRole === 'HQ_COMMANDER'
  const canTransfer = userRole === 'DEVELOPER' || userRole === 'UNIVERSITY_ADMIN'

  return (
    <div>
      {canEdit && <button onClick={openAddModal} className="btn-primary" style={{ marginBottom: '2rem' }}><UserPlus size={18} /> Добавить бойца</button>}
      <div className="glass-panel" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)' }}>
              <th style={{ padding: '1rem', width: '50px' }}>№</th><th style={{ padding: '1rem' }}>Должность</th><th style={{ padding: '1rem' }}>ФИО</th><th style={{ padding: '1rem' }}>Факультет/Группа</th><th style={{ padding: '1rem' }}>Курс</th><th style={{ padding: '1rem' }}>Форма обучения</th><th style={{ padding: '1rem' }}>Контакты</th>{canEdit && <th style={{ padding: '1rem' }}></th>}
            </tr>
          </thead>
          <tbody>
            {fighters.map((fighter, i) => (
              <motion.tr key={fighter.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{i + 1}</td>
                <td style={{ padding: '1rem', color: fighter.position === 'Командир' ? 'var(--commander-accent)' : fighter.position === 'Комиссар' ? 'var(--commissar-accent)' : 'inherit', fontWeight: fighter.position !== 'Боец' ? 600 : 400 }}>{fighter.position}</td>
                <td style={{ padding: '1rem', fontWeight: 500 }}>{fighter.fullName}</td>
                <td style={{ padding: '1rem' }}>{fighter.faculty}<br/><span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)'}}>{fighter.studyGroup}</span></td>
                <td style={{ padding: '1rem' }}>{fighter.course}</td>
                <td style={{ padding: '1rem' }}>{fighter.educationForm}</td>
                <td style={{ padding: '1rem' }}>
                  {fighter.phone}
                  {fighter.vkLink && <div><a href={fighter.vkLink} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-color)' }}>ВКонтакте <ExternalLink size={14} /></a></div>}
                </td>
                {canEdit && <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => openEditModal(fighter)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-color)', cursor: 'pointer' }} title="Редактировать"><Pencil size={18} /></button>
                  {canTransfer && <button onClick={() => openTransferModal(fighter)} style={{ background: 'transparent', border: 'none', color: '#10b981', cursor: 'pointer' }} title="Перевести в другой отряд"><ArrowRightLeft size={18} /></button>}
                  <button onClick={() => { if (confirm('Удалить?')) deleteFighter(fighter.id, squadId) }} style={{ background: 'transparent', border: 'none', color: 'var(--danger-color)', cursor: 'pointer' }} title="Удалить"><Trash2 size={18} /></button>
                </td>}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      <AnimatePresence>
        {isModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '2rem', background: 'var(--bg-color)' }}>
              <h2>{modalMode === 'add' ? 'Новый боец' : 'Редактировать бойца'}</h2>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {modalMode === 'edit' && editingFighter && <input type="hidden" name="fighterId" value={editingFighter.id} />}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <input name="fullName" placeholder="ФИО" defaultValue={editingFighter?.fullName || ''} className="input-field" required style={{ gridColumn: '1 / -1' }} />
                  <select name="position" defaultValue={editingFighter?.position || 'Боец'} className="input-field" required>
                    <option value="Боец">Боец</option>
                    <option value="Кандидат">Кандидат</option>
                  </select>
                  <input name="course" type="number" min="1" max="6" placeholder="Курс" defaultValue={editingFighter?.course || ''} className="input-field" required />
                  <input name="faculty" placeholder="Факультет" defaultValue={editingFighter?.faculty || ''} className="input-field" required />
                  <input name="studyGroup" placeholder="Группа" defaultValue={editingFighter?.studyGroup || ''} className="input-field" required />
                  <select name="educationForm" defaultValue={editingFighter?.educationForm || 'Бюджет'} className="input-field" required style={{ gridColumn: '1 / -1' }}><option value="Бюджет">Бюджетная основа</option><option value="Целевое">Целевое обучение</option><option value="Коммерческое">Коммерческая основа</option></select>
                  <input name="phone" placeholder="Телефон" defaultValue={editingFighter?.phone || ''} className="input-field" required />
                  <input name="vkLink" placeholder="Ссылка на ВК (необяз.)" defaultValue={editingFighter?.vkLink || ''} className="input-field" />
                </div>
                {error && <div style={{ color: 'var(--danger-color)' }}>{error}</div>}
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-danger" style={{ flex: 1, color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }}>Отмена</button>
                  <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={loading}>{loading ? 'Сохранение...' : 'Сохранить'}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {transferModalOpen && transferFighterItem && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2rem', background: 'var(--bg-color)' }}>
              <h2 style={{ marginBottom: '1rem' }}>Перевод бойца</h2>
              <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Выберите отряд, в который хотите перевести <b>{transferFighterItem.fullName}</b>. Командирам старого и нового отрядов придет уведомление в ВК.
              </p>
              <form onSubmit={handleTransferSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <select name="newSquadId" className="input-field" required defaultValue="">
                  <option value="" disabled>Выберите отряд</option>
                  {allSquads.filter((s: any) => s.id !== squadId).map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                {error && <div style={{ color: 'var(--danger-color)' }}>{error}</div>}
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button type="button" onClick={() => setTransferModalOpen(false)} className="btn-danger" style={{ flex: 1, color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }}>Отмена</button>
                  <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={loading}>{loading ? 'Обработка...' : 'Перевести'}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
