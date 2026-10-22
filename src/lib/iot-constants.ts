export interface DefaultIotItem {
  kategori: string
  namaBarang: string
  satuan: string
  volume: number
  hargaSatuanRAB: number
  hargaSatuanReal: number
  kemasan: string
  diterima: boolean
  kondisiCatatan: string
}

export const DEFAULT_51_IOT_ITEMS: DefaultIotItem[] = [
  // 1. Peralatan kerja (7 items)
  { kategori: 'Peralatan kerja', namaBarang: 'Solder', satuan: 'Unit', volume: 1, hargaSatuanRAB: 45000, hargaSatuanReal: 57500, kemasan: '–', diterima: true, kondisiCatatan: 'Baik' },
  { kategori: 'Peralatan kerja', namaBarang: 'Timah solder', satuan: 'Roll', volume: 1, hargaSatuanRAB: 25000, hargaSatuanReal: 45000, kemasan: 'Box 2', diterima: true, kondisiCatatan: 'Baik' },
  { kategori: 'Peralatan kerja', namaBarang: 'Lem G', satuan: 'Botol', volume: 1, hargaSatuanRAB: 12000, hargaSatuanReal: 7650, kemasan: '–', diterima: true, kondisiCatatan: 'Baik' },
  { kategori: 'Peralatan kerja', namaBarang: 'Set lem tembak + isi lem', satuan: 'Set', volume: 1, hargaSatuanRAB: 45000, hargaSatuanReal: 55000, kemasan: '–', diterima: true, kondisiCatatan: 'Baik' },
  { kategori: 'Peralatan kerja', namaBarang: 'Tang potong', satuan: 'Unit', volume: 1, hargaSatuanRAB: 35000, hargaSatuanReal: 14000, kemasan: 'Box 1', diterima: true, kondisiCatatan: 'Baik' },
  { kategori: 'Peralatan kerja', namaBarang: 'Atractor (penyedot timah)', satuan: 'Unit', volume: 1, hargaSatuanRAB: 18000, hargaSatuanReal: 20000, kemasan: '–', diterima: true, kondisiCatatan: 'Baik' },
  { kategori: 'Peralatan kerja', namaBarang: 'Obeng set', satuan: 'Set', volume: 1, hargaSatuanRAB: 45000, hargaSatuanReal: 35000, kemasan: 'Box 3', diterima: true, kondisiCatatan: 'Baik' },

  // 2. Mekanik & rangka (7 items)
  { kategori: 'Mekanik & rangka', namaBarang: 'Tempat sampah', satuan: 'Unit', volume: 1, hargaSatuanRAB: 350000, hargaSatuanReal: 61160, kemasan: '–', diterima: true, kondisiCatatan: 'Baik' },
  { kategori: 'Mekanik & rangka', namaBarang: 'Set gearbox DC motor', satuan: 'Set', volume: 4, hargaSatuanRAB: 25000, hargaSatuanReal: 52000, kemasan: 'Box 4', diterima: true, kondisiCatatan: 'Baik' },
  { kategori: 'Mekanik & rangka', namaBarang: 'Box hitam (x6/x7)', satuan: 'Unit', volume: 5, hargaSatuanRAB: 25000, hargaSatuanReal: 72500, kemasan: 'Di tempat sampah', diterima: true, kondisiCatatan: 'Baik' },
  { kategori: 'Mekanik & rangka', namaBarang: 'Baut', satuan: 'Pcs', volume: 30, hargaSatuanRAB: 500, hargaSatuanReal: 15000, kemasan: '–', diterima: true, kondisiCatatan: 'Baik' },
  { kategori: 'Mekanik & rangka', namaBarang: 'Baut spacer (6 mm 20 pcs, 10 mm 20 pcs)', satuan: 'Pcs', volume: 40, hargaSatuanRAB: 1000, hargaSatuanReal: 44000, kemasan: 'Box 4', diterima: true, kondisiCatatan: '20 pcs 6mm, 20 pcs 10mm' },
  { kategori: 'Mekanik & rangka', namaBarang: 'Set baut/mur', satuan: 'Set', volume: 40, hargaSatuanRAB: 1500, hargaSatuanReal: 60000, kemasan: '–', diterima: true, kondisiCatatan: 'Baik' },
  { kategori: 'Mekanik & rangka', namaBarang: 'Roda 360 derajat', satuan: 'Unit', volume: 1, hargaSatuanRAB: 15000, hargaSatuanReal: 73050, kemasan: '–', diterima: true, kondisiCatatan: 'Baik' },

  // 3. Komponen elektronik (9 items)
  { kategori: 'Komponen elektronik', namaBarang: 'Sensor ultrasonik', satuan: 'Unit', volume: 2, hargaSatuanRAB: 18000, hargaSatuanReal: 26000, kemasan: 'Box 4', diterima: true, kondisiCatatan: 'Baik' },
  { kategori: 'Komponen elektronik', namaBarang: 'PCB lubang 2 layer', satuan: 'Lembar', volume: 10, hargaSatuanRAB: 8000, hargaSatuanReal: 208000, kemasan: '–', diterima: true, kondisiCatatan: 'Baik' },
  { kategori: 'Komponen elektronik', namaBarang: 'ESP32 (Type-C)', satuan: 'Unit', volume: 5, hargaSatuanRAB: 85000, hargaSatuanReal: 367500, kemasan: 'Box 2', diterima: true, kondisiCatatan: 'Baik' },
  { kategori: 'Komponen elektronik', namaBarang: 'Servo MG90S', satuan: 'Unit', volume: 5, hargaSatuanRAB: 35000, hargaSatuanReal: 142500, kemasan: 'Box 1', diterima: true, kondisiCatatan: 'Baik' },
  { kategori: 'Komponen elektronik', namaBarang: 'Saklar 2 pin', satuan: 'Unit', volume: 6, hargaSatuanRAB: 3000, hargaSatuanReal: 12000, kemasan: 'Box 4', diterima: true, kondisiCatatan: 'Baik' },
  { kategori: 'Komponen elektronik', namaBarang: 'Relay 2 channel', satuan: 'Modul', volume: 1, hargaSatuanRAB: 25000, hargaSatuanReal: 14500, kemasan: 'Box 1', diterima: true, kondisiCatatan: 'Baik' },
  { kategori: 'Komponen elektronik', namaBarang: 'Relay 1 channel', satuan: 'Modul', volume: 2, hargaSatuanRAB: 15000, hargaSatuanReal: 16000, kemasan: 'Box 1', diterima: true, kondisiCatatan: 'Baik' },
  { kategori: 'Komponen elektronik', namaBarang: 'Push button (2 warna)', satuan: 'Pcs', volume: 8, hargaSatuanRAB: 4000, hargaSatuanReal: 22196, kemasan: '–', diterima: true, kondisiCatatan: '@4 pcs' },
  { kategori: 'Komponen elektronik', namaBarang: 'LCD 16×2 I2C', satuan: 'Unit', volume: 2, hargaSatuanRAB: 45000, hargaSatuanReal: 58000, kemasan: 'Box 2', diterima: true, kondisiCatatan: 'Baik' },

  // 4. Daya (5 items)
  { kategori: 'Daya', namaBarang: 'Baterai Li-ion 18650', satuan: 'Unit', volume: 6, hargaSatuanRAB: 35000, hargaSatuanReal: 142727, kemasan: '–', diterima: true, kondisiCatatan: 'Baik' },
  { kategori: 'Daya', namaBarang: 'Cas baterai', satuan: 'Unit', volume: 1, hargaSatuanRAB: 65000, hargaSatuanReal: 55990, kemasan: '–', diterima: true, kondisiCatatan: 'Baik' },
  { kategori: 'Daya', namaBarang: 'Casing baterai 18650', satuan: 'Unit', volume: 3, hargaSatuanRAB: 10000, hargaSatuanReal: 22500, kemasan: 'Box 2', diterima: true, kondisiCatatan: 'Baik' },
  { kategori: 'Daya', namaBarang: 'Kepala cas + kabel Type-C', satuan: 'Set', volume: 2, hargaSatuanRAB: 25000, hargaSatuanReal: 72300, kemasan: '–', diterima: true, kondisiCatatan: 'Baik' },
  { kategori: 'Daya', namaBarang: 'Adaptor 5V', satuan: 'Unit', volume: 4, hargaSatuanRAB: 25000, hargaSatuanReal: 112300, kemasan: '–', diterima: true, kondisiCatatan: 'Baik' },

  // 5. Kabel & konektor (7 items)
  { kategori: 'Kabel & konektor', namaBarang: 'Kabel merah hitam serabut', satuan: 'Meter', volume: 20, hargaSatuanRAB: 3000, hargaSatuanReal: 100000, kemasan: '–', diterima: true, kondisiCatatan: '20 m' },
  { kategori: 'Kabel & konektor', namaBarang: 'Kabel jumper (M-M, M-F, F-F)', satuan: 'Set', volume: 3, hargaSatuanRAB: 12000, hargaSatuanReal: 450000, kemasan: '–', diterima: true, kondisiCatatan: '@40 pcs' },
  { kategori: 'Kabel & konektor', namaBarang: 'Pin header male', satuan: 'Strip', volume: 10, hargaSatuanRAB: 2000, hargaSatuanReal: 15000, kemasan: 'Box 4', diterima: true, kondisiCatatan: 'Baik' },
  { kategori: 'Kabel & konektor', namaBarang: 'Pin header female', satuan: 'Strip', volume: 20, hargaSatuanRAB: 2500, hargaSatuanReal: 40000, kemasan: 'Box 4', diterima: true, kondisiCatatan: 'Baik' },
  { kategori: 'Kabel & konektor', namaBarang: 'DC jack female', satuan: 'Unit', volume: 10, hargaSatuanRAB: 2500, hargaSatuanReal: 13000, kemasan: 'Box 4', diterima: true, kondisiCatatan: 'Baik' },
  { kategori: 'Kabel & konektor', namaBarang: 'Kabel merah putih', satuan: 'Meter', volume: 10, hargaSatuanRAB: 3000, hargaSatuanReal: 55000, kemasan: '–', diterima: true, kondisiCatatan: '10 m' },
  { kategori: 'Kabel & konektor', namaBarang: 'Kabel pejal 0,6 (3 warna)', satuan: 'Meter', volume: 3, hargaSatuanRAB: 5000, hargaSatuanReal: 40250, kemasan: '–', diterima: true, kondisiCatatan: '3 m' },

  // 6. Smart Lamp IoT (3 items)
  { kategori: 'Smart Lamp IoT', namaBarang: 'Fitting lampu', satuan: 'Unit', volume: 2, hargaSatuanRAB: 8000, hargaSatuanReal: 24000, kemasan: '–', diterima: true, kondisiCatatan: 'Baik' },
  { kategori: 'Smart Lamp IoT', namaBarang: 'Steker', satuan: 'Unit', volume: 6, hargaSatuanRAB: 5000, hargaSatuanReal: 42000, kemasan: 'Box 4', diterima: true, kondisiCatatan: 'Baik' },
  { kategori: 'Smart Lamp IoT', namaBarang: 'Lampu 5 watt', satuan: 'Unit', volume: 2, hargaSatuanRAB: 12000, hargaSatuanReal: 25000, kemasan: 'Box 3', diterima: true, kondisiCatatan: 'Baik' },

  // 7. Smart Garden IoT (4 items)
  { kategori: 'Smart Garden IoT', namaBarang: 'Sensor soil moisture', satuan: 'Unit', volume: 2, hargaSatuanRAB: 18000, hargaSatuanReal: 18000, kemasan: 'Box 4', diterima: true, kondisiCatatan: 'Baik' },
  { kategori: 'Smart Garden IoT', namaBarang: 'Pompa 5V', satuan: 'Unit', volume: 2, hargaSatuanRAB: 25000, hargaSatuanReal: 24000, kemasan: 'Box 1', diterima: true, kondisiCatatan: 'Baik' },
  { kategori: 'Smart Garden IoT', namaBarang: 'Selang pompa 5V', satuan: 'Meter', volume: 5, hargaSatuanRAB: 5000, hargaSatuanReal: 25000, kemasan: '–', diterima: true, kondisiCatatan: '5 m' },
  { kategori: 'Smart Garden IoT', namaBarang: 'Wadah plastik', satuan: 'Unit', volume: 6, hargaSatuanRAB: 8000, hargaSatuanReal: 23000, kemasan: '–', diterima: true, kondisiCatatan: 'Baik' },

  // 8. Komponen Tambahan (11 items)
  { kategori: 'Komponen Tambahan', namaBarang: 'Motor driver L298N', satuan: 'Unit', volume: 2, hargaSatuanRAB: 26500, hargaSatuanReal: 26500, kemasan: '–', diterima: true, kondisiCatatan: 'Baik' },
  { kategori: 'Komponen Tambahan', namaBarang: 'Modul step up', satuan: 'Unit', volume: 2, hargaSatuanRAB: 28000, hargaSatuanReal: 56000, kemasan: '–', diterima: true, kondisiCatatan: 'Baik' },
  { kategori: 'Komponen Tambahan', namaBarang: 'Modul step down', satuan: 'Unit', volume: 2, hargaSatuanRAB: 13250, hargaSatuanReal: 26500, kemasan: '–', diterima: true, kondisiCatatan: 'Baik' },
  { kategori: 'Komponen Tambahan', namaBarang: 'Mur baut M3×6', satuan: 'Pcs', volume: 20, hargaSatuanRAB: 700, hargaSatuanReal: 13900, kemasan: '–', diterima: true, kondisiCatatan: 'Baik' },
  { kategori: 'Komponen Tambahan', namaBarang: 'Mur baut M3×8', satuan: 'Pcs', volume: 20, hargaSatuanRAB: 700, hargaSatuanReal: 13900, kemasan: '–', diterima: true, kondisiCatatan: 'Baik' },
  { kategori: 'Komponen Tambahan', namaBarang: 'Multimeter', satuan: 'Unit', volume: 1, hargaSatuanRAB: 141900, hargaSatuanReal: 141900, kemasan: '–', diterima: true, kondisiCatatan: 'Baik' },
  { kategori: 'Komponen Tambahan', namaBarang: 'Resistor 4k7 ohm', satuan: 'Pcs', volume: 10, hargaSatuanRAB: 100, hargaSatuanReal: 1000, kemasan: '–', diterima: true, kondisiCatatan: 'Baik' },
  { kategori: 'Komponen Tambahan', namaBarang: 'Vibration sensor', satuan: 'Unit', volume: 1, hargaSatuanRAB: 21000, hargaSatuanReal: 21000, kemasan: '–', diterima: true, kondisiCatatan: 'Baik' },
  { kategori: 'Komponen Tambahan', namaBarang: 'Sensor suhu air', satuan: 'Unit', volume: 1, hargaSatuanRAB: 39000, hargaSatuanReal: 39000, kemasan: '–', diterima: true, kondisiCatatan: 'Baik' },
  { kategori: 'Komponen Tambahan', namaBarang: 'Tang buaya', satuan: 'Unit', volume: 1, hargaSatuanRAB: 27500, hargaSatuanReal: 27500, kemasan: '–', diterima: true, kondisiCatatan: 'Baik' },
  { kategori: 'Komponen Tambahan', namaBarang: 'Pasta solder / flux', satuan: 'Unit', volume: 1, hargaSatuanRAB: 12000, hargaSatuanReal: 12000, kemasan: 'Box 1', diterima: true, kondisiCatatan: 'Baik' }
]
