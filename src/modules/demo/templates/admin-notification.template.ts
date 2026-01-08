/**
 * Admin Notification Email Templates
 * Sent to admins for demo system events
 */

export interface NewDemoNotificationData {
  demoId: string;
  subdomain: string;
  userName: string;
  userEmail: string;
  company?: string;
  createdAt: string;
  adminDashboardUrl: string;
  totalActiveDemos: number;
  maxDemos: number;
}

export interface UpgradeRequestData {
  demoId: string;
  subdomain: string;
  userName: string;
  userEmail: string;
  company?: string;
  notes?: string;
  featuresUsed: string[];
  demoAge: string;
  adminDashboardUrl: string;
}

export interface CapacityWarningData {
  currentDemos: number;
  maxDemos: number;
  utilizationPercent: number;
  adminDashboardUrl: string;
}

export function generateNewDemoNotification(data: NewDemoNotificationData): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <div style="background: #3b82f6; padding: 20px; color: white;">
      <h2 style="margin: 0;">🆕 New Demo Created</h2>
    </div>
    <div style="padding: 25px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; color: #666; width: 120px;">Demo ID:</td><td style="padding: 8px 0;"><code>${data.demoId}</code></td></tr>
        <tr><td style="padding: 8px 0; color: #666;">Subdomain:</td><td style="padding: 8px 0;"><strong>${data.subdomain}</strong></td></tr>
        <tr><td style="padding: 8px 0; color: #666;">User:</td><td style="padding: 8px 0;">${data.userName}</td></tr>
        <tr><td style="padding: 8px 0; color: #666;">Email:</td><td style="padding: 8px 0;"><a href="mailto:${data.userEmail}">${data.userEmail}</a></td></tr>
        ${data.company ? `<tr><td style="padding: 8px 0; color: #666;">Company:</td><td style="padding: 8px 0;">${data.company}</td></tr>` : ''}
        <tr><td style="padding: 8px 0; color: #666;">Created:</td><td style="padding: 8px 0;">${data.createdAt}</td></tr>
      </table>
      
      <div style="background: #f0f9ff; padding: 15px; border-radius: 6px; margin-top: 20px;">
        <strong>Capacity:</strong> ${data.totalActiveDemos} / ${data.maxDemos} demos active
        <div style="background: #e0e7ff; height: 8px; border-radius: 4px; margin-top: 8px; overflow: hidden;">
          <div style="background: #3b82f6; height: 100%; width: ${(data.totalActiveDemos / data.maxDemos) * 100}%;"></div>
        </div>
      </div>
      
      <a href="${data.adminDashboardUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 20px;">View in Dashboard</a>
    </div>
  </div>
</body>
</html>
  `;
}

export function generateUpgradeRequestNotification(data: UpgradeRequestData): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 20px; color: white;">
      <h2 style="margin: 0;">🎉 Upgrade Request!</h2>
    </div>
    <div style="padding: 25px;">
      <p style="color: #333; font-size: 16px;">A demo user has requested to upgrade to a paid plan!</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr><td style="padding: 8px 0; color: #666; width: 120px;">User:</td><td style="padding: 8px 0;"><strong>${data.userName}</strong></td></tr>
        <tr><td style="padding: 8px 0; color: #666;">Email:</td><td style="padding: 8px 0;"><a href="mailto:${data.userEmail}">${data.userEmail}</a></td></tr>
        ${data.company ? `<tr><td style="padding: 8px 0; color: #666;">Company:</td><td style="padding: 8px 0;">${data.company}</td></tr>` : ''}
        <tr><td style="padding: 8px 0; color: #666;">Demo Age:</td><td style="padding: 8px 0;">${data.demoAge}</td></tr>
      </table>

      ${data.notes ? `
      <div style="background: #fef3c7; padding: 15px; border-radius: 6px; margin: 15px 0;">
        <strong style="color: #92400e;">Notes from user:</strong>
        <p style="margin: 10px 0 0; color: #78350f;">"${data.notes}"</p>
      </div>
      ` : ''}

      <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 15px 0;">
        <strong>Features Used:</strong>
        <p style="margin: 10px 0 0;">${data.featuresUsed.join(', ') || 'None recorded'}</p>
      </div>
      
      <a href="${data.adminDashboardUrl}" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 15px;">View Demo Details</a>
      <a href="mailto:${data.userEmail}?subject=NodePress%20Upgrade" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 15px 0 0 10px;">Contact User</a>
    </div>
  </div>
</body>
</html>
  `;
}

export function generateCapacityWarningNotification(data: CapacityWarningData): string {
  const isHigh = data.utilizationPercent >= 80;
  const isCritical = data.utilizationPercent >= 95;
  
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <div style="background: ${isCritical ? '#dc2626' : isHigh ? '#f59e0b' : '#3b82f6'}; padding: 20px; color: white;">
      <h2 style="margin: 0;">${isCritical ? '🚨' : '⚠️'} Demo Capacity ${isCritical ? 'Critical' : 'Warning'}</h2>
    </div>
    <div style="padding: 25px;">
      <p style="color: #333; font-size: 16px;">
        Demo system is at <strong>${data.utilizationPercent}%</strong> capacity.
      </p>
      
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
        <div style="font-size: 36px; font-weight: bold; color: ${isCritical ? '#dc2626' : isHigh ? '#f59e0b' : '#3b82f6'};">
          ${data.currentDemos} / ${data.maxDemos}
        </div>
        <div style="color: #666; margin-top: 5px;">Active Demos</div>
        <div style="background: #e5e7eb; height: 12px; border-radius: 6px; margin-top: 15px; overflow: hidden;">
          <div style="background: ${isCritical ? '#dc2626' : isHigh ? '#f59e0b' : '#3b82f6'}; height: 100%; width: ${data.utilizationPercent}%;"></div>
        </div>
      </div>

      <p style="color: #666;">
        ${isCritical 
          ? 'New demo requests may be rejected. Consider cleaning up expired demos or increasing capacity.'
          : 'Consider monitoring the system or preparing to scale up.'}
      </p>
      
      <a href="${data.adminDashboardUrl}" style="display: inline-block; background: ${isCritical ? '#dc2626' : '#3b82f6'}; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 15px;">Manage Demos</a>
    </div>
  </div>
</body>
</html>
  `;
}

