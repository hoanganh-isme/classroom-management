import jwt from "jsonwebtoken";

const TOKEN_ISSUER = "classroom-management-api";
const TOKEN_AUDIENCE = "classroom-management-client";

function getJwtSettings() {
    const secret = process.env.JWT_SECRET;
    const expiresIn =
        process.env.JWT_EXPIRES_IN || "1h";

    if (!secret) {
        throw new Error(
            "JWT_SECRET is not configured.",
        );
    }

    return {
        secret,
        expiresIn,
    };
}

export function createAuthToken(user) {
    const {
        secret,
        expiresIn,
    } = getJwtSettings();

    return jwt.sign(
        {
            role: user.role,
        },
        secret,
        {
            subject: user.id,
            expiresIn,
            issuer: TOKEN_ISSUER,
            audience: TOKEN_AUDIENCE,
            algorithm: "HS256",
        },
    );
}

export function verifyAuthToken(token) {
    const { secret } = getJwtSettings();

    return jwt.verify(
        token,
        secret,
        {
            issuer: TOKEN_ISSUER,
            audience: TOKEN_AUDIENCE,
            algorithms: ["HS256"],
        },
    );
}