import express from "express";

import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";

import {
    createAvailability,
    getAvailability,
    updateAvailability,
    deactivateAvailability,
    activateAvailability
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

router.patch(
    "/:id",
    authMiddleware,
    roleMiddleware("fisioterapeuta"),
    updateAvailability
);

router.patch(
    "/:id/desactivar",
    authMiddleware,
    roleMiddleware("fisioterapeuta"),
    deactivateAvailability
);

router.patch(
    "/:id/activar",
    authMiddleware,
    roleMiddleware("fisioterapeuta"),
    activateAvailability
);

export default router;