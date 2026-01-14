'use client';

import { useNotificationManager } from '../hooks/useNotificationManager';
import { AchievementModal } from './AchievementModal';

export function NotificationManager() {
  const { currentModal, dismissModal } = useNotificationManager();

  return (
    <>
      {currentModal && (
        <AchievementModal
          notification={currentModal}
          onDismiss={dismissModal}
        />
      )}
    </>
  );
}
