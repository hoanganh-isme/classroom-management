import {
    createHash,
    randomBytes,
} from "node:crypto";

import {
    FieldValue,
    Timestamp,
} from "firebase-admin/firestore";

import {
    db,
} from "../config/firebase.js";

import {
    sendStudentSetupEmail,
} from "./email.service.js";

const DEFAULT_SETUP_TOKEN_TTL_SECONDS =
    24 * 60 * 60; // 24 giờ

function hashSetupToken(token) {
    return createHash("sha256")
        .update(token)
        .digest("hex");
}

export async function createStudentSetupInvitation({
    studentId,
    name,
    email,
}) {
    /*
     * Sinh 32 bytes random.
     *
     * 32 bytes = 256 bit entropy.
     */
    const rawToken =
        randomBytes(32).toString("hex");

    /*
     * Không lưu token gốc xuống database.
     */
    const tokenHash =
        hashSetupToken(rawToken);

    const configuredTtl = Number(
        process.env.STUDENT_SETUP_TOKEN_TTL_SECONDS,
    );

    const ttlSeconds =
        Number.isInteger(configuredTtl) &&
            configuredTtl > 0
            ? configuredTtl
            : DEFAULT_SETUP_TOKEN_TTL_SECONDS;

    const expiresAt =
        Timestamp.fromMillis(
            Date.now() +
            ttlSeconds * 1000,
        );

    /*
     * Hash được dùng luôn làm document ID.
     */
    const tokenReference = db
        .collection("studentSetupTokens")
        .doc(tokenHash);

    await tokenReference.set({
        studentId,
        email,

        createdAt:
            FieldValue.serverTimestamp(),

        expiresAt,
    });

    const clientUrl =
        process.env.CLIENT_URL ||
        "http://localhost:5173";

    const setupUrl =
        new URL(
            "/student/setup-account",
            clientUrl,
        );

    /*
     * Chỉ token RAW được gửi tới email.
     */
    setupUrl.searchParams.set(
        "token",
        rawToken,
    );

    await sendStudentSetupEmail({
        name,
        email,
        setupUrl:
            setupUrl.toString(),
        expiresInHours:
            Math.floor(
                ttlSeconds / 3600,
            ),
    });

    return {
        expiresAt:
            expiresAt
                .toDate()
                .toISOString(),
    };
}

export function getSetupTokenHash(
    rawToken,
) {
    return hashSetupToken(rawToken);
}