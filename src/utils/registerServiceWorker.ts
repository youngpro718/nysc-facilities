
/**
 * Service Worker Registration for iOS 18+ PWA Support
 * Handles installation, updates, and push notifications
 */
import { logger } from '@/lib/logger';

export interface ServiceWorkerConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

export async function registerServiceWorker(config: ServiceWorkerConfig = {}) {
  // Check if service workers are supported
  if (!('serviceWorker' in navigator)) {
    logger.warn('Service Workers are not supported in this browser');
    return null;
  }

  try {
    // Register the service worker
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    logger.debug('Service Worker registered successfully:', registration);

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New service worker available
          logger.debug('New service worker available');
          config.onUpdate?.(registration);
        }
      });
    });

    // Check for updates periodically (every hour)
    setInterval(() => {
      registration.update();
    }, 60 * 60 * 1000);

    config.onSuccess?.(registration);
    return registration;
  } catch (error) {
    logger.error('Service Worker registration failed:', error);
    config.onError?.(error as Error);
    return null;
  }
}

/**
 * Unregister service worker
 */
export async function unregisterServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const success = await registration.unregister();
    logger.debug('Service Worker unregistered:', success);
    return success;
  } catch (error) {
    logger.error('Service Worker unregistration failed:', error);
    return false;
  }
}

/**
 * Request push notification permission (iOS 16.4+)
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    logger.warn('Notifications are not supported');
    return 'denied';
  }

  // Check current permission
  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  // Request permission
  try {
    const permission = await Notification.requestPermission();
    logger.debug('Notification permission:', permission);
    return permission;
  } catch (error) {
    logger.error('Notification permission request failed:', error);
    return 'denied';
  }
}

/**
 * Subscribe to push notifications (iOS 16.4+)
 */
export async function subscribeToPushNotifications(
  vapidPublicKey: string
): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    logger.warn('Push notifications are not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const pushManager = (registration as unknown as { pushManager: PushManager }).pushManager;
    
    // Check if already subscribed
    let subscription = await pushManager.getSubscription();
    
    if (subscription) {
      logger.debug('Already subscribed to push notifications');
      return subscription;
    }

    // Request notification permission first
    const permission = await requestNotificationPermission();
    
    if (permission !== 'granted') {
      logger.warn('Notification permission not granted');
      return null;
    }

    // Subscribe to push notifications
    subscription = await pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    logger.debug('Subscribed to push notifications:', subscription);
    return subscription;
  } catch (error) {
    logger.error('Push notification subscription failed:', error);
    return null;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const pushManager = (registration as unknown as { pushManager: PushManager }).pushManager;
    const subscription = await pushManager.getSubscription();
    
    if (!subscription) {
      logger.debug('No push subscription found');
      return false;
    }

    const success = await subscription.unsubscribe();
    logger.debug('Unsubscribed from push notifications:', success);
    return success;
  } catch (error) {
    logger.error('Push notification unsubscription failed:', error);
    return false;
  }
}

/**
 * Check if app is running in standalone mode (installed as PWA)
 */
export function isStandalone(): boolean {
  // iOS Safari
  if ('standalone' in navigator && (navigator as unknown as Record<string, unknown>).standalone) {
    return true;
  }

  // Android and modern browsers
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }

  return false;
}

/**
 * Check if app is running on iOS
 */
export function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as Record<string, unknown>).MSStream;
}

/**
 * Check if app can be installed (has beforeinstallprompt support)
 */
export function canInstall(): boolean {
  return 'BeforeInstallPromptEvent' in window;
}

/**
 * Utility: Convert VAPID key to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * Send message to service worker
 */
export function sendMessageToSW(message: unknown): void {
  if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
    logger.warn('No active service worker to send message to');
    return;
  }

  navigator.serviceWorker.controller.postMessage(message);
}

/**
 * Clear all caches
 */
export async function clearAllCaches(): Promise<void> {
  if (!('caches' in window)) {
    return;
  }

  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));
    logger.debug('All caches cleared');
  } catch (error) {
    logger.error('Failed to clear caches:', error);
  }
}
