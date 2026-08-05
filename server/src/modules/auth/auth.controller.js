import {
    createPhoneAccessCode,
    validatePhoneAccessCode,
} from "./auth.service.js";

const E164_PHONE_PATTERN = /^\+[1-9]\d{7,14}$/;

export async function createAccessCode(
    request,
    response,
) {
    const { phoneNumber } = request.body;

    if (
        typeof phoneNumber !== "string" ||
        !E164_PHONE_PATTERN.test(phoneNumber)
    ) {
        return response.status(400).json({
            success: false,
            message:
                "phoneNumber must use international format, for example +84901234567.",
        });
    }

    try {
        const result =
            await createPhoneAccessCode(phoneNumber);

        return response.status(200).json({
            success: true,
            message: "Access code was created.",
            data: result,
        });
    } catch (error) {
        console.error(
            "Create access code failed:",
            error,
        );

        return response
            .status(error.statusCode || 500)
            .json({
                success: false,
                message:
                    error.statusCode
                        ? error.message
                        : "Unable to create access code.",
            });
    }
}
export async function validateAccessCode(
    request,
    response,
) {
    const {
        phoneNumber,
        accessCode,
    } = request.body;

    if (
        typeof phoneNumber !== "string" ||
        !E164_PHONE_PATTERN.test(phoneNumber)
    ) {
        return response.status(400).json({
            success: false,
            message:
                "phoneNumber must use international format.",
        });
    }

    if (
        typeof accessCode !== "string" ||
        !/^\d{6}$/.test(accessCode)
    ) {
        return response.status(400).json({
            success: false,
            message:
                "accessCode must contain exactly 6 digits.",
        });
    }

    try {
        const result =
            await validatePhoneAccessCode(
                phoneNumber,
                accessCode,
            );

        return response.status(200).json({
            success: true,
            message: "Access code was validated.",
            data: result,
        });
    } catch (error) {
        console.error(
            "Validate access code failed:",
            error,
        );

        return response
            .status(error.statusCode || 500)
            .json({
                success: false,
                message:
                    error.statusCode
                        ? error.message
                        : "Unable to validate access code.",
            });
    }
}