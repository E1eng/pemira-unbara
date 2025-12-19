import { createContext, useContext, useMemo, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [nim, setNim] = useState(null)
  const [accessCode, setAccessCode] = useState(null)

  const login = (rawNim, rawCode) => {
    const cleanedNim = String(rawNim ?? '').trim()
    const cleanedCode = String(rawCode ?? '').trim()

    if (!cleanedNim) throw new Error('NIM/NPM wajib diisi.')
    if (!/^[0-9]+$/.test(cleanedNim)) throw new Error('NIM/NPM harus berupa angka.')
    if (cleanedNim.length < 5 || cleanedNim.length > 20) throw new Error('Format NIM/NPM tidak valid.')

    if (!cleanedCode) throw new Error('Kode Akses wajib diisi.')
    if (cleanedCode.length < 4 || cleanedCode.length > 32) throw new Error('Format Kode Akses tidak valid.')

    setNim(cleanedNim)
    setAccessCode(cleanedCode)
  }

  const logout = () => {
    setNim(null)
    setAccessCode(null)
  }

  const value = useMemo(
    () => ({
      nim,
      accessCode,
      isAuthenticated: Boolean(nim && accessCode),
      login,
      logout,
    }),
    [nim, accessCode],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
