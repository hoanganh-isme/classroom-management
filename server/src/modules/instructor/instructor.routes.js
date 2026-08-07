import { Router } from "express";

import {
    authenticate,
} from "../../middleware/authenticate.js";

import {
    authorizeRoles,
} from "../../middleware/authorize.js";

import {
    addStudent,
    assignLesson,
    deleteStudent,
    editStudent,
    getLessons,
    getStudent,
    getStudents,
} from "./instructor.controller.js";

const instructorRouter = Router();

instructorRouter.use(
    authenticate,
    authorizeRoles("instructor"),
);

instructorRouter.post(
    "/addStudent",
    addStudent,
);

instructorRouter.post(
    "/assignLesson",
    assignLesson,
);

instructorRouter.get(
    "/lessons",
    getLessons,
);

instructorRouter.get(
    "/students",
    getStudents,
);

instructorRouter.get(
    "/student/:phone",
    getStudent,
);

instructorRouter.put(
    "/editStudent/:phone",
    editStudent,
);

instructorRouter.delete(
    "/student/:phone",
    deleteStudent,
);

export default instructorRouter;