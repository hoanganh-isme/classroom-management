import { Router } from "express";

import {
    createAccessCode,
    validateAccessCode,
} from "./auth.controller.js";

const authRouter = Router();

authRouter.post(
    "/createAccessCode",
    createAccessCode,
);
authRouter.post(
    "/validateAccessCode",
    validateAccessCode,
);
export default authRouter;