import Availability from "../models/Availability.js";

export const createAvailability = async (req, res) => {
    try {
        const {
            dia,
            horaInicio,
            horaFin
        } = req.body;

        if (!dia || !horaInicio || !horaFin) {
            return res.status(400).json({
                message: "Día, hora de inicio y hora de fin son obligatorios"
            });
        }

        const disponibilidad = await Availability.create({
            fisioterapeuta: req.usuario.id,
            dia,
            horaInicio,
            horaFin
        });

        res.status(201).json({
            message: "Disponibilidad creada correctamente",
            disponibilidad
        });

    } catch (error) {
        console.error(
            "Error creando disponibilidad:",
            error
        );

        res.status(500).json({
            message: "Error interno del servidor"
        });
    }
};

export const getAvailability = async (req, res) => {
    try {
        const disponibilidad = await Availability.find({
            fisioterapeuta: req.usuario.id,
            activo: true
        }).sort({
            dia: 1,
            horaInicio: 1
        });

        res.json({
            disponibilidad
        });

    } catch (error) {
        console.error(
            "Error obteniendo disponibilidad:",
            error
        );

        res.status(500).json({
            message: "Error interno del servidor"
        });
    }
};