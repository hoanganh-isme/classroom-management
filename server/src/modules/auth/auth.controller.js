import {
    createEmailAccessCode,
    createPhoneAccessCode,
    validateEmailAccessCode,
    validatePhoneAccessCode,
} from "./auth.service.js";

const E164_PHONE_PATTERN = /^\+[1-9]\d{7,14}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function createAccessCode(request, response) {
    const { phoneNumber, email } = request.body || {};

    if (email) {
        if (typeof email !== "string" || !EMAIL_PATTERN.test(email.trim())) {
            return response.status(400).json({
                success: false,
                message: "Please enter a valid email address.",
            });
        }
        try {
            const result = await createEmailAccessCode(email.trim());
            return response.status(200).json({
                success: true,
                message: "Access code sent to your email.",
                data: result,
            });
        } catch (error) {
            console.error("Create email access code failed:", error);
            return response.status(error.statusCode || 500).json({
                success: false,
                message: error.statusCode ? error.message : "Unable to create access code.",
            });
        }
    }

    if (typeof phoneNumber !== "string" || !E164_PHONE_PATTERN.test(phoneNumber)) {
        return response.status(400).json({
            success: false,
            message: "phoneNumber must use international format, for example +84901234567.",
        });
    }

    try {
        const result = await createPhoneAccessCode(phoneNumber);
        return response.status(200).json({
            success: true,
            message: "Access code was created.",
            data: result,
        });
    } catch (error) {
        console.error("Create phone access code failed:", error);
        return response.status(error.statusCode || 500).json({
            success: false,
            message: error.statusCode ? error.message : "Unable to create access code.",
        });
    }
}

export async function validateAccessCode(request, response) {
    const { phoneNumber, email, accessCode } = request.body || {};

    if (typeof accessCode !== "string" || !/^\d{6}$/.test(accessCode.trim())) {
        return response.status(400).json({
            success: false,
            message: "accessCode must contain exactly 6 digits.",
        });
    }

    if (email) {
        if (typeof email !== "string" || !EMAIL_PATTERN.test(email.trim())) {
            return response.status(400).json({
                success: false,
                message: "Please enter a valid email address.",
            });
        }
        try {
            const result = await validateEmailAccessCode(email.trim(), accessCode.trim());
            return response.status(200).json({
                success: true,
                message: "Access code was validated.",
                data: result,
            });
        } catch (error) {
            console.error("Validate email access code failed:", error);
            return response.status(error.statusCode || 500).json({
                success: false,
                message: error.statusCode ? error.message : "Unable to validate access code.",
            });
        }
    }

    if (typeof phoneNumber !== "string" || !E164_PHONE_PATTERN.test(phoneNumber)) {
        return response.status(400).json({
            success: false,
            message: "phoneNumber must use international format.",
        });
    }

    try {
        const result = await validatePhoneAccessCode(phoneNumber, accessCode.trim());
        return response.status(200).json({
            success: true,
            message: "Access code was validated.",
            data: result,
        });
    } catch (error) {
        console.error("Validate phone access code failed:", error);
        return response.status(error.statusCode || 500).json({
            success: false,
            message: error.statusCode ? error.message : "Unable to validate access code.",
        });
    }
}