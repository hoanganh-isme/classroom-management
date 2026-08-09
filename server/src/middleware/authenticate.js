import { verifyAuthToken } from "../services/token.service.js";
import { getAuthenticatedUser } from "../services/auth-user.service.js";

export async function authenticate(request, response, next) {
    const authorizationHeader = request.headers.authorization;

    if (
        typeof authorizationHeader !== "string" ||
        !authorizationHeader.startsWith("Bearer ")
    ) {
        return response.status(401).json({
            success: false,
            message: "Authorization Bearer token is required.",
        });
    }

    const token = authorizationHeader
        .slice("Bearer ".length)
        .trim();

    if (!token) {
        return response.status(401).json({
            success: false,
            message: "Authentication token is empty.",
        });
    }

    try {
        const decodedToken = verifyAuthToken(token);
        const user = await getAuthenticatedUser(decodedToken);

        request.user = user;
        return next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return response.status(401).json({
                success: false,
                message: "Authentication token has expired.",
            });
        }

        if (
            error.name === "JsonWebTokenError" ||
            error.name === "NotBeforeError"
        ) {
            return response.status(401).json({
                success: false,
                message: "Authentication token is invalid.",
            });
        }

        const statusCode = error.statusCode || 401;

        return response.status(statusCode).json({
            success: false,
            message: error.message || "Authentication failed.",
        });
    }
}