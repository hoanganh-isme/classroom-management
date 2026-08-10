import { io } from "socket.io-client";
import { getStoredToken } from "../utils/authUtils";

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:3000";

let socketInstance = null;

// Connects or retrieves the authenticated Socket.io client instance
export function connectSocket() {
  const token = getStoredToken();
  if (!token) {
    if (socketInstance) {
      socketInstance.disconnect();
      socketInstance = null;
    }
    return null;
  }

  if (socketInstance) {
    if (!socketInstance.connected) {
      socketInstance.auth = { token };
      socketInstance.connect();
    }
    return socketInstance;
  }

  socketInstance = io(SOCKET_URL, {
    auth: {
      token,
    },
    transports: ["websocket", "polling"],
    autoConnect: true,
  });

  socketInstance.on("connect", () => {
    console.log("[SOCKET CLIENT] Connected successfully with ID:", socketInstance.id);
  });

  socketInstance.on("connect_error", (err) => {
    console.error("[SOCKET CLIENT] Connection error:", err.message);
  });

  socketInstance.on("disconnect", (reason) => {
    console.log("[SOCKET CLIENT] Disconnected:", reason);
  });

  return socketInstance;
}

// Returns current active Socket instance
export function getSocket() {
  return socketInstance;
}

// Disconnects active Socket connection on logout
export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}
