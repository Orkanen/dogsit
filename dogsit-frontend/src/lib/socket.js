import { io } from 'socket.io-client';

let socket = null;

export const getSocket = () => {
  if (!socket) {
    const token = localStorage.getItem('token');
    socket = io(import.meta.env.VITE_API_BASE, {
      auth: { token },
      transports: ['websocket']
    });

    socket.on('connect', () => {
      console.log('Connected to WebSocket');
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};