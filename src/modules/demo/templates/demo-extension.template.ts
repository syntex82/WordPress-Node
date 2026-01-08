/**
 * Demo Extension Confirmation Email Template
 * Sent when a demo is extended
 */

export interface DemoExtensionData {
  userName: string;
  subdomain: string;
  demoUrl: string;
  previousExpiry: string;
  newExpiry: string;
  hoursAdded: number;
  accessToken: string;
  upgradeUrl: string;
}

export function generateDemoExtensionEmail(data: DemoExtensionData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your NodePress Demo Has Been Extended</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
      <div style="font-size: 48px; margin-bottom: 10px;">⏰</div>
      <h1 style="margin: 0; color: white; font-size: 24px;">Demo Extended!</h1>
    </div>
    
    <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <p style="color: #333; font-size: 16px; margin-top: 0;">Hi ${data.userName}! 🎉</p>
      
      <p style="color: #666; line-height: 1.6;">
        Great news! Your NodePress demo <strong>${data.subdomain}</strong> has been extended 
        by <strong>${data.hoursAdded} hours</strong>.
      </p>

      <!-- Extension Details -->
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #666;">Previous Expiry:</td>
            <td style="padding: 8px 0; text-align: right; color: #999; text-decoration: line-through;">${data.previousExpiry}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">New Expiry:</td>
            <td style="padding: 8px 0; text-align: right; color: #10b981; font-weight: bold;">${data.newExpiry}</td>
          </tr>
        </table>
      </div>

      <p style="color: #666; line-height: 1.6;">
        You now have more time to explore all the powerful features NodePress has to offer.
        Make the most of your extended demo!
      </p>

      <!-- Features to Try -->
      <div style="margin: 25px 0;">
        <h3 style="color: #333; margin-bottom: 15px;">Features to explore:</h3>
        <ul style="color: #666; line-height: 1.8; padding-left: 20px;">
          <li>🎨 AI Theme Generator - Create beautiful themes in seconds</li>
          <li>📝 Block Editor - Build pages with drag-and-drop ease</li>
          <li>📊 Analytics Dashboard - Track your site performance</li>
          <li>🛒 E-commerce Setup - Start selling online</li>
        </ul>
      </div>

      <!-- CTA -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.demoUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: 600;">
          Continue Your Demo →
        </a>
      </div>

      <!-- Upgrade Note -->
      <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 15px 20px; border-radius: 8px; margin-top: 20px;">
        <p style="margin: 0; color: #92400e; font-size: 14px;">
          💡 <strong>Ready for unlimited access?</strong> 
          <a href="${data.upgradeUrl}" style="color: #92400e; font-weight: 600;">Upgrade to a full license</a> 
          and keep all your work!
        </p>
      </div>

      <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
        Questions? Reply to this email or contact support@nodepress.io
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

