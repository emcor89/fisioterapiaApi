import express from "express";
import User from "../models/User.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";

const router = express.Router();

router.put(
    "/convertir-admin/:id",
    authMiddleware,
    roleMiddleware("admin"),
    async (req, res) => {
        try {
            const usuario = await User.findByIdAndUpdate(
                req.params.id,
                { rol: "admin" },
                { new: true }
            ).select("-password");

            if (!usuario) {
                return res.status(404).json({
                    message: "Usuario no encontrado"
                });
            }

            res.json({
                message: "Usuario convertido en administrador",
                usuario
            });
        } catch (error) {
            console.error(error);

            res.status(500).json({
                message: "Error interno del servidor"
            });
        }
    }
);

export default router;