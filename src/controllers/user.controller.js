import User from "../models/User.js";

export const getUsers = async (req, res) => {
    try {
        const usuarios = await User.find()
            .select("-password")
            .sort({ createdAt: -1 });

        res.json({
            usuarios
        });
    } catch (error) {
        console.error("Error obteniendo usuarios:", error);

        res.status(500).json({
            message: "Error interno del servidor"
        });
    }
};