import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";
import { getUsers, getProfile, updateProfile } from "../controllers/user.controller.js";

const router = express.Router();

router.get(
    "/perfil",
    authMiddleware,
    getProfile

);
router.put(
    "/perfil",
    authMiddleware,
    updateProfile
);

router.get(
    "/solo-fisioterapeutas",
    authMiddleware,
    roleMiddleware("fisioterapeuta"),
    (req, res) => {
        res.json({
            message: "Bienvenido fisioterapeuta"
        });
    }
);

router.get(
    "/",
    authMiddleware,
    roleMiddleware("admin"),
    getUsers
);

export default router;