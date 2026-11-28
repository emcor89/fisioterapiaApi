import jwt from "jsonwebtoken";
import User from "../models/User.js";

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                message: "No se proporcionó el token"
            });
        }

        const [tipo, token] = authHeader.split(" ");

        if (tipo !== "Bearer" || !token || authHeader.split(" ").length !== 2) {
            return res.status(401).json({
                message: "Formato de token inválido. Usa Bearer <token>"
            });
        }

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({
                message: "Error de configuración del servidor"
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Buscar usuario en MongoDB
        const usuario = await User.findById(decoded.id);

        if (!usuario) {
            return res.status(401).json({
                message: "Usuario no encontrado"
            });
        }

        // Comprobar versión del token
        if (decoded.tokenVersion !== usuario.tokenVersion) {
            return res.status(401).json({
                message: "La sesión ha expirado. Inicia sesión nuevamente"
            });
        }

        req.usuario = decoded;

        next();

    } catch (error) {
        return res.status(401).json({
            message: "Token inválido o expirado"
        });
    }
};

export default authMiddleware;