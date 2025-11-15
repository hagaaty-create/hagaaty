'use server';

// This is a placeholder for a real email sending service.
// In a real application, you would use a service like Resend, SendGrid, or Nodemailer.
// For this demo, it will just log to the console.

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailPayload): Promise<void> {
  console.log('=============== SENDING EMAIL (SIMULATION) ===============');
  console.log(`TO: ${to}`);
  console.log(`SUBJECT: ${subject}`);
  console.log('========================================================');
  // In a real app, the actual email sending logic would go here.
  // For example, using Resend:
  //
  // import { Resend } from 'resend';
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send({
  //   from: 'onboarding@yourdomain.com',
  //   to,
  //   subject,
  //   html,
  // });
  
  // Since we don't have a real email service configured, we'll resolve the promise
  // to simulate a successful email send.
  return Promise.resolve();
}

    