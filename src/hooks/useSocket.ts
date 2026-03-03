import { useAuthStore } from '@/store/use-auth-store';
import { useEffect, useState } from 'react';
import { Socket, io } from 'socket.io-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const SOCKET_URL = API_URL.replace(/\/api$/, '');

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const token = useAuthStore(state => state.token);

  useEffect(() => {
    if (!token) {
        return;
    }

    const socketInstance = io(SOCKET_URL, {
      auth: {
        token: token,
      },
      transports: ['websocket'],
      reconnection: true,
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [token]);

  return socket;
};
