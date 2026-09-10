import { Resend } from 'resend';

// Helper function to send emails
export async function sendEmail({
  to,
  subject,
  html
}: {
  to: string;
  subject: string;
  html: string;
}) {
  // Return early if no API key is set
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY is not set. Email will not be sent.', { to, subject });
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'PT. JT Robotic Explorer <admin@roboticexplorer.site>',
      to,
      subject,
      html,
    });
    
    if (error) {
      console.error('Resend API Error:', error);
      return { success: false, error };
    }
    
    console.log('Email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error };
  }
}
