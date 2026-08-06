export function authorizeRoles(
    ...allowedRoles
) {
    return function authorize(
        request,
        response,
        next,
    ) {
        if (!request.user) {
            return response.status(401).json({
                success: false,
                message:
                    "Authentication is required.",
            });
        }

        if (
            !allowedRoles.includes(
                request.user.role,
            )
        ) {
            return response.status(403).json({
                success: false,
                message:
                    "You do not have permission.",
            });
        }

        return next();
    };
}