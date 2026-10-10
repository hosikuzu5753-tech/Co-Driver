// frontend/src/hooks/useNotifications.ts

import { useState, useCallback, useRef, useEffect } from 'react';
import { NotificationPayload } from '../types/protocol';
import { playNotificationChime, triggerHaptic } from '../utils/audioFeedback';

export interface UseNotificationsReturn {
  notifications: NotificationPayload[];
  activeToast: NotificationPayload | null;
  pushNotification: (notif: NotificationPayload) => void;
  dismissToast: () => void;
  clearHistory: () => void;
}

const TOAST_AUTO_DISMISS_MS = 4000;

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<NotificationPayload[]>([]);
  const [activeToast, setActiveToast] = useState<NotificationPayload | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismissToast = useCallback(() => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = null;
    }
    setActiveToast(null);
  }, []);

  const pushNotification = useCallback(
    (notif: NotificationPayload) => {
      // 1. Prepend to history stack (reverse chronological order)
      setNotifications((prev) => [notif, ...prev]);

      // 2. Play subtle chime & trigger haptic double pulse
      playNotificationChime();
      triggerHaptic([30, 50, 30]);

      // 3. Clear existing toast timeout if any (for burst notifications)
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
        toastTimeoutRef.current = null;
      }

      // 4. Set active toast and schedule 4-second auto-dismiss
      setActiveToast(notif);
      toastTimeoutRef.current = setTimeout(() => {
        setActiveToast(null);
        toastTimeoutRef.current = null;
      }, TOAST_AUTO_DISMISS_MS);
    },
    []
  );

  const clearHistory = useCallback(() => {
    setNotifications([]);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  return {
    notifications,
    activeToast,
    pushNotification,
    dismissToast,
    clearHistory,
  };
}
