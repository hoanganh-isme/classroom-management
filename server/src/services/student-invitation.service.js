import { createHash, randomBytes } from "node:crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { db } from "../config/firebase.js";
import { sendStudentSetupEmail } from "./email.service.js";

const DEFAULT_SETUP_TOKEN_TTL_SECONDS = 24 * 60 * 60; // 24 hours

function hashSetupToken(token) {
    return createHash("sha256")
        .update(token)
        .digest("hex");
}

export async function createStudentSetupInvitation({ studentId, name, email }) {
    // Generate 32 cryptographically secure random bytes
    const rawToken = randomBytes(32).toString("hex");

    // Hash the token before storing in database
    const tokenHash = hashSetupToken(rawToken);

    const configuredTtl = Number(process.env.STUDENT_SETUP_TOKEN_TTL_SECONDS);

    const ttlSeconds =
        Number.isInteger(configuredTtl) && configuredTtl > 0
            ? configuredTtl
            : DEFAULT_SETUP_TOKEN_TTL_SECONDS;

    const expiresAt = Timestamp.fromMillis(Date.now() + ttlSeconds * 1000);

    // Use token hash as document ID
    const tokenReference = db.collection("studentSetupTokens").doc(tokenHash);

    await tokenReference.set({
        studentId,
        email,
        createdAt: FieldValue.serverTimestamp(),
        expiresAt,
    });

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const setupUrl = new URL("/student/setup-account", clientUrl);

    // Send only raw token in setup link
    setupUrl.searchParams.set("token", rawToken);

    await sendStudentSetupEmail({
        name,
        email,
        setupUrl: setupUrl.toString(),
        expiresInHours: Math.floor(ttlSeconds / 3600),
    });

    return {
        expiresAt: expiresAt.toDate().toISOString(),
    };
}

export function getSetupTokenHash(rawToken) {
    return hashSetupToken(rawToken);
}