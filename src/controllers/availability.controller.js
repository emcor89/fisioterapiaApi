import Availability from "../models/Availability.js";

export const createAvailability = async (req, res) => {
    try {
        const { dia, horaInicio, horaFin } = req.body;

        const diasValidos = [
            "lunes",
            "martes",
            "miercoles",
            "jueves",
            "viernes",
            "sabado",
            "domingo"
        ];

        if (!dia || !horaInicio || !horaFin) {
            return res.status(400).json({
                message: "Día, hora de inicio y hora de fin son obligatorios"
            });
        }

        if (!diasValidos.includes(dia)) {
            return res.status(400).json({
                message: "Día no válido",
                diasPermitidos: diasValidos
            });
        }

        const formatoHora = /^([01]\d|2[0-3]):[0-5]\d$/;

        if (
            !formatoHora.test(horaInicio) ||
            !formatoHora.test(horaFin)
        ) {
            return res.status(400).json({
                message: "Las horas deben tener el formato HH:mm, por ejemplo 08:00"
            });
        }

        if (horaInicio >= horaFin) {
            return res.status(400).json({
                message: "La hora de inicio debe ser anterior a la hora de fin"
            });
        }

        const disponibilidadExistente = await Availability.findOne({
            fisioterapeuta: req.usuario.id,
            dia,
            activo: true,
            horaInicio: { $lt: horaFin },
            horaFin: { $gt: horaInicio }
        });

        if (disponibilidadExistente) {
            return res.status(409).json({
                message: "Este horario se cruza con otra disponibilidad activa del mismo día",
                disponibilidadExistente: {
                    horaInicio: disponibilidadExistente.horaInicio,
                    horaFin: disponibilidadExistente.horaFin
                }
            });
        }
        const disponibilidad = await Availability.create({
            fisioterapeuta: req.usuario.id,
            dia,
            horaInicio,
            horaFin
        });

        return res.status(201).json({
            message: "Disponibilidad creada correctamente",
            disponibilidad
        });
    } catch (error) {
        console.error("Error creando disponibilidad:", error);

        return res.status(500).json({
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

//editar horarios de citas
export const updateAvailability = async (req, res) => {
    try {
        const { id } = req.params;
        const { dia, horaInicio, horaFin } = req.body;

        const disponibilidad = await Availability.findOne({
            _id: id,
            fisioterapeuta: req.usuario.id,
            activo: true
        });

        if (!disponibilidad) {
            return res.status(404).json({
                message: "Disponibilidad no encontrada"
            });
        }

        const nuevoDia = dia ?? disponibilidad.dia;
        const nuevaHoraInicio = horaInicio ?? disponibilidad.horaInicio;
        const nuevaHoraFin = horaFin ?? disponibilidad.horaFin;

        const diasValidos = [
            "lunes",
            "martes",
            "miercoles",
            "jueves",
            "viernes",
            "sabado",
            "domingo"
        ];

        if (!diasValidos.includes(nuevoDia)) {
            return res.status(400).json({
                message: "Día no válido",
                diasPermitidos: diasValidos
            });
        }

        const formatoHora = /^([01]\d|2[0-3]):[0-5]\d$/;

        if (
            !formatoHora.test(nuevaHoraInicio) ||
            !formatoHora.test(nuevaHoraFin)
        ) {
            return res.status(400).json({
                message: "Las horas deben tener el formato HH:mm, por ejemplo 08:00"
            });
        }

        if (nuevaHoraInicio >= nuevaHoraFin) {
            return res.status(400).json({
                message: "La hora de inicio debe ser anterior a la hora de fin"
            });
        }

        const disponibilidadSolapada = await Availability.findOne({
            _id: { $ne: id },
            fisioterapeuta: req.usuario.id,
            dia: nuevoDia,
            activo: true,
            horaInicio: { $lt: nuevaHoraFin },
            horaFin: { $gt: nuevaHoraInicio }
        });

        if (disponibilidadSolapada) {
            return res.status(409).json({
                message: "Este horario se cruza con otra disponibilidad activa del mismo día",
                disponibilidadExistente: {
                    dia: disponibilidadSolapada.dia,
                    horaInicio: disponibilidadSolapada.horaInicio,
                    horaFin: disponibilidadSolapada.horaFin
                }
            });
        }

        disponibilidad.dia = nuevoDia;
        disponibilidad.horaInicio = nuevaHoraInicio;
        disponibilidad.horaFin = nuevaHoraFin;

        await disponibilidad.save();

        return res.json({
            message: "Disponibilidad actualizada correctamente",
            disponibilidad
        });
    } catch (error) {
        console.error("Error actualizando disponibilidad:", error);

        return res.status(500).json({
            message: "Error interno del servidor"
        });
    }
};

// desactivar disponibilidad

export const deactivateAvailability = async (req, res) => {
    try {
        const { id } = req.params;

        const disponibilidad = await Availability.findOne({
            _id: id,
            fisioterapeuta: req.usuario.id,
            activo: true
        });

        if (!disponibilidad) {
            return res.status(404).json({
                message: "Disponibilidad no encontrada o ya desactivada"
            });
        }

        disponibilidad.activo = false;
        await disponibilidad.save();

        return res.json({
            message: "Disponibilidad desactivada correctamente",
            disponibilidad
        });
    } catch (error) {
        console.error("Error desactivando disponibilidad:", error);

        return res.status(500).json({
            message: "Error interno del servidor"
        });
    }
};

//reactivar horarios de fisioterapeuta

export const activateAvailability = async (req, res) => {
    try {
        const { id } = req.params;

        const disponibilidad = await Availability.findOne({
            _id: id,
            fisioterapeuta: req.usuario.id,
            activo: false
        });

        if (!disponibilidad) {
            return res.status(404).json({
                message: "Disponibilidad no encontrada o ya activa"
            });
        }

        const disponibilidadSolapada = await Availability.findOne({
            _id: { $ne: id },
            fisioterapeuta: req.usuario.id,
            dia: disponibilidad.dia,
            activo: true,
            horaInicio: { $lt: disponibilidad.horaFin },
            horaFin: { $gt: disponibilidad.horaInicio }
        });

        if (disponibilidadSolapada) {
            return res.status(409).json({
                message: "No se puede activar porque el horario se cruza con otra disponibilidad activa",
                disponibilidadExistente: {
                    dia: disponibilidadSolapada.dia,
                    horaInicio: disponibilidadSolapada.horaInicio,
                    horaFin: disponibilidadSolapada.horaFin
                }
            });
        }

        disponibilidad.activo = true;

        await disponibilidad.save();

        return res.json({
            message: "Disponibilidad activada correctamente",
            disponibilidad
        });
    } catch (error) {
        console.error("Error activando disponibilidad:", error);

        return res.status(500).json({
            message: "Error interno del servidor"
        });
    }
};

