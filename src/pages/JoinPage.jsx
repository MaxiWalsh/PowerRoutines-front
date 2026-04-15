import { useEffect, useState } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getToken, isTrainer } from '../lib/auth'
import api from '../lib/api'

export default function JoinPage() {
  const [params]    = useSearchParams()
  const navigate    = useNavigate()
  const qc          = useQueryClient()
  const code        = params.get('code') ?? ''
  const loggedIn    = !!getToken()
  const trainerUser = isTrainer()

  const [joined, setJoined] = useState(false)
  const [error, setError]   = useState('')

  const joinMutation = useMutation({
    mutationFn: () => api.post('/gyms/join', { invite_code: code }),
    onSuccess: ({ data }) => {
      setJoined(true)
      qc.invalidateQueries(['me'])
      qc.invalidateQueries(['routines'])
    },
    onError: err => {
      setError(err.response?.data?.message ?? err.response?.data?.errors?.invite_code?.[0] ?? 'Código inválido o expirado.')
    },
  })

  // Si está logueado como alumno, auto-intenta unirse
  useEffect(() => {
    if (loggedIn && !trainerUser && code) {
      joinMutation.mutate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-2">
          <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center">
            <DumbbellIcon className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-white text-lg tracking-tight">Power Routines</span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">

          {joined ? (
            /* ── Éxito ─────────────────────────────────────────── */
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto">
                <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">¡Te uniste al gimnasio!</h2>
                <p className="text-zinc-500 text-sm mt-1">Ya podés ver las rutinas asignadas por tu entrenador.</p>
              </div>
              <button
                onClick={() => navigate('/student/routines', { replace: true })}
                className="w-full py-3 rounded-xl text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white transition-colors">
                Ver mis rutinas →
              </button>
            </div>

          ) : trainerUser ? (
            /* ── Es trainer, no puede unirse ───────────────────── */
            <div className="space-y-4">
              <p className="text-zinc-400 text-sm">Este enlace es para alumnos.</p>
              <p className="text-zinc-600 text-xs">Estás conectado como entrenador. Los entrenadores no pueden unirse a otros gimnasios como alumnos.</p>
              <Link to="/trainer/routines"
                className="block w-full py-3 rounded-xl text-sm font-semibold border border-zinc-700 text-zinc-300 hover:border-zinc-500 transition-colors">
                Ir al panel →
              </Link>
            </div>

          ) : !loggedIn ? (
            /* ── No está logueado ───────────────────────────────── */
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-full bg-orange-500/15 flex items-center justify-center mx-auto">
                <svg className="w-7 h-7 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Invitación al gimnasio</h2>
                {code && (
                  <p className="text-zinc-500 text-sm mt-1">
                    Código: <span className="font-mono font-bold text-orange-400 tracking-wider">{code}</span>
                  </p>
                )}
                <p className="text-zinc-600 text-xs mt-2">Creá una cuenta o iniciá sesión para unirte.</p>
              </div>
              <div className="space-y-2">
                <Link to={`/register?invite=${code}`}
                  className="block w-full py-3 rounded-xl text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white transition-colors">
                  Crear cuenta
                </Link>
                <Link to={`/login?redirect=/join?code=${code}`}
                  className="block w-full py-3 rounded-xl text-sm font-semibold border border-zinc-700 text-zinc-300 hover:border-zinc-500 transition-colors">
                  Ya tengo cuenta
                </Link>
              </div>
            </div>

          ) : joinMutation.isPending ? (
            /* ── Cargando ───────────────────────────────────────── */
            <div className="py-6 space-y-3">
              <div className="w-10 h-10 rounded-full border-2 border-orange-500 border-t-transparent animate-spin mx-auto" />
              <p className="text-zinc-500 text-sm">Uniéndote al gimnasio...</p>
            </div>

          ) : error ? (
            /* ── Error ──────────────────────────────────────────── */
            <div className="space-y-4">
              <p className="text-red-400 text-sm">{error}</p>
              <Link to="/student/profile"
                className="block w-full py-3 rounded-xl text-sm font-semibold border border-zinc-700 text-zinc-300 hover:border-zinc-500 transition-colors">
                Ingresar código manualmente
              </Link>
            </div>
          ) : null}
        </div>

        <p className="text-xs text-zinc-700">
          <Link to="/" className="hover:text-zinc-500 transition-colors">← Volver al inicio</Link>
        </p>
      </div>
    </div>
  )
}

function DumbbellIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 32 16" fill="currentColor">
      <rect x="0" y="2" width="7" height="12" rx="2"/>
      <rect x="25" y="2" width="7" height="12" rx="2"/>
      <rect x="5" y="4" width="4" height="8" rx="1.5" opacity="0.6"/>
      <rect x="23" y="4" width="4" height="8" rx="1.5" opacity="0.6"/>
      <rect x="9" y="6" width="14" height="4" rx="1.5"/>
    </svg>
  )
}
