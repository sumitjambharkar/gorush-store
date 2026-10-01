import { io, Socket } from "socket.io-client";
import { API_URL } from "./client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(API_URL, { transports: ["websocket"], autoConnect: true });
  }
  return socket;
}

export function joinRoom(room: string) {
  getSocket().emit("join", room);
}

export function leaveRoom(room: string) {
  getSocket().emit("leave", room);
}
