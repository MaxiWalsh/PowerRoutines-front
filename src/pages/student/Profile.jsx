import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getUser, saveSession, getToken } from '../../lib/auth'
import api from '../../lib/api'
import { C } from '../../lib/cn'
import AvatarUpload from '../../components/AvatarUpload'
import PremiumGate from '../../components/PremiumGate'

export default function StudentProfile() {
  const user = getUser()
  const qc   = useQueryClient()
  const [form, setForm] = useState({
    name:       user?.name ?? '',
    weight_kg:  user?.weight_kg ?? '',
    height_cm:  user?.height_cm ?? '',
    birth_date: user?.birth_date ?? '',
    gender:     user?.gender ?? '',
  })
  const [saved, setSaved]       = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const [joinMsg, setJoinMsg]   = useState('')
  const [joinErr, setJoinErr]   = useState('')
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  // Fetch full user to get gyms list
  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/users/me').then(r => r.data),
  })

  const mutation = useMutation({
    mutationFn: () => api.put('/users/me', form),
    onSuccess: ({ data }) => {
      saveSession(data, getToken())
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    },
  })

  const joinGym = useMutation({
    mutationFn: () => {
      if (!inviteCode.trim()) throw new Error('Ingresá el código de invitación.')
      return api.post('/gyms/join', { invite_code: inviteCode.trim() })
    },
    onSuccess: ({ data }) => {
      setJoinMsg(data.message ?? '¡Te uniste al gimnasio!')
      setJoinErr('')
      setInviteCode('')
      qc.invalidateQueries(['me'])
      qc.invalidateQueries(['routines'])
    },
    onError: err => {
      setJoinErr(err.response?.data?.message ?? err.message ?? 'Código inválido.')
      setJoinMsg('')
    },
  })

  const leaveGym = useMutation({
    mutationFn: gymId => api.delete(`/gyms/${gymId}/leave`),
    onSuccess: () => {
      qc.invalidateQueries(['me'])
      qc.invalidateQueries(['routines'])
    },
    onError: err => {
      setJoinErr(err.response?.data?.message ?? err.message ?? 'Error al salir del gimnasio.')
    },
  })

  const myGyms = me?.gyms ?? []

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-white">Mi perfil</h1>

      <div className="flex items-center gap-4">
        <AvatarUpload user={user} />
        <div>
          <p className="font-semibold text-white">{user?.name}</p>
          <span className={`${C.badgeBlue} mt-1`}>Alumno</span>
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
            <input className={C.input} type="number" step="0.5" value={form.weight_kg} onChange={set('weight_kg')} placeholder="75" />
          </div>
          <div>
            <label className={C.label}>Altura (cm)</label>
            <input className={C.input} type="number" value={form.height_cm} onChange={set('height_cm')} placeholder="175" />
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
        <button className={C.primary} onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          {mutation.isPending ? 'Guardando...' : saved ? '¡Guardado!' : 'Guardar cambios'}
        </button>
      </div>

      {/* Mis gimnasios */}
      <div className={`${C.cardP} space-y-4`}>
        <h2 className="text-sm font-semibold text-zinc-300">Mis gimnasios</h2>

        {myGyms.length === 0 ? (
          <p className="text-xs text-zinc-500">Todavía no estás inscripto en ningún gimnasio.</p>
        ) : (
          <ul className="space-y-2">
            {myGyms.map(gym => (
              <li key={gym.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-zinc-800/60 border border-zinc-700">
                <div className="w-8 h-8 rounded-lg bg-orange-500/15 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <span className="flex-1 text-sm font-medium text-white">{gym.name}</span>
                <button
                  onClick={() => {
                    if (confirm(`¿Salir de "${gym.name}"? Perderás acceso a las rutinas del gimnasio.`)) {
                      leaveGym.mutate(gym.id)
                    }
                  }}
                  disabled={leaveGym.isPending}
                  className="text-xs text-zinc-600 hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-500/10"
                  title="Salir del gimnasio">
                  Salir
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Unirse con código */}
        <div className="pt-2 border-t border-zinc-800 space-y-3">
          <p className="text-xs font-medium text-zinc-400">Unirse a un gimnasio con código de invitación</p>
          <div className="flex gap-2">
            <input
              className={`${C.input} flex-1 font-mono tracking-widest uppercase`}
              placeholder="ABCD1234"
              value={inviteCode}
              onChange={e => setInviteCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && joinGym.mutate()}
              maxLength={12}
            />
            <button
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-40 transition-colors shrink-0"
              onClick={() => joinGym.mutate()}
              disabled={joinGym.isPending || !inviteCode.trim()}>
              {joinGym.isPending ? 'Uniéndose...' : 'Unirse'}
            </button>
          </div>
          {joinMsg && <p className="text-emerald-400 text-xs">{joinMsg}</p>}
          {joinErr && <p className="text-red-400 text-xs">{joinErr}</p>}
        </div>
      </div>

      {/* Plan */}
      <PlanSection me={me} qc={qc} />
    </div>
  )
}

// ─── PlanSection ──────────────────────────────────────────────────────────────

function PlanSection({ me, qc }) {
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
    <div className={`${C.cardP} space-y-4`} id="premium">
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
          <div className="space-y-2">
            {[
              'Progreso por ejercicio con gráficos',
              'Récords personales automáticos',
              'Estadísticas de volumen semanal/mensual',
              'Rutinas activas ilimitadas',
            ].map(f => (
              <div key={f} className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-zinc-300">{f}</span>
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
            Estás en el plan <span className="text-white font-medium">Free</span>.
            Pasate a Premium para desbloquear estadísticas avanzadas y seguimiento de progreso.
          </p>
          <div className="space-y-2">
            {[
              { label: 'Progreso por ejercicio', free: false },
              { label: 'Récords personales (PR)', free: false },
              { label: 'Estadísticas de volumen', free: false },
              { label: 'Registrar entrenamientos', free: true },
              { label: 'Historial básico', free: true },
              { label: 'Marketplace', free: true },
            ].map(f => (
              <div key={f.label} className="flex items-center justify-between">
                <span className={`text-xs ${f.free ? 'text-zinc-400' : 'text-zinc-600'}`}>{f.label}</span>
                {f.free
                  ? <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  : <span className="text-xs text-orange-400 font-medium">⭐ Premium</span>
                }
              </div>
            ))}
          </div>
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
