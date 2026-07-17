import { useState, useEffect, useCallback } from "react";

export const useNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );
  const [reminderEnabled, setReminderEnabled] = useState(() => {
    return localStorage.getItem("study-reminder") === "true";
  });

  useEffect(() => {
    if (typeof Notification !== "undefined") {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof Notification === "undefined") return "denied" as NotificationPermission;
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, []);

  const sendNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (permission === "granted") {
        new Notification(title, {
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          ...options,
        });
      }
    },
    [permission]
  );

  const toggleReminder = useCallback(async () => {
    if (!reminderEnabled) {
      const perm = await requestPermission();
      if (perm === "granted") {
        setReminderEnabled(true);
        localStorage.setItem("study-reminder", "true");
        // Schedule daily reminder
        scheduleReminder();
      }
    } else {
      setReminderEnabled(false);
      localStorage.setItem("study-reminder", "false");
    }
  }, [reminderEnabled, requestPermission]);

  const scheduleReminder = useCallback(() => {
    // Check every 30 minutes if it's study time
    const checkInterval = setInterval(() => {
      const now = new Date();
      const hour = now.getHours();
      const lastReminder = localStorage.getItem("last-reminder-date");
      const today = now.toDateString();

      // Send reminder at 9 AM and 7 PM if not already sent today
      if ((hour === 9 || hour === 19) && lastReminder !== today) {
        sendNotification("📚 Study Reminder", {
          body: "Time to practice your PTE skills! Keep your streak going 🔥",
          tag: "study-reminder",
        });
        localStorage.setItem("last-reminder-date", today);
      }
    }, 30 * 60 * 1000);

    return () => clearInterval(checkInterval);
  }, [sendNotification]);

  useEffect(() => {
    if (reminderEnabled && permission === "granted") {
      const cleanup = scheduleReminder();
      return cleanup;
    }
  }, [reminderEnabled, permission, scheduleReminder]);

  return {
    permission,
    reminderEnabled,
    requestPermission,
    sendNotification,
    toggleReminder,
    isSupported: typeof Notification !== "undefined",
  };
};
