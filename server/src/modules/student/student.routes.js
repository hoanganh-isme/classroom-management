import { Router } from "express";

import { authenticate } from "../../middleware/authenticate.js";
import { authorizeRoles } from "../../middleware/authorize.js";

import {
    setupAccount,
    studentLogin,
    verifySetupToken,
    getProfile,
    editProfile,
    getLessons,
    markLessonDone,
    changePassword,
} from "./student.controller.js";

const studentRouter = Router();

/*
 * PUBLIC ROUTES
 */
studentRouter.get("/verifyStudentSetupToken", verifySetupToken);
studentRouter.post("/setupStudentAccount", setupAccount);
studentRouter.post("/studentLogin", studentLogin);

/*
 * PRIVATE STUDENT ROUTES
 */
const requireStudent = [authenticate, authorizeRoles("student")];

studentRouter.get("/myProfile", requireStudent, getProfile);
studentRouter.put("/editProfile", requireStudent, editProfile);
studentRouter.put("/changePassword", requireStudent, changePassword);
studentRouter.get("/myLessons", requireStudent, getLessons);
studentRouter.put("/markLessonDone/:lessonId", requireStudent, markLessonDone);

export default studentRouter;