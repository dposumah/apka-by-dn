const fs = require('fs');

const adminFormPath = 'src/app/(snt)/fasilitator/form.tsx';
let adminFormContent = fs.readFileSync(adminFormPath, 'utf8');

// If KtpField wasn't injected, let's inject it.
if (!adminFormContent.includes('Mengunggah...')) {
  const KtpField = `
          <div className="space-y-2 md:col-span-2 border p-4 rounded-md bg-slate-50 mt-4">
            <Label>Dokumen KTP</Label>
            <p className="text-xs text-slate-500 mb-2">Unggah file foto KTP (Maks 2MB)</p>
            {formData.ktpUrl ? (
              <div className="flex flex-col gap-2">
                <a href={formData.ktpUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm font-medium">
                  Lihat KTP Tersimpan
                </a>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="w-max"
                  onClick={() => setFormData({...formData, ktpUrl: ''})}
                >
                  Ganti Foto
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Input type="file" accept="image/*" disabled={uploadingKtp} onChange={handleKtpUpload} className="max-w-xs" />
                {uploadingKtp && <span className="text-sm text-slate-500">Mengunggah...</span>}
              </div>
            )}
          </div>
`;
  adminFormContent = adminFormContent.replace(
    /<div className="flex justify-end gap-2 pt-4 border-t">/,
    `${KtpField}\n      <div className="flex justify-end gap-2 pt-4 border-t mt-4">`
  );
  fs.writeFileSync(adminFormPath, adminFormContent);
} else {
  // Just update the accept attribute and text
  adminFormContent = adminFormContent.replace(/accept="image\/\*,\.pdf"/g, 'accept="image/*"');
  adminFormContent = adminFormContent.replace(/file KTP/g, 'foto KTP');
  fs.writeFileSync(adminFormPath, adminFormContent);
}

const clientProfilPath = 'src/app/(snt)/portal/profil/client-profil.tsx';
let clientProfilContent = fs.readFileSync(clientProfilPath, 'utf8');
clientProfilContent = clientProfilContent.replace(/accept="image\/\*,\.pdf"/g, 'accept="image/*"');
clientProfilContent = clientProfilContent.replace(/PDF\/Gambar/g, 'Foto / Gambar');
fs.writeFileSync(clientProfilPath, clientProfilContent);

console.log('Fixed forms');
