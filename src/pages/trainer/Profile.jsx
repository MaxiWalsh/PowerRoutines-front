import { useState, useEffect, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getUser, saveSession, getToken } from '../../lib/auth'
import api from '../../lib/api'
import { C } from '../../lib/cn'
import AvatarUpload from '../../components/AvatarUpload'
import PremiumGate from '../../components/PremiumGate'
import { DISCIPLINES, GOALS, FITNESS_LEVELS, CONDITIONS } from '../Onboarding'

export default function TrainerProfile() {
  const user = getUser()
  const qc   = useQueryClient()

  const [form, setForm]   = useState({
    name:          user?.name          ?? '',
    weight_kg:     user?.weight_kg     ?? '',
    height_cm:     user?.height_cm     ?? '',
    birth_date:    user?.birth_date    ?? '',
    gender:        user?.gender        ?? '',
    disciplines:   user?.disciplines   ?? [],
    goals:         user?.goals         ?? [],
    fitness_level: user?.fitness_level ?? '',
    conditions:    user?.conditions    ?? [],
  })
  const [saved, setSaved] = useState(false)

  const [showNewGym, setShowNewGym]     = useState(false)
  const [gymForm, setGymForm]           = useState({ name: '', description: '' })
  const [editingGym, setEditingGym]     = useState(false)
  const [gymEditForm, setGymEditForm]   = useState({ name: '', description: '' })
  const [gymSaved, setGymSaved]         = useState(false)
  const [gymLogoPreview, setGymLogoPreview] = useState(null)
  const gymLogoInputRef = useRef()

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/users/me').then(r => r.data),
  })

  const gym = me?.owned_gym

  // Sync gym edit form when gym loads
  useEffect(() => {
    if (gym) setGymEditForm({ name: gym.name ?? '', description: gym.description ?? '' })
  }, [gym?.id])

  const set    = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const setGym = k => e => setGymEditForm(f => ({ ...f, [k]: e.target.value }))

  const updateMe = useMutation({
    mutationFn: () => api.put('/users/me', form),
    onSuccess: ({ data }) => {
      saveSession(data, getToken())
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    },
  })

  const createGym = useMutation({
    mutationFn: () => api.post('/gyms', gymForm),
    onSuccess: () => {
      qc.invalidateQueries(['me'])
      setShowNewGym(false)
      setGymForm({ name: '', description: '' })
    },
  })

  const uploadGymLogo = useMutation({
    mutationFn: (file) => {
      const fd = new FormData()
      fd.append('logo', file)
      return api.post(`/gyms/${gym.id}/logo`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    onSuccess: () => qc.invalidateQueries(['me']),
  })

  const updateGym = useMutation({
    mutationFn: () => api.put(`/gyms/${gym.id}`, gymEditForm),
    onSuccess: () => {
      qc.invalidateQueries(['me'])
      setEditingGym(false)
      setGymSaved(true)
      setTimeout(() => setGymSaved(false), 2500)
    },
  })

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-white">Mi perfil</h1>

      {/* Avatar + rol */}
      <div className="flex items-center gap-4">
        <AvatarUpload user={user} />
        <div>
          <p className="font-semibold text-white">{user?.name}</p>
          <span className={`${C.badgeBlue} mt-1`}>Entrenador</span>
          <p className="text-xs text-zinc-600 mt-1">Tocá la foto para cambiarla</p>
        </div>
      </div>

      {/* Datos personales */}
      <div className={`${C.cardP} space-y-4`}>
        <h2 className="text-sm font-semibold text-zinc-300">Datos personales</h2>
        <div>
          <label className={C.label}>Nombre</label>
          <input className={C.input} value={form.name} onChange={set('name')} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={C.label}>Peso (kg)</label>
            <input className={C.input} type="number" step="0.5" value={form.weight_kg}
              onChange={set('weight_kg')} placeholder="75" />
          </div>
          <div>
            <label className={C.label}>Altura (cm)</label>
            <input className={C.input} type="number" value={form.height_cm}
              onChange={set('height_cm')} placeholder="175" />
          </div>
        </div>
        <div>
          <label className={C.label}>Fecha de nacimiento</label>
          <input className={C.input} type="date" value={form.birth_date} onChange={set('birth_date')} />
        </div>
        <div>
          <label className={C.label}>Género</label>
          <select className={C.input} value={form.gender} onChange={set('gender')}>
            <option value="">Prefiero no decir</option>
            <option value="male">Masculino</option>
            <option value="female">Femenino</option>
            <option value="other">Otro</option>
          </select>
        </div>

        {/* Deporte y objetivo */}
        <div className="pt-2 border-t border-zinc-800 space-y-3">
          <p className="text-xs font-semibold text-zinc-400">Deporte y objetivo</p>
          <div>
            <label className={C.label}>
              Deportes / Actividades
              {form.disciplines.length > 0 && <span className="ml-1.5 text-orange-400">{form.disciplines.length} sel.</span>}
            </label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {DISCIPLINES.map(d => (
                <button key={d.value} type="button"
                  onClick={() => setForm(f => ({ ...f, disciplines: f.disciplines.includes(d.value) ? f.disciplines.filter(x => x !== d.value) : [...f.disciplines, d.value] }))}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all ${form.disciplines.includes(d.value) ? 'bg-orange-500 border-orange-500 text-white' : 'bg-zinc-800/60 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white'}`}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={C.label}>
              Objetivos
              {form.goals.length > 0 && <span className="ml-1.5 text-orange-400">{form.goals.length} sel.</span>}
            </label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {GOALS.map(g => (
                <button key={g.value} type="button"
                  onClick={() => setForm(f => ({ ...f, goals: f.goals.includes(g.value) ? f.goals.filter(x => x !== g.value) : [...f.goals, g.value] }))}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all ${form.goals.includes(g.value) ? 'bg-orange-500 border-orange-500 text-white' : 'bg-zinc-800/60 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white'}`}>
                  {g.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={C.label}>Nivel de condición</label>
            <select className={C.input} value={form.fitness_level} onChange={set('fitness_level')}>
              <option value="">Sin especificar</option>
              {FITNESS_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
        </div>

        {/* Condiciones físicas */}
        <div className="pt-2 border-t border-zinc-800 space-y-2">
          <p className="text-xs font-semibold text-zinc-400">Condiciones físicas <span className="font-normal text-zinc-600">(opcional)</span></p>
          <div className="grid grid-cols-2 gap-2">
            {CONDITIONS.map(c => (
              <button
                key={c.value}
                type="button"
                onClick={() => setForm(f => ({
                  ...f,
                  conditions: f.conditions.includes(c.value)
                    ? f.conditions.filter(x => x !== c.value)
                    : [...f.conditions, c.value],
                }))}
                className={`px-2.5 py-2 rounded-xl text-xs font-medium border transition-all text-left ${
                  form.conditions.includes(c.value)
                    ? 'bg-orange-500/15 border-orange-500 text-orange-300'
                    : 'bg-zinc-800/60 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white'
                }`}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <button className={C.primary} onClick={() => updateMe.mutate()} disabled={updateMe.isPending}>
          {updateMe.isPending ? 'Guardando...' : saved ? '¡Guardado!' : 'Guardar cambios'}
        </button>
      </div>

      {/* Gimnasio */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-white">Mi gimnasio</h2>

        {gym ? (
          <div className={`${C.cardP} space-y-4`}>
            {editingGym ? (
              /* Formulario de edición del gimnasio */
              <div className="space-y-3">
                <div>
                  <label className={C.label}>Nombre del gimnasio</label>
                  <input className={C.input} value={gymEditForm.name} onChange={setGym('name')} />
                </div>
                <div>
                  <label className={C.label}>Descripción</label>
                  <textarea className={`${C.input} resize-none`} rows={2}
                    value={gymEditForm.description} onChange={setGym('description')}
                    placeholder="Descripción opcional..." />
                </div>
                <div className="flex gap-2">
                  <button className={C.primary}
                    onClick={() => updateGym.mutate()}
                    disabled={!gymEditForm.name.trim() || updateGym.isPending}>
                    {updateGym.isPending ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button className={C.outline} onClick={() => {
                    setEditingGym(false)
                    setGymEditForm({ name: gym.name, description: gym.description ?? '' })
                  }}>Cancelar</button>
                </div>
              </div>
            ) : (
              /* Vista del gimnasio */
              <>
                <div className="flex items-start justify-between gap-3">
                  {/* Logo del gym */}
                  <div
                    className="w-14 h-14 rounded-2xl bg-zinc-700 border-2 border-transparent hover:border-orange-500 flex items-center justify-center overflow-hidden cursor-pointer relative group shrink-0"
                    onClick={() => gymLogoInputRef.current?.click()}
                    title="Cambiar logo">
                    {gymLogoPreview || gym.logo
                      ? <img src={gymLogoPreview || gym.logo} alt="logo" className="w-full h-full object-cover" />
                      : <svg className="w-7 h-7 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    }
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                      {uploadGymLogo.isPending
                        ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                      }
                    </div>
                    <input ref={gymLogoInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        const reader = new FileReader()
                        reader.onload = ev => setGymLogoPreview(ev.target.result)
                        reader.readAsDataURL(file)
                        uploadGymLogo.mutate(file)
                      }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-base">{gym.name}</p>
                    {gym.description && <p className="text-sm text-zinc-500 mt-0.5">{gym.description}</p>}
                    {gymSaved && <p className="text-xs text-emerald-400 mt-1">¡Gimnasio actualizado!</p>}
                    <p className="text-xs text-zinc-600 mt-1">Tocá el logo para cambiarlo</p>
                  </div>
                  <button onClick={() => setEditingGym(true)}
                    className="p-2 rounded-xl hover:bg-zinc-700 text-zinc-500 hover:text-white transition-colors shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </div>

                <div className="pt-3 border-t border-zinc-800">
                  <p className="text-xs text-zinc-600 mb-1.5">Código de invitación</p>
                  <p className="font-mono font-bold text-orange-400 text-2xl tracking-[0.3em]">{gym.invite_code}</p>
                  <p className="text-xs text-zinc-600 mt-1">Compartí este código con tus alumnos para que se unan al gimnasio.</p>
                </div>
              </>
            )}
          </div>
        ) : showNewGym ? (
          <div className={`${C.cardP} space-y-3`}>
            <input className={C.input} placeholder="Nombre del gimnasio"
              value={gymForm.name} onChange={e => setGymForm(f => ({ ...f, name: e.target.value }))} />
            <textarea className={`${C.input} resize-none`} rows={2}
              placeholder="Descripción (opcional)"
              value={gymForm.description} onChange={e => setGymForm(f => ({ ...f, description: e.target.value }))} />
            <div className="flex gap-2">
              <button className={C.primary}
                onClick={() => createGym.mutate()}
                disabled={!gymForm.name.trim() || createGym.isPending}>
                {createGym.isPending ? 'Creando...' : 'Crear gimnasio'}
              </button>
              <button className={C.outline} onClick={() => setShowNewGym(false)}>Cancelar</button>
            </div>
          </div>
        ) : (
          <button className={C.outline} onClick={() => setShowNewGym(true)}>
            + Crear gimnasio
          </button>
        )}
      </div>

      {/* Plan */}
      <TrainerPlanSection me={me} qc={qc} />
    </div>
  )
}

// ─── TrainerPlanSection ───────────────────────────────────────────────────────

function TrainerPlanSection({ me, qc }) {
  const isPremium = me?.plan === 'premium'

  const upgrade = useMutation({
    mutationFn: () => api.post('/users/me/upgrade'),
    onSuccess: ({ data }) => {
      saveSession(data, getToken())
      qc.invalidateQueries(['me'])
    },
  })

  const downgrade = useMutation({
    mutationFn: () => api.post('/users/me/downgrade'),
    onSuccess: ({ data }) => {
      saveSession(data, getToken())
      qc.invalidateQueries(['me'])
    },
  })

  return (
    <div className={`${C.cardP} space-y-4`}>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-300">Mi plan</h2>
        {isPremium && (
          <span className="text-xs font-bold text-orange-400 bg-orange-500/10 border border-orange-800 px-2.5 py-1 rounded-full">
            ⭐ PREMIUM
          </span>
        )}
      </div>

      {isPremium ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {[
              'Analytics de tu gimnasio',
              'Rutinas ilimitadas',
              'Posicionamiento en marketplace',
              'Estadísticas de ventas avanzadas',
            ].map(f => (
              <div key={f} className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                <span className="text-xs text-zinc-400">{f}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => { if (confirm('¿Cancelar tu suscripción premium?')) downgrade.mutate() }}
            disabled={downgrade.isPending}
            className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
            {downgrade.isPending ? 'Cancelando...' : 'Cancelar suscripción'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-zinc-400">
            Plan <span className="text-white font-medium">Free</span> — Pasate a Premium para posicionar tus rutinas en el marketplace y acceder a analytics avanzados.
          </p>
          <button
            onClick={() => upgrade.mutate()}
            disabled={upgrade.isPending}
            className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold transition-colors disabled:opacity-60">
            {upgrade.isPending ? 'Activando...' : '⭐ Activar Premium — Gratis por ahora'}
          </button>
          <p className="text-zinc-700 text-xs text-center">Sin tarjeta de crédito · Cancelá cuando quieras</p>
        </div>
      )}
    </div>
  )
}
