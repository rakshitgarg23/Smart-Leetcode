import { useEffect } from 'react';
import api from '../api';

export const useServerHeartbeat = () => {
  useEffect(() => {
    // 10 minutes in milliseconds
    const HEARTBEAT_INTERVAL = 600000; 

    const pingServer = async () => {
      // Only ping if the document is visible
      if (document.visibilityState === 'visible') {
        try {
          await api.get('/api/keep-alive');
          console.log('Heartbeat sent successfully.');
        } catch (error) {
          console.error('Heartbeat failed:', error);
        }
      } else {
        console.log('Tab hidden, skipping heartbeat.');
      }
    };

    // Initial ping on mount if visible
    if (document.visibilityState === 'visible') {
        pingServer();
    }

    // Set up the interval
    const intervalId = setInterval(pingServer, HEARTBEAT_INTERVAL);

    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, []);
};
