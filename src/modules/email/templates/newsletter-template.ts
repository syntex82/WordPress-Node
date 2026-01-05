/**
 * Newsletter Email Template
 * Beautiful newsletter template with featured items and social links
 * Configured for NodePress - https://nodepress.co.uk
 */

import { getBaseEmailTemplate } from './base-template';

export function getNewsletterTemplate(): string {
  const content = `
<!-- Greeting -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
  <tr>
    <td style="padding-bottom: 24px;">
      <h2 style="margin: 0 0 12px; font-size: 24px; font-weight: 800; color: #f1f5f9;">
        {{newsletter.title}}
      </h2>
      <p style="margin: 0; font-size: 16px; color: #94a3b8;">
        {{newsletter.subtitle}}
      </p>
    </td>
  </tr>
</table>

<!-- Main Content -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
  <tr>
    <td style="padding-bottom: 32px;">
      <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.8; color: #cbd5e1;">
        Hi {{user.firstName}},
      </p>
      <!-- Dynamic content inserted here -->
      <div style="font-size: 16px; line-height: 1.8; color: #cbd5e1;">
        {{{content}}}
      </div>
    </td>
  </tr>
</table>
<!-- Featured Items -->
{{#if featuredItems}}
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
  <tr>
    <td style="padding-bottom: 32px;">
      <h3 style="margin: 0 0 20px; font-size: 18px; font-weight: 700; color: #f1f5f9;">✨ Featured This Week</h3>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        {{#each featuredItems}}
        <tr>
          <td style="padding: 20px; background: linear-gradient(135deg, #1e3a5f 0%, #0f2744 100%); border-radius: 12px; margin-bottom: 16px; border: 1px solid #334155; transition: all 0.3s ease;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                {{#if this.image}}
                <td style="width: 90px; vertical-align: top; padding-right: 16px;">
                  <img src="{{this.image}}" alt="{{this.title}}" width="80" height="80" style="border-radius: 8px; object-fit: cover; display: block;">
                </td>
                {{/if}}
                <td style="vertical-align: top;">
                  <h4 style="margin: 0 0 8px; font-size: 16px; font-weight: 700; color: #f1f5f9;">
                    <a href="{{this.url}}" style="color: #10b981; text-decoration: none; border-bottom: 2px solid #10b981;">{{this.title}}</a>
                  </h4>
                  <p style="margin: 0 0 8px; font-size: 14px; line-height: 1.6; color: #94a3b8;">{{this.description}}</p>
                  {{#if this.category}}<p style="margin: 0; font-size: 12px; color: #64748b; font-weight: 600;">📁 {{this.category}}</p>{{/if}}
                </td>
              </tr>
            </table>
          </td>
        </tr>
        {{/each}}
      </table>
    </td>
  </tr>
</table>
{{/if}}
<!-- CTA Button -->
{{#if callToAction}}
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
  <tr>
    <td style="text-align: center; padding-bottom: 32px;">
      <a href="{{callToAction.url}}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; font-size: 16px; font-weight: 700; text-decoration: none; border-radius: 8px; box-shadow: 0 8px 16px rgba(16, 185, 129, 0.3);">
        {{callToAction.text}} →
      </a>
    </td>
  </tr>
</table>
{{/if}}

<!-- Social Links & Footer -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
  <tr>
    <td style="border-top: 2px solid #334155; padding-top: 32px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="text-align: center;">
            <p style="margin: 0 0 20px; font-size: 14px; font-weight: 600; color: #f1f5f9;">
              Follow NodePress for more updates
            </p>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
              <tr>
                {{#if social.twitter}}
                <td style="padding: 0 10px;">
                  <a href="{{social.twitter}}" style="display: inline-block; width: 44px; height: 44px; background: linear-gradient(135deg, #1da1f2 0%, #1a8cd8 100%); border-radius: 50%; text-align: center; line-height: 44px; color: #fff; text-decoration: none; font-size: 18px; font-weight: 700; box-shadow: 0 4px 8px rgba(29, 161, 242, 0.2);">𝕏</a>
                </td>
                {{/if}}
                {{#if social.facebook}}
                <td style="padding: 0 10px;">
                  <a href="{{social.facebook}}" style="display: inline-block; width: 44px; height: 44px; background: linear-gradient(135deg, #1877f2 0%, #0a66c2 100%); border-radius: 50%; text-align: center; line-height: 44px; color: #fff; text-decoration: none; font-size: 18px; font-weight: 700; box-shadow: 0 4px 8px rgba(24, 119, 242, 0.2);">f</a>
                </td>
                {{/if}}
                {{#if social.linkedin}}
                <td style="padding: 0 10px;">
                  <a href="{{social.linkedin}}" style="display: inline-block; width: 44px; height: 44px; background: linear-gradient(135deg, #0a66c2 0%, #004182 100%); border-radius: 50%; text-align: center; line-height: 44px; color: #fff; text-decoration: none; font-size: 16px; font-weight: 700; box-shadow: 0 4px 8px rgba(10, 102, 194, 0.2);">in</a>
                </td>
                {{/if}}
                {{#if social.instagram}}
                <td style="padding: 0 10px;">
                  <a href="{{social.instagram}}" style="display: inline-block; width: 44px; height: 44px; background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888); border-radius: 50%; text-align: center; line-height: 44px; color: #fff; text-decoration: none; font-size: 18px; font-weight: 700; box-shadow: 0 4px 8px rgba(224, 136, 51, 0.2);">📷</a>
                </td>
                {{/if}}
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;

  return getBaseEmailTemplate(content, {
    preheader: "Check out this week's NodePress featured content and updates",
  });
}
