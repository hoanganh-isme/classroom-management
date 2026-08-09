import { Router } from "express";

import {
    createAccessCode,
    validateAccessCode,
} from "./auth.controller.js";

import {
    authenticate,
} from "../../middleware/authenticate.js";

import {
    authorizeRoles,
} from "../../middleware/authorize.js";

const authRouter = Router();

/*
 * Public routes:
 * Chưa đăng nhập vẫn được gọi.
 */
authRouter.post(
    "/createAccessCode",
    createAccessCode,
);

authRouter.post(
    "/validateAccessCode",
    validateAccessCode,
);

/*
 * Authenticated routes:
 */
authRouter.get(
    "/auth-check",
    authenticate,
    (request, response) => {
        return response.status(200).json({
            success: true,
            message: "Authentication is valid.",
            user: request.user,
        });
    },
);

authRouter.get(
    "/instructor-check",
    authenticate,
    authorizeRoles("instructor"),
    (request, response) => {
        return response.status(200).json({
            success: true,
            message:
                "Instructor authorization is valid.",
            user: request.user,
        });
    },
);

export default authRouter;