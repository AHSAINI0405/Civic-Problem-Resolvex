const https = require('https');

/**
 * Send an email via the EmailJS REST API (server-side).
 * Docs: https://www.emailjs.com/docs/rest-api/send/
 *
 * Required env vars:
 *   EMAILJS_SERVICE_ID  – your EmailJS service ID
 *   EMAILJS_PUBLIC_KEY  – your EmailJS public key
 *   EMAILJS_PRIVATE_KEY – your EmailJS private key (for server-side auth)
 *   EMAILJS_TEMPLATE_ID – your EmailJS email template ID
 */
const sendEmail = async ({ to, subject, html }) => {
  const payload = JSON.stringify({
    service_id: process.env.EMAILJS_SERVICE_ID,
    template_id: process.env.EMAILJS_TEMPLATE_ID,
    user_id: process.env.EMAILJS_PUBLIC_KEY,
    accessToken: process.env.EMAILJS_PRIVATE_KEY,
    template_params: {
      to_email: to,
      subject: subject,
      message_html: html,
    },
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.emailjs.com',
      path: '/api/v1.0/email/send',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(data);
        } else {
          console.error(`EmailJS error (${res.statusCode}):`, data);
          reject(new Error(`EmailJS responded with status ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (err) => {
      console.error('EmailJS request error:', err.message);
      reject(err);
    });

    req.write(payload);
    req.end();
  });
};

exports.sendVerificationEmail = async (email, token) => {
  const url = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
  await sendEmail({
    to: email,
    subject: 'Verify your Resolvex account',
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;background:#0f172a;color:#e2e8f0;border-radius:16px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:28px;">Resolvex</h1>
          <p style="color:#c7d2fe;margin:8px 0 0;">AI-Powered Civic Complaint System</p>
        </div>
        <div style="padding:32px;">
          <h2 style="color:#a5b4fc;">Verify your email address</h2>
          <p style="color:#94a3b8;line-height:1.6;">Click the button below to verify your email and activate your account.</p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${url}" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">Verify Email</a>
          </div>
          <p style="color:#64748b;font-size:13px;">This link expires in 24 hours. If you didn't sign up, please ignore this email.</p>
        </div>
      </div>`,
  });
};

exports.sendPasswordResetEmail = async (email, token) => {
  const url = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
  await sendEmail({
    to: email,
    subject: '🔐 Reset your Resolvex password',
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;background:#0f172a;color:#e2e8f0;border-radius:16px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:28px;">Resolvex</h1>
        </div>
        <div style="padding:32px;">
          <h2 style="color:#a5b4fc;">Password Reset Request</h2>
          <p style="color:#94a3b8;line-height:1.6;">We received a request to reset your password. Click below to proceed.</p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${url}" style="background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;">Reset Password</a>
          </div>
          <p style="color:#64748b;font-size:13px;">This link expires in 1 hour. If you didn't request this, please ignore.</p>
        </div>
      </div>`,
  });
};

exports.sendStatusUpdateEmail = async (email, userName, complaintTitle, newStatus) => {
  const statusColors = { pending: '#f59e0b', assigned: '#3b82f6', in_progress: '#8b5cf6', resolved: '#10b981', rejected: '#ef4444' };
  const color = statusColors[newStatus] || '#6366f1';
  await sendEmail({
    to: email,
    subject: `📢 Complaint Update: ${complaintTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;background:#0f172a;color:#e2e8f0;border-radius:16px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:28px;">Resolvex</h1>
        </div>
        <div style="padding:32px;">
          <p style="color:#94a3b8;">Hi <strong style="color:#e2e8f0;">${userName}</strong>,</p>
          <p style="color:#94a3b8;">Your complaint <strong style="color:#a5b4fc;">"${complaintTitle}"</strong> has been updated:</p>
          <div style="background:#1e293b;border-left:4px solid ${color};padding:16px;border-radius:8px;margin:16px 0;">
            <span style="color:${color};font-weight:700;font-size:18px;text-transform:uppercase;">${newStatus.replace('_', ' ')}</span>
          </div>
          <a href="${process.env.CLIENT_URL}/complaints" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;">View Complaint</a>
        </div>
      </div>`,
  });
};

exports.sendComplaintRegistrationEmail = async (email, userName, complaintTitle, category, priority) => {
  await sendEmail({
    to: email,
    subject: `📝 Complaint Registered Successfully: ${complaintTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;background:#0f172a;color:#e2e8f0;border-radius:16px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:28px;">Resolvex</h1>
          <p style="color:#c7d2fe;margin:8px 0 0;">Civic Complaint Successfully Registered</p>
        </div>
        <div style="padding:32px;">
          <p style="color:#94a3b8;">Hi <strong style="color:#e2e8f0;">${userName}</strong>,</p>
          <p style="color:#94a3b8;">Your complaint has been successfully registered and is being reviewed by our administration team.</p>
          <div style="background:#1e293b;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #6366f1;">
            <p style="margin:0 0 8px;color:#e2e8f0;"><strong style="color:#94a3b8;">Title:</strong> ${complaintTitle}</p>
            <p style="margin:0 0 8px;color:#e2e8f0;"><strong style="color:#94a3b8;">Category:</strong> ${category}</p>
            <p style="margin:0;color:#e2e8f0;"><strong style="color:#94a3b8;">Priority:</strong> <span style="text-transform:uppercase;font-weight:600;color:${priority === 'critical' ? '#ef4444' : priority === 'high' ? '#f59e0b' : '#3b82f6'};">${priority}</span></p>
          </div>
          <div style="text-align:center;margin:24px 0;">
            <a href="${process.env.CLIENT_URL}/complaints" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">Track Your Complaint</a>
          </div>
          <p style="color:#64748b;font-size:13px;line-height:1.4;margin:0;">Thank you for helping us improve our community. You will receive updates as actions are taken on your complaint.</p>
        </div>
      </div>`,
  });
};

