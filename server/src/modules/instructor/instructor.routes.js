import { Router } from "express";

import {
    authenticate,
} from "../../middleware/authenticate.js";

import {
    authorizeRoles,
} from "../../middleware/authorize.js";

const instructorRouter = Router();

instructorRouter.use(
    authenticate,
    authorizeRoles("instructor"),
);

instructorRouter.get(
    "/students",
    getStudents,
);

instructorRouter.post(
    "/addStudent",
    addStudent,
);

instructorRouter.put(
    "/students/:studentId",
    updateStudent,
);

instructorRouter.delete(
    "/students/:studentId",
    deleteStudent,
);

export default instructorRouter;