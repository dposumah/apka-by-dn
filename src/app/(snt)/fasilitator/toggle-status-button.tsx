"use client"

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toggleFasilitatorStatus } from '@/app/actions/rab'
import { Switch } from '@/components/ui/switch'
import { useModal } from '@/components/modal-provider';

export function ToggleStatusButton({ id, isActive }: { id: string, isActive: boolean }) {
  const { confirm, alert } = useModal();

  const [isPending, startTransition] = useTransition()
  const [optimisticState, setOptimisticState] = useState(isActive)
  const router = useRouter()

  const handleToggle = async (checked: boolean) => {
    setOptimisticState(checked)
    startTransition(async () => {
      try {
        await toggleFasilitatorStatus(id, checked)
        router.refresh()
      } catch (e: any) {
        setOptimisticState(isActive) // revert on error
        await alert(e.message || 'Gagal mengubah status')
      }
    })
  }

  return (
    <div className="flex items-center gap-2">
      <Switch 
        checked={optimisticState} 
        onCheckedChange={handleToggle} 
        disabled={isPending}
      />
      <span className={`text-xs font-medium ${optimisticState ? 'text-emerald-600' : 'text-slate-400'}`}>
        {optimisticState ? 'Aktif' : 'Tidak Aktif'}
      </span>
    </div>
  )
}
