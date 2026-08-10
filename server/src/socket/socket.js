import { verifyAuthToken } from "../services/token.service.js";
import { getAuthenticatedUser } from "../services/auth-user.service.js";
import { registerChatHandlers } from "../modules/chat/chat.socket.js";

// Initializes Socket.io authentication middleware and connection handlers
export function initializeSocket(io) {
    // 1. Socket Authentication Middleware (runs BEFORE connection)
    io.use(async (socket, next) => {
        try {
            const authHeader = socket.handshake.headers?.authorization;
            const tokenFromHeader =
                typeof authHeader === "string" && authHeader.startsWith("Bearer ")
                    ? authHeader.slice(7).trim()
                    : null;

            const token = socket.handshake.auth?.token || tokenFromHeader;

            if (!token) {
                return next(new Error("Authentication token is required for socket connection."));
            }

            const decodedToken = verifyAuthToken(token);
            const user = await getAuthenticatedUser(decodedToken);

            // Attach validated server-authenticated user to socket
            socket.user = user;
            return next();
        } catch (error) {
            return next(new Error(error.message || "Socket authentication failed."));
        }
    });

    // 2. Connection Handler
    io.on("connection", (socket) => {
        console.log(`[SOCKET CONNECTED] Socket ID: ${socket.id} | User: ${socket.user.name} (${socket.user.id}, Role: ${socket.user.role})`);

        // Register module socket handlers
        registerChatHandlers(io, socket);

        socket.on("disconnect", () => {
            console.log(`[SOCKET DISCONNECTED] Socket ID: ${socket.id} | User: ${socket.user.id}`);
        });
    });
}
