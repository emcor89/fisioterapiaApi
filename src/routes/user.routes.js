import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";
import { getUsers } from "../controllers/user.controller.js";

const router = express.Router();

router.get(
    "/perfil",
    authMiddleware,
    (req, res) => {
        res.json({
            message: "Acceso autorizado",
            usuario: req.usuario
        });
    }
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