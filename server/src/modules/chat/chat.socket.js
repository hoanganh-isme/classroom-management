import {
    getConversationHistory,
    getOrCreateConversation,
    listConversations,
    markConversationAsRead,
    saveMessage,
} from "./chat.service.js";

// Registers real-time Socket.io chat event handlers with read/unread status
export function registerChatHandlers(io, socket) {
    // 1. chat:list
    socket.on("chat:list", async (callback) => {
        try {
            const conversations = await listConversations(socket.user);
            if (typeof callback === "function") {
                callback({
                    success: true,
                    data: { conversations },
                });
            }
        } catch (error) {
            console.error("Socket chat:list error:", error.message);
            if (typeof callback === "function") {
                callback({
                    success: false,
                    message: error.message || "Failed to list conversations.",
                });
            }
        }
    });

    // 2. chat:start
    socket.on("chat:start", async (payload, callback) => {
        const studentId = payload?.studentId;
        try {
            const conversation = await getOrCreateConversation({
                currentUser: socket.user,
                studentId,
            });

            if (typeof callback === "function") {
                callback({
                    success: true,
                    data: { conversation },
                });
            }
        } catch (error) {
            console.error("Socket chat:start error:", error.message);
            if (typeof callback === "function") {
                callback({
                    success: false,
                    message: error.message || "Failed to start conversation.",
                });
            }
        }
    });

    // 3. chat:join
    socket.on("chat:join", async (payload, callback) => {
        const conversationId = payload?.conversationId;
        try {
            const messages = await getConversationHistory({
                currentUser: socket.user,
                conversationId,
            });

            socket.join(`conversation:${conversationId}`);

            // Automatically mark conversation as read upon joining
            const readResult = await markConversationAsRead({
                currentUser: socket.user,
                conversationId,
            });

            // Broadcast read status to the room so the other user sees "Read / Seen"
            io.to(`conversation:${conversationId}`).emit("chat:read_status", {
                conversationId,
                readerId: socket.user.id,
                readAt: readResult.readAt,
            });

            if (typeof callback === "function") {
                callback({
                    success: true,
                    data: { conversationId, messages },
                });
            }
        } catch (error) {
            console.error("Socket chat:join error:", error.message);
            if (typeof callback === "function") {
                callback({
                    success: false,
                    message: error.message || "Failed to join conversation.",
                });
            }
        }
    });

    // 4. chat:send
    socket.on("chat:send", async (payload, callback) => {
        const { conversationId, text } = payload || {};
        try {
            const savedMessage = await saveMessage({
                currentUser: socket.user,
                conversationId,
                text,
            });

            // Broadcast saved message to room members
            io.to(`conversation:${conversationId}`).emit("chat:message", savedMessage);

            if (typeof callback === "function") {
                callback({
                    success: true,
                    data: { message: savedMessage },
                });
            }
        } catch (error) {
            console.error("Socket chat:send error:", error.message);
            if (typeof callback === "function") {
                callback({
                    success: false,
                    message: error.message || "Failed to send message.",
                });
            }
        }
    });

    // 5. chat:read
    socket.on("chat:read", async (payload, callback) => {
        const conversationId = payload?.conversationId;
        try {
            const result = await markConversationAsRead({
                currentUser: socket.user,
                conversationId,
            });

            io.to(`conversation:${conversationId}`).emit("chat:read_status", {
                conversationId,
                readerId: socket.user.id,
                readAt: result.readAt,
            });

            if (typeof callback === "function") {
                callback({
                    success: true,
                    data: result,
                });
            }
        } catch (error) {
            console.error("Socket chat:read error:", error.message);
            if (typeof callback === "function") {
                callback({
                    success: false,
                    message: error.message || "Failed to mark as read.",
                });
            }
        }
    });
}
