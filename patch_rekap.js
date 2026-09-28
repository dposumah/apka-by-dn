const fs = require('fs');

let content = fs.readFileSync('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx', 'utf-8');

// Add imports
content = content.replace("import { adminGenerateInvoiceHonor } from '@/app/actions/rekap'", "import { adminGenerateInvoiceHonor } from '@/app/actions/rekap'\nimport { getInvoiceHtml, getKwitansiHtml } from './pdf-generator'");

// Replace states
const old_states = `  const [kwitansiInputStep, setKwitansiInputStep] = useState(false)
  const [inputNoUrut, setInputNoUrut] = useState("")
  const [inputTanggal, setInputTanggal] = useState("")`;

const new_states = `  const [printCheckInvoice, setPrintCheckInvoice] = useState(true)
  const [printCheckHonor, setPrintCheckHonor] = useState(false)
  const [printCheckTransport, setPrintCheckTransport] = useState(false)
  const [printKopType, setPrintKopType] = useState<'maleo' | 'robotic'>('maleo')
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [inputNoUrut, setInputNoUrut] = useState("")
  const [inputTanggal, setInputTanggal] = useState("")`;

content = content.replace(old_states, new_states);

// Replace openKopModal
const old_openKopModal = `  const openKopModal = (rekap: any) => {
    setSelectedRekap(rekap)
    setKwitansiInputStep(false)
    setInputNoUrut("")
    
    // Default tanggal to today
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    const localISOTime = (new Date(Date.now() - tzoffset)).toISOString().slice(0, 10);
    setInputTanggal(localISOTime)
    
    setShowKopModal(true)
  }`;

const new_openKopModal = `  const openKopModal = (rekap: any) => {
    setSelectedRekap(rekap)
    setPrintCheckInvoice(true)
    setPrintCheckHonor(false)
    setPrintCheckTransport(false)
    setPrintKopType('maleo')
    setInputNoUrut("")
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    const localISOTime = (new Date(Date.now() - tzoffset)).toISOString().slice(0, 10);
    setInputTanggal(localISOTime)
    setShowKopModal(true)
  }

  const generatePdfDirect = async () => {
    if (!selectedRekap) return;
    setIsGeneratingPdf(true);
    
    try {
      let htmlString = "";
      
      // 1. Invoice
      if (printCheckInvoice) {
        htmlString += getInvoiceHtml(selectedRekap, printKopType);
      }
      
      // 2. Kwitansi Honor
      if (printCheckHonor) {
        const record = await generateKwitansiHonor(selectedRekap.id, inputNoUrut, inputTanggal);
        htmlString += getKwitansiHtml(selectedRekap, record, 'HONOR', terbilangRupiah);
      }
      
      // 3. Kwitansi Transport
      if (printCheckTransport) {
        const record = await generateKwitansiTransportBulanan(selectedRekap.id, inputNoUrut, inputTanggal);
        htmlString += getKwitansiHtml(selectedRekap, record, 'TRANSPORT', terbilangRupiah);
      }
      
      if (!htmlString) {
        setIsGeneratingPdf(false);
        alert("Pilih minimal satu dokumen untuk dicetak.");
        return;
      }
      
      // Put html in hidden div
      const container = document.createElement('div');
      container.innerHTML = htmlString;
      container.style.position = 'absolute';
      container.style.top = '-9999px';
      container.style.left = '-9999px';
      container.style.width = '210mm';
      document.body.appendChild(container);
      
      // Wait for images
      const images = container.getElementsByTagName('img');
      const imagePromises = Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      });
      await Promise.all(imagePromises);
      
      // Create PDF
      const html2pdf = (await import('html2pdf.js')).default;
      const opt = {
        margin: 0,
        filename: \`Rekap_Honor_\${selectedRekap.fasilitator?.namaLengkap}_\${selectedRekap.bulan}.pdf\`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      await html2pdf().set(opt).from(container).save();
      document.body.removeChild(container);
      setShowKopModal(false);
    } catch (err: any) {
      console.error(err);
      alert("Gagal generate PDF: " + err.message);
    } finally {
      setIsGeneratingPdf(false);
    }
  }`;
content = content.replace(old_openKopModal, new_openKopModal);

fs.writeFileSync('src/app/(snt)/fasilitator/rekap-honor/client-page.tsx', content);
