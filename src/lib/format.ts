import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace('Rp', 'Rp ');
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('id-ID').format(num);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'dd MMM yyyy', { locale: id });
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'dd/MM/yyyy');
}

export function formatPeriod(month: number, year: number): string {
  const monthName = MONTHS_ID[month - 1] || '';
  return `${monthName} ${year}`;
}

export function parseRupiah(value: string): number {
  return Number(value.replace(/[^0-9,-]+/g, "").replace(",", "."));
}

export const formatCurrency = formatRupiah;
export function terbilang(nilai: number): string {
  const bilangan = [
    "", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"
  ];
  
  if (nilai < 12) {
    return bilangan[nilai];
  } else if (nilai < 20) {
    return terbilang(nilai - 10) + " Belas";
  } else if (nilai < 100) {
    return terbilang(Math.floor(nilai / 10)) + " Puluh " + terbilang(nilai % 10);
  } else if (nilai < 200) {
    return "Seratus " + terbilang(nilai - 100);
  } else if (nilai < 1000) {
    return terbilang(Math.floor(nilai / 100)) + " Ratus " + terbilang(nilai % 100);
  } else if (nilai < 2000) {
    return "Seribu " + terbilang(nilai - 1000);
  } else if (nilai < 1000000) {
    return terbilang(Math.floor(nilai / 1000)) + " Ribu " + terbilang(nilai % 1000);
  } else if (nilai < 1000000000) {
    return terbilang(Math.floor(nilai / 1000000)) + " Juta " + terbilang(nilai % 1000000);
  } else if (nilai < 1000000000000) {
    return terbilang(Math.floor(nilai / 1000000000)) + " Milyar " + terbilang(nilai % 1000000000);
  }
  return "";
}

export function terbilangRupiah(nilai: number): string {
  const str = terbilang(nilai).replace(/\s+/g, ' ').trim();
  return str ? str + " Rupiah" : "Nol Rupiah";
}
