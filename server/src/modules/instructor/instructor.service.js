import {
    Timestamp,
} from "firebase-admin/firestore";

import {
    db,
} from "../../config/firebase.js";

import {
    createStudentSetupInvitation,
} from "../../services/student-invitation.service.js";
const USERS_COLLECTION = "users";

/**
 * Tạo lỗi có HTTP status để controller xử lý.
 */
function createHttpError(
    statusCode,
    message,
) {
    const error = new Error(message);

    error.statusCode = statusCode;

    return error;
}

/**
 * Chuyển Firestore Timestamp thành chuỗi ISO.
 */
function timestampToIso(timestamp) {
    if (!timestamp) {
        return null;
    }

    if (
        typeof timestamp.toDate === "function"
    ) {
        return timestamp
            .toDate()
            .toISOString();
    }

    return timestamp;
}

/**
 * Chuyển Firestore document thành object
 * có thể trả về client.
 */
function mapStudentDocument(
    studentDocument,
) {
    const student =
        studentDocument.data();

    return {
        id: studentDocument.id,
        name: student.name,
        phone: student.phone,
        email: student.email,
        address: student.address || "",
        role: student.role,
        status: student.status,
        createdBy:
            student.createdBy || null,
        createdAt:
            timestampToIso(
                student.createdAt,
            ),
        updatedAt:
            timestampToIso(
                student.updatedAt,
            ),
    };
}

/**
 * Tìm user theo phone.
 */
async function findUserByPhone(
    phone,
) {
    const snapshot = await db
        .collection(USERS_COLLECTION)
        .where(
            "phone",
            "==",
            phone,
        )
        .limit(1)
        .get();

    if (snapshot.empty) {
        return null;
    }

    return snapshot.docs[0];
}

/**
 * Tìm student theo phone.
 *
 * Nếu phone thuộc instructor thì cũng không
 * được xem là student.
 */
async function findStudentByPhone(
    phone,
) {
    const userDocument =
        await findUserByPhone(phone);

    if (!userDocument) {
        return null;
    }

    const user = userDocument.data();

    if (user.role !== "student") {
        return null;
    }

    return userDocument;
}

/**
 * Kiểm tra phone đã được sử dụng hay chưa.
 *
 * excludedDocumentId dùng khi update:
 * student hiện tại được phép giữ nguyên phone.
 */
async function ensurePhoneIsAvailable(
    phone,
    excludedDocumentId = null,
) {
    const snapshot = await db
        .collection(USERS_COLLECTION)
        .where(
            "phone",
            "==",
            phone,
        )
        .get();

    const conflictingDocument =
        snapshot.docs.find(
            (document) =>
                document.id !==
                excludedDocumentId,
        );

    if (conflictingDocument) {
        throw createHttpError(
            409,
            "A user with this phone number already exists.",
        );
    }
}

/**
 * Kiểm tra email đã được sử dụng hay chưa.
 */
async function ensureEmailIsAvailable(
    email,
    excludedDocumentId = null,
) {
    const snapshot = await db
        .collection(USERS_COLLECTION)
        .where(
            "email",
            "==",
            email,
        )
        .get();

    const conflictingDocument =
        snapshot.docs.find(
            (document) =>
                document.id !==
                excludedDocumentId,
        );

    if (conflictingDocument) {
        throw createHttpError(
            409,
            "A user with this email already exists.",
        );
    }
}

/**
 * POST /addStudent
 */
export async function addStudent({
    name,
    phone,
    email,
    address = "",
    instructorId,
}) {
    const normalizedName =
        name.trim();

    const normalizedPhone =
        phone.trim();

    const normalizedEmail =
        email
            .trim()
            .toLowerCase();

    const normalizedAddress =
        address.trim();

    await Promise.all([
        ensurePhoneIsAvailable(
            normalizedPhone,
        ),
        ensureEmailIsAvailable(
            normalizedEmail,
        ),
    ]);

    const now = Timestamp.now();

    const studentData = {
        name: normalizedName,
        phone: normalizedPhone,
        email: normalizedEmail,
        address: normalizedAddress,

        role: "student",
        status: "active",

        /*
         * Student chưa thiết lập username/password.
         */
        accountSetupComplete: false,

        username: null,
        usernameNormalized: null,
        passwordHash: null,
        accountSetupAt: null,

        createdBy: instructorId,
        createdAt: now,
        updatedAt: now,
    };

    const studentReference = db
        .collection(USERS_COLLECTION)
        .doc();

    await studentReference.set(
        studentData,
    );

    const createdDocument =
        await studentReference.get();

    const createdStudent =
        mapStudentDocument(
            createdDocument,
        );

    try {
        await createStudentSetupInvitation({
            studentId:
                createdStudent.id,

            name:
                createdStudent.name,

            email:
                createdStudent.email,
        });
    } catch (invitationError) {
        console.error(
            "Failed to create student setup invitation:",
            invitationError,
        );
    }

    return createdStudent;
}

/**
 * GET /students
 */
export async function listStudents() {
    const snapshot = await db
        .collection(USERS_COLLECTION)
        .where(
            "role",
            "==",
            "student",
        )
        .get();

    const students =
        snapshot.docs.map(
            mapStudentDocument,
        );

    /*
     * Sắp xếp mới nhất trước.
     * Làm trong Node để chưa cần composite index.
     */
    students.sort(
        (firstStudent, secondStudent) =>
            (
                secondStudent.createdAt ||
                ""
            ).localeCompare(
                firstStudent.createdAt ||
                "",
            ),
    );

    return {
        total: students.length,
        students,
    };
}

/**
 * GET /student/:phone
 */
export async function getStudentProfile(
    phone,
) {
    const normalizedPhone =
        phone.trim();

    const studentDocument =
        await findStudentByPhone(
            normalizedPhone,
        );

    if (!studentDocument) {
        throw createHttpError(
            404,
            "Student was not found.",
        );
    }

    /*
     * Challenge yêu cầu trả cả assigned lessons.
     * Hiện chưa có lesson thì mảng sẽ rỗng.
     */
    const lessonsSnapshot =
        await studentDocument.ref
            .collection("lessons")
            .get();

    const lessons =
        lessonsSnapshot.docs.map(
            (lessonDocument) => {
                const lesson =
                    lessonDocument.data();

                return {
                    id: lessonDocument.id,
                    title: lesson.title,
                    description:
                        lesson.description,
                    status:
                        lesson.status ||
                        "pending",
                    assignedBy:
                        lesson.assignedBy ||
                        null,
                    assignedAt:
                        timestampToIso(
                            lesson.assignedAt,
                        ),
                    completedAt:
                        timestampToIso(
                            lesson.completedAt,
                        ),
                };
            },
        );

    return {
        student:
            mapStudentDocument(
                studentDocument,
            ),
        lessons,
    };
}

/**
 * PUT /editStudent/:phone
 */
export async function editStudent({
    currentPhone,
    changes,
}) {
    const normalizedCurrentPhone =
        currentPhone.trim();

    const studentDocument =
        await findStudentByPhone(
            normalizedCurrentPhone,
        );

    if (!studentDocument) {
        throw createHttpError(
            404,
            "Student was not found.",
        );
    }

    const currentStudent =
        studentDocument.data();

    const updateData = {
        updatedAt: Timestamp.now(),
    };

    if (changes.name !== undefined) {
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
        changes.status !== undefined
    ) {
        updateData.status =
            changes.status;
    }

    if (changes.phone !== undefined) {
        const newPhone =
            changes.phone.trim();

        if (
            newPhone !==
            currentStudent.phone
        ) {
            await ensurePhoneIsAvailable(
                newPhone,
                studentDocument.id,
            );
        }

        updateData.phone = newPhone;
    }

    if (changes.email !== undefined) {
        const newEmail =
            changes.email
                .trim()
                .toLowerCase();

        if (
            newEmail !==
            currentStudent.email
        ) {
            await ensureEmailIsAvailable(
                newEmail,
                studentDocument.id,
            );
        }

        updateData.email = newEmail;
    }

    await studentDocument.ref.update(
        updateData,
    );

    const updatedDocument =
        await studentDocument.ref.get();

    return mapStudentDocument(
        updatedDocument,
    );
}

/**
 * Xóa toàn bộ document trong một subcollection.
 *
 * Firestore không tự xóa subcollection khi
 * parent document bị xóa.
 */
async function deleteSubcollection(
    documentReference,
    collectionName,
) {
    const snapshot =
        await documentReference
            .collection(collectionName)
            .get();

    const batchSize = 500;

    for (
        let index = 0;
        index < snapshot.docs.length;
        index += batchSize
    ) {
        const batch = db.batch();

        const documents =
            snapshot.docs.slice(
                index,
                index + batchSize,
            );

        for (
            const document of documents
        ) {
            batch.delete(document.ref);
        }

        await batch.commit();
    }
}

/**
 * DELETE /student/:phone
 */
export async function deleteStudent(
    phone,
) {
    const normalizedPhone =
        phone.trim();

    const studentDocument =
        await findStudentByPhone(
            normalizedPhone,
        );

    if (!studentDocument) {
        throw createHttpError(
            404,
            "Student was not found.",
        );
    }

    const deletedStudent =
        mapStudentDocument(
            studentDocument,
        );

    /*
     * Xóa lesson và setup tokens trước khi xóa user.
     */
    await deleteSubcollection(
        studentDocument.ref,
        "lessons",
    );

    const tokensSnapshot = await db
        .collection("studentSetupTokens")
        .where("studentId", "==", studentDocument.id)
        .get();

    for (const tokenDoc of tokensSnapshot.docs) {
        await tokenDoc.ref.delete();
    }

    await studentDocument.ref.delete();

    return deletedStudent;
}

/**
 * POST /assignLesson
 */
export async function assignLesson({
    title,
    description = "",
    studentPhones = [],
    instructorId,
}) {
    const normalizedTitle = title.trim();
    const normalizedDescription = (description || "").trim();
    const assignedLessons = [];

    const now = Timestamp.now();

    for (const phone of studentPhones) {
        const normalizedPhone = phone.trim();
        const studentDocument = await findStudentByPhone(normalizedPhone);

        if (!studentDocument) {
            throw createHttpError(
                404,
                `Student with phone ${normalizedPhone} was not found.`
            );
        }

        const lessonData = {
            title: normalizedTitle,
            description: normalizedDescription,
            status: "pending",
            assignedBy: instructorId,
            assignedAt: now,
            completedAt: null,
        };

        const lessonReference = studentDocument.ref.collection("lessons").doc();
        await lessonReference.set(lessonData);

        assignedLessons.push({
            id: lessonReference.id,
            studentPhone: normalizedPhone,
            studentName: studentDocument.data().name,
            title: normalizedTitle,
            description: normalizedDescription,
            status: "pending",
            assignedAt: now.toDate().toISOString(),
        });
    }

    return {
        assignedCount: assignedLessons.length,
        lessons: assignedLessons,
    };
}

/**
 * GET /lessons - Query all lessons across all student subcollections using CollectionGroup
 */
export async function listAllLessons() {
    const snapshot = await db.collectionGroup("lessons").get();
    const lessons = [];

    for (const doc of snapshot.docs) {
        const lessonData = doc.data();
        const studentDoc = await doc.ref.parent.parent.get();
        const studentData = studentDoc.exists ? studentDoc.data() : {};

        lessons.push({
            id: doc.id,
            title: lessonData.title,
            description: lessonData.description || "",
            status: lessonData.status || "pending",
            assignedBy: lessonData.assignedBy || null,
            assignedAt: lessonData.assignedAt
                ? lessonData.assignedAt.toDate().toISOString()
                : null,
            studentName: studentData.name || "Unknown Student",
            studentPhone: studentData.phone || "",
            studentEmail: studentData.email || "",
        });
    }

    return lessons;
}