/**
 * Base Email Template
 * Mobile-responsive template that works across all major email clients
 * Configured for NodePress - https://nodepress.co.uk
 */

export function getBaseEmailTemplate(
  content: string,
  options: { preheader?: string } = {},
): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>{{site.name}}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    /* Reset styles */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }

    /* Base styles */
    body {
      width: 100% !important;
      height: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      background-color: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }

    /* Container */
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #1e293b;
    }

    /* Responsive styles */
    @media screen and (max-width: 600px) {
      .email-container { width: 100% !important; }
      .fluid { max-width: 100% !important; height: auto !important; margin-left: auto !important; margin-right: auto !important; }
      .stack-column { display: block !important; width: 100% !important; max-width: 100% !important; }
      .center-on-narrow { text-align: center !important; display: block !important; margin-left: auto !important; margin-right: auto !important; float: none !important; }
      .mobile-padding { padding-left: 20px !important; padding-right: 20px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a;">
  ${options.preheader ? `<div style="display: none; max-height: 0; overflow: hidden;">${options.preheader}</div>` : ''}

  <!-- Background wrapper -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #0f172a;">
    <tr>
      <td style="padding: 40px 20px;">
        <!-- Email container -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" class="email-container" style="margin: 0 auto; max-width: 600px; background-color: #1e293b; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);">

          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px; text-align: center; background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
              {{#if site.logo}}
                <img src="{{site.logo}}" alt="{{site.name}}" width="180" style="max-width: 180px; height: auto;">
              {{else}}
                <h1 style="margin: 0; font-size: 32px; font-weight: 800; color: #ffffff; letter-spacing: -1px;">{{site.name}}</h1>
              {{/if}}
              <p style="margin: 8px 0 0; font-size: 14px; color: rgba(255,255,255,0.8);">{{site.url}}</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px; color: #f1f5f9;" class="mobile-padding">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px; background-color: #0f172a; border-top: 1px solid #334155;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center;">
                    <!-- Social Links -->
                    <p style="margin: 0 0 16px;">
                      <a href="{{site.url}}" style="display: inline-block; margin: 0 8px; color: #10b981; text-decoration: none; font-size: 14px; font-weight: 600;">Website</a>
                      <span style="color: #475569;">|</span>
                      <a href="{{docsUrl}}" style="display: inline-block; margin: 0 8px; color: #10b981; text-decoration: none; font-size: 14px; font-weight: 600;">Documentation</a>
                      <span style="color: #475569;">|</span>
                      <a href="{{supportUrl}}" style="display: inline-block; margin: 0 8px; color: #10b981; text-decoration: none; font-size: 14px; font-weight: 600;">Support</a>
                    </p>
                    <p style="margin: 0 0 8px; font-size: 14px; color: #94a3b8;">
                      © {{year}} {{site.name}}. All rights reserved.
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #64748b;">
                      NodePress CMS - Modern Content Management System
                    </p>
                    <p style="margin: 8px 0 0; font-size: 12px; color: #64748b;">
                      {{#if site.address}}{{site.address}}{{/if}}
                    </p>
                    {{#if unsubscribeUrl}}
                    <p style="margin: 16px 0 0; font-size: 12px;">
                      <a href="{{unsubscribeUrl}}" style="color: #64748b; text-decoration: underline;">Unsubscribe from these emails</a>
                    </p>
                    {{/if}}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

        <!-- Legal footer -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 20px auto 0;">
          <tr>
            <td style="text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #475569;">
                This email was sent by {{site.name}}. If you have questions, please contact
                <a href="mailto:{{supportEmail}}" style="color: #10b981;">{{supportEmail}}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
