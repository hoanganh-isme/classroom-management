import { db, firebaseAdminAuth } from "../../config/firebase.js";
import { createAuthToken } from "../../services/token.service.js";

function createServiceError(message, statusCode) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

// Verifies Firebase Phone ID Token and issues application JWT
export async function authenticateFirebasePhone(idToken) {
    if (!idToken || typeof idToken !== "string" || !idToken.trim()) {
        throw createServiceError("idToken is required and must be a valid string.", 400);
    }

    let decodedToken;
    try {
        decodedToken = await firebaseAdminAuth.verifyIdToken(idToken.trim());
    } catch (error) {
        console.error("Firebase ID Token verification failed:", error.message);
        throw createServiceError("Invalid or expired Firebase authentication token.", 401);
    }

    const phoneNumber = decodedToken.phone_number;
    if (!phoneNumber) {
        throw createServiceError("Firebase ID token does not contain a verified phone number.", 400);
    }

    const signInProvider = decodedToken.firebase?.sign_in_provider;
    if (signInProvider && signInProvider !== "phone") {
        throw createServiceError("Authentication token must be issued by the phone provider.", 400);
    }

    // Look up registered user document in Firestore by verified phone number
    const userSnapshot = await db
        .collection("users")
        .where("phone", "==", phoneNumber)
        .limit(1)
        .get();

    if (userSnapshot.empty) {
        throw createServiceError("This phone number is not registered.", 404);
    }

    const userDocument = userSnapshot.docs[0];
    const user = userDocument.data();

    if (user.status !== "active") {
        throw createServiceError("This user account is not active.", 403);
    }

    if (user.role !== "student" && user.role !== "instructor") {
        throw createServiceError("Invalid user account role.", 403);
    }

    const authenticatedUser = {
        id: userDocument.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        accountSetupComplete: Boolean(user.accountSetupComplete),
        status: user.status || "inactive",
    };

    const token = createAuthToken(authenticatedUser);

    return {
        token,
        expiresIn: process.env.JWT_EXPIRES_IN || "1h",
        user: authenticatedUser,
    };
}
