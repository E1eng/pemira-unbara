import { createContext, useContext, useMemo, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [nik, setNik] = useState(null)
  const [accessCode, setAccessCode] = useState(null)

  const login = (rawNik, rawCode) => {
    const cleanedNik = String(rawNik ?? '').trim()
    const cleanedCode = String(rawCode ?? '').trim()

    if (!cleanedNik) throw new Error('NIK wajib diisi.')
    if (!/^[0-9]+$/.test(cleanedNik)) throw new Error('NIK harus berupa angka.')
    if (cleanedNik.length < 5 || cleanedNik.length > 20) throw new Error('Format NIK tidak valid.')

    if (!cleanedCode) throw new Error('Kode Akses wajib diisi.')
    if (cleanedCode.length < 4 || cleanedCode.length > 32) throw new Error('Format Kode Akses tidak valid.')

    setNik(cleanedNik)
    setAccessCode(cleanedCode)
  }

  const logout = () => {
    setNik(null)
    setAccessCode(null)
  }

  const value = useMemo(
    () => ({
      nik,
      accessCode,
      isAuthenticated: Boolean(nik && accessCode),
      login,
      logout,
    }),
    [nik, accessCode],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
