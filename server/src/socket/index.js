import { verifyAuthToken } from "../services/token.service.js";
import { getAuthenticatedUser } from "../services/auth-user.service.js";
import { db } from "../config/firebase.js";

/**
 * Initialize Socket.io authentication and event handlers.
 * @param {import("socket.io").Server} io 
 */
export function initializeSocket(io) {
    // 1. Socket Authentication Middleware
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

            // Attach validated user to socket
            socket.user = user;
            return next();
        } catch (error) {
            return next(new Error(error.message || "Socket authentication failed."));
        }
    });

    // 2. Connection Handler
    io.on("connection", (socket) => {
        console.log(`Socket authenticated & connected: ${socket.id} (User: ${socket.user.id}, Role: ${socket.user.role})`);

        // 3. Resource Authorization: Join Conversation
        socket.on("joinConversation", async (conversationId) => {
            if (!conversationId || typeof conversationId !== "string") {
                return socket.emit("error", { message: "Invalid conversationId." });
            }

            try {
                const conversationRef = db.collection("conversations").doc(conversationId);
                const snapshot = await conversationRef.get();

                if (!snapshot.exists) {
                    return socket.emit("error", { message: "Conversation was not found." });
                }

                const conversation = snapshot.data();

                // Validate membership: instructor or student owner
                const isInstructor = socket.user.role === "instructor" && conversation.instructorId === socket.user.id;
                const isStudent = socket.user.role === "student" && conversation.studentId === socket.user.id;

                if (!isInstructor && !isStudent) {
                    return socket.emit("error", { message: "You are not a member of this conversation." });
                }

                socket.join(conversationId);
                socket.emit("joinedConversation", { conversationId });
            } catch (err) {
                console.error("Socket joinConversation error:", err);
                socket.emit("error", { message: "Unable to join conversation." });
            }
        });

        socket.on("disconnect", () => {
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });
}
