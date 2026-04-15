import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { saveSession } from '../lib/auth'

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

export default function LoginPage() {
  const navigate = useNavigate()
  const [form, setForm]   = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/users/login', form)
      saveSession(data.user, data.token)
      navigate(data.user.role === 'trainer' ? '/trainer/routines' : '/student/routines', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Error al iniciar sesión.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#1e1e1e] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-500 mb-4">
            <DumbbellIcon className="w-9 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Power Routines</h1>
          <p className="text-zinc-500 text-sm mt-1">Tu entrenamiento, organizado.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-2">Email</label>
            <input
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-orange-500 transition-colors"
              type="email" placeholder="juan@ejemplo.com"
              value={form.email} onChange={set('email')} required />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-2">Contraseña</label>
            <input
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-orange-500 transition-colors"
              type="password" placeholder="••••••••"
              value={form.password} onChange={set('password')} required />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm bg-orange-500 hover:bg-orange-600 active:scale-95 text-white transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed mt-2"
            type="submit" disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p className="text-center text-sm text-zinc-500 mt-6">
          ¿No tenés cuenta?{' '}
          <Link to="/register" className="text-orange-400 hover:underline font-medium">
            Registrate
          </Link>
        </p>
      </div>
    </div>
  )
}
