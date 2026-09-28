const fs = require('fs');

let r = fs.readFileSync('src/app/actions/rekap.ts', 'utf8');

function updateWebhookLogic(content, funcName) {
  const regex = new RegExp(`export async function ${funcName}\\([\\s\\S]*?const webhookUrl = "https:\\/\\/script\\.google\\.com[\\s\\S]*?const noUrut = inputNoUrut \\|\\| "";`);
  
  return content.replace(regex, (match) => {
    // Replace the block of logic
    return match.replace(
      /if \(existing && !inputNoUrut\) \{\s*return JSON\.parse\(JSON\.stringify\(existing\)\);\s*\}\s*\/\/ Call Google Apps Script Webhook\s*const webhookUrl = "https:\/\/script\.google\.com[^\n]*\n\s*\/\/ Default values[^\n]*\n\s*const noUrut = inputNoUrut \|\| "";/,
      `let finalNoUrut = inputNoUrut || "";
  if (!inputNoUrut) {
    if (existing) {
      if (existing.noKwitansi.includes('TEMP') || existing.noKwitansi === "") {
        finalNoUrut = existing.noUrut.toString().padStart(3, '0');
      } else {
        return JSON.parse(JSON.stringify(existing));
      }
    } else {
      const lastRecord = await prisma.kwitansiRecord.findFirst({ orderBy: { noUrut: 'desc' } });
      finalNoUrut = ((lastRecord?.noUrut || 0) + 1).toString().padStart(3, '0');
    }
  }

  // Call Google Apps Script Webhook
  const webhookUrl = "https://script.google.com/macros/s/AKfycbx4HtXH816rxAkcPV44wM5VEp9cgJ7DQ0aLv9TMAIkDtGUVVRrVS8pRPAxL9mCuAVJe/exec";
  const noUrut = finalNoUrut;`
    );
  });
}

r = updateWebhookLogic(r, 'generateKwitansiHonor');
r = updateWebhookLogic(r, 'generateKwitansiExpense');
r = updateWebhookLogic(r, 'generateKwitansiTransportBulanan');

fs.writeFileSync('src/app/actions/rekap.ts', r);
console.log('Fixed auto-numbering logic');
