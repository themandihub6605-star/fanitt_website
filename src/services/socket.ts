import { io, type Socket } from 'socket.io-client';
import { store } from '@/store';

const SOCKET_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

let socket: Socket | null = null;

/** Returns the current authenticated socket, creating/connecting it if
 * needed. Uses the same access token as REST requests — call this after
 * login (or on the Messages page mount) rather than at module load, since
 * the token isn't guaranteed to exist yet at import time. */
export function getSocket(): Socket | null {
  const token = store.getState().auth.accessToken;
  if (!token) return null;

  if (socket && socket.connected) return socket;

  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });
  } else {
    socket.auth = { token };
  }

  if (!socket.connected) socket.connect();
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}