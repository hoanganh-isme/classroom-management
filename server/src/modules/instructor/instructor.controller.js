import { z } from "zod";

import {
    addStudent as addStudentService,
    assignLesson as assignLessonService,
    deleteStudent as deleteStudentService,
    editStudent as editStudentService,
    getStudentProfile,
    listAllLessons,
    listStudents,
} from "./instructor.service.js";

const phoneSchema = z
    .string()
    .trim()
    .regex(
        /^\+\d{8,15}$/,
        "Phone must use international format, for example +84901234567.",
    );

const addStudentSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Name must contain at least 2 characters.")
        .max(100, "Name must not exceed 100 characters."),

    phone: phoneSchema,

    email: z
        .string()
        .trim()
        .email("Email address is invalid."),

    address: z
        .string()
        .trim()
        .max(250, "Address must not exceed 250 characters.")
        .optional()
        .default(""),
});

const editStudentSchema = z
    .object({
        name: z
            .string()
            .trim()
            .min(2)
            .max(100)
            .optional(),

        phone: phoneSchema.optional(),

        email: z
            .string()
            .trim()
            .email("Email address is invalid.")
            .optional(),

        address: z
            .string()
            .trim()
            .max(250)
            .optional(),

        status: z
            .enum(["active", "inactive"])
            .optional(),
    })
    .refine(
        (data) =>
            Object.values(data).some(
                (value) => value !== undefined,
            ),
        {
            message:
                "At least one field must be provided.",
        },
    );

const assignLessonSchema = z
    .object({
        title: z
            .string()
            .trim()
            .min(2, "Title must contain at least 2 characters.")
            .max(200, "Title must not exceed 200 characters."),

        description: z
            .string()
            .trim()
            .max(1000, "Description must not exceed 1000 characters.")
            .optional()
            .default(""),

        studentPhone: phoneSchema.optional(),
        studentPhones: z.array(phoneSchema).optional(),
    })
    .refine(
        (data) =>
            Boolean(data.studentPhone) ||
            (Array.isArray(data.studentPhones) && data.studentPhones.length > 0),
        {
            message: "At least one student phone must be provided.",
            path: ["studentPhone"],
        }
    );

function formatValidationErrors(error) {
    return error.issues.map((issue) => ({
        field:
            issue.path.join(".") ||
            "request",
        message: issue.message,
    }));
}

function handleError(
    response,
    error,
    actionName,
) {
    console.error(
        `${actionName} failed:`,
        error,
    );

    const statusCode =
        error.statusCode || 500;

    return response
        .status(statusCode)
        .json({
            success: false,
            message:
                statusCode === 500
                    ? "An unexpected server error occurred."
                    : error.message,
        });
}

export async function addStudent(
    request,
    response,
) {
    const validation =
        addStudentSchema.safeParse(
            request.body,
        );

    if (!validation.success) {
        return response.status(400).json({
            success: false,
            message:
                "Student information is invalid.",
            errors:
                formatValidationErrors(
                    validation.error,
                ),
        });
    }

    try {
        const student =
            await addStudentService({
                name: validation.data.name,
                phone: validation.data.phone,
                email: validation.data.email,
                address: validation.data.address,
                instructorId: request.user.id,
            });

        return response.status(201).json({
            success: true,
            message:
                "Student was added successfully.",
            data: {
                student,
            },
        });
    } catch (error) {
        return handleError(
            response,
            error,
            "Add student",
        );
    }
}

export async function getStudents(
    request,
    response,
) {
    try {
        const result =
            await listStudents();

        return response.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        return handleError(
            response,
            error,
            "Get students",
        );
    }
}

export async function getStudent(
    request,
    response,
) {
    const validation =
        phoneSchema.safeParse(
            request.params.phone,
        );

    if (!validation.success) {
        return response.status(400).json({
            success: false,
            message:
                validation.error
                    .issues[0]
                    .message,
        });
    }

    try {
        const result =
            await getStudentProfile(
                validation.data,
            );

        return response.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        return handleError(
            response,
            error,
            "Get student",
        );
    }
}

export async function editStudent(
    request,
    response,
) {
    const phoneValidation =
        phoneSchema.safeParse(
            request.params.phone,
        );

    if (!phoneValidation.success) {
        return response.status(400).json({
            success: false,
            message:
                phoneValidation.error
                    .issues[0]
                    .message,
        });
    }

    const bodyValidation =
        editStudentSchema.safeParse(
            request.body,
        );

    if (!bodyValidation.success) {
        return response.status(400).json({
            success: false,
            message:
                "Student information is invalid.",
            errors:
                formatValidationErrors(
                    bodyValidation.error,
                ),
        });
    }

    try {
        const student =
            await editStudentService({
                currentPhone:
                    phoneValidation.data,
                changes:
                    bodyValidation.data,
            });

        return response.status(200).json({
            success: true,
            message:
                "Student was updated successfully.",
            data: {
                student,
            },
        });
    } catch (error) {
        return handleError(
            response,
            error,
            "Edit student",
        );
    }
}

export async function deleteStudent(
    request,
    response,
) {
    const validation =
        phoneSchema.safeParse(
            request.params.phone,
        );

    if (!validation.success) {
        return response.status(400).json({
            success: false,
            message:
                validation.error
                    .issues[0]
                    .message,
        });
    }

    try {
        const student =
            await deleteStudentService(
                validation.data,
            );

        return response.status(200).json({
            success: true,
            message:
                "Student was deleted successfully.",
            data: {
                student,
            },
        });
    } catch (error) {
        return handleError(
            response,
            error,
            "Delete student",
        );
    }
}

export async function assignLesson(
    request,
    response,
) {
    const validation =
        assignLessonSchema.safeParse(
            request.body,
        );

    if (!validation.success) {
        return response.status(400).json({
            success: false,
            message:
                "Lesson information is invalid.",
            errors:
                formatValidationErrors(
                    validation.error,
                ),
        });
    }

    try {
        const studentPhones = validation.data.studentPhones || [validation.data.studentPhone];
        const result =
            await assignLessonService({
                title: validation.data.title,
                description: validation.data.description,
                studentPhones,
                instructorId: request.user.id,
            });

        return response.status(201).json({
            success: true,
            message:
                "Lesson was assigned successfully.",
            data: result,
        });
    } catch (error) {
        return handleError(
            response,
            error,
            "Assign lesson",
        );
    }
}

export async function getLessons(
    request,
    response,
) {
    try {
        const lessons = await listAllLessons();

        return response.status(200).json({
            success: true,
            data: {
                total: lessons.length,
                lessons,
            },
        });
    } catch (error) {
        return handleError(
            response,
            error,
            "List all lessons",
        );
    }
}