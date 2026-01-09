/**
 * Password Reset Email Template
 * Secure password reset email with clear instructions
 * Configured for NodePress - https://nodepress.co.uk
 */

import { getBaseEmailTemplate } from './base-template';

interface PasswordResetTemplateData {
  user: { firstName: string };
  resetUrl: string;
  expiresIn: string;
  supportUrl: string;
  supportEmail: string;
}

export function getPasswordResetTemplate(data: PasswordResetTemplateData): string {
  const { user, resetUrl, expiresIn, supportUrl, supportEmail } = data;

  const content = `
<!-- Hero Section -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
  <tr>
    <td style="text-align: center; padding-bottom: 32px;">
      <div style="width: 100px; height: 100px; margin: 0 auto 20px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 48px; box-shadow: 0 8px 16px rgba(16, 185, 129, 0.3);">
        🔐
      </div>
      <h1 style="margin: 0 0 12px; font-size: 32px; font-weight: 800; color: #f1f5f9; letter-spacing: -1px;">
        Reset Your Password
      </h1>
      <p style="margin: 0; font-size: 16px; color: #94a3b8;">
        Secure your NodePress account with a new password
      </p>
    </td>
  </tr>
</table>

<!-- Main Message -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
  <tr>
    <td style="padding-bottom: 32px;">
      <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.8; color: #cbd5e1;">
        Hi {{user.firstName}},
      </p>
      <p style="margin: 0; font-size: 16px; line-height: 1.8; color: #cbd5e1;">
        We received a request to reset your password for your NodePress account. Click the button below to create a new, secure password.
      </p>
    </td>
  </tr>
</table>

<!-- CTA Button -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
  <tr>
    <td style="text-align: center; padding-bottom: 32px;">
      <a href="{{resetUrl}}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; font-size: 16px; font-weight: 700; text-decoration: none; border-radius: 8px; box-shadow: 0 8px 16px rgba(16, 185, 129, 0.3);">
        Reset Password Now
      </a>
    </td>
  </tr>
</table>

<!-- Security Alert -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
  <tr>
    <td style="padding-bottom: 32px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="background: linear-gradient(135deg, #1e3a5f 0%, #0f2744 100%); border-left: 4px solid #10b981; border-radius: 8px; padding: 20px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td style="width: 30px; vertical-align: top; padding-right: 12px; font-size: 20px;">⏰</td>
                <td style="vertical-align: top;">
                  <p style="margin: 0 0 8px; font-size: 14px; font-weight: 700; color: #10b981;">
                    Link Expires in {{expiresIn}}
                  </p>
                  <p style="margin: 0; font-size: 13px; color: #94a3b8; line-height: 1.6;">
                    For security reasons, this password reset link will expire after {{expiresIn}}. If you don't reset your password within this time, you'll need to request a new link.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- Security Tips -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
  <tr>
    <td style="padding-bottom: 32px;">
      <h3 style="margin: 0 0 16px; font-size: 16px; font-weight: 700; color: #f1f5f9;">🛡️ Security Tips</h3>
      <ul style="margin: 0; padding-left: 20px; color: #94a3b8; font-size: 14px; line-height: 1.8;">
        <li style="margin-bottom: 8px;">Use a strong password with uppercase, lowercase, numbers, and symbols</li>
        <li style="margin-bottom: 8px;">Never share your password with anyone</li>
        <li>If you didn't request this reset, your account may be at risk. Contact support immediately.</li>
      </ul>
    </td>
  </tr>
</table>

<!-- Fallback Link -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
  <tr>
    <td style="padding-bottom: 24px; border-top: 1px solid #334155; padding-top: 24px;">
      <p style="margin: 0 0 12px; font-size: 13px; color: #94a3b8;">
        If the button above doesn't work, copy and paste this link into your browser:
      </p>
      <p style="margin: 0; font-size: 12px; color: #64748b; word-break: break-all; background-color: #0f172a; padding: 12px; border-radius: 6px; font-family: monospace; border: 1px solid #334155;">
        {{resetUrl}}
      </p>
    </td>
  </tr>
</table>

<!-- Support -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
  <tr>
    <td style="padding-top: 16px;">
      <p style="margin: 0; font-size: 13px; color: #94a3b8;">
        <strong style="color: #f1f5f9;">Didn't request this?</strong> <a href="${supportUrl}" style="color: #10b981; text-decoration: none; font-weight: 600;">Contact our support team</a> immediately at ${supportEmail} if you believe your account has been compromised.
      </p>
    </td>
  </tr>
</table>`;

  // Replace placeholders with actual values
  // Note: supportUrl uses JS template literal (${...}) directly, not Handlebars
  const processedContent = content
    .replace(/\{\{user\.firstName\}\}/g, user.firstName)
    .replace(/\{\{resetUrl\}\}/g, resetUrl)
    .replace(/\{\{expiresIn\}\}/g, expiresIn);

  return getBaseEmailTemplate(processedContent, {
    preheader: 'Reset your NodePress password securely',
  });
}
