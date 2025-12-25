/**
 * Device Permissions Helper
 * Handles camera, microphone, and notification permissions for mobile/Android
 *
 * IMPORTANT: The Permissions API is not uniformly supported across browsers.
 * - Chrome/Edge: Full support for camera/microphone queries
 * - Firefox: Partial support, may throw errors
 * - Safari/iOS: No support for camera/microphone queries
 * - Mobile browsers: Inconsistent support
 *
 * This module uses a hybrid approach:
 * 1. Try Permissions API first (when available)
 * 2. Fall back to actually requesting media access to check permissions
 * 3. Cache successful grants in localStorage with timestamp
 * 4. Listen for permission changes where supported
 */

export type PermissionStatus = 'granted' | 'denied' | 'prompt' | 'unsupported';

// Cache key for storing permission state with timestamp
const PERMISSION_CACHE_KEY = 'mediaPermissionStatus';
const PERMISSION_CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

interface PermissionCache {
  status: PermissionStatus;
  timestamp: number;
}

/**
 * Get cached permission status if valid
 */
function getCachedPermissionStatus(): PermissionStatus | null {
  try {
    const cached = localStorage.getItem(PERMISSION_CACHE_KEY);
    if (cached) {
      const data: PermissionCache = JSON.parse(cached);
      const now = Date.now();
      // Only use cache if it's recent and was granted
      if (data.status === 'granted' && (now - data.timestamp) < PERMISSION_CACHE_EXPIRY) {
        return data.status;
      }
      // Clear stale cache
      if ((now - data.timestamp) >= PERMISSION_CACHE_EXPIRY) {
        localStorage.removeItem(PERMISSION_CACHE_KEY);
      }
    }
  } catch {
    // Ignore localStorage errors
  }
  return null;
}

/**
 * Cache permission status
 */
function setCachedPermissionStatus(status: PermissionStatus): void {
  try {
    if (status === 'granted') {
      const data: PermissionCache = { status, timestamp: Date.now() };
      localStorage.setItem(PERMISSION_CACHE_KEY, JSON.stringify(data));
    } else {
      // Clear cache if not granted
      localStorage.removeItem(PERMISSION_CACHE_KEY);
    }
    // Also maintain backward compatibility
    if (status === 'granted') {
      localStorage.setItem('mediaPermissionGranted', 'true');
    } else {
      localStorage.removeItem('mediaPermissionGranted');
    }
  } catch {
    // Ignore localStorage errors
  }
}

/**
 * Check camera permission status using Permissions API
 * Returns 'unsupported' if the browser doesn't support this check
 */
export async function checkCameraPermission(): Promise<PermissionStatus> {
  try {
    if (!navigator.permissions) return 'unsupported';
    // Some browsers don't support querying camera/microphone
    const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
    return result.state as PermissionStatus;
  } catch {
    // Safari and some mobile browsers throw an error for camera/microphone queries
    return 'unsupported';
  }
}

/**
 * Check microphone permission status using Permissions API
 * Returns 'unsupported' if the browser doesn't support this check
 */
export async function checkMicrophonePermission(): Promise<PermissionStatus> {
  try {
    if (!navigator.permissions) return 'unsupported';
    const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
    return result.state as PermissionStatus;
  } catch {
    // Safari and some mobile browsers throw an error for camera/microphone queries
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
 * This is the most reliable way to check permissions across all browsers
 */
export async function requestMediaPermissions(options?: {
  video?: boolean;
  audio?: boolean;
}): Promise<{
  granted: boolean;
  stream: MediaStream | null;
  error?: string;
  errorType?: 'unsupported' | 'denied' | 'not_found' | 'in_use' | 'overconstrained' | 'unknown';
}> {
  const { video = true, audio = true } = options || {};

  try {
    // Check if getUserMedia is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCachedPermissionStatus('unsupported');
      return {
        granted: false,
        stream: null,
        error: 'Camera/microphone not supported on this device',
        errorType: 'unsupported'
      };
    }

    // Build constraints - try with both first, then fallback
    const constraints: MediaStreamConstraints = {};
    if (video) {
      constraints.video = {
        facingMode: 'user',
        width: { ideal: 640 },
        height: { ideal: 480 }
      };
    }
    if (audio) {
      constraints.audio = {
        echoCancellation: true,
        noiseSuppression: true
      };
    }

    // Request permissions by getting a stream
    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    // Cache the successful permission grant
    setCachedPermissionStatus('granted');

    return { granted: true, stream };
  } catch (error: unknown) {
    const err = error as Error & { name?: string; constraint?: string };

    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      setCachedPermissionStatus('denied');
      return {
        granted: false,
        stream: null,
        error: `Permission denied. ${getPermissionInstructions()}`,
        errorType: 'denied'
      };
    }

    if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      return {
        granted: false,
        stream: null,
        error: 'No camera or microphone found on this device.',
        errorType: 'not_found'
      };
    }

    if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
      return {
        granted: false,
        stream: null,
        error: 'Camera or microphone is already in use by another app. Please close other apps and try again.',
        errorType: 'in_use'
      };
    }

    if (err.name === 'OverconstrainedError') {
      // Try again without constraints
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setCachedPermissionStatus('granted');
        return { granted: true, stream };
      } catch {
        return {
          granted: false,
          stream: null,
          error: 'Your camera/microphone does not support the required settings.',
          errorType: 'overconstrained'
        };
      }
    }

    if (err.name === 'SecurityError') {
      return {
        granted: false,
        stream: null,
        error: 'Camera access requires a secure connection (HTTPS). Please use HTTPS.',
        errorType: 'denied'
      };
    }

    return {
      granted: false,
      stream: null,
      error: 'Could not access camera/microphone. Please check your device settings.',
      errorType: 'unknown'
    };
  }
}

/**
 * Quick test to verify camera/microphone access is still working
 * Uses a short-lived stream to check permissions without keeping it open
 */
export async function verifyMediaAccess(): Promise<boolean> {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return false;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    // Immediately stop all tracks
    stream.getTracks().forEach(track => track.stop());
    setCachedPermissionStatus('granted');
    return true;
  } catch {
    setCachedPermissionStatus('denied');
    return false;
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
 * Uses a hybrid approach for cross-browser compatibility:
 * 1. Check recent cache (if granted within last 24 hours)
 * 2. Try Permissions API (Chrome/Edge)
 * 3. Fall back to assuming 'prompt' for Safari/iOS (user can click to test)
 */
export async function checkMediaPermissionStatus(): Promise<PermissionStatus> {
  // Check if mediaDevices is even supported
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return 'unsupported';
  }

  // Check recent cache first
  const cachedStatus = getCachedPermissionStatus();
  if (cachedStatus === 'granted') {
    return 'granted';
  }

  // Try Permissions API for browsers that support it
  const camera = await checkCameraPermission();
  const mic = await checkMicrophonePermission();

  // If both are supported and can give us a definitive answer
  if (camera !== 'unsupported' && mic !== 'unsupported') {
    // If either is denied, return denied
    if (camera === 'denied' || mic === 'denied') {
      setCachedPermissionStatus('denied');
      return 'denied';
    }

    // If both are granted
    if (camera === 'granted' && mic === 'granted') {
      setCachedPermissionStatus('granted');
      return 'granted';
    }

    // If either is prompt, return prompt
    return 'prompt';
  }

  // For Safari/iOS and other browsers without Permissions API support,
  // we can't determine the status without actually requesting access.
  // Return 'prompt' to show the enable button so user can grant access.
  return 'prompt';
}

/**
 * Subscribe to permission changes (Chrome/Edge only)
 * Returns a cleanup function to unsubscribe
 */
export function subscribeToPermissionChanges(
  onChange: (status: PermissionStatus) => void
): () => void {
  const cleanupFns: (() => void)[] = [];

  const setupListener = async (permissionName: 'camera' | 'microphone') => {
    try {
      if (!navigator.permissions) return;
      const result = await navigator.permissions.query({ name: permissionName as PermissionName });

      const handleChange = async () => {
        const newStatus = await checkMediaPermissionStatus();
        onChange(newStatus);
      };

      result.addEventListener('change', handleChange);
      cleanupFns.push(() => result.removeEventListener('change', handleChange));
    } catch {
      // Permissions API not supported for this permission type
    }
  };

  // Set up listeners for both camera and microphone
  setupListener('camera');
  setupListener('microphone');

  return () => {
    cleanupFns.forEach(fn => fn());
  };
}

/**
 * Clear cached permission status
 * Call this when user explicitly wants to re-check permissions
 */
export function clearPermissionCache(): void {
  try {
    localStorage.removeItem(PERMISSION_CACHE_KEY);
    localStorage.removeItem('mediaPermissionGranted');
  } catch {
    // Ignore localStorage errors
  }
}
