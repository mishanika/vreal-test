import { io, Socket } from "socket.io-client";

// In dev (vite, port 5173) connect directly to backend; in Docker vite preview proxies /socket.io
const SOCKET_URL = window.location.port === "5173" ? "http://localhost:6001" : window.location.origin;

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ["websocket"],
});

export function connectSocket(token: string): void {
  socket.auth = { token };
  if (!socket.connected) socket.connect();
}

export function disconnectSocket(): void {
  socket.disconnect();
}
