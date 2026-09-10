"use client"

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { uploadLaporanFisik } from '@/app/actions/rab'

export function UploadLaporanFisikButton({ laporanId }: { laporanId: string }) {
  const [uploading, setUploading] = useState(false)
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadFile = async (file: File) => {
    const uploadData = new FormData()
    uploadData.append('file', file)
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: uploadData
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Gagal unggah')
    return data.url
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran file maksimal 2 MB')
      return
    }

    setUploading(true)
    try {
      const url = await uploadFile(file)
      await uploadLaporanFisik(laporanId, url)
      alert('Laporan Fisik berhasil diunggah')
      router.refresh()
    } catch (error: any) {
      alert(error.message || 'Gagal mengunggah file')
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      <input 
        type="file" 
        className="hidden" 
        accept=".pdf" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
      />
      <button 
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="text-xs text-orange-600 hover:underline mt-1 inline-block mr-3 font-medium disabled:opacity-50"
      >
        {uploading ? 'Mengunggah...' : 'Upload Laporan Fisik'}
      </button>
    </>
  )
}
