import React, { createContext, useContext, useEffect, useState } from 'react';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { useAuth } from './AuthContext';

window.Pusher = Pusher;

const EchoContext = createContext(null);

export function EchoProvider({ children }) {
  const { token, user } = useAuth();
  const [echoInstance, setEchoInstance] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!token) {
      if (echoInstance) {
        echoInstance.disconnect();
        setEchoInstance(null);
        setIsConnected(false);
      }
      return;
    }

    const host = window.location.hostname || 'localhost';

    const echo = new Echo({
      broadcaster: 'reverb',
      key: 'servora-key',
      wsHost: host,
      wsPort: 8080,
      wssPort: 8080,
      forceTLS: false,
      enabledTransports: ['ws', 'wss'],
      authEndpoint: `http://${host}:8000/api/v1/broadcasting/auth`,
      auth: {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      },
    });

    echo.connector.pusher.connection.bind('connected', () => {
      setIsConnected(true);
    });

    echo.connector.pusher.connection.bind('disconnected', () => {
      setIsConnected(false);
    });

    echo.connector.pusher.connection.bind('error', (err) => {
      console.warn('Reverb WebSocket connection notice:', err);
      setIsConnected(false);
    });

    setEchoInstance(echo);

    return () => {
      echo.disconnect();
    };
  }, [token]);

  return (
    <EchoContext.Provider value={{ echo: echoInstance, isConnected }}>
      {children}
    </EchoContext.Provider>
  );
}

export function useEcho() {
  const context = useContext(EchoContext);
  if (!context) {
    throw new Error('useEcho must be used within an EchoProvider');
  }
  return context;
}

