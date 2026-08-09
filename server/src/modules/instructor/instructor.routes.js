import { Router } from "express";

import { authenticate } from "../../middleware/authenticate.js";
import { authorizeRoles } from "../../middleware/authorize.js";

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

const requireInstructor = [authenticate, authorizeRoles("instructor")];

instructorRouter.post("/addStudent", requireInstructor, addStudent);
instructorRouter.post("/assignLesson", requireInstructor, assignLesson);
instructorRouter.get("/lessons", requireInstructor, getLessons);
instructorRouter.get("/students", requireInstructor, getStudents);
instructorRouter.get("/student/:phone", requireInstructor, getStudent);
instructorRouter.put("/editStudent/:phone", requireInstructor, editStudent);
instructorRouter.delete("/student/:phone", requireInstructor, deleteStudent);

export default instructorRouter;