import bcrypt from "bcrypt";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendEmail } from "../services/email.service.js";

export const register = async (req, res, next) => {
    try {
        const {
            nombre,
            cedula,
            correo,
            edad,
            sexo,
            password
        } = req.body || {};

        const nombreLimpio = nombre?.trim();
        const cedulaLimpia = cedula?.trim();
        const correoLimpio = correo?.trim().toLowerCase();
        const sexoLimpio = sexo?.trim().toLowerCase();

        // Verificar que todos los campos existan
        if (
            !nombreLimpio ||
            !cedulaLimpia ||
            !correoLimpio ||
            edad === undefined ||
            edad === null ||
            !sexoLimpio ||
            !password?.trim()
        ) {
            return res.status(400).json({
                message: "Todos los campos son obligatorios"
            });
        }
        // verificar correo
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(correoLimpio)) {
            return res.status(400).json({
                message: "El formato del correo electrónico no es válido"
            });
        }


        //verificar cedula
        const validarCedulaEcuatoriana = (cedula) => {
            if (!/^\d{10}$/.test(cedula)) {
                return false;
            }

            const digitos = cedula.split("").map(Number);
            const provincia = Number(cedula.substring(0, 2));

            if (provincia < 1 || provincia > 24 || digitos[2] > 5) {
                return false;
            }

            let suma = 0;

            for (let i = 0; i < 9; i++) {
                let valor = digitos[i];

                if (i % 2 === 0) {
                    valor *= 2;

                    if (valor > 9) {
                        valor -= 9;
                    }
                }

                suma += valor;
            }

            const verificador = (10 - (suma % 10)) % 10;

            return verificador === digitos[9];
        };

        if (!validarCedulaEcuatoriana(cedulaLimpia)) {
            return res.status(400).json({
                message: "La cédula ecuatoriana no es válida"
            });
        }

        // validar edad
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

        //validar sexo
        const sexosPermitidos = ["masculino", "femenino", "otro"];

        if (!sexosPermitidos.includes(sexoLimpio)) {
            return res.status(400).json({
                message: "El sexo debe ser masculino, femenino u otro"
            });
        }

        //validar contraseña
        if (password.trim().length < 8) {
            return res.status(400).json({
                message: "La contraseña debe tener al menos 8 caracteres"
            });
        }
        //que tenga una letra y un numero
        if (!/(?=.*[A-Za-z])(?=.*\d)/.test(password)) {
            return res.status(400).json({
                message: "La contraseña debe contener al menos una letra y un número"
            });
        }

        // Verificar si el correo ya existe
        const usuarioExiste = await User.findOne({
            correo: correoLimpio
        });

        if (usuarioExiste) {
            return res.status(400).json({
                message: "El correo ya está registrado"
            });
        }



        // Verificar si la cédula ya existe
        const cedulaExiste = await User.findOne({
            cedula: cedulaLimpia
        });

        if (cedulaExiste) {
            return res.status(400).json({
                message: "La cédula ya está registrada"
            });
        }


        // Encriptar contraseña
        const passwordHasheada = await bcrypt.hash(password, 10);

        // Crear usuario
        const nuevoUsuario = await User.create({
            nombre: nombreLimpio,
            cedula: cedulaLimpia,
            correo: correoLimpio,
            edad: edadNumero,
            sexo: sexoLimpio,
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
        next(error);
    }
};

// Log in
export const login = async (req, res, next) => {
    try {
        const { correo, password } = req.body || {};

        const correoLimpio = correo?.trim().toLowerCase();

        if (!correoLimpio || !password?.trim()) {
            return res.status(400).json({
                message: "Correo y contraseña son obligatorios"
            });
        }

        const usuario = await User.findOne({
            correo: correoLimpio
        });

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
        //Verificar que JWT_SECRET esté configurado antes de generar el token
        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET no está configurado");
        }

        const token = jwt.sign(
            {
                id: usuario._id,
                rol: usuario.rol,
                tokenVersion: usuario.tokenVersion
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
        next(error);
    }
};


// Cambiar contraseña del usuario autenticado
export const changePassword = async (req, res, next) => {
    try {
        const {
            passwordActual,
            nuevaPassword
        } = req.body || {};

        // Verificar campos obligatorios
        if (
            typeof passwordActual !== "string" ||
            !passwordActual.trim() ||
            typeof nuevaPassword !== "string" ||
            !nuevaPassword.trim()
        ) {
            return res.status(400).json({
                message: "La contraseña actual y la nueva contraseña son obligatorias"
            });
        }

        // Buscar usuario autenticado
        const usuario = await User.findById(req.usuario.id);

        if (!usuario) {
            return res.status(404).json({
                message: "Usuario no encontrado"
            });
        }

        // Verificar contraseña actual
        const passwordCorrecta = await bcrypt.compare(
            passwordActual,
            usuario.password
        );

        if (!passwordCorrecta) {
            return res.status(401).json({
                message: "La contraseña actual es incorrecta"
            });
        }

        // Validar nueva contraseña
        if (nuevaPassword.trim().length < 8) {
            return res.status(400).json({
                message: "La nueva contraseña debe tener al menos 8 caracteres"
            });
        }

        if (!/(?=.*[A-Za-z])(?=.*\d)/.test(nuevaPassword)) {
            return res.status(400).json({
                message: "La nueva contraseña debe contener al menos una letra y un número"
            });
        }

        // Evitar reutilizar la contraseña actual
        const mismaPassword = await bcrypt.compare(
            nuevaPassword,
            usuario.password
        );

        if (mismaPassword) {
            return res.status(400).json({
                message: "La nueva contraseña debe ser diferente a la actual"
            });
        }

        // Encriptar y guardar nueva contraseña
        usuario.password = await bcrypt.hash(nuevaPassword, 10);

        // Invalidar sesiones anteriores
        usuario.tokenVersion += 1;

        await usuario.save();

        res.json({
            message: "Contraseña actualizada correctamente"
        });

    } catch (error) {
        next(error);
    }
};

// Solicitar recuperación de contraseña
export const forgotPassword = async (req, res, next) => {
    try {
        const { correo } = req.body || {};

        if (typeof correo !== "string" || !correo.trim()) {
            return res.status(400).json({
                message: "El correo electrónico es obligatorio"
            });
        }

        const correoLimpio = correo.trim().toLowerCase();

        const usuario = await User.findOne({
            correo: correoLimpio
        });

        // Respuesta genérica para no revelar si el correo existe
        if (!usuario) {
            return res.json({
                message: "Si el correo está registrado, recibirás instrucciones para recuperar tu contraseña"
            });
        }

        // Generar token seguro
        const resetToken = crypto.randomBytes(32).toString("hex");

        // Guardar únicamente el hash del token
        usuario.resetPasswordToken = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");

        // El token tendrá una validez de 15 minutos
        usuario.resetPasswordExpires = Date.now() + 15 * 60 * 1000;

        await usuario.save();

        // Construir enlace de recuperación
        const resetUrl = `${process.env.FRONTEND_URL}/restablecer-password?token=${resetToken}`;

        // Enviar correo de recuperación
        try {
            await sendEmail({
                to: usuario.correo,
                subject: "Recuperación de contraseña - Fisioterapia",
                html: `
                    <h2>Recuperación de contraseña</h2>

                    <p>Hola ${usuario.nombre},</p>

                    <p>Hemos recibido una solicitud para restablecer tu contraseña.</p>

                    <p>Haz clic en el siguiente enlace:</p>

                    <a href="${resetUrl}">
                        Restablecer mi contraseña
                    </a>

                    <p>Este enlace expirará en 15 minutos.</p>

                    <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
                `
            });

        } catch (emailError) {
            // Eliminar el token si falla el envío
            usuario.resetPasswordToken = undefined;
            usuario.resetPasswordExpires = undefined;

            await usuario.save();

            throw emailError;
        }

        res.json({
            message: "Si el correo está registrado, recibirás instrucciones para recuperar tu contraseña"
        });
    } catch (error) {
        next(error);
    }
};


// Restablecer contraseña mediante token
export const resetPassword = async (req, res, next) => {
    try {
        const {
            token,
            nuevaPassword
        } = req.body || {};

        // Verificar campos obligatorios
        if (
            typeof token !== "string" ||
            !token.trim() ||
            typeof nuevaPassword !== "string" ||
            !nuevaPassword.trim()
        ) {
            return res.status(400).json({
                message: "El token y la nueva contraseña son obligatorios"
            });
        }

        // Validar longitud de contraseña
        if (nuevaPassword.trim().length < 8) {
            return res.status(400).json({
                message: "La nueva contraseña debe tener al menos 8 caracteres"
            });
        }

        // Validar que contenga letras y números
        if (!/(?=.*[A-Za-z])(?=.*\d)/.test(nuevaPassword)) {
            return res.status(400).json({
                message: "La nueva contraseña debe contener al menos una letra y un número"
            });
        }

        // Generar hash del token recibido
        const resetTokenHash = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        // Buscar usuario con token válido y no expirado
        const usuario = await User.findOne({
            resetPasswordToken: resetTokenHash,
            resetPasswordExpires: { $gt: Date.now() }
        }).select("+resetPasswordToken +resetPasswordExpires");

        if (!usuario) {
            return res.status(400).json({
                message: "El token es inválido o ha expirado"
            });
        }

        // Evitar reutilizar la contraseña actual
        const mismaPassword = await bcrypt.compare(
            nuevaPassword,
            usuario.password
        );

        if (mismaPassword) {
            return res.status(400).json({
                message: "La nueva contraseña debe ser diferente a la actual"
            });
        }

        // Guardar nueva contraseña cifrada
        usuario.password = await bcrypt.hash(nuevaPassword, 10);

        // Invalidar sesiones anteriores
        usuario.tokenVersion += 1;

        // Invalidar token después de utilizarlo
        usuario.resetPasswordToken = undefined;
        usuario.resetPasswordExpires = undefined;

        await usuario.save();

        res.json({
            message: "Contraseña restablecida correctamente"
        });

    } catch (error) {
        next(error);
    }
};

