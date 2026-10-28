const sendReportConfirmation = async ({ to, referenceId, location, concern, statusMessage, trackUrl }) => {
  if (!to) {
    return { sent: false, reason: 'missing_recipient' };
  }

  const host = process.env.EMAIL_HOST;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD;

  const subject = 'SafeDrop — Water Concern Report Received';
  const text = [
    'SafeDrop',
    'Water Concern Report Received',
    '',
    `Report Reference Number: ${referenceId}`,
    location ? `Location: ${location}` : '',
    concern ? `Concern: ${concern}` : '',
    `Submission Status: ${statusMessage}`,
    '',
    'This confirmation means SafeDrop has recorded your report.',
    'It does not mean a government department has accepted the report unless an official reference is shown.',
    '',
    trackUrl ? `Track your report: ${trackUrl}` : 'Use the Track Report page on SafeDrop with your reference number.',
  ]
    .filter(Boolean)
    .join('\n');

  if (!host || !user || !pass) {
    console.info('[Email] EMAIL_HOST/USER/PASSWORD not configured. Confirmation email skipped.');
    return { sent: false, reason: 'not_configured', preview: { to, subject } };
  }

  try {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.EMAIL_PORT || 587),
      secure: String(process.env.EMAIL_PORT) === '465',
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || `SafeDrop <${user}>`,
      to,
      subject,
      text,
    });
    return { sent: true };
  } catch (err) {
    console.error('[Email] Failed to send confirmation:', err.message);
    return { sent: false, reason: 'send_failed' };
  }
};

module.exports = { sendReportConfirmation };
