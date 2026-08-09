import {
    z,
} from "zod";

import {
    changeStudentPassword as changeStudentPasswordService,
    completeStudentLesson as completeStudentLessonService,
    getMyLessons as getMyLessonsService,
    getMyProfile as getMyProfileService,
    loginStudent as loginStudentService,
    setupStudentAccount as setupStudentAccountService,
    updateMyProfile as updateMyProfileService,
    verifyStudentSetupToken,
} from "./student.service.js";

const setupSchema =
    z.object({
        token:
            z.string()
                .min(32),

        username:
            z.string()
                .trim()
                .min(3)
                .max(30)
                .regex(
                    /^[a-zA-Z0-9._-]+$/,
                    "Username contains invalid characters.",
                ),

        password:
            z.string()
                .min(8)
                .max(72)
                .regex(
                    /[a-z]/,
                    "Password must contain a lowercase letter.",
                )
                .regex(
                    /[A-Z]/,
                    "Password must contain an uppercase letter.",
                )
                .regex(
                    /\d/,
                    "Password must contain a number.",
                ),
    });

export async function verifySetupToken(
    request,
    response,
) {
    const token =
        request.query.token;

    if (
        typeof token !== "string" ||
        token.length < 32
    ) {
        return response
            .status(400)
            .json({
                success: false,
                message:
                    "Invalid setup token.",
            });
    }

    try {
        const result =
            await verifyStudentSetupToken(
                token,
            );

        return response
            .status(200)
            .json({
                success: true,
                data: result,
            });
    } catch (error) {
        return response
            .status(
                error.statusCode ||
                500,
            )
            .json({
                success: false,
                message:
                    error.statusCode
                        ? error.message
                        : "Unable to verify setup link.",
            });
    }
}

export async function setupAccount(
    request,
    response,
) {
    const validation =
        setupSchema.safeParse(
            request.body,
        );

    if (!validation.success) {
        return response
            .status(400)
            .json({
                success: false,
                message:
                    "Account information is invalid.",
                errors:
                    validation
                        .error
                        .issues,
            });
    }

    try {
        await setupStudentAccountService({
            rawToken:
                validation.data.token,

            username:
                validation.data.username,

            password:
                validation.data.password,
        });

        return response
            .status(200)
            .json({
                success: true,
                message:
                    "Student account was set up successfully.",
            });
    } catch (error) {
        return response
            .status(
                error.statusCode ||
                500,
            )
            .json({
                success: false,
                message:
                    error.statusCode
                        ? error.message
                        : "Unable to set up account.",
            });
    }
}

export async function studentLogin(request, response) {
    const { username, password } = request.body || {};

    if (!username || !password) {
        return response.status(400).json({
            success: false,
            message: "Username and password are required.",
        });
    }

    try {
        const result = await loginStudentService({ username, password });
        return response.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        return response.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Login failed.",
        });
    }
}

export async function getProfile(request, response) {
    try {
        const profile = await getMyProfileService(request.user.id);
        return response.status(200).json({
            success: true,
            data: { profile },
        });
    } catch (error) {
        return response.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to fetch profile.",
        });
    }
}

export async function editProfile(request, response) {
    try {
        const profile = await updateMyProfileService({
            studentId: request.user.id,
            changes: request.body,
        });
        return response.status(200).json({
            success: true,
            message: "Profile was updated successfully.",
            data: { profile },
        });
    } catch (error) {
        return response.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to update profile.",
        });
    }
}

export async function getLessons(request, response) {
    try {
        const lessons = await getMyLessonsService(request.user.id);
        return response.status(200).json({
            success: true,
            data: { lessons },
        });
    } catch (error) {
        return response.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to fetch lessons.",
        });
    }
}

export async function markLessonDone(request, response) {
    const { lessonId } = request.params;
    try {
        const lesson = await completeStudentLessonService({
            studentId: request.user.id,
            lessonId,
        });
        return response.status(200).json({
            success: true,
            message: "Lesson marked as done.",
            data: { lesson },
        });
    } catch (error) {
        return response.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to mark lesson done.",
        });
    }
}

export async function changePassword(request, response) {
    const { currentPassword, newPassword } = request.body || {};
    if (!currentPassword || !newPassword) {
        return response.status(400).json({
            success: false,
            message: "Current password and new password are required.",
        });
    }

    if (newPassword.length < 8) {
        return response.status(400).json({
            success: false,
            message: "New password must be at least 8 characters.",
        });
    }

    try {
        await changeStudentPasswordService({
            studentId: request.user.id,
            currentPassword,
            newPassword,
        });

        return response.status(200).json({
            success: true,
            message: "Password was changed successfully.",
        });
    } catch (error) {
        return response.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to change password.",
        });
    }
}