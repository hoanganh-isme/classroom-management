import {
    verifyAuthToken,
} from "../services/token.service.js";

export function authenticate(
    request,
    response,
    next,
) {
    const authorizationHeader =
        request.headers.authorization;

    if (
        typeof authorizationHeader !== "string" ||
        !authorizationHeader.startsWith("Bearer ")
    ) {
        return response.status(401).json({
            success: false,
            message:
                "Authorization Bearer token is required.",
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
        const decodedToken =
            verifyAuthToken(token);

        request.user = {
            id: decodedToken.sub,
            role: decodedToken.role,
        };

        return next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return response.status(401).json({
                success: false,
                message:
                    "Authentication token has expired.",
            });
        }

        return response.status(401).json({
            success: false,
            message:
                "Authentication token is invalid.",
        });
    }
}