import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { getTransportLunasEmailHtml } from '@/lib/email-templates';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  
  if (!email) {
    return NextResponse.json({ error: 'Harap sertakan parameter ?email=emailanda@gmail.com' }, { status: 400 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'RESEND_API_KEY belum dipasang di Environment Variables' }, { status: 500 });
  }

  try {
    const data = await sendEmail({
      to: email,
      subject: '🧪 Testing Notifikasi SNT',
      html: getTransportLunasEmailHtml('Testing Fasilitator', '10 September 2026', 'Uji Coba Notifikasi', 150000, 'https://roboticexplorer.site')
    });
    
    return NextResponse.json({ message: 'Permintaan kirim email selesai dieksekusi', data });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengirim email', detail: error }, { status: 500 });
  }
}
