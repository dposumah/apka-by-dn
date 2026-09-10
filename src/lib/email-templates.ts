export const getTransportLunasEmailHtml = (nama: string, date: string, topic: string, amount: number, buktiUrl: string) => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
  <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-bottom: 1px solid #e2e8f0;">
    <h2 style="color: #1e293b; margin: 0;">Pencairan Transportasi SNT</h2>
  </div>
  <div style="padding: 24px; color: #334155; line-height: 1.6;">
    <p>Halo <strong>${nama}</strong>,</p>
    <p>Biaya transportasi Anda untuk kegiatan mengajar telah ditransfer dan berstatus <strong>LUNAS</strong>.</p>
    
    <div style="background-color: #f1f5f9; padding: 16px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 4px 0;"><strong>Kegiatan:</strong> ${topic}</p>
      <p style="margin: 4px 0;"><strong>Tanggal:</strong> ${date}</p>
      <p style="margin: 4px 0;"><strong>Nominal:</strong> Rp ${amount.toLocaleString('id-ID')}</p>
    </div>
    
    <div style="text-align: center; margin-top: 24px;">
      <a href="${buktiUrl}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Lihat Bukti Transfer</a>
    </div>
    
    <p style="margin-top: 30px; font-size: 14px; color: #64748b;">
      Harap cek rekening Anda. Jika ada kendala, silakan hubungi Admin KORWIL.
    </p>
  </div>
  <div style="background-color: #1e293b; color: #94a3b8; text-align: center; padding: 16px; font-size: 12px;">
    &copy; 2026 PT. JT Robotic Explorer SNT
  </div>
</div>
`;

export const getHonorLunasEmailHtml = (nama: string, bulan: string, totalJP: number, amount: number, pdfUrl: string) => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
  <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-bottom: 1px solid #e2e8f0;">
    <h2 style="color: #1e293b; margin: 0;">Pencairan Honorarium SNT</h2>
  </div>
  <div style="padding: 24px; color: #334155; line-height: 1.6;">
    <p>Halo <strong>${nama}</strong>,</p>
    <p>Tagihan honorarium Anda telah disetujui dan ditransfer. Terima kasih atas dedikasi Anda!</p>
    
    <div style="background-color: #f1f5f9; padding: 16px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 4px 0;"><strong>Bulan:</strong> ${bulan}</p>
      <p style="margin: 4px 0;"><strong>Total JP:</strong> ${totalJP} Jam Pelajaran</p>
      <p style="margin: 4px 0;"><strong>Nominal:</strong> Rp ${amount.toLocaleString('id-ID')}</p>
    </div>
    
    <div style="text-align: center; margin-top: 24px;">
      <a href="${pdfUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Unduh Invoice PDF / Bukti</a>
    </div>
    
    <p style="margin-top: 30px; font-size: 14px; color: #64748b;">
      Harap cek rekening Anda. Jika ada kendala, silakan hubungi Admin KORWIL.
    </p>
  </div>
  <div style="background-color: #1e293b; color: #94a3b8; text-align: center; padding: 16px; font-size: 12px;">
    &copy; 2026 PT. JT Robotic Explorer SNT
  </div>
</div>
`;
