import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { saveSession } from '../lib/auth'
import { C } from '../lib/cn'

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

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    first_name: '', last_name: '',
    email: '', password: '', password_confirmation: '', role: 'student',
  })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError('Ingresá nombre y apellido.')
      return
    }
    if (form.password !== form.password_confirmation) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    try {
      const payload = {
        name:                  `${form.first_name.trim()} ${form.last_name.trim()}`,
        email:                 form.email,
        password:              form.password,
        password_confirmation: form.password_confirmation,
        role:                  form.role,
      }
      const { data } = await api.post('/users/register', payload)
      saveSession(data.user, data.token)
      // Nuevo usuario: ir al wizard de onboarding para personalizar el perfil
      navigate('/onboarding', { replace: true })
    } catch (err) {
      const msgs = err.response?.data?.errors
      setError(msgs ? Object.values(msgs).flat().join(' ') : 'Error al registrarse.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#1e1e1e] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-500 mb-4">
            <DumbbellIcon className="w-9 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Crear cuenta</h1>
          <p className="text-zinc-500 text-sm mt-1">Power Routines</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre y Apellido en fila */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={C.label}>Nombre</label>
              <input className={C.input} type="text" placeholder="Juan"
                value={form.first_name} onChange={set('first_name')} required />
            </div>
            <div>
              <label className={C.label}>Apellido</label>
              <input className={C.input} type="text" placeholder="García"
                value={form.last_name} onChange={set('last_name')} required />
            </div>
          </div>

          <div>
            <label className={C.label}>Email</label>
            <input className={C.input} type="email" placeholder="juan@ejemplo.com"
              value={form.email} onChange={set('email')} required />
          </div>

          <div>
            <label className={C.label}>Contraseña</label>
            <input className={C.input} type="password" placeholder="Mínimo 8 caracteres"
              value={form.password} onChange={set('password')} required />
          </div>

          <div>
            <label className={C.label}>Confirmar contraseña</label>
            <input className={C.input} type="password" placeholder="••••••••"
              value={form.password_confirmation} onChange={set('password_confirmation')} required />
          </div>

          <div>
            <label className={C.label}>Soy</label>
            <div className="grid grid-cols-2 gap-2">
              {['student', 'trainer'].map(r => (
                <button key={r} type="button"
                  onClick={() => setForm(f => ({ ...f, role: r }))}
                  className={`py-3 rounded-xl text-sm font-semibold transition-all border
                    ${form.role === r
                      ? 'bg-orange-500 border-orange-500 text-white'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                    }`}>
                  {r === 'student' ? 'Alumno' : 'Entrenador'}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button className={C.primary} type="submit" disabled={loading}>
            {loading ? 'Registrando...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="text-center text-sm text-zinc-500 mt-6">
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="text-orange-400 hover:underline font-medium">Ingresá</Link>
        </p>
      </div>
    </div>
  )
}
