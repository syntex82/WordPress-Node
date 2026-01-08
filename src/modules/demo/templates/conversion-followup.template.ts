/**
 * Demo Conversion Follow-up Email Templates
 * Automated email sequences for demo users who haven't converted
 */

export interface ConversionEmailData {
  name: string;
  email: string;
  demoId: string;
  demoSubdomain: string;
  hoursUsed: number;
  featuresUsed: string[];
  upgradeUrl: string;
  unsubscribeUrl: string;
}

/**
 * Email 1: Sent immediately when demo expires
 * Purpose: Remind them of their experience and offer next steps
 */
export function getDemoExpiredEmail(data: ConversionEmailData): { subject: string; html: string } {
  return {
    subject: `Your NodePress demo has ended – Here's what's next 🚀`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 40px 32px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 32px; }
    .stats-box { background: #f1f5f9; border-radius: 12px; padding: 24px; margin: 24px 0; }
    .stats-grid { display: flex; justify-content: space-around; text-align: center; }
    .stat-value { font-size: 28px; font-weight: 700; color: #6366f1; }
    .stat-label { font-size: 12px; color: #64748b; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0; }
    .options { margin: 32px 0; }
    .option { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 16px 0; }
    .option h3 { margin: 0 0 8px 0; color: #1e293b; }
    .option p { margin: 0; color: #64748b; font-size: 14px; }
    .footer { background: #1e293b; color: #94a3b8; padding: 24px 32px; text-align: center; font-size: 12px; }
    .footer a { color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Your NodePress Demo Has Ended</h1>
    </div>
    <div class="content">
      <p>Hi ${data.name},</p>
      
      <p>Your NodePress demo experience has come to an end. We hope you enjoyed exploring everything NodePress has to offer!</p>
      
      <div class="stats-box">
        <p style="margin: 0 0 16px 0; font-weight: 600; text-align: center;">Your Demo Journey</p>
        <div class="stats-grid">
          <div>
            <div class="stat-value">${data.hoursUsed}</div>
            <div class="stat-label">Hours Explored</div>
          </div>
          <div>
            <div class="stat-value">${data.featuresUsed.length}</div>
            <div class="stat-label">Features Used</div>
          </div>
        </div>
      </div>
      
      <p><strong>Ready to make it permanent?</strong> Here are your options:</p>
      
      <div class="options">
        <div class="option">
          <h3>💻 Custom Development</h3>
          <p>Let us build and manage your perfect NodePress site. Full setup from £499 or £99/month managed.</p>
        </div>
        <div class="option">
          <h3>🖥️ Self-Host on Hostinger</h3>
          <p>Deploy NodePress on your own VPS from just £5.99/month. Full control, one-click setup.</p>
        </div>
      </div>
      
      <p style="text-align: center;">
        <a href="${data.upgradeUrl}" class="cta-button">View Your Options →</a>
      </p>
      
      <p>Have questions? Just reply to this email – we're happy to help!</p>
      
      <p>Best regards,<br>The NodePress Team</p>
    </div>
    <div class="footer">
      <p>You received this because you requested a NodePress demo.</p>
      <p><a href="${data.unsubscribeUrl}">Unsubscribe</a> from demo emails</p>
    </div>
  </div>
</body>
</html>
    `.trim()
  };
}

/**
 * Email 2: Sent 24 hours after demo expires
 * Purpose: Highlight specific features they used and offer help
 */
export function getFollowUp24HourEmail(data: ConversionEmailData): { subject: string; html: string } {
  const featuresHighlight = data.featuresUsed.slice(0, 3).map(f => 
    `<li style="padding: 8px 0;">${getFeatureDescription(f)}</li>`
  ).join('');

  return {
    subject: `${data.name}, need help getting started with NodePress?`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: #1e293b; color: white; padding: 32px; }
    .content { padding: 32px; }
    .feature-list { background: #f0fdf4; border-left: 4px solid #10b981; padding: 16px 24px; margin: 24px 0; }
    .cta-button { display: inline-block; background: #10b981; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; }
    .help-box { background: #fef3c7; border-radius: 12px; padding: 20px; margin: 24px 0; }
    .footer { padding: 24px 32px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 22px;">Need a Hand Getting Started?</h1>
    </div>
    <div class="content">
      <p>Hi ${data.name},</p>
      
      <p>I noticed you spent time exploring NodePress during your demo. You checked out some great features:</p>
      
      <div class="feature-list">
        <ul style="margin: 0; padding-left: 20px;">
          ${featuresHighlight}
        </ul>
      </div>
      
      <p>If you're thinking about moving forward but not sure where to start, I'm here to help!</p>
      
      <div class="help-box">
        <p style="margin: 0; font-weight: 600;">🎁 Special Offer: Free 30-Minute Consultation</p>
        <p style="margin: 8px 0 0 0; font-size: 14px;">Let's discuss your project and find the best solution for your needs – no strings attached.</p>
      </div>
      
      <p style="text-align: center;">
        <a href="${data.upgradeUrl}#contact" class="cta-button">Book Your Free Call →</a>
      </p>
      
      <p>Or if you prefer to self-host, check out our <a href="${data.upgradeUrl}">step-by-step guide</a>.</p>
      
      <p>Looking forward to hearing from you!</p>
      
      <p>Best,<br>The NodePress Team</p>
    </div>
    <div class="footer">
      <p><a href="${data.unsubscribeUrl}" style="color: #64748b;">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>
    `.trim()
  };
}

/**
 * Email 3: Sent 3 days after demo expires
 * Purpose: Share success story and final offer
 */
export function getFollowUp3DayEmail(data: ConversionEmailData): { subject: string; html: string } {
  return {
    subject: `How ${data.name === 'there' ? 'a blogger' : 'others like you'} launched with NodePress`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.8; color: #1e293b; margin: 0; padding: 20px; background: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; background: white; padding: 32px; border-radius: 12px;">
    <p>Hi ${data.name},</p>
    
    <p>I wanted to share a quick success story...</p>
    
    <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin: 24px 0;">
      <p style="font-style: italic; margin: 0 0 16px 0;">"I tried the NodePress demo and was impressed, but unsure about hosting. The team helped me set everything up on Hostinger in under an hour. Now my blog gets 10,000 visitors a month and loads in under 1 second!"</p>
      <p style="margin: 0; font-weight: 600;">— Sarah P., Content Creator</p>
    </div>
    
    <p>Whether you need full custom development or just want to self-host, we're here to help you succeed.</p>
    
    <p style="text-align: center; margin: 32px 0;">
      <a href="${data.upgradeUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">Explore Your Options →</a>
    </p>
    
    <p>Questions? Just hit reply – I read every email personally.</p>
    
    <p>Cheers,<br>The NodePress Team</p>
    
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">
    <p style="font-size: 12px; color: #64748b; text-align: center;">
      <a href="${data.unsubscribeUrl}" style="color: #64748b;">Unsubscribe</a> • This is the last follow-up email we'll send.
    </p>
  </div>
</body>
</html>
    `.trim()
  };
}

function getFeatureDescription(feature: string): string {
  const descriptions: Record<string, string> = {
    'posts': '📝 Blog & Content Management',
    'pages': '📄 Page Builder',
    'media': '🖼️ Media Library',
    'themes': '🎨 Theme Customization',
    'ecommerce': '🛒 E-commerce & Shop',
    'courses': '🎓 LMS & Courses',
    'users': '👥 User Management',
    'analytics': '📊 Analytics Dashboard',
    'seo': '🔍 SEO Tools',
    'email': '✉️ Email Marketing',
  };
  return descriptions[feature] || `✓ ${feature}`;
}

