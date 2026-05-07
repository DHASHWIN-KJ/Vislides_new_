import { io, Socket } from 'socket.io-client';

const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'] // Add fallback polling in case websocket fails
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
