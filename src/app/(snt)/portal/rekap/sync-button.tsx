'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { syncFromGoogleSheets } from '@/app/actions/sync'

export function SyncButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  
  const handleSync = async () => {
    setIsLoading(true)
    setLogs(['Memulai sinkronisasi dari Google Sheets...'])
    try {
      const result = await syncFromGoogleSheets()
      if (result.success && result.logs) {
        setLogs(prev => [...prev, ...result.logs!, 'Sinkronisasi selesai.'])
      } else {
        setLogs(prev => [...prev, `Gagal: ${result.error}`])
      }
    } catch (e: any) {
      setLogs(prev => [...prev, `Error: ${e.message}`])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Button onClick={handleSync} disabled={isLoading} className="mb-4">
        {isLoading ? 'Menyinkronkan...' : 'Sinkronisasi dari Google Sheets'}
      </Button>
      {logs.length > 0 && (
        <div className="bg-muted p-4 rounded-md h-48 overflow-y-auto font-mono text-sm">
          {logs.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </div>
      )}
    </div>
  )
}
