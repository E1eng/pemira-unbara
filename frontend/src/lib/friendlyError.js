export function friendlyError(err, fallback) {
  if (!err) return fallback || 'Terjadi kesalahan.'

  const rawMessage = String(err.message || err.error_description || err.error || '').trim()
  const message = rawMessage || String(fallback || 'Terjadi kesalahan.')
  const lower = rawMessage.toLowerCase()

  const code = err.code != null ? String(err.code) : ''

  if (lower.includes('jwt expired') || lower.includes('session') && lower.includes('expired')) {
    return 'Sesi login berakhir. Silakan login ulang.'
  }

  if (lower === 'unauthorized' || lower.includes('permission denied') || lower.includes('not authorized') || lower.includes('insufficient_privilege')) {
    return 'Akses ditolak. Akun ini tidak terdaftar sebagai panitia.'
  }

  if (code === '23505' || lower.includes('duplicate key value') || lower.includes('already exists')) {
    return 'Data sudah ada (duplikat).'
  }

  if (lower.includes('pemungutan suara sedang ditutup') || lower.includes('voting closed')) {
    return 'Pemungutan suara sedang ditutup.'
  }

  if (lower.includes('nik tidak terdaftar')) {
    return 'NIK tidak terdaftar dalam DPT.'
  }

  if (lower.includes('kode akses salah') || lower.includes('wrong token') || lower.includes('wrong code')) {
    return 'Kode akses salah. Silakan cek surat undangan.'
  }

  if (lower.includes('sudah digunakan') || lower.includes('already voted')) {
    return 'NIK ini sudah digunakan untuk memilih.'
  }

  if (rawMessage) return rawMessage
  return message
}
