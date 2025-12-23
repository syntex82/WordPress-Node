/**
 * Device Detection Utility
 * Parses user agent strings to identify device type, browser, and OS
 * Used for responsive design and analytics
 */

export interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop';
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  browser: string;
  os: string;
  isTouchDevice: boolean;
}

/**
 * Parse user agent string to extract device information
 */
export function parseUserAgent(userAgent: string | undefined): DeviceInfo {
  if (!userAgent) {
    return {
      type: 'desktop',
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      browser: 'unknown',
      os: 'unknown',
      isTouchDevice: false,
    };
  }

  const ua = userAgent.toLowerCase();

  // Device type detection
  let type: 'mobile' | 'tablet' | 'desktop' = 'desktop';
  let isTouchDevice = false;

  // Check for tablets first (they often include 'mobile' in UA)
  const isTablet =
    /ipad|tablet|playbook|silk|android(?!.*mobile)/i.test(userAgent) ||
    (ua.includes('android') && !ua.includes('mobile'));

  // Check for mobile devices
  const isMobile =
    !isTablet &&
    /mobile|android|iphone|ipod|blackberry|windows phone|opera mini|iemobile|wpdesktop/i.test(
      userAgent,
    );

  if (isTablet) {
    type = 'tablet';
    isTouchDevice = true;
  } else if (isMobile) {
    type = 'mobile';
    isTouchDevice = true;
  }

  // Browser detection
  let browser = 'unknown';
  if (ua.includes('firefox') || ua.includes('fxios')) {
    browser = 'Firefox';
  } else if (ua.includes('edg') || ua.includes('edge')) {
    browser = 'Edge';
  } else if (ua.includes('opr') || ua.includes('opera')) {
    browser = 'Opera';
  } else if (ua.includes('chrome') || ua.includes('crios')) {
    browser = 'Chrome';
  } else if (ua.includes('safari')) {
    browser = 'Safari';
  } else if (ua.includes('msie') || ua.includes('trident')) {
    browser = 'IE';
  }

  // OS detection
  let os = 'unknown';
  if (ua.includes('windows')) {
    os = 'Windows';
  } else if (ua.includes('mac os') || ua.includes('macos')) {
    os = 'macOS';
  } else if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) {
    os = 'iOS';
  } else if (ua.includes('android')) {
    os = 'Android';
  } else if (ua.includes('linux')) {
    os = 'Linux';
  } else if (ua.includes('chromeos')) {
    os = 'ChromeOS';
  }

  return {
    type,
    isMobile: type === 'mobile',
    isTablet: type === 'tablet',
    isDesktop: type === 'desktop',
    browser,
    os,
    isTouchDevice,
  };
}

/**
 * Get CSS class names based on device info
 */
export function getDeviceClasses(device: DeviceInfo): string {
  const classes: string[] = [];

  classes.push(`device-${device.type}`);

  if (device.isTouchDevice) {
    classes.push('touch-device');
  } else {
    classes.push('no-touch');
  }

  if (device.os !== 'unknown') {
    classes.push(`os-${device.os.toLowerCase().replace(/\s+/g, '-')}`);
  }

  if (device.browser !== 'unknown') {
    classes.push(`browser-${device.browser.toLowerCase()}`);
  }

  return classes.join(' ');
}

