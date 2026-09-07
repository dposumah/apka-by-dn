const fs = require('fs')

let code = fs.readFileSync('src/app/(snt)/portal/client-page.tsx', 'utf8')

const targetCards = `<Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Kinerja</p>
              <h3 className="text-2xl font-bold text-slate-900">{totalJP} <span className="text-sm font-normal text-slate-500">JP</span></h3>
              <p className="text-xs text-slate-400 mt-1">Intra: {totalJPIntra} | Ekstra: {totalJPEkstra}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-amber-100 rounded-lg text-amber-600">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Honor Belum Direkap</p>
              <h3 className="text-2xl font-bold text-slate-900">Rp {(estimasiHonorPending/1000).toLocaleString('id-ID')}k</h3>
              <p className="text-xs text-slate-400 mt-1">{jpBelumDirekap} JP dalam {laporanBelumDirekap.length} Laporan</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-emerald-100 rounded-lg text-emerald-600">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Honor Disetujui</p>
              <h3 className="text-2xl font-bold text-slate-900">Rp {(honorDisetujui/1000).toLocaleString('id-ID')}k</h3>
              <p className="text-xs text-slate-400 mt-1">Total pencairan honor</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg text-purple-600">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Transportasi</p>
              <h3 className="text-lg font-bold text-slate-900 leading-tight">Rp {(transportLunas/1000).toLocaleString('id-ID')}k <span className="text-sm font-normal text-slate-500">Lunas</span></h3>
              <p className="text-xs text-amber-600 mt-1">Rp {(transportPending/1000).toLocaleString('id-ID')}k Pending</p>
            </div>
          </CardContent>
        </Card>`
        
const replacementCards = `<Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-500">Total Kinerja</p>
                <h3 className="text-2xl font-bold text-slate-900 leading-none">{totalJP} <span className="text-sm font-normal text-slate-500">JP</span></h3>
              </div>
              <div className="p-2.5 bg-blue-50 rounded-lg text-blue-600 shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-4 font-medium bg-slate-50 px-2 py-1.5 rounded-md inline-block w-fit">
              Intra: {totalJPIntra} <span className="text-slate-300 mx-1">|</span> Ekstra: {totalJPEkstra}
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-500 line-clamp-1">Honor Belum Direkap</p>
                <h3 className="text-2xl font-bold text-slate-900 leading-none">Rp {(estimasiHonorPending/1000).toLocaleString('id-ID')}<span className="text-sm font-normal text-slate-500">k</span></h3>
              </div>
              <div className="p-2.5 bg-amber-50 rounded-lg text-amber-600 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xs text-amber-700 mt-4 font-medium bg-amber-50 px-2 py-1.5 rounded-md inline-block w-fit">
              {jpBelumDirekap} JP dalam {laporanBelumDirekap.length} Laporan
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-500 line-clamp-1">Honor Disetujui</p>
                <h3 className="text-2xl font-bold text-slate-900 leading-none">Rp {(honorDisetujui/1000).toLocaleString('id-ID')}<span className="text-sm font-normal text-slate-500">k</span></h3>
              </div>
              <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-600 shrink-0">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xs text-emerald-700 mt-4 font-medium bg-emerald-50 px-2 py-1.5 rounded-md inline-block w-fit">
              Total pencairan honor
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-500 line-clamp-1">Transportasi</p>
                <h3 className="text-2xl font-bold text-slate-900 leading-none">Rp {(transportLunas/1000).toLocaleString('id-ID')}<span className="text-sm font-normal text-slate-500">k</span></h3>
              </div>
              <div className="p-2.5 bg-purple-50 rounded-lg text-purple-600 shrink-0">
                <Car className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xs text-purple-700 mt-4 font-medium bg-purple-50 px-2 py-1.5 rounded-md inline-block w-fit">
              Rp {(transportPending/1000).toLocaleString('id-ID')}k Pending
            </p>
          </CardContent>
        </Card>`

code = code.replace(targetCards, replacementCards)
fs.writeFileSync('src/app/(snt)/portal/client-page.tsx', code)
