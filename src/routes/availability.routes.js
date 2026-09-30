import express from "express";

import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";

import {
    createAvailability,
    getAvailability
} from "../controllers/availability.controller.js";

const router = express.Router();

router.post(
    "/",
    authMiddleware,
    roleMiddleware("fisioterapeuta"),
    createAvailability
);

router.get(
    "/",
    authMiddleware,
    roleMiddleware("fisioterapeuta"),
    getAvailability
);

export default router;