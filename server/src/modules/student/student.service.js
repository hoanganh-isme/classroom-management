import bcrypt from "bcryptjs";

import {
    Timestamp,
} from "firebase-admin/firestore";

import {
    db,
} from "../../config/firebase.js";

import {
    createAuthToken,
} from "../../services/token.service.js";

import {
    getSetupTokenHash,
} from "../../services/student-invitation.service.js";
function createServiceError(
    message,
    statusCode,
) {
    const error =
        new Error(message);

    error.statusCode =
        statusCode;

    return error;
}
export async function verifyStudentSetupToken(
    rawToken,
) {
    const tokenHash =
        getSetupTokenHash(
            rawToken,
        );

    const tokenReference = db
        .collection(
            "studentSetupTokens",
        )
        .doc(tokenHash);

    const tokenSnapshot =
        await tokenReference.get();

    if (!tokenSnapshot.exists) {
        throw createServiceError(
            "This setup link is invalid or has already been used.",
            400,
        );
    }

    const setupToken =
        tokenSnapshot.data();

    if (
        !setupToken.expiresAt ||
        setupToken.expiresAt
            .toMillis() <
        Date.now()
    ) {
        await tokenReference.delete();

        throw createServiceError(
            "This setup link has expired.",
            400,
        );
    }

    const studentReference = db
        .collection("users")
        .doc(
            setupToken.studentId,
        );

    const studentSnapshot =
        await studentReference.get();

    if (!studentSnapshot.exists) {
        await tokenReference.delete();

        throw createServiceError(
            "Student account was not found.",
            404,
        );
    }

    const student =
        studentSnapshot.data();

    if (
        student.role !==
        "student"
    ) {
        throw createServiceError(
            "This setup link is invalid.",
            400,
        );
    }

    if (
        student.accountSetupComplete ===
        true
    ) {
        await tokenReference.delete();

        throw createServiceError(
            "This account has already been set up.",
            409,
        );
    }

    return {
        valid: true,

        student: {
            name:
                student.name,
            email:
                student.email,
        },
    };
}
export async function setupStudentAccount({
    rawToken,
    username,
    password,
}) {
    const tokenHash =
        getSetupTokenHash(
            rawToken,
        );

    const tokenReference = db
        .collection(
            "studentSetupTokens",
        )
        .doc(tokenHash);

    const tokenSnapshot =
        await tokenReference.get();

    if (!tokenSnapshot.exists) {
        throw createServiceError(
            "This setup link is invalid or has already been used.",
            400,
        );
    }

    const setupToken =
        tokenSnapshot.data();

    if (
        !setupToken.expiresAt ||
        setupToken.expiresAt
            .toMillis() <
        Date.now()
    ) {
        await tokenReference.delete();

        throw createServiceError(
            "This setup link has expired.",
            400,
        );
    }

    const studentReference = db
        .collection("users")
        .doc(
            setupToken.studentId,
        );

    const studentSnapshot =
        await studentReference.get();

    if (!studentSnapshot.exists) {
        throw createServiceError(
            "Student account was not found.",
            404,
        );
    }

    const student =
        studentSnapshot.data();

    if (
        student.role !== "student"
    ) {
        throw createServiceError(
            "Invalid student account.",
            400,
        );
    }

    if (
        student.accountSetupComplete
    ) {
        throw createServiceError(
            "This account has already been set up.",
            409,
        );
    }

    const normalizedUsername =
        username
            .trim()
            .toLowerCase();

    /*
     * Username phải unique.
     */
    const usernameSnapshot =
        await db
            .collection("users")
            .where(
                "usernameNormalized",
                "==",
                normalizedUsername,
            )
            .limit(1)
            .get();

    if (!usernameSnapshot.empty) {
        throw createServiceError(
            "This username is already in use.",
            409,
        );
    }

    /*
     * Không bao giờ lưu password plaintext.
     */
    const passwordHash =
        await bcrypt.hash(
            password,
            12,
        );

    await studentReference.update({
        username:
            username.trim(),

        usernameNormalized:
            normalizedUsername,

        passwordHash,

        accountSetupComplete:
            true,

        accountSetupAt:
            Timestamp.now(),

        updatedAt:
            Timestamp.now(),
    });

    /*
     * Token one-time:
     * setup xong là xóa.
     */
    await tokenReference.delete();

    return {
        success: true,
    };
}

export async function loginStudent({
    username,
    password,
}) {
    const normalizedUsername =
        username
            .trim()
            .toLowerCase();

    const userSnapshot = await db
        .collection("users")
        .where(
            "usernameNormalized",
            "==",
            normalizedUsername,
        )
        .limit(1)
        .get();

    /*
     * Không nói username tồn tại hay không.
     * Tránh user enumeration.
     */
    if (userSnapshot.empty) {
        throw createServiceError(
            "Invalid username or password.",
            401,
        );
    }

    const userDocument =
        userSnapshot.docs[0];

    const user =
        userDocument.data();

    if (
        user.role !== "student" ||
        !user.accountSetupComplete ||
        !user.passwordHash
    ) {
        throw createServiceError(
            "Invalid username or password.",
            401,
        );
    }

    if (user.status !== "active") {
        throw createServiceError(
            "This account is not active.",
            403,
        );
    }

    const passwordIsValid =
        await bcrypt.compare(
            password,
            user.passwordHash,
        );

    if (!passwordIsValid) {
        throw createServiceError(
            "Invalid username or password.",
            401,
        );
    }

    const authenticatedUser = {
        id:
            userDocument.id,

        name:
            user.name,

        phone:
            user.phone,

        email:
            user.email,

        username:
            user.username,

        role:
            user.role,
    };

    /*
     * Dùng lại JWT service hiện tại.
     */
    const token =
        createAuthToken(
            authenticatedUser,
        );

    return {
        token,

        expiresIn:
            process.env.JWT_EXPIRES_IN ||
            "1h",

        user:
            authenticatedUser,
    };
}

export async function getMyProfile(
    studentId,
) {
    const document = await db
        .collection("users")
        .doc(studentId)
        .get();

    if (!document.exists) {
        throw createServiceError(
            "Student was not found.",
            404,
        );
    }

    const user =
        document.data();

    return {
        id:
            document.id,

        name:
            user.name,

        username:
            user.username,

        phone:
            user.phone,

        email:
            user.email,

        address:
            user.address || "",

        role:
            user.role,

        status:
            user.status,
    };
}
export async function updateMyProfile({
    studentId,
    changes,
}) {
    const reference = db
        .collection("users")
        .doc(studentId);

    const snapshot =
        await reference.get();

    if (!snapshot.exists) {
        throw createServiceError(
            "Student was not found.",
            404,
        );
    }

    const updateData = {
        updatedAt:
            Timestamp.now(),
    };

    if (
        changes.name !== undefined
    ) {
        updateData.name =
            changes.name.trim();
    }

    if (
        changes.address !== undefined
    ) {
        updateData.address =
            changes.address.trim();
    }

    if (
        changes.phone !== undefined
    ) {
        const phone =
            changes.phone.trim();

        const duplicate =
            await db
                .collection("users")
                .where(
                    "phone",
                    "==",
                    phone,
                )
                .get();

        const conflict =
            duplicate.docs.some(
                (document) =>
                    document.id !==
                    studentId,
            );

        if (conflict) {
            throw createServiceError(
                "This phone number is already in use.",
                409,
            );
        }

        updateData.phone =
            phone;
    }

    if (
        changes.email !== undefined
    ) {
        const email =
            changes.email
                .trim()
                .toLowerCase();

        const duplicate =
            await db
                .collection("users")
                .where(
                    "email",
                    "==",
                    email,
                )
                .get();

        const conflict =
            duplicate.docs.some(
                (document) =>
                    document.id !==
                    studentId,
            );

        if (conflict) {
            throw createServiceError(
                "This email is already in use.",
                409,
            );
        }

        updateData.email =
            email;
    }

    /*
     * Không có:
     *
     * role
     * status
     * passwordHash
     * accountSetupComplete
     *
     * trong request được update.
     */

    await reference.update(
        updateData,
    );

    return getMyProfile(
        studentId,
    );
}

export async function getMyLessons(studentId) {
    const studentRef = db.collection("users").doc(studentId);
    const studentSnapshot = await studentRef.get();

    if (!studentSnapshot.exists) {
        throw createServiceError("Student was not found.", 404);
    }

    const lessonsSnapshot = await studentRef.collection("lessons").get();
    const lessons = lessonsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
            id: doc.id,
            title: data.title,
            description: data.description || "",
            status: data.status || "pending",
            assignedBy: data.assignedBy || null,
            assignedAt: data.assignedAt ? data.assignedAt.toDate().toISOString() : null,
            completedAt: data.completedAt ? data.completedAt.toDate().toISOString() : null,
        };
    });

    return lessons;
}

export async function completeStudentLesson({ studentId, lessonId }) {
    const lessonRef = db
        .collection("users")
        .doc(studentId)
        .collection("lessons")
        .doc(lessonId);

    const snapshot = await lessonRef.get();
    if (!snapshot.exists) {
        throw createServiceError("Lesson was not found.", 404);
    }

    const now = Timestamp.now();
    await lessonRef.update({
        status: "completed",
        completedAt: now,
    });

    const updated = await lessonRef.get();
    const data = updated.data();

    return {
        id: updated.id,
        title: data.title,
        description: data.description || "",
        status: data.status,
        assignedAt: data.assignedAt ? data.assignedAt.toDate().toISOString() : null,
        completedAt: data.completedAt ? data.completedAt.toDate().toISOString() : null,
    };
}
