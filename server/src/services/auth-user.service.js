import { db } from "../config/firebase.js";

function createAuthError(message, statusCode) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

/**
 * Shared service for retrieving and validating an authenticated user.
 * Used by both HTTP authenticate middleware and Socket.io authentication.
 *
 * @param {Object} decodedToken - Payload from verified JWT token ({ sub, role })
 * @returns {Promise<Object>} Sanitized user object: { id, role, name, phone, email }
 */
export async function getAuthenticatedUser(decodedToken) {
    const { sub, role } = decodedToken || {};

    if (!sub || typeof sub !== "string") {
        throw createAuthError("Invalid token subject.", 401);
    }

    if (role !== "student" && role !== "instructor") {
        throw createAuthError("Invalid token role.", 401);
    }

    const userDocumentRef = db.collection("users").doc(sub);
    const userSnapshot = await userDocumentRef.get();

    if (!userSnapshot.exists) {
        throw createAuthError("User account was not found.", 401);
    }

    const user = userSnapshot.data();

    if (user.status !== "active") {
        throw createAuthError("User account is inactive.", 403);
    }

    if (user.role !== role) {
        throw createAuthError("Token role does not match user account role.", 401);
    }

    return {
        id: userSnapshot.id,
        role: user.role,
        name: user.name || "",
        phone: user.phone || "",
        email: user.email || "",
    };
}
