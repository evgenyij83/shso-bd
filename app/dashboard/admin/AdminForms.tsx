'use client'

import { useState } from 'react'
import { addSquad, addUser, deleteUser, deleteSquad } from '@/app/actions/admin'
import { Trash2 } from 'lucide-react'

type Squad = { id: string, name: string }
type User = { id: string, uniqueCode: string, role: string, squadName?: string, fullName?: string | null }

export default function AdminForms({ squads, users = [] }: { squads: Squad[], users?: User[] }) {
  const [squadLoading, setSquadLoading] = useState(false)
  const [squadError, setSquadError] = useState('')
  const [squadSuccess, setSquadSuccess] = useState('')

  const [userLoading, setUserLoading] = useState(false)
  const [userError, setUserError] = useState('')
  const [userSuccess, setUserSuccess] = useState('')
  const [selectedRole, setSelectedRole] = useState('UNIVERSITY_ADMIN')

  async function handleAddSquad(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSquadLoading(true)
    setSquadError('')
    setSquadSuccess('')
    
    const res = await addSquad(new FormData(e.currentTarget))
    if (res.error) setSquadError(res.error)
    else {
      setSquadSuccess('Отряд успешно добавлен!')
      ;(e.target as HTMLFormElement).reset()
    }
    setSquadLoading(false)
  }

  async function handleAddUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setUserLoading(true)
    setUserError('')
    setUserSuccess('')

    const res = await addUser(new FormData(e.currentTarget))
    if (res.error) setUserError(res.error)
    else {
      setUserSuccess('Пользователь успешно создан!')
      ;(e.target as HTMLFormElement).reset()
    }
    setUserLoading(false)
  }

  const roleLabels: Record<string, string> = {
    UNIVERSITY_ADMIN: 'Руководство Университета',
    HQ_COMMANDER: 'Командир Штаба',
    HQ_COMMISSAR: 'Комиссар Штаба',
    SQUAD_COMMANDER: 'Командир Отряда',
    SQUAD_COMMISSAR: 'Комиссар Отряда',
    DEVELOPER: 'Разработчик (Root)'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Добавить новый отряд</h3>
          <form onSubmit={handleAddSquad} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input name="name" placeholder="Название отряда" className="input-field" required />
            {squadError && <div style={{ color: 'var(--danger-color)', fontSize: '0.9rem' }}>{squadError}</div>}
            {squadSuccess && <div style={{ color: '#34d399', fontSize: '0.9rem' }}>{squadSuccess}</div>}
            <button type="submit" className="btn-primary" disabled={squadLoading}>
              {squadLoading ? 'Сохранение...' : 'Создать отряд'}
            </button>
          </form>

          <div style={{ marginTop: '2rem' }}>
            <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Список отрядов</h4>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <tbody>
                  {squads.map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{s.name}</td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                        <button 
                          className="btn-danger" 
                          style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                          onClick={async () => {
                            if (confirm(`Вы уверены? Удаление отряда "${s.name}" также удалит всех его бойцов и командиров без возможности восстановления!`)) {
                              await deleteSquad(s.id)
                            }
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {squads.length === 0 && (
                    <tr>
                      <td colSpan={2} style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        Отрядов пока нет
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Создать аккаунт (Код доступа)</h3>
          <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input name="uniqueCode" placeholder="Уникальный код (например COM-123)" className="input-field" required />
            
            <select 
              name="role" 
              className="input-field" 
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              required
            >
              <option value="UNIVERSITY_ADMIN">Руководство университета</option>
              <option value="HQ_COMMANDER">Командир штаба</option>
              <option value="HQ_COMMISSAR">Комиссар штаба</option>
              <option value="SQUAD_COMMANDER">Командир отряда</option>
              <option value="SQUAD_COMMISSAR">Комиссар отряда</option>
            </select>

            {selectedRole === 'UNIVERSITY_ADMIN' && (
              <>
                <input name="fullName" placeholder="ФИО руководителя" className="input-field" required />
                <input name="vkLink" placeholder="Ссылка на ВК (обязательно)" className="input-field" required />
              </>
            )}

            {(selectedRole === 'SQUAD_COMMANDER' || selectedRole === 'SQUAD_COMMISSAR' || selectedRole === 'HQ_COMMANDER' || selectedRole === 'HQ_COMMISSAR') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '-0.5rem' }}>Данные для списка отряда:</h4>
                <select 
                  name="squadId" 
                  className="input-field" 
                  required={selectedRole === 'SQUAD_COMMANDER' || selectedRole === 'SQUAD_COMMISSAR'}
                >
                  <option value="">-- Выберите отряд -- {(selectedRole === 'HQ_COMMANDER' || selectedRole === 'HQ_COMMISSAR') && '(опционально)'}</option>
                  {squads.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                
                <input name="fullName" placeholder="ФИО (обязательно)" className="input-field" required />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <input name="faculty" placeholder="Факультет" className="input-field" required />
                  <input name="studyGroup" placeholder="Группа" className="input-field" required />
                  <input name="course" type="number" min="1" max="6" placeholder="Курс" className="input-field" required />
                  <select name="educationForm" className="input-field" required>
                    <option value="" disabled selected>Форма обучения</option>
                    <option value="Бюджет">Бюджетная основа</option>
                    <option value="Целевое">Целевое обучение</option>
                    <option value="Коммерческое">Коммерческая основа</option>
                  </select>
                </div>
                <input name="phone" placeholder="Телефон" className="input-field" required />
                <input name="vkLink" placeholder="Ссылка на ВК (обязательно)" className="input-field" required />
              </div>
            )}

            {userError && <div style={{ color: 'var(--danger-color)', fontSize: '0.9rem' }}>{userError}</div>}
            {userSuccess && <div style={{ color: '#34d399', fontSize: '0.9rem' }}>{userSuccess}</div>}
            <button type="submit" className="btn-primary" disabled={userLoading}>
              {userLoading ? 'Сохранение...' : 'Создать аккаунт'}
            </button>
          </form>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '2rem', marginTop: '1rem' }}>
        <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Управление аккаунтами</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <th style={{ padding: '1rem 0.5rem', color: 'var(--text-secondary)' }}>Код доступа</th>
                <th style={{ padding: '1rem 0.5rem', color: 'var(--text-secondary)' }}>Роль</th>
                <th style={{ padding: '1rem 0.5rem', color: 'var(--text-secondary)' }}>ФИО</th>
                <th style={{ padding: '1rem 0.5rem', color: 'var(--text-secondary)' }}>Отряд</th>
                <th style={{ padding: '1rem 0.5rem', color: 'var(--text-secondary)', textAlign: 'right' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem 0.5rem', fontWeight: 500 }}>{u.uniqueCode}</td>
                  <td style={{ padding: '1rem 0.5rem' }}>{roleLabels[u.role] || u.role}</td>
                  <td style={{ padding: '1rem 0.5rem' }}>{u.role === 'DEVELOPER' ? 'KiritoNagibator' : u.fullName || '—'}</td>
                  <td style={{ padding: '1rem 0.5rem' }}>
                    {u.squadName ? u.squadName : 
                     (u.role === 'HQ_COMMANDER' || u.role === 'HQ_COMMISSAR') ? 'Штаб' : 
                     u.role === 'UNIVERSITY_ADMIN' ? 'ПГУПС' : '—'}
                  </td>
                  <td style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>
                    {u.role !== 'DEVELOPER' && (
                      <button 
                        className="btn-danger" 
                        style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                        onClick={async () => {
                          if (confirm(`Удалить пользователя ${u.uniqueCode}?`)) {
                            await deleteUser(u.id)
                          }
                        }}
                      >
                        <Trash2 size={16} style={{ marginRight: '5px' }} />
                        Удалить
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Нет созданных аккаунтов
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
