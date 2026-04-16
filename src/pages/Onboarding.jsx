import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { getUser, saveSession, getToken, isTrainer } from '../lib/auth'
import api from '../lib/api'
import { C } from '../lib/cn'

export const DISCIPLINES = [
  { value: 'gym',          label: 'Gym / Musculación' },
  { value: 'football',     label: 'Fútbol' },
  { value: 'athletics',    label: 'Atletismo' },
  { value: 'crossfit',     label: 'CrossFit' },
  { value: 'swimming',     label: 'Natación' },
  { value: 'cycling',      label: 'Ciclismo' },
  { value: 'basketball',   label: 'Básquet' },
  { value: 'tennis',       label: 'Tenis' },
  { value: 'martial_arts', label: 'Artes Marciales' },
  { value: 'yoga',         label: 'Yoga / Pilates' },
  { value: 'other',        label: 'Otro' },
]

export const GOALS = [
  { value: 'strength',     label: 'Ganar fuerza' },
  { value: 'muscle_gain',  label: 'Ganar músculo' },
  { value: 'weight_loss',  label: 'Bajar de peso' },
  { value: 'endurance',    label: 'Mejorar resistencia' },
  { value: 'performance',  label: 'Rendimiento deportivo' },
  { value: 'flexibility',  label: 'Flexibilidad y movilidad' },
  { value: 'rehabilitation', label: 'Rehabilitación' },
  { value: 'general',      label: 'Bienestar general' },
]

export const FITNESS_LEVELS = [
  { value: 'beginner',     label: 'Principiante', desc: 'Empezando o volviendo después de un tiempo' },
  { value: 'intermediate', label: 'Intermedio',   desc: 'Entrenando regularmente hace más de 6 meses' },
  { value: 'advanced',     label: 'Avanzado',     desc: 'Varios años de entrenamiento consistente' },
]

export const CONDITIONS = [
  { value: 'knee_injury',     label: 'Lesión de rodilla' },
  { value: 'back_injury',     label: 'Lesión de espalda' },
  { value: 'shoulder_injury', label: 'Lesión de hombro' },
  { value: 'hypertension',    label: 'Hipertensión' },
  { value: 'heart_condition', label: 'Condición cardíaca' },
  { value: 'diabetes',        label: 'Diabetes' },
  { value: 'obesity',         label: 'Obesidad / Sobrepeso' },
  { value: 'pregnancy',       label: 'Embarazo' },
  { value: 'asthma',          label: 'Asma' },
]

export default function Onboarding() {
  const navigate  = useNavigate()
  const user      = getUser()
  const [step, setStep] = useState(1)

  const [form, setForm] = useState({
    discipline:    '',
    goal:          '',
    fitness_level: 'beginner',
    conditions:    [],
  })

  const mutation = useMutation({
    mutationFn: () => api.put('/users/me', form),
    onSuccess: ({ data }) => {
      saveSession(data, getToken())
      navigate(isTrainer() ? '/trainer/routines' : '/student/routines', { replace: true })
    },
  })

  function toggleCondition(value) {
    setForm(f => ({
      ...f,
      conditions: f.conditions.includes(value)
        ? f.conditions.filter(c => c !== value)
        : [...f.conditions, value],
    }))
  }

  const canNext1 = form.discipline && form.goal
  const canNext2 = form.fitness_level

  return (
    <div className="min-h-screen bg-[#1e1e1e] flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">

        {/* Logo + título */}
        <div className="text-center mb-8">
          <p className="text-zinc-500 text-sm mb-1">Paso {step} de 3</p>
          <div className="flex justify-center gap-2 mb-6">
            {[1, 2, 3].map(s => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all ${
                  s <= step ? 'bg-orange-500 w-10' : 'bg-zinc-700 w-6'
                }`}
              />
            ))}
          </div>
          <h1 className="text-2xl font-bold text-white">
            {step === 1 && 'Tu deporte y objetivo'}
            {step === 2 && 'Tu nivel de condición'}
            {step === 3 && '¿Tenés alguna condición?'}
          </h1>
          <p className="text-zinc-500 text-sm mt-2">
            {step === 1 && 'Esto nos permite sugerirte rutinas relevantes.'}
            {step === 2 && 'Para recomendarte el nivel de rutinas adecuado.'}
            {step === 3 && 'Así evitamos sugerirte rutinas que no sean convenientes para vos.'}
          </p>
        </div>

        {/* Paso 1: Disciplina + Objetivo */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className={C.label}>¿Qué deporte o actividad practicás?</label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {DISCIPLINES.map(d => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, discipline: d.value }))}
                    className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition-all text-left ${
                      form.discipline === d.value
                        ? 'bg-orange-500 border-orange-500 text-white'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white'
                    }`}>
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={C.label}>¿Cuál es tu objetivo principal?</label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {GOALS.map(g => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, goal: g.value }))}
                    className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition-all text-left ${
                      form.goal === g.value
                        ? 'bg-orange-500 border-orange-500 text-white'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white'
                    }`}>
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              className={C.primary}
              disabled={!canNext1}
              onClick={() => setStep(2)}>
              Continuar
            </button>
          </div>
        )}

        {/* Paso 2: Nivel de condición */}
        {step === 2 && (
          <div className="space-y-4">
            {FITNESS_LEVELS.map(l => (
              <button
                key={l.value}
                type="button"
                onClick={() => setForm(f => ({ ...f, fitness_level: l.value }))}
                className={`w-full text-left px-4 py-4 rounded-2xl border transition-all ${
                  form.fitness_level === l.value
                    ? 'bg-orange-500/15 border-orange-500 text-white'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-500'
                }`}>
                <p className="font-semibold">{l.label}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{l.desc}</p>
              </button>
            ))}

            <div className="flex gap-2 pt-2">
              <button className={C.outline} onClick={() => setStep(1)}>Volver</button>
              <button className={`${C.primary} flex-1`} disabled={!canNext2} onClick={() => setStep(3)}>
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* Paso 3: Condiciones físicas */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {CONDITIONS.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => toggleCondition(c.value)}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition-all text-left ${
                    form.conditions.includes(c.value)
                      ? 'bg-orange-500/15 border-orange-500 text-orange-300'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white'
                  }`}>
                  {c.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-zinc-600">Podés seleccionar varias. Esto es opcional.</p>

            <div className="flex gap-2 pt-2">
              <button className={C.outline} onClick={() => setStep(2)}>Volver</button>
              <button
                className={`${C.primary} flex-1`}
                disabled={mutation.isPending}
                onClick={() => mutation.mutate()}>
                {mutation.isPending ? 'Guardando...' : '¡Listo, empezar!'}
              </button>
            </div>

            <button
              className="w-full text-center text-xs text-zinc-600 hover:text-zinc-400 transition-colors py-1"
              onClick={() => {
                // Saltar onboarding sin condiciones
                mutation.mutate()
              }}>
              Saltear este paso
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
