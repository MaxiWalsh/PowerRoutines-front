import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { saveSession, getToken } from '../lib/auth'
import api from '../lib/api'

/**
 * AvatarUpload – círculo clicable que sube la foto de perfil.
 * Props:
 *   user        – objeto usuario con .avatar y .name
 *   size        – 'md' (default) | 'lg'
 */
export default function AvatarUpload({ user, size = 'md' }) {
  const qc        = useQueryClient()
  const inputRef  = useRef()
  const [preview, setPreview] = useState(null)
  const [error, setError]     = useState('')

  const dim = size === 'lg' ? 'w-20 h-20' : 'w-16 h-16'

  // Usamos la query 'me' para tener siempre la URL del avatar actualizada desde el servidor,
  // evitando el 404 que ocurre cuando user prop viene del localStorage desactualizado.
  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/users/me').then(r => r.data),
    staleTime: 1000 * 60,
  })

  const upload = useMutation({
    mutationFn: (file) => {
      const fd = new FormData()
      fd.append('avatar', file)
      return api.post('/users/me/avatar', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    onSuccess: ({ data }) => {
      // Actualiza la sesión local con el nuevo avatar
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
      saveSession({ ...currentUser, avatar: data.avatar }, getToken())
      qc.invalidateQueries(['me'])
      setError('')
    },
    onError: () => setError('No se pudo subir la imagen. Intentá de nuevo.'),
  })

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setPreview(ev.target.result)
    reader.readAsDataURL(file)
    upload.mutate(file)
  }

  // preview → base64 recién subido | me?.avatar → URL fresca del servidor | user?.avatar → fallback localStorage
  const avatarSrc = preview || me?.avatar || user?.avatar

  return (
    <div className="relative group cursor-pointer" onClick={() => inputRef.current?.click()}>
      <div className={`${dim} rounded-2xl bg-zinc-800 flex items-center justify-center overflow-hidden border-2 border-transparent group-hover:border-orange-500 transition-colors`}>
        {avatarSrc
          ? <img src={avatarSrc} alt="avatar" className="w-full h-full object-cover" />
          : <span className={`font-bold text-zinc-500 ${size === 'lg' ? 'text-3xl' : 'text-2xl'}`}>
              {user?.name?.[0]?.toUpperCase()}
            </span>
        }
        {/* Overlay al hover */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
          {upload.isPending
            ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
          }
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {error && <p className="text-red-400 text-xs mt-1 text-center">{error}</p>}
    </div>
  )
}
