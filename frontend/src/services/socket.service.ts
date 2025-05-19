import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '../types';

let socket: Socket<ServerToClientEvents, ClientToServerEvents>;
const SOCKET_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

export const connectSocket = (nick: string) => {
  console.debug('Connecting to socket at', SOCKET_URL);
  socket = io(SOCKET_URL, { query: { nick } });
  return socket;
};

export const getSocket = () => {
  if (!socket) throw new Error('Socket not initialized');
  return socket;
};
