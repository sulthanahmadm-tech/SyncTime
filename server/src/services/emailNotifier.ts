import { Resend } from 'resend';

let resend: Resend | null = null;
let initialized = false;

function getResend(): Resend | null {
  if (!initialized) {
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey && apiKey !== 'your_resend_api_key') {
      resend = new Resend(apiKey);
    }
    initialized = true;
  }
  return resend;
}

export const sendEmailNotification = async (
  to: string,
  subject: string,
  htmlBody: string
): Promise<void> => {
  const client = getResend();
  const emailFrom = process.env.EMAIL_FROM || 'SyncTime <onboarding@resend.dev>';

  if (!client) {
    console.log(`[Email Mock] To: ${to} | Subject: ${subject}`);
    console.log(`[Email Mock] Body: ${htmlBody}`);
    return;
  }
  try {
    await client.emails.send({
      from: emailFrom,
      to,
      subject,
      html: htmlBody,
    });
    console.log(`[Email] Sent to ${to}: ${subject}`);
  } catch (error) {
    console.error(`[Email Error] Failed to send to ${to}:`, error);
  }
};
