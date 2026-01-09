/**
 * Course Enrollment Email Template
 * Beautiful course enrollment confirmation with learning tips
 * Configured for NodePress - https://nodepress.co.uk
 */

import { getBaseEmailTemplate } from './base-template';

export function getCourseEnrollmentTemplate(): string {
  const content = `
<!-- Hero Section -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
  <tr>
    <td style="text-align: center; padding-bottom: 32px;">
      <div style="width: 100px; height: 100px; margin: 0 auto 20px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 48px; box-shadow: 0 8px 16px rgba(59, 130, 246, 0.3);">
        📚
      </div>
      <h1 style="margin: 0 0 12px; font-size: 32px; font-weight: 800; color: #f1f5f9; letter-spacing: -1px;">
        You're Enrolled!
      </h1>
      <p style="margin: 0; font-size: 16px; color: #94a3b8;">
        Welcome to your NodePress learning journey
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
        Congratulations! You've successfully enrolled in <strong style="color: #10b981;">{{course.title}}</strong>. Your learning journey starts now, and we're excited to have you on board!
      </p>
    </td>
  </tr>
</table>
<!-- Course Card -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
  <tr>
    <td style="padding-bottom: 32px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #1e3a5f 0%, #0f2744 100%); border-radius: 12px; overflow: hidden; border: 1px solid #334155;">
        {{#if course.thumbnail}}
        <tr>
          <td style="height: 200px; overflow: hidden;">
            <img src="{{course.thumbnail}}" alt="{{course.title}}" width="560" style="width: 100%; height: 100%; object-fit: cover; display: block;">
          </td>
        </tr>
        {{/if}}
        <tr>
          <td style="padding: 28px;">
            <h2 style="margin: 0 0 12px; font-size: 24px; font-weight: 800; color: #f1f5f9; line-height: 1.3;">
              {{course.title}}
            </h2>
            {{#if course.description}}
            <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.7; color: #94a3b8;">
              {{course.description}}
            </p>
            {{/if}}

            <!-- Course Stats -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              {{#if course.instructor}}
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #334155;">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                    <tr>
                      <td style="width: 30px; vertical-align: top; padding-right: 12px; font-size: 18px;">👨‍🏫</td>
                      <td>
                        <p style="margin: 0; font-size: 14px; color: #94a3b8;">
                          <strong style="color: #f1f5f9;">Instructor:</strong> {{course.instructor}}
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              {{/if}}
              {{#if course.lessons}}
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #334155;">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                    <tr>
                      <td style="width: 30px; vertical-align: top; padding-right: 12px; font-size: 18px;">📖</td>
                      <td>
                        <p style="margin: 0; font-size: 14px; color: #94a3b8;">
                          <strong style="color: #f1f5f9;">Lessons:</strong> {{course.lessons}} lessons
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              {{/if}}
              {{#if course.duration}}
              <tr>
                <td style="padding: 8px 0;">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                    <tr>
                      <td style="width: 30px; vertical-align: top; padding-right: 12px; font-size: 18px;">⏱️</td>
                      <td>
                        <p style="margin: 0; font-size: 14px; color: #94a3b8;">
                          <strong style="color: #f1f5f9;">Duration:</strong> {{course.duration}}
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              {{/if}}
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
<!-- Tips for Success -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
  <tr>
    <td style="padding-bottom: 32px;">
      <h3 style="margin: 0 0 20px; font-size: 16px; font-weight: 700; color: #f1f5f9;">💡 Tips for Success</h3>

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 12px;">
        <tr>
          <td style="background: linear-gradient(135deg, #1e3a5f 0%, #0f2744 100%); border-radius: 8px; padding: 16px; border-left: 4px solid #f59e0b;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td style="width: 30px; vertical-align: top; padding-right: 12px; font-size: 20px;">🎯</td>
                <td>
                  <p style="margin: 0; font-size: 14px; color: #f59e0b;">
                    <strong>Set a Schedule</strong> <span style="color: #94a3b8;">- Dedicate regular time each week for learning</span>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 12px;">
        <tr>
          <td style="background: linear-gradient(135deg, #1e3a5f 0%, #0f2744 100%); border-radius: 8px; padding: 16px; border-left: 4px solid #3b82f6;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td style="width: 30px; vertical-align: top; padding-right: 12px; font-size: 20px;">📝</td>
                <td>
                  <p style="margin: 0; font-size: 14px; color: #3b82f6;">
                    <strong>Take Notes</strong> <span style="color: #94a3b8;">- Writing helps with retention and understanding</span>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="background: linear-gradient(135deg, #1e3a5f 0%, #0f2744 100%); border-radius: 8px; padding: 16px; border-left: 4px solid #10b981;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td style="width: 30px; vertical-align: top; padding-right: 12px; font-size: 20px;">🏆</td>
                <td>
                  <p style="margin: 0; font-size: 14px; color: #10b981;">
                    <strong>Complete Quizzes</strong> <span style="color: #94a3b8;">- Test your knowledge and track progress</span>
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

<!-- CTA Button -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
  <tr>
    <td style="text-align: center; padding-bottom: 24px;">
      <a href="{{courseUrl}}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; font-size: 16px; font-weight: 700; text-decoration: none; border-radius: 8px; box-shadow: 0 8px 16px rgba(16, 185, 129, 0.3);">
        Start Learning Now →
      </a>
    </td>
  </tr>
</table>

<!-- Support -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
  <tr>
    <td style="padding-top: 24px; border-top: 1px solid #334155;">
      <p style="margin: 0; font-size: 13px; color: #94a3b8;">
        <strong style="color: #f1f5f9;">Need help?</strong> Check out our <a href="{{docsUrl}}" style="color: #10b981; text-decoration: none; font-weight: 600;">learning resources</a> or <a href="mailto:{{supportEmail}}" style="color: #10b981; text-decoration: none; font-weight: 600;">contact support</a>.
      </p>
    </td>
  </tr>
</table>`;

  return getBaseEmailTemplate(content, {
    preheader: 'Your NodePress course enrollment is confirmed! Start learning today.',
  });
}
