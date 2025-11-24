/**
 * Auto Vibe Refresh Reminder
 * Prompts users to update their vibe every 12 hours
 */

const VIBE_REFRESH_INTERVAL = 12 * 60 * 60 * 1000; // 12 hours in milliseconds
const STORAGE_KEY = "vibe_last_updated";
const REMINDER_KEY = "vibe_refresh_reminder_shown";

export function setVibeLastUpdated() {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    localStorage.removeItem(REMINDER_KEY);
  }
}

export function getVibeLastUpdated(): Date | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? new Date(stored) : null;
}

export function shouldShowRefreshReminder(): boolean {
  if (typeof window === "undefined") return false;
  
  // Check if reminder was already shown
  if (localStorage.getItem(REMINDER_KEY) === "true") {
    return false;
  }

  const lastUpdated = getVibeLastUpdated();
  if (!lastUpdated) return false;

  const now = new Date();
  const timeSinceUpdate = now.getTime() - lastUpdated.getTime();

  return timeSinceUpdate >= VIBE_REFRESH_INTERVAL;
}

export function markReminderShown() {
  if (typeof window !== "undefined") {
    localStorage.setItem(REMINDER_KEY, "true");
  }
}

export function getTimeUntilNextReminder(): number {
  const lastUpdated = getVibeLastUpdated();
  if (!lastUpdated) return 0;

  const now = new Date();
  const timeSinceUpdate = now.getTime() - lastUpdated.getTime();
  const timeUntilReminder = VIBE_REFRESH_INTERVAL - timeSinceUpdate;

  return Math.max(0, timeUntilReminder);
}

export function formatTimeUntilReminder(ms: number): string {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

