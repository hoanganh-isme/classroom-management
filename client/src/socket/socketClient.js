import { io } from "socket.io-client";
import { getStoredToken } from "../utils/authUtils";

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:3000";

let socketInstance = null;

/**
 * Initializes or returns the authenticated Socket.io client connection.
 * Prevents duplicate connections across React re-renders.
 * @returns {import("socket.io-client").Socket|null}
 */
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

/**
 * Returns the current active Socket instance.
 * @returns {import("socket.io-client").Socket|null}
 */
export function getSocket() {
  return socketInstance;
}

/**
 * Disconnects and cleans up the active Socket connection.
 * Used on user logout.
 */
export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}
