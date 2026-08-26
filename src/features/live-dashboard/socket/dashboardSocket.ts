import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getDashboardSocket = (): Socket => {
  if (!socket) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const socketUrl = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
      : 'http://localhost:5000';

    socket = io(socketUrl, {
      auth: { token },
      path: '/socket.io',
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });
  }

  return socket;
};

export const connectDashboardSocket = (): Socket => {
  const s = getDashboardSocket();
  if (!s.connected) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    s.auth = { token };
    s.connect();
  }
  return s;
};

export const disconnectDashboardSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
