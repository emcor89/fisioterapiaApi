import Availability from "../models/Availability.js";
import Appointment from "../models/Appointment.js";

export const getAvailableHours = async (req, res) => {
    try {
        const { fisioterapeutaId, fecha } = req.query;

        if (!fisioterapeutaId || !fecha) {
            return res.status(400).json({
                message: "fisioterapeutaId y fecha son obligatorios"
            });
        }

        const date = new Date(`${fecha}T00:00:00`);

        if (isNaN(date.getTime())) {
            return res.status(400).json({
                message: "La fecha no es válida"
            });
        }

        const diasSemana = [
            "domingo",
            "lunes",
            "martes",
            "miercoles",
            "jueves",
            "viernes",
            "sabado"
        ];

        const dia = diasSemana[date.getDay()];

        const disponibilidades = await Availability.find({
            fisioterapeuta: fisioterapeutaId,
            dia,
            activo: true
        });

        const citas = await Appointment.find({
            fisioterapeuta: fisioterapeutaId,
            fecha,
            estado: {
                $in: ["pendiente", "confirmada"]
            }
        });

        const horasOcupadas = citas.map((cita) => cita.hora);

        const horarios = [];

        for (const disponibilidad of disponibilidades) {
            let horaActual = disponibilidad.horaInicio;

            while (horaActual < disponibilidad.horaFin) {
                if (!horasOcupadas.includes(horaActual)) {
                    horarios.push(horaActual);
                }

                const [hora, minutos] = horaActual
                    .split(":")
                    .map(Number);

                const nuevaHora = hora + 1;

                if (nuevaHora >= 24) {
                    break;
                }

                horaActual = `${String(nuevaHora).padStart(2, "0")}:${String(
                    minutos
                ).padStart(2, "0")}`;
            }
        }

        res.json({
            fecha,
            dia,
            horarios
        });

    } catch (error) {
        console.error(
            "Error obteniendo horarios:",
            error
        );

        res.status(500).json({
            message: "Error interno del servidor"
        });
    }
};

//crear cita
export const createAppointment = async (req, res) => {
    try {
        const {
            fisioterapeutaId,
            fecha,
            hora
        } = req.body;

        if (!fisioterapeutaId || !fecha || !hora) {
            return res.status(400).json({
                message: "Fisioterapeuta, fecha y hora son obligatorios"
            });
        }

        // Verificar que el horario no esté ocupado
        const citaExiste = await Appointment.findOne({
            fisioterapeuta: fisioterapeutaId,
            fecha,
            hora,
            estado: {
                $in: ["pendiente", "confirmada"]
            }
        });

        if (citaExiste) {
            return res.status(409).json({
                message: "Este horario ya está ocupado"
            });
        }

        // Verificar que el horario realmente esté dentro
        // de la disponibilidad del fisioterapeuta
        const date = new Date(`${fecha}T00:00:00`);

        if (isNaN(date.getTime())) {
            return res.status(400).json({
                message: "La fecha no es válida"
            });
        }

        const fechaHoraCita = new Date(`${fecha}T${hora}:00`);

        if (isNaN(fechaHoraCita.getTime())) {
            return res.status(400).json({
                message: "La fecha u hora no son válidas"
            });
        }

        if (fechaHoraCita <= new Date()) {
            return res.status(400).json({
                message: "No puedes agendar una cita en una fecha u hora pasada"
            });
        }


        const diasSemana = [
            "domingo",
            "lunes",
            "martes",
            "miercoles",
            "jueves",
            "viernes",
            "sabado"
        ];

        const dia = diasSemana[date.getDay()];

        const disponibilidades = await Availability.find({
            fisioterapeuta: fisioterapeutaId,
            dia,
            activo: true
        });

        let horarioValido = false;

        for (const disponibilidad of disponibilidades) {
            if (
                hora >= disponibilidad.horaInicio &&
                hora < disponibilidad.horaFin
            ) {
                horarioValido = true;
                break;
            }
        }

        if (!horarioValido) {
            return res.status(400).json({
                message: "El fisioterapeuta no tiene disponibilidad en ese horario"
            });
        }

        const horaValida = /^([01]\d|2[0-3]):00$/.test(hora);

        if (!horaValida) {
            return res.status(400).json({
                message: "La hora debe tener formato HH:00"
            });
        }


        // Crear la cita
        const cita = await Appointment.create({
            paciente: req.usuario.id,
            fisioterapeuta: fisioterapeutaId,
            fecha,
            hora
        });

        res.status(201).json({
            message: "Cita creada correctamente",
            cita
        });

    } catch (error) {
        console.error(
            "Error creando cita:",
            error
        );

        res.status(500).json({
            message: "Error interno del servidor"
        });
    }
};

//ver mis citas
export const getMyAppointments = async (req, res) => {
    try {
        const citas = await Appointment.find({
            paciente: req.usuario.id
        })
            .populate(
                "fisioterapeuta",
                "nombre correo"
            )
            .sort({
                fecha: 1,
                hora: 1
            });

        res.json({
            citas
        });

    } catch (error) {
        console.error(
            "Error obteniendo mis citas:",
            error
        );

        res.status(500).json({
            message: "Error interno del servidor"
        });
    }
};

//ver citas
export const getAppointmentById = async (req, res) => {
    try {
        const cita = await Appointment.findOne({
            _id: req.params.id,
            paciente: req.usuario.id
        }).populate(
            "fisioterapeuta",
            "nombre correo"
        );

        if (!cita) {
            return res.status(404).json({
                message: "Cita no encontrada"
            });
        }

        res.json({
            cita
        });

    } catch (error) {
        console.error(
            "Error obteniendo la cita:",
            error
        );

        res.status(500).json({
            message: "Error interno del servidor"
        });
    }
};

//cancelar cita

export const cancelAppointment = async (req, res) => {
    try {
        const cita = await Appointment.findOne({
            _id: req.params.id,
            paciente: req.usuario.id
        });

        if (!cita) {
            return res.status(404).json({
                message: "Cita no encontrada"
            });
        }

        if (cita.estado === "cancelada") {
            return res.status(400).json({
                message: "La cita ya está cancelada"
            });
        }

        if (cita.estado === "completada") {
            return res.status(400).json({
                message: "No se puede cancelar una cita completada"
            });
        }

        cita.estado = "cancelada";

        await cita.save();

        res.json({
            message: "Cita cancelada correctamente",
            cita
        });

    } catch (error) {
        console.error(
            "Error cancelando la cita:",
            error
        );

        res.status(500).json({
            message: "Error interno del servidor"
        });
    }
};

//cambiar estados de la cita
export const updateAppointmentStatus = async (req, res) => {
    try {
        const { estado } = req.body;

        const estadosPermitidos = [
            "confirmada",
            "completada",
            "cancelada"
        ];

        if (!estado || !estadosPermitidos.includes(estado)) {
            return res.status(400).json({
                message:
                    "Estado inválido. Usa: confirmada, completada o cancelada"
            });
        }

        const cita = await Appointment.findOne({
            _id: req.params.id,
            fisioterapeuta: req.usuario.id
        });

        if (!cita) {
            return res.status(404).json({
                message: "Cita no encontrada"
            });
        }

        if (
            cita.estado === "completada" ||
            cita.estado === "cancelada"
        ) {
            return res.status(400).json({
                message: `No se puede modificar una cita ${cita.estado}`
            });
        }

        cita.estado = estado;

        await cita.save();

        res.json({
            message: "Estado de la cita actualizado correctamente",
            cita
        });

    } catch (error) {
        console.error(
            "Error actualizando estado de la cita:",
            error
        );

        res.status(500).json({
            message: "Error interno del servidor"
        });
    }
};

//historial de citas
export const getMyAppointmentHistory = async (req, res) => {
    try {
        const citas = await Appointment.find({
            paciente: req.usuario.id,
            estado: {
                $in: ["completada", "cancelada"]
            }
        })
            .populate(
                "fisioterapeuta",
                "nombre correo"
            )
            .sort({
                fecha: -1,
                hora: -1
            });

        res.json({
            citas
        });

    } catch (error) {
        console.error(
            "Error obteniendo historial de citas:",
            error
        );

        res.status(500).json({
            message: "Error interno del servidor"
        });
    }
};

//paciente vea las proximas citas
export const getMyFutureAppointments = async (req, res) => {
    try {
        const hoy = new Date().toISOString().split("T")[0];

        const citas = await Appointment.find({
            paciente: req.usuario.id,
            fecha: {
                $gte: hoy
            },
            estado: {
                $in: ["pendiente", "confirmada"]
            }
        })
            .populate(
                "fisioterapeuta",
                "nombre correo"
            )
            .sort({
                fecha: 1,
                hora: 1
            });

        res.json({
            citas
        });

    } catch (error) {
        console.error(
            "Error obteniendo citas futuras:",
            error
        );

        res.status(500).json({
            message: "Error interno del servidor"
        });
    }
};