'use client';

import { create } from 'zustand';

export interface Notification {
  id: string;
  type: 'achievement' | 'rank' | 'milestone' | 'streak' | 'warning';
  priority: 'high' | 'medium' | 'low';
  displayStyle: 'modal' | 'toast';
  data: {
    title: string;
    description: string;
    icon?: string;
    rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
    points?: number;
    actionLabel?: string;
    actionUrl?: string;
  };
}

interface NotificationStore {
  queue: Notification[];
  currentModal: Notification | null;
  isProcessing: boolean;

  // Actions
  notify: (notification: Notification) => void;
  dismissModal: () => void;
  processQueue: () => void;
}

export const useNotificationManager = create<NotificationStore>((set, get) => ({
  queue: [],
  currentModal: null,
  isProcessing: false,

  notify: (notification) => {
    const state = get();

    // Check if this notification was already shown (prevent duplicates)
    const shownKey = `notification_shown_${notification.id}`;
    if (typeof window !== 'undefined' && localStorage.getItem(shownKey)) {
      console.log(`Notification ${notification.id} already shown, skipping`);
      return;
    }

    // Add to queue
    const newQueue = [...state.queue, notification];

    // Sort by priority (high first)
    const sortedQueue = newQueue.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    set({ queue: sortedQueue });

    // Start processing if not already
    if (!state.isProcessing && !state.currentModal) {
      get().processQueue();
    }
  },

  processQueue: () => {
    const state = get();

    if (state.queue.length === 0) {
      set({ isProcessing: false });
      return;
    }

    // Get next notification
    const [nextNotification, ...remainingQueue] = state.queue;

    if (nextNotification.displayStyle === 'modal') {
      // Show modal
      set({
        currentModal: nextNotification,
        queue: remainingQueue,
        isProcessing: true,
      });

      // Mark as shown
      if (typeof window !== 'undefined') {
        localStorage.setItem(`notification_shown_${nextNotification.id}`, 'true');
      }
    } else {
      // Toast will be handled by react-hot-toast directly
      set({ queue: remainingQueue });

      // Process next immediately
      setTimeout(() => get().processQueue(), 100);
    }
  },

  dismissModal: () => {
    set({ currentModal: null });

    // Process next notification after a short delay
    setTimeout(() => get().processQueue(), 500);
  },
}));
