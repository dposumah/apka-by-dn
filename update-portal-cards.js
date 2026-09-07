const fs = require('fs')

let code = fs.readFileSync('src/app/(snt)/portal/client-page.tsx', 'utf8')

const targetBadge = `{fasilitator.lokasiSNT ? (
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-sm font-medium">
              Lokasi SNT: {fasilitator.lokasiSNT}
            </div>
          ) : (`

const replacementBadge = `{fasilitator.lokasiSNT ? (
            <div className="mt-3 inline-flex flex-col items-start gap-0.5 px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700">
              <span className="text-sm font-bold">{fasilitator.lokasiSNT.split(' - ')[0]}</span>
              {fasilitator.lokasiSNT.split(' - ')[1] && <span className="text-xs text-blue-600/80">{fasilitator.lokasiSNT.split(' - ')[1]}</span>}
            </div>
          ) : (`

code = code.replace(targetBadge, replacementBadge)

const targetCards = `<Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
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

const replacementCards = `<Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <BookOpen className="w-20 h-20" />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-50 rounded-md text-blue-600">
                <BookOpen className="w-4 h-4" />
              </div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Kinerja</p>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-slate-900 mb-1">{totalJP} <span className="text-base font-normal text-slate-500">JP</span></h3>
              <p className="text-xs text-slate-500 font-medium">Intra: {totalJPIntra} &bull; Ekstra: {totalJPEkstra}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Clock className="w-20 h-20" />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-50 rounded-md text-amber-600">
                <Clock className="w-4 h-4" />
              </div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Honor Menunggu</p>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-slate-900 mb-1">Rp {(estimasiHonorPending/1000).toLocaleString('id-ID')}<span className="text-base font-normal text-slate-500">k</span></h3>
              <p className="text-xs text-amber-600 font-medium">{jpBelumDirekap} JP ({laporanBelumDirekap.length} Laporan)</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Wallet className="w-20 h-20" />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-50 rounded-md text-emerald-600">
                <Wallet className="w-4 h-4" />
              </div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Honor Selesai</p>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-slate-900 mb-1">Rp {(honorDisetujui/1000).toLocaleString('id-ID')}<span className="text-base font-normal text-slate-500">k</span></h3>
              <p className="text-xs text-emerald-600 font-medium">Total pencairan lunas</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Car className="w-20 h-20" />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-50 rounded-md text-purple-600">
                <Car className="w-4 h-4" />
              </div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Transportasi</p>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-slate-900 mb-1">Rp {(transportLunas/1000).toLocaleString('id-ID')}<span className="text-base font-normal text-slate-500">k</span></h3>
              <p className="text-xs text-purple-600 font-medium">Lunas (Pending: Rp {(transportPending/1000).toLocaleString('id-ID')}k)</p>
            </div>
          </CardContent>
        </Card>`

code = code.replace(targetCards, replacementCards)
fs.writeFileSync('src/app/(snt)/portal/client-page.tsx', code)
