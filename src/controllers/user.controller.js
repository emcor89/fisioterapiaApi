
import User from "../models/User.js";

// Obtener todos los usuarios (solo administrador)
export const getUsers = async (req, res, next) => {
    try {
        const usuarios = await User.find()
            .select("-password -__v")
            .sort({ createdAt: -1 });

        res.json({
            usuarios
        });

    } catch (error) {
        next(error);
    }
};

// Obtener perfil del usuario autenticado
export const getProfile = async (req, res, next) => {
    try {
        const usuario = await User.findById(req.usuario.id)
            .select("-password -__v");

        if (!usuario) {
            return res.status(404).json({
                message: "Usuario no encontrado"
            });
        }

        res.json({
            usuario
        });

    } catch (error) {
        next(error);
    }
};

//actualizar perfil del usuario

export const updateProfile = async (req, res, next) => {
    try {
        const {
            nombre,
            correo,
            edad,
            sexo
        } = req.body || {};

        const camposActualizar = {};

        // Validar nombre
        if (nombre !== undefined) {
            if (typeof nombre !== "string" || !nombre.trim()) {
                return res.status(400).json({
                    message: "El nombre no es válido"
                });
            }

            camposActualizar.nombre = nombre.trim();
        }

        // Validar correo
        if (correo !== undefined) {
            if (typeof correo !== "string" || !correo.trim()) {
                return res.status(400).json({
                    message: "El correo no es válido"
                });
            }

            const correoLimpio = correo.trim().toLowerCase();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailRegex.test(correoLimpio)) {
                return res.status(400).json({
                    message: "El formato del correo electrónico no es válido"
                });
            }

            const correoExiste = await User.findOne({
                correo: correoLimpio,
                _id: { $ne: req.usuario.id }
            });

            if (correoExiste) {
                return res.status(400).json({
                    message: "El correo ya está registrado"
                });
            }

            camposActualizar.correo = correoLimpio;
        }

        // Validar edad
        if (edad !== undefined) {
            const edadNumero = Number(edad);

            if (
                !Number.isInteger(edadNumero) ||
                edadNumero < 1 ||
                edadNumero > 120
            ) {
                return res.status(400).json({
                    message: "La edad debe ser un número entero entre 1 y 120"
                });
            }

            camposActualizar.edad = edadNumero;
        }

        // Validar sexo
        if (sexo !== undefined) {
            if (typeof sexo !== "string") {
                return res.status(400).json({
                    message: "El sexo no es válido"
                });
            }

            const sexoLimpio = sexo.trim().toLowerCase();
            const sexosPermitidos = ["masculino", "femenino", "otro"];

            if (!sexosPermitidos.includes(sexoLimpio)) {
                return res.status(400).json({
                    message: "El sexo debe ser masculino, femenino u otro"
                });
            }

            camposActualizar.sexo = sexoLimpio;
        }

        if (Object.keys(camposActualizar).length === 0) {
            return res.status(400).json({
                message: "Debes proporcionar al menos un campo válido para actualizar"
            });
        }

        const usuario = await User.findByIdAndUpdate(
            req.usuario.id,
            { $set: camposActualizar },
            {
                new: true,
                runValidators: true
            }
        ).select("-password -__v");

        if (!usuario) {
            return res.status(404).json({
                message: "Usuario no encontrado"
            });
        }

        res.json({
            message: "Perfil actualizado correctamente",
            usuario
        });

    } catch (error) {
        next(error);
    }
};

