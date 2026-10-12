"use client"

import React, { useEffect } from 'react'
import { X, ExternalLink, Download } from 'lucide-react'

interface FilePreviewModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  url?: string | null
}

export function FilePreviewModal({ isOpen, onClose, title, url }: FilePreviewModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen || !url) return null

  const isPdf = url.toLowerCase().includes('.pdf')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
      />
      <div 
        className="relative z-10 bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-200 bg-white">
          <h3 className="font-semibold text-slate-900 text-sm sm:text-base truncate pr-2">
            {title}
          </h3>
          <div className="flex items-center gap-1.5">
            <a 
              href={url} 
              target="_blank" 
              rel="noreferrer" 
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors"
              title="Buka di tab baru jika diperlukan"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button 
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors"
              title="Tutup (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-50/70 flex items-center justify-center min-h-[350px]">
          {isPdf ? (
            <iframe 
              src={url} 
              className="w-full h-[65vh] rounded-lg border border-slate-200 bg-white" 
              title={title}
            />
          ) : (
            <img 
              src={url} 
              alt={title} 
              className="max-h-[65vh] w-auto max-w-full object-contain rounded-lg shadow-sm border border-slate-200/60 bg-white" 
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-t border-slate-200 bg-white text-xs">
          <span className="text-slate-500 truncate mr-2">
            Pratinjau Dokumen / Bukti Transfer
          </span>
          <div className="flex items-center gap-2">
            <a 
              href={url} 
              download 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Unduh
            </a>
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-md bg-slate-900 text-white hover:bg-slate-800 font-medium transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
