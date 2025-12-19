import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, LockKeyhole, UserCog, Vote } from 'lucide-react'
import Layout from '../components/Layout.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabaseClient.js'

export default function HomePage() {
  const { nik, isAuthenticated, logout } = useAuth()
  const [settings, setSettings] = useState(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      const { data, error } = await supabase.from('election_settings').select('is_voting_open, show_live_result').single()
      if (cancelled) return
      if (!error && data) setSettings(data)
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <Layout>
      <div className="space-y-6">
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="bg-gradient-to-br from-gov-accent/10 via-white to-white p-5 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-2xl">
                <div className="text-sm font-semibold text-gov-accent">Portal Publik</div>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-gov-blue sm:text-3xl">
                  E-Voting Ketua BEM
                </h1>
                <p className="mt-2 text-sm text-zinc-600 sm:text-base">
                  Akses bilik suara digital, pantau quick count (jika dibuka panitia), dan lihat rekap suara.
                </p>
              </div>

              <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white/70 p-4 backdrop-blur">
                <div className="text-xs font-semibold text-zinc-600">Status Sistem</div>
                <div className="mt-2 grid gap-2">
                  <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm">
                    <div className="text-zinc-700">Pemungutan Suara</div>
                    <div className={`rounded-lg px-2 py-1 text-xs font-semibold ${settings?.is_voting_open ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-700'}`}>
                      {settings ? (settings.is_voting_open ? 'Dibuka' : 'Ditutup') : '—'}
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm">
                    <div className="text-zinc-700">Live Quick Count</div>
                    <div className={`rounded-lg px-2 py-1 text-xs font-semibold ${settings?.show_live_result ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-700'}`}>
                      {settings ? (settings.show_live_result ? 'Tampil' : 'Disembunyikan') : '—'}
                    </div>
                  </div>
                </div>

                {isAuthenticated ? (
                  <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                    NIM/NPM aktif: <span className="font-mono font-semibold">{nik}</span>
                  </div>
                ) : (
                  <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
                    Anda belum login.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-8 lg:grid-cols-4">
            <div className="rounded-2xl border border-zinc-200 bg-white p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gov-accent/10 text-gov-accent">
                <Vote className="h-5 w-5" />
              </div>
              <div className="mt-3 text-sm font-semibold text-zinc-900">Bilik Suara</div>
              <div className="mt-1 text-sm text-zinc-600">Masuk menggunakan NIM/NPM & Kode Akses dari panitia.</div>
              <div className="mt-4">
                <Link
                  to={isAuthenticated ? '/vote' : '/login'}
                  className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-gov-accent px-4 text-sm font-semibold text-white shadow-sm hover:bg-gov-accent/95"
                >
                  {isAuthenticated ? 'Lanjutkan Voting' : 'Masuk untuk Voting'}
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div className="mt-3 text-sm font-semibold text-zinc-900">Rekap Suara</div>
              <div className="mt-1 text-sm text-zinc-600">Lihat rekap perolehan suara (ringkas).</div>
              <div className="mt-4">
                <Link
                  to="/results"
                  className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                >
                  Buka Rekap
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div className="mt-3 text-sm font-semibold text-zinc-900">Live Quick Count</div>
              <div className="mt-1 text-sm text-zinc-600">Tampil hanya jika diaktifkan panitia (aman untuk publik).</div>
              <div className="mt-4">
                <Link
                  to="/live"
                  className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                >
                  Buka Live
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-800">
                <UserCog className="h-5 w-5" />
              </div>
              <div className="mt-3 text-sm font-semibold text-zinc-900">Panel Admin</div>
              <div className="mt-1 text-sm text-zinc-600">Khusus panitia: kandidat, DPT, audit log, kontrol sistem.</div>
              <div className="mt-4">
                <Link
                  to="/admin"
                  className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                >
                  Masuk Admin
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="text-sm font-semibold text-gov-blue">Cara Memilih</div>
            <div className="mt-3 space-y-3 text-sm text-zinc-700">
              <div className="flex gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-zinc-100 text-xs font-bold text-zinc-700">1</div>
                <div>Tekan <span className="font-semibold">Masuk untuk Voting</span>, lalu masukkan NIM/NPM & Kode Akses dari panitia.</div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-zinc-100 text-xs font-bold text-zinc-700">2</div>
                <div>Pilih kandidat, lalu konfirmasi. Suara akan direkam di server.</div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-zinc-100 text-xs font-bold text-zinc-700">3</div>
                <div>Setelah selesai, sesi otomatis berakhir untuk keamanan.</div>
              </div>
            </div>

            {isAuthenticated ? (
              <button
                type="button"
                onClick={logout}
                className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Keluar (Hapus Sesi)
              </button>
            ) : null}
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-gov-blue">
              <LockKeyhole className="h-4 w-4 text-gov-accent" />
              Catatan Keamanan
            </div>
            <p className="mt-3 text-sm text-zinc-600">
              Kode Akses tidak disimpan permanen di perangkat. Di database, token disimpan dalam bentuk hash (tidak bisa dilihat kembali).
            </p>
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Jika Anda panitia: saat import DPT, pastikan Anda langsung unduh/cetak master list token.
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
