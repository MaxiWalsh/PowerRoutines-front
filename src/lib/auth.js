export const getToken = () => localStorage.getItem('token')
export const getUser  = () => JSON.parse(localStorage.getItem('user') || 'null')

export const saveSession = (user, token) => {
  localStorage.setItem('token', token)
  localStorage.setItem('user', JSON.stringify(user))
}

export const clearSession = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

export const isTrainer = () => getUser()?.role === 'trainer'
export const isStudent = () => getUser()?.role === 'student'
