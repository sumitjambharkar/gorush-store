import { io, Socket } from "socket.io-client";
import { API_URL, getToken, onTokenChange } from "./client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(API_URL, {
      transports: ["websocket"],
      autoConnect: true,
      // Read on every (re)connect, so it always carries the current login.
      auth: (cb) => {
        getToken()
          .then((token) => cb(token ? { token } : {}))
          .catch(() => cb({}));
      },
    });
  }
  return socket;
}

// Logged in / out: reconnect so the server sees the new identity.
onTokenChange(() => {
  if (socket) socket.disconnect().connect();
});

export function joinRoom(room: string) {
  getSocket().emit("join", room);
}

export function leaveRoom(room: string) {
  getSocket().emit("leave", room);
}
