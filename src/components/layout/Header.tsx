"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const pathname = usePathname()
  const [companyName, setCompanyName] = React.useState('Memuat...');
  
  React.useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data && data.name) {
          setCompanyName(data.name);
        } else {
          setCompanyName('Perusahaan');
        }
      })
      .catch(() => setCompanyName('Perusahaan'));
  }, []);

  // Format pathname to breadcrumb
  const segments = pathname?.split('/').filter(Boolean) || []
  const breadcrumb = segments.length > 0 
    ? segments.map(s => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ')).join(' / ')
    : 'Dashboard'

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-white px-4 md:px-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="md:hidden -ml-2" onClick={onMenuClick}>
          <Menu className="h-6 w-6" />
        </Button>
        <h2 className="text-lg font-medium text-gray-800 hidden sm:block">{breadcrumb}</h2>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <span className="text-xs sm:text-sm font-medium text-gray-600 border-r pr-2 md:pr-4 truncate max-w-[120px] sm:max-w-xs">{companyName}</span>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                AD
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="right" className="w-56">
            <div className="flex items-center justify-start gap-2 p-2">
              <div className="flex flex-col space-y-1 leading-none">
                <p className="font-medium">Admin Utama</p>
                <p className="w-[200px] truncate text-sm text-gray-500">admin@apka.com</p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profil</DropdownMenuItem>
            <DropdownMenuItem>Pengaturan</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">Keluar</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
