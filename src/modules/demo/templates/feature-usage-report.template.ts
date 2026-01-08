/**
 * Feature Usage Report Email Template
 * Sent to demo users with a summary of their feature usage
 */

export interface FeatureUsageReportData {
  userName: string;
  subdomain: string;
  demoUrl: string;
  reportPeriod: string;
  featuresUsed: Array<{
    name: string;
    count: number;
    lastUsed: string;
  }>;
  totalActions: number;
  topFeature: string;
  upgradeUrl: string;
}

export function generateFeatureUsageReportEmail(data: FeatureUsageReportData): string {
  const featureRows = data.featuresUsed
    .map(f => `
      <tr>
        <td style="padding: 12px 15px; border-bottom: 1px solid #eee;">${f.name}</td>
        <td style="padding: 12px 15px; border-bottom: 1px solid #eee; text-align: center;">${f.count}</td>
        <td style="padding: 12px 15px; border-bottom: 1px solid #eee; text-align: right;">${f.lastUsed}</td>
      </tr>
    `)
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your NodePress Demo Activity Report</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
      <h1 style="margin: 0; color: white; font-size: 24px;">📊 Your Activity Report</h1>
      <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">${data.reportPeriod}</p>
    </div>
    
    <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <p style="color: #333; font-size: 16px; margin-top: 0;">Hi ${data.userName}! 👋</p>
      
      <p style="color: #666; line-height: 1.6;">
        Here's a summary of your activity on your NodePress demo <strong>${data.subdomain}</strong>.
      </p>

      <!-- Stats Summary -->
      <div style="display: flex; justify-content: space-around; margin: 25px 0; text-align: center;">
        <div style="flex: 1; padding: 15px; background: #f8f9fa; border-radius: 8px; margin: 0 5px;">
          <div style="font-size: 28px; font-weight: bold; color: #667eea;">${data.totalActions}</div>
          <div style="font-size: 12px; color: #666; text-transform: uppercase;">Total Actions</div>
        </div>
        <div style="flex: 1; padding: 15px; background: #f8f9fa; border-radius: 8px; margin: 0 5px;">
          <div style="font-size: 28px; font-weight: bold; color: #764ba2;">${data.featuresUsed.length}</div>
          <div style="font-size: 12px; color: #666; text-transform: uppercase;">Features Used</div>
        </div>
      </div>

      <!-- Top Feature Highlight -->
      <div style="background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
        <p style="margin: 0; font-size: 14px; color: #666;">Your Most Used Feature</p>
        <p style="margin: 10px 0 0; font-size: 20px; font-weight: bold; color: #333;">🏆 ${data.topFeature}</p>
      </div>

      <!-- Feature Usage Table -->
      <h3 style="color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Feature Breakdown</h3>
      <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
        <thead>
          <tr style="background: #f8f9fa;">
            <th style="padding: 12px 15px; text-align: left; font-weight: 600;">Feature</th>
            <th style="padding: 12px 15px; text-align: center; font-weight: 600;">Uses</th>
            <th style="padding: 12px 15px; text-align: right; font-weight: 600;">Last Used</th>
          </tr>
        </thead>
        <tbody>
          ${featureRows}
        </tbody>
      </table>

      <!-- CTA -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.demoUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 5px;">
          Continue Exploring
        </a>
        <a href="${data.upgradeUrl}" style="display: inline-block; background: #10b981; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 5px;">
          Upgrade Now
        </a>
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

