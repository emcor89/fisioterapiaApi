
import express from "express";
import { register, login, changePassword } from "../controllers/auth.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

router.put(
    "/cambiar-password",
    authMiddleware,
    changePassword
);

export default router;
