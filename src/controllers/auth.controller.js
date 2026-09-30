import bcrypt from "bcrypt";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
    try {
        const {
            nombre,
            cedula,
            correo,
            edad,
            sexo,
            password
        } = req.body;

        // Verificar que todos los campos existan
        if (!nombre || !cedula || !correo || !edad || !sexo || !password) {
            return res.status(400).json({
                message: "Todos los campos son obligatorios"
            });
        }

        // Verificar si el correo ya existe
        const usuarioExiste = await User.findOne({ correo });

        if (usuarioExiste) {
            return res.status(400).json({
                message: "El correo ya está registrado"
            });
        }

        // Verificar si la cédula ya existe
        const cedulaExiste = await User.findOne({ cedula });

        if (cedulaExiste) {
            return res.status(400).json({
                message: "La cédula ya está registrada"
            });
        }

        // Encriptar contraseña
        const passwordHasheada = await bcrypt.hash(password, 10);

        // Crear usuario
        const nuevoUsuario = await User.create({
            nombre,
            cedula,
            correo,
            edad,
            sexo,
            password: passwordHasheada
        });

        res.status(201).json({
            message: "Usuario registrado correctamente",
            usuario: {
                id: nuevoUsuario._id,
                nombre: nuevoUsuario.nombre,
                correo: nuevoUsuario.correo,
                rol: nuevoUsuario.rol
            }
        });

    } catch (error) {
        console.error("Error registrando usuario:", error);

        res.status(500).json({
            message: "Error interno del servidor"
        });
    }
};

// Log in
export const login = async (req, res) => {
    try {
        const { correo, password } = req.body;

        if (!correo || !password) {
            return res.status(400).json({
                message: "Correo y contraseña son obligatorios"
            });
        }

        const usuario = await User.findOne({ correo });

        if (!usuario) {
            return res.status(401).json({
                message: "Correo o contraseña incorrectos"
            });
        }

        const passwordCorrecta = await bcrypt.compare(
            password,
            usuario.password
        );

        if (!passwordCorrecta) {
            return res.status(401).json({
                message: "Correo o contraseña incorrectos"
            });
        }

        const token = jwt.sign(
            {
                id: usuario._id,
                rol: usuario.rol
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        res.json({
            message: "Inicio de sesión correcto",
            token,
            usuario: {
                id: usuario._id,
                nombre: usuario.nombre,
                correo: usuario.correo,
                rol: usuario.rol
            }
        });

    } catch (error) {
        console.error("Error en login:", error);

        res.status(500).json({
            message: "Error interno del servidor"
        });
    }
};


