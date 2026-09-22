const fs = require('fs');
const pdf = require('pdf-parse');

const files = [
  'C:\\Users\\ASUS\\Downloads\\Mobile Devices\\Kuitansi Yayasan Maleo-Honor Fasilitator.pdf',
  'C:\\Users\\ASUS\\Downloads\\Mobile Devices\\Kuitansi Yayasan Maleo-Sewa Rumah.pdf',
  'C:\\Users\\ASUS\\Downloads\\Mobile Devices\\Kuitansi Yayasan Maleo-Akomodasi 14 Hari Fasilitator.pdf'
];

async function main() {
  for (const file of files) {
    console.log('\n====== ' + file.split('\\').pop() + ' ======');
    try {
      const buf = fs.readFileSync(file);
      const data = await pdf(buf);
      console.log(data.text);
    } catch (e) {
      console.error('Error reading:', e.message);
    }
  }
}

main();
