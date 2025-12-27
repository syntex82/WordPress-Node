/**
 * Welcome Email Template
 * Beautiful, modern welcome email for new users
 */

import { getBaseEmailTemplate } from './base-template';

export function getWelcomeTemplate(): string {
  const content = `
<!-- Hero Section -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
  <tr>
    <td style="text-align: center; padding-bottom: 32px;">
      <div style="width: 100px; height: 100px; margin: 0 auto 20px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 48px; box-shadow: 0 8px 16px rgba(16, 185, 129, 0.2);">
        🎉
      </div>
      <h1 style="margin: 0 0 12px; font-size: 32px; font-weight: 800; color: #111827; letter-spacing: -1px;">
        Welcome, {{user.firstName}}!
      </h1>
      <p style="margin: 0; font-size: 18px; color: #6b7280; font-weight: 500;">
        Your journey starts here
      </p>
    </td>
  </tr>
</table>

<!-- Main Message -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
  <tr>
    <td style="padding-bottom: 32px;">
      <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.8; color: #374151;">
        We're absolutely thrilled to have you join <strong style="color: #111827;">{{site.name}}</strong>! Your account has been successfully created, and you're now part of our amazing community.
      </p>
      <p style="margin: 0; font-size: 16px; line-height: 1.8; color: #374151;">
        Whether you're here to learn, shop, or connect with others, we've got everything you need to get started.
      </p>
    </td>
  </tr>
</table>

<!-- Account Info Card -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
  <tr>
    <td style="padding-bottom: 32px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="background: linear-gradient(135deg, #f0f9ff 0%, #f0fdf4 100%); border-radius: 12px; padding: 24px; border-left: 4px solid #10b981;">
            <h3 style="margin: 0 0 16px; font-size: 16px; font-weight: 700; color: #111827;">Your Account Details</h3>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td style="padding: 8px 0;">
                  <p style="margin: 0; font-size: 14px; color: #6b7280;">
                    <span style="color: #111827; font-weight: 600;">Email:</span> {{user.email}}
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0;">
                  <p style="margin: 0; font-size: 14px; color: #6b7280;">
                    <span style="color: #111827; font-weight: 600;">Name:</span> {{user.name}}
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0;">
                  <p style="margin: 0; font-size: 14px; color: #6b7280;">
                    <span style="color: #111827; font-weight: 600;">Joined:</span> {{joinDate}}
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

<!-- Quick Start Section -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
  <tr>
    <td style="padding-bottom: 32px;">
      <h3 style="margin: 0 0 20px; font-size: 18px; font-weight: 700; color: #111827;">Quick Start Guide</h3>

      <!-- Step 1 -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 16px;">
        <tr>
          <td style="width: 50px; vertical-align: top; padding-right: 16px;">
            <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 18px;">1</div>
          </td>
          <td style="vertical-align: top;">
            <h4 style="margin: 0 0 4px; font-size: 15px; font-weight: 600; color: #111827;">Complete Your Profile</h4>
            <p style="margin: 0; font-size: 14px; color: #6b7280;">Add a profile picture and bio to personalize your account</p>
          </td>
        </tr>
      </table>

      <!-- Step 2 -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 16px;">
        <tr>
          <td style="width: 50px; vertical-align: top; padding-right: 16px;">
            <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 18px;">2</div>
          </td>
          <td style="vertical-align: top;">
            <h4 style="margin: 0 0 4px; font-size: 15px; font-weight: 600; color: #111827;">Explore Our Content</h4>
            <p style="margin: 0; font-size: 14px; color: #6b7280;">Browse courses, products, and articles tailored to your interests</p>
          </td>
        </tr>
      </table>

      <!-- Step 3 -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="width: 50px; vertical-align: top; padding-right: 16px;">
            <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 18px;">3</div>
          </td>
          <td style="vertical-align: top;">
            <h4 style="margin: 0 0 4px; font-size: 15px; font-weight: 600; color: #111827;">Connect & Learn</h4>
            <p style="margin: 0; font-size: 14px; color: #6b7280;">Join our community and start your learning journey today</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- CTA Button -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
  <tr>
    <td style="text-align: center; padding-bottom: 24px;">
      <a href="{{loginUrl}}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; font-size: 16px; font-weight: 700; text-decoration: none; border-radius: 8px; box-shadow: 0 8px 16px rgba(99, 102, 241, 0.3); transition: all 0.3s ease;">
        Get Started Now →
      </a>
    </td>
  </tr>
</table>

<!-- Support Section -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
  <tr>
    <td style="padding-top: 24px; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0 0 12px; font-size: 14px; color: #6b7280;">
        <strong style="color: #111827;">Need help?</strong> Our support team is here for you. Visit our <a href="{{helpUrl}}" style="color: #6366f1; text-decoration: none; font-weight: 600;">help center</a> or <a href="mailto:{{supportEmail}}" style="color: #6366f1; text-decoration: none; font-weight: 600;">contact us</a>.
      </p>
    </td>
  </tr>
</table>`;

  return getBaseEmailTemplate(content, {
    preheader: 'Welcome to our community! Get started in 3 easy steps.',
  });
}
