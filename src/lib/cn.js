// Clases de Tailwind reutilizables — reemplaza las clases @apply que no compilan
export const C = {
  // Botones
  btn:        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold text-sm transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer',
  primary:    'inline-flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl font-semibold text-sm bg-orange-500 hover:bg-orange-600 active:scale-95 text-white transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed',
  ghost:      'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm bg-transparent hover:bg-zinc-700 text-zinc-300 transition-all duration-150 cursor-pointer border-0 outline-none',
  outline:    'inline-flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl font-semibold text-sm border border-zinc-600 hover:border-zinc-400 text-zinc-200 bg-transparent transition-all duration-150',
  danger:     'inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all duration-150 cursor-pointer border-0 outline-none',
  sm:         'px-3 py-2 text-xs',
  // Tarjetas
  card:       'bg-zinc-800 border border-zinc-700 rounded-2xl',
  cardP:      'bg-zinc-800 border border-zinc-700 rounded-2xl p-4',
  // Formulario
  input:      'w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-orange-500 transition-colors',
  label:      'block text-xs font-medium text-zinc-400 mb-2',
  // Badges
  badgeOrange: 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-500/15 text-orange-400',
  badgeBlue:  'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-500/15 text-orange-400',
  badgeGreen: 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400',
  badgeGray:  'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-700 text-zinc-400',
}
