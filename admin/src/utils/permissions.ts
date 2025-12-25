/**
 * Device Permissions Helper
 * Handles camera, microphone, and notification permissions for mobile/Android
 */

export type PermissionStatus = 'granted' | 'denied' | 'prompt' | 'unsupported';

/**
 * Check camera permission status
 */
export async function checkCameraPermission(): Promise<PermissionStatus> {
  try {
    if (!navigator.permissions) return 'unsupported';
    const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
    return result.state as PermissionStatus;
  } catch {
    return 'unsupported';
  }
}

/**
 * Check microphone permission status
 */
export async function checkMicrophonePermission(): Promise<PermissionStatus> {
  try {
    if (!navigator.permissions) return 'unsupported';
    const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
    return result.state as PermissionStatus;
  } catch {
    return 'unsupported';
  }
}

/**
 * Check notification permission status
 */
export function checkNotificationPermission(): PermissionStatus {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission as PermissionStatus;
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<PermissionStatus> {
  if (!('Notification' in window)) return 'unsupported';
  
  try {
    const result = await Notification.requestPermission();
    return result as PermissionStatus;
  } catch {
    return 'denied';
  }
}

/**
 * Request camera and microphone permissions
 * Returns the stream if granted, null if denied
 */
export async function requestMediaPermissions(): Promise<{ 
  granted: boolean; 
  stream: MediaStream | null;
  error?: string;
}> {
  try {
    // Check if getUserMedia is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return { 
        granted: false, 
        stream: null, 
        error: 'Camera/microphone not supported on this device' 
      };
    }

    // Request permissions by getting a stream
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });

    return { granted: true, stream };
  } catch (error: unknown) {
    const err = error as Error & { name?: string };
    
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      return { 
        granted: false, 
        stream: null, 
        error: 'Permission denied. Please allow camera and microphone access in your browser settings.' 
      };
    }
    
    if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      return { 
        granted: false, 
        stream: null, 
        error: 'No camera or microphone found on this device.' 
      };
    }
    
    if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
      return { 
        granted: false, 
        stream: null, 
        error: 'Camera or microphone is already in use by another app.' 
      };
    }

    return { 
      granted: false, 
      stream: null, 
      error: 'Could not access camera/microphone. Please check your device settings.' 
    };
  }
}

/**
 * Check if running on Android
 */
export function isAndroid(): boolean {
  return /Android/i.test(navigator.userAgent);
}

/**
 * Check if running on iOS
 */
export function isIOS(): boolean {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/**
 * Check if running as PWA (installed app)
 */
export function isPWA(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

/**
 * Get permission instructions based on platform
 */
export function getPermissionInstructions(): string {
  if (isAndroid()) {
    return 'Go to Settings > Apps > Your Browser > Permissions > Camera/Microphone > Allow';
  }
  if (isIOS()) {
    return 'Go to Settings > Safari (or your browser) > Camera/Microphone > Allow';
  }
  return 'Click the lock/info icon in your browser address bar and allow camera/microphone access';
}

/**
 * Check combined media permission status
 * Returns the most restrictive status between camera and microphone
 */
export async function checkMediaPermissionStatus(): Promise<PermissionStatus> {
  const camera = await checkCameraPermission();
  const mic = await checkMicrophonePermission();

  // If either is denied, return denied
  if (camera === 'denied' || mic === 'denied') return 'denied';

  // If either is unsupported, we can't check - return prompt to encourage trying
  if (camera === 'unsupported' || mic === 'unsupported') return 'prompt';

  // If either is prompt, return prompt
  if (camera === 'prompt' || mic === 'prompt') return 'prompt';

  // Both granted
  return 'granted';
}

