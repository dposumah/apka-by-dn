export function getHargaBBM(config: any, jenisBBM: string): number {
  switch (jenisBBM) {
    case 'Pertalite': return config.hargaPertalite
    case 'Pertamax': return config.hargaPertamax
    case 'Solar': return config.hargaSolar
    case 'Dexlite': return config.hargaDexlite
    default: return config.hargaPertalite
  }
}

export function hitungTransportDarat(
  jarakOneWayKm: number,
  jenisKendaraan: string,
  jenisBBM: string,
  nominalStruk: number,
  config: any
) {
  const rasio = jenisKendaraan === 'R2' ? config.rasioKonsumsiR2 : config.rasioKonsumsiR4
  const kompensasi = config.kompensasiAkses / 100
  const jarakPP = jarakOneWayKm * 2
  const jarakEfektif = jarakPP * (1 + kompensasi)
  const volumeLiter = Math.round((jarakEfektif / rasio) * 100) / 100
  const hargaBBM = getHargaBBM(config, jenisBBM)
  const plafonMaksimal = Math.ceil(volumeLiter * hargaBBM)
  const biayaDisetujui = Math.min(nominalStruk, plafonMaksimal)

  return {
    jarakPP,
    jarakEfektif,
    volumeLiter,
    hargaBBM,
    plafonMaksimal,
    biayaDisetujui,
  }
}
