import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Singleton Supabase client for client-side uploads
let supabaseInstance: any = null

function getSupabase() {
  if (!supabaseInstance && supabaseUrl && supabaseKey) {
    supabaseInstance = createClient(supabaseUrl, supabaseKey)
  }
  return supabaseInstance
}

/**
 * Kompres gambar otomatis di sisi browser (client-side) sebelum diunggah.
 * Mengurangi ukuran foto kamera HP (misal 5-12 MB) menjadi ~300-600 KB tanpa mengurangi keterbacaan dokumen.
 */
export async function compressImageIfNeeded(file: File, maxDimension = 1920, quality = 0.82): Promise<File> {
  if (typeof window === 'undefined') return file

  // Hanya proses file gambar standar (skip PDF, GIF, SVG)
  const isImage = file.type.startsWith('image/')
  const isExcluded = file.type === 'image/gif' || file.type === 'image/svg+xml'
  if (!isImage || isExcluded) {
    return file
  }

  // Jika ukuran file gambar sudah kecil (< 600 KB), tidak perlu kompresi
  if (file.size < 600 * 1024) {
    return file
  }

  return new Promise((resolve) => {
    try {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          try {
            let width = img.width
            let height = img.height

            if (width > maxDimension || height > maxDimension) {
              if (width > height) {
                height = Math.round((height * maxDimension) / width)
                width = maxDimension
              } else {
                width = Math.round((width * maxDimension) / height)
                height = maxDimension
              }
            }

            const canvas = document.createElement('canvas')
            canvas.width = width
            canvas.height = height
            const ctx = canvas.getContext('2d')

            if (!ctx) {
              resolve(file)
              return
            }

            ctx.drawImage(img, 0, 0, width, height)

            canvas.toBlob(
              (blob) => {
                if (!blob || blob.size >= file.size) {
                  // Jika hasil kompresi tidak lebih kecil, gunakan file asli
                  resolve(file)
                } else {
                  const ext = file.type === 'image/png' ? 'png' : 'jpg'
                  const cleanName = file.name.replace(/\.[^/.]+$/, '')
                  const compressedFile = new File([blob], `${cleanName}.${ext}`, {
                    type: blob.type || 'image/jpeg',
                    lastModified: Date.now(),
                  })
                  resolve(compressedFile)
                }
              },
              file.type === 'image/png' ? 'image/png' : 'image/jpeg',
              quality
            )
          } catch (err) {
            console.warn('Image compression canvas error, using original file:', err)
            resolve(file)
          }
        }
        img.onerror = () => resolve(file)
        img.src = e.target?.result as string
      }
      reader.onerror = () => resolve(file)
      reader.readAsDataURL(file)
    } catch (err) {
      console.warn('FileReader error, using original file:', err)
      resolve(file)
    }
  })
}

/**
 * Unggah file secara aman dan langsung ke Supabase Storage (Client-side Direct Upload).
 * Keuntungan:
 * 1. Menghindari batasan payload serverless Vercel (4.5 MB) yang menyebabkan error:
 *    "Unexpected token 'R', Request Entity Too Large... is not valid JSON".
 * 2. Mengompres foto secara otomatis sebelum dikirim.
 * 3. Memiliki fallback ke /api/upload dengan error handling yang ramah pengguna.
 */
export async function uploadFileClient(file: File, folder = 'receipts'): Promise<string> {
  if (!file) {
    throw new Error('Tidak ada file yang dipilih untuk diunggah')
  }

  // Batas maksimal file (25 MB)
  const MAX_LIMIT = 25 * 1024 * 1024
  if (file.size > MAX_LIMIT) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1)
    throw new Error(`Ukuran file "${file.name}" terlalu besar (${sizeMB} MB). Maksimal ukuran file adalah 25 MB.`)
  }

  // 1. Kompres gambar jika berupa foto/gambar
  const processedFile = await compressImageIfNeeded(file)

  // Buat nama file unik yang bersih
  const fileExt = processedFile.name.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') || 'file'
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
  const filePath = `${folder}/${fileName}`

  // 2. Coba unggah LANGSUNG ke Supabase Storage (Bypass limit 4.5 MB Vercel)
  const supabase = getSupabase()
  if (supabase) {
    try {
      const { data, error } = await supabase.storage
        .from('attachments')
        .upload(filePath, processedFile, {
          cacheControl: '3600',
          upsert: false,
        })

      if (!error && data) {
        const { data: publicUrlData } = supabase.storage
          .from('attachments')
          .getPublicUrl(filePath)
        return publicUrlData.publicUrl
      }

      if (error) {
        console.warn('Supabase direct upload warning:', error)
      }
    } catch (err) {
      console.warn('Supabase direct upload exception:', err)
    }
  }

  // 3. Fallback: jika direct upload ke Supabase gagal, coba melalui /api/upload
  const formData = new FormData()
  formData.append('file', processedFile)

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    if (res.status === 413) {
      const sizeMB = (processedFile.size / (1024 * 1024)).toFixed(1)
      throw new Error(`Ukuran file "${processedFile.name}" terlalu besar (${sizeMB} MB) untuk diproses server. Harap gunakan file dengan ukuran lebih kecil atau kompres terlebih dahulu.`)
    }

    let errorMessage = `Gagal mengunggah file (${res.status})`
    try {
      const errorJson = await res.json()
      if (errorJson.error) errorMessage = errorJson.error
    } catch {
      try {
        const text = await res.text()
        if (text && text.length < 200) errorMessage = text
      } catch {
        // no-op
      }
    }

    throw new Error(errorMessage)
  }

  try {
    const data = await res.json()
    return data.url
  } catch {
    throw new Error('Server mengembalikan respon yang tidak valid saat mengunggah file.')
  }
}
