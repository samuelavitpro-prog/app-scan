import { QueuedOfflineAction, OfflineActionType } from "../types";

const STORAGE_KEY = "stockvision_offline_queue_v1";
const SIMULATED_OFFLINE_KEY = "stockvision_simulated_offline";

export const getStoredQueue = (): QueuedOfflineAction[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Error reading offline queue from localStorage:", e);
    return [];
  }
};

export const saveStoredQueue = (queue: QueuedOfflineAction[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error("Error saving offline queue to localStorage:", e);
  }
};

export const getStoredSimulatedOffline = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(SIMULATED_OFFLINE_KEY) === "true";
  } catch {
    return false;
  }
};

export const setStoredSimulatedOffline = (simulated: boolean) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SIMULATED_OFFLINE_KEY, simulated ? "true" : "false");
  } catch {}
};

export const enqueueOfflineAction = (
  type: OfflineActionType,
  description: string,
  payload: any
): QueuedOfflineAction => {
  const newAction: QueuedOfflineAction = {
    id: `queue-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    type,
    description,
    payload,
    timestamp: new Date().toISOString(),
    status: "pending",
    retryCount: 0,
  };

  const currentQueue = getStoredQueue();
  const updatedQueue = [newAction, ...currentQueue];
  saveStoredQueue(updatedQueue);
  return newAction;
};

export const removeQueueAction = (id: string): QueuedOfflineAction[] => {
  const currentQueue = getStoredQueue();
  const updated = currentQueue.filter((item) => item.id !== id);
  saveStoredQueue(updated);
  return updated;
};

export const clearAllQueuedActions = (): void => {
  saveStoredQueue([]);
};
