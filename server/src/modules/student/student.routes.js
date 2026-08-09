import {
    Router,
} from "express";

import {
    authenticate,
} from "../../middleware/authenticate.js";

import {
    authorizeRoles,
} from "../../middleware/authorize.js";

import {
    setupAccount,
    studentLogin,
    verifySetupToken,
    getProfile,
    editProfile,
    getLessons,
    markLessonDone,
} from "./student.controller.js";

const studentRouter =
    Router();

/*
 * PUBLIC
 */
studentRouter.get(
    "/verifyStudentSetupToken",
    verifySetupToken,
);

studentRouter.post(
    "/setupStudentAccount",
    setupAccount,
);

studentRouter.post(
    "/studentLogin",
    studentLogin,
);

/*
 * Từ đây trở xuống:
 * student JWT bắt buộc.
 */
studentRouter.use(
    authenticate,
    authorizeRoles("student"),
);

studentRouter.get(
    "/myProfile",
    getProfile,
);

studentRouter.put(
    "/editProfile",
    editProfile,
);

studentRouter.get(
    "/myLessons",
    getLessons,
);

studentRouter.put(
    "/markLessonDone/:lessonId",
    markLessonDone,
);

export default studentRouter;