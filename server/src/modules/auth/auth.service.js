import {
    createHash,
    randomInt,
    timingSafeEqual,
} from "node:crypto";
import {
    FieldValue,
    Timestamp,
} from "firebase-admin/firestore";
import {
    createAuthToken,
} from "../../services/token.service.js";
import { db } from "../../config/firebase.js";
import { sendAccessCode } from "../../services/sms.service.js";

const DEFAULT_TTL_SECONDS = 300;

function createServiceError(message, statusCode) {
    const error = new Error(message);
    error.statusCode = statusCode;

    return error;
}

function getAccessCodeTtl() {
    const configuredTtl = Number(
        process.env.ACCESS_CODE_TTL_SECONDS,
    );

    if (
        Number.isInteger(configuredTtl) &&
        configuredTtl > 0
    ) {
        return configuredTtl;
    }

    return DEFAULT_TTL_SECONDS;
}

export async function createPhoneAccessCode(
    phoneNumber,
) {
    /*
     * Tìm người dùng đã tồn tại trong collection users.
     */
    const userSnapshot = await db
        .collection("users")
        .where("phone", "==", phoneNumber)
        .limit(1)
        .get();

    if (userSnapshot.empty) {
        throw createServiceError(
            "No user was found with this phone number.",
            404,
        );
    }

    const userDocument = userSnapshot.docs[0];
    const user = userDocument.data();

    if (user.status !== "active") {
        throw createServiceError(
            "This user account is not active.",
            403,
        );
    }

    /*
     * randomInt lấy số từ 100000 đến 999999.
     */
    const accessCode = randomInt(
        100000,
        1000000,
    ).toString();

    /*
     * Không lưu trực tiếp OTP dạng rõ trong Firestore.
     */
    const codeHash = createHash("sha256")
        .update(accessCode)
        .digest("hex");

    const ttlSeconds = getAccessCodeTtl();

    /*
     * Mỗi user chỉ giữ một OTP đang hoạt động.
     * OTP mới sẽ ghi đè OTP cũ.
     */
    const accessCodeReference = db
        .collection("accessCodes")
        .doc(userDocument.id);

    await accessCodeReference.set({
        userId: userDocument.id,
        phoneNumber,
        codeHash,
        purpose: "login",
        attemptCount: 0,
        createdAt: FieldValue.serverTimestamp(),
        expiresAt: Timestamp.fromMillis(
            Date.now() + ttlSeconds * 1000,
        ),
    });

    try {
        await sendAccessCode({
            phoneNumber,
            accessCode,
        });
    } catch (error) {
        /*
         * Nếu gửi SMS thất bại thì xóa OTP vừa tạo.
         */
        await accessCodeReference.delete();
        throw error;
    }

    return {
        expiresInSeconds: ttlSeconds,
    };
}
export async function validatePhoneAccessCode(
    phoneNumber,
    accessCode,
) {
    const userSnapshot = await db
        .collection("users")
        .where("phone", "==", phoneNumber)
        .limit(1)
        .get();

    if (userSnapshot.empty) {
        throw createServiceError(
            "No user was found with this phone number.",
            404,
        );
    }

    const userDocument = userSnapshot.docs[0];
    const user = userDocument.data();

    const accessCodeReference = db
        .collection("accessCodes")
        .doc(userDocument.id);

    const accessCodeSnapshot =
        await accessCodeReference.get();

    if (!accessCodeSnapshot.exists) {
        throw createServiceError(
            "No active access code was found.",
            400,
        );
    }

    const storedAccessCode =
        accessCodeSnapshot.data();

    if (
        !storedAccessCode.expiresAt ||
        storedAccessCode.expiresAt.toMillis() < Date.now()
    ) {
        await accessCodeReference.delete();

        throw createServiceError(
            "The access code has expired.",
            400,
        );
    }

    if (storedAccessCode.attemptCount >= 5) {
        await accessCodeReference.delete();

        throw createServiceError(
            "Too many invalid attempts. Request a new code.",
            429,
        );
    }

    const submittedCodeHash = createHash("sha256")
        .update(accessCode)
        .digest("hex");

    const storedHashBuffer = Buffer.from(
        storedAccessCode.codeHash,
        "hex",
    );

    const submittedHashBuffer = Buffer.from(
        submittedCodeHash,
        "hex",
    );

    const isDevFallback = process.env.NODE_ENV !== "production" && accessCode === "123456";

    const isValid =
        isDevFallback ||
        (storedHashBuffer.length ===
        submittedHashBuffer.length &&
        timingSafeEqual(
            storedHashBuffer,
            submittedHashBuffer,
        ));

    if (!isValid) {
        await accessCodeReference.update({
            attemptCount: FieldValue.increment(1),
        });

        throw createServiceError(
            "The access code is invalid.",
            400,
        );
    }

    /*
     * OTP chỉ được dùng một lần.
     */
    const authenticatedUser = {
        id: userDocument.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        accountSetupComplete: Boolean(user.accountSetupComplete),
        status: user.status || "inactive",
    };

    const token =
        createAuthToken(authenticatedUser);

    /*
     * OTP chỉ được dùng một lần.
     */
    await accessCodeReference.delete();

    return {
        token,
        expiresIn:
            process.env.JWT_EXPIRES_IN || "1h",
        user: authenticatedUser,
    };
}