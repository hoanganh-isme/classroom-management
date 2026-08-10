import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { db } from "../../config/firebase.js";

function createChatError(message, statusCode = 400) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

// Asserts that the current user is a member of the conversation
export function assertConversationMember({ currentUser, conversation }) {
    if (!currentUser || !conversation) {
        throw createChatError("Invalid conversation access parameters.", 400);
    }

    const isInstructorMember =
        currentUser.role === "instructor" && conversation.instructorId === currentUser.id;

    const isStudentMember =
        currentUser.role === "student" && conversation.studentId === currentUser.id;

    if (!isInstructorMember && !isStudentMember) {
        throw createChatError("Access denied. You are not a member of this conversation.", 403);
    }
}

// Gets or creates a deterministic conversation for an instructor/student pair
export async function getOrCreateConversation({ currentUser, studentId }) {
    let finalInstructorId = "";
    let finalStudentId = "";

    if (currentUser.role === "instructor") {
        if (!studentId || typeof studentId !== "string") {
            throw createChatError("studentId is required for instructor to start chat.", 400);
        }

        const studentDoc = await db.collection("users").doc(studentId).get();
        if (!studentDoc.exists) {
            throw createChatError("Student account was not found.", 404);
        }

        const studentData = studentDoc.data();
        if (studentData.role !== "student") {
            throw createChatError("Target user is not a student.", 400);
        }

        if (studentData.status !== "active") {
            throw createChatError("Target student account is not active.", 403);
        }

        if (studentData.createdBy && studentData.createdBy !== currentUser.id) {
            throw createChatError("You can only chat with students assigned to you.", 403);
        }

        finalInstructorId = currentUser.id;
        finalStudentId = studentDoc.id;
    } else if (currentUser.role === "student") {
        finalStudentId = currentUser.id;

        const ownUserDoc = await db.collection("users").doc(currentUser.id).get();
        if (!ownUserDoc.exists) {
            throw createChatError("Student account was not found.", 404);
        }

        const ownData = ownUserDoc.data();
        const instructorId = ownData.createdBy;

        if (!instructorId || typeof instructorId !== "string") {
            throw createChatError("No assigned instructor found for this student.", 400);
        }

        const instructorDoc = await db.collection("users").doc(instructorId).get();
        if (!instructorDoc.exists) {
            throw createChatError("Assigned instructor account was not found.", 404);
        }

        const instructorData = instructorDoc.data();
        if (instructorData.role !== "instructor") {
            throw createChatError("Assigned user is not an instructor.", 400);
        }

        if (instructorData.status !== "active") {
            throw createChatError("Assigned instructor account is not active.", 403);
        }

        finalInstructorId = instructorDoc.id;
    } else {
        throw createChatError("Invalid user role for chat.", 403);
    }

    const conversationId = `${finalInstructorId}_${finalStudentId}`;
    const conversationRef = db.collection("conversations").doc(conversationId);
    const snapshot = await conversationRef.get();

    if (!snapshot.exists) {
        const now = FieldValue.serverTimestamp();
        const newConversationData = {
            instructorId: finalInstructorId,
            studentId: finalStudentId,
            createdAt: now,
            updatedAt: now,
            lastMessage: "",
            lastMessageAt: null,
            unreadCountInstructor: 0,
            unreadCountStudent: 0,
        };

        await conversationRef.set(newConversationData);
        return {
            id: conversationId,
            instructorId: finalInstructorId,
            studentId: finalStudentId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastMessage: "",
            lastMessageAt: null,
            unreadCount: 0,
        };
    }

    const data = snapshot.data();
    const unreadCount =
        currentUser.role === "instructor"
            ? data.unreadCountInstructor || 0
            : data.unreadCountStudent || 0;

    return {
        id: snapshot.id,
        instructorId: data.instructorId,
        studentId: data.studentId,
        createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
        updatedAt: data.updatedAt ? data.updatedAt.toDate().toISOString() : null,
        lastMessage: data.lastMessage || "",
        lastMessageAt: data.lastMessageAt ? data.lastMessageAt.toDate().toISOString() : null,
        unreadCount,
    };
}

// Lists all conversations for the current authenticated user including unread counts
export async function listConversations(currentUser) {
    if (!currentUser || !currentUser.id) {
        throw createChatError("User authentication is required.", 401);
    }

    const fieldToQuery = currentUser.role === "instructor" ? "instructorId" : "studentId";
    const snapshot = await db
        .collection("conversations")
        .where(fieldToQuery, "==", currentUser.id)
        .get();

    const conversations = [];

    for (const doc of snapshot.docs) {
        const data = doc.data();
        const otherUserId = currentUser.role === "instructor" ? data.studentId : data.instructorId;

        let otherUserObj = { id: otherUserId, name: "User", role: "" };
        if (otherUserId) {
            const otherUserDoc = await db.collection("users").doc(otherUserId).get();
            if (otherUserDoc.exists) {
                const uData = otherUserDoc.data();
                otherUserObj = {
                    id: otherUserDoc.id,
                    name: uData.name || "User",
                    role: uData.role || "",
                };
            }
        }

        const unreadCount =
            currentUser.role === "instructor"
                ? data.unreadCountInstructor || 0
                : data.unreadCountStudent || 0;

        conversations.push({
            id: doc.id,
            instructorId: data.instructorId,
            studentId: data.studentId,
            otherUser: otherUserObj,
            lastMessage: data.lastMessage || "",
            lastMessageAt: data.lastMessageAt ? data.lastMessageAt.toDate().toISOString() : null,
            updatedAt: data.updatedAt ? data.updatedAt.toDate().toISOString() : null,
            unreadCount,
        });
    }

    conversations.sort((a, b) => {
        const timeA = new Date(a.lastMessageAt || a.updatedAt || 0).getTime();
        const timeB = new Date(b.lastMessageAt || b.updatedAt || 0).getTime();
        return timeB - timeA;
    });

    return conversations;
}

// Retrieves message history for a conversation including read status
export async function getConversationHistory({ currentUser, conversationId }) {
    if (!conversationId || typeof conversationId !== "string") {
        throw createChatError("conversationId is required.", 400);
    }

    const conversationRef = db.collection("conversations").doc(conversationId);
    const snapshot = await conversationRef.get();

    if (!snapshot.exists) {
        throw createChatError("Conversation was not found.", 404);
    }

    const conversation = snapshot.data();
    assertConversationMember({ currentUser, conversation });

    const messagesSnapshot = await conversationRef
        .collection("messages")
        .orderBy("createdAt", "asc")
        .limit(100)
        .get();

    const messages = messagesSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
            id: doc.id,
            conversationId,
            senderId: data.senderId,
            senderRole: data.senderRole,
            text: data.text,
            isRead: Boolean(data.isRead),
            readAt: data.readAt ? data.readAt.toDate().toISOString() : null,
            createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
        };
    });

    return messages;
}

// Saves a new message to a conversation and increments recipient unread count
export async function saveMessage({ currentUser, conversationId, text }) {
    if (!conversationId || typeof conversationId !== "string") {
        throw createChatError("conversationId is required.", 400);
    }

    const trimmedText = typeof text === "string" ? text.trim() : "";
    if (!trimmedText) {
        throw createChatError("Message text cannot be empty.", 400);
    }

    if (trimmedText.length > 2000) {
        throw createChatError("Message text exceeds maximum length of 2000 characters.", 400);
    }

    const conversationRef = db.collection("conversations").doc(conversationId);
    const snapshot = await conversationRef.get();

    if (!snapshot.exists) {
        throw createChatError("Conversation was not found.", 404);
    }

    const conversation = snapshot.data();
    assertConversationMember({ currentUser, conversation });

    const now = FieldValue.serverTimestamp();
    const messageData = {
        senderId: currentUser.id,
        senderRole: currentUser.role,
        text: trimmedText,
        isRead: false,
        readAt: null,
        createdAt: now,
    };

    const messageRef = await conversationRef.collection("messages").add(messageData);

    const recipientUnreadField =
        currentUser.role === "instructor" ? "unreadCountStudent" : "unreadCountInstructor";

    await conversationRef.update({
        lastMessage: trimmedText,
        lastMessageAt: now,
        updatedAt: now,
        [recipientUnreadField]: FieldValue.increment(1),
    });

    return {
        id: messageRef.id,
        conversationId,
        senderId: currentUser.id,
        senderRole: currentUser.role,
        text: trimmedText,
        isRead: false,
        readAt: null,
        createdAt: new Date().toISOString(),
    };
}

// Marks a conversation as read for the current user and sets messages as read
export async function markConversationAsRead({ currentUser, conversationId }) {
    if (!conversationId || typeof conversationId !== "string") {
        throw createChatError("conversationId is required.", 400);
    }

    const conversationRef = db.collection("conversations").doc(conversationId);
    const snapshot = await conversationRef.get();

    if (!snapshot.exists) {
        throw createChatError("Conversation was not found.", 404);
    }

    const conversation = snapshot.data();
    assertConversationMember({ currentUser, conversation });

    const myUnreadField =
        currentUser.role === "instructor" ? "unreadCountInstructor" : "unreadCountStudent";

    await conversationRef.update({
        [myUnreadField]: 0,
    });

    // Mark unread messages sent by the other party as read
    const unreadMessagesSnapshot = await conversationRef
        .collection("messages")
        .where("isRead", "==", false)
        .get();

    const now = Timestamp.now();
    const batch = db.batch();

    let updatedCount = 0;
    unreadMessagesSnapshot.docs.forEach((doc) => {
        const msg = doc.data();
        if (msg.senderId !== currentUser.id) {
            batch.update(doc.ref, {
                isRead: true,
                readAt: now,
            });
            updatedCount++;
        }
    });

    if (updatedCount > 0) {
        await batch.commit();
    }

    return {
        conversationId,
        updatedCount,
        readAt: now.toDate().toISOString(),
    };
}
