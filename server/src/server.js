import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { db } from "./config/firebase.js";
import authRouter from "./modules/auth/auth.routes.js";
import instructorRouter from "./modules/instructor/instructor.routes.js";
import studentRouter from "./modules/student/student.routes.js";
import { initializeSocket } from "./socket/index.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);

const port = process.env.PORT || 3000;
const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

app.use(
    cors({
        origin: clientUrl,
        credentials: true,
    }),
);

app.use(express.json());
app.use(authRouter);
app.use(studentRouter);
app.use(instructorRouter);

app.get("/health", (request, response) => {
    response.status(200).json({
        success: true,
        message: "Classroom Management API is running",
    });
});

if (process.env.NODE_ENV !== "production") {
    app.get("/firebase-health", async (req, res) => {
        try {
            const healthDocument = db
                .collection("_system")
                .doc("firebase-health");

            await healthDocument.set(
                {
                    status: "connected",
                    checkedAt: new Date(),
                },
                {
                    merge: true,
                },
            );

            return res.status(200).json({
                success: true,
                message: "Firebase and Firestore are connected",
            });
        } catch (error) {
            console.error("Firebase health check failed:", error);

            return res.status(500).json({
                success: false,
                message: "Cannot connect to Firebase",
            });
        }
    });
}

const io = new Server(httpServer, {
    cors: {
        origin: clientUrl,
        credentials: true,
    },
});

initializeSocket(io);

httpServer.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});