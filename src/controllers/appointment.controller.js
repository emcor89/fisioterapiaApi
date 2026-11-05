import Availability from "../models/Availability.js";
import Appointment from "../models/Appointment.js";
import mongoose from "mongoose";

export const getAvailableHours = async (req, res, next) => {
    try {
        const { fisioterapeutaId, fecha } = req.query;

        if (!fisioterapeutaId || !fecha) {
            return res.status(400).json({
                message: "fisioterapeutaId y fecha son obligatorios"
            });
        }

        const formatoFecha = /^\d{4}-\d{2}-\d{2}$/;

        if (!formatoFecha.test(fecha)) {
            return res.status(400).json({
                message: "La fecha debe tener el formato YYYY-MM-DD"
            });
        }

        const date = new Date(`${fecha}T00:00:00`);

        if (
            isNaN(date.getTime()) ||
            date.toISOString().slice(0, 10) !== fecha
        ) {
            return res.status(400).json({
                message: "La fecha no es válida"
            });
        }

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        if (date < hoy) {
            return res.status(400).json({
                message: "No puedes consultar horarios de fechas pasadas"
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
        const ahora = new Date();

        const esHoy =
            fecha ===
            `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}-${String(ahora.getDate()).padStart(2, "0")}`;

        const horarios = [];

        for (const disponibilidad of disponibilidades) {
            let horaActual = disponibilidad.horaInicio;

            while (horaActual < disponibilidad.horaFin) {
                // if (!horasOcupadas.includes(horaActual)) {
                //     horarios.push(horaActual);
                // }
                const horaEsFutura =
                    !esHoy ||
                    horaActual > ahora.toTimeString().slice(0, 5);

                if (
                    !horasOcupadas.includes(horaActual) &&
                    horaEsFutura
                ) {
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
        next(error);
    }
};

//crear cita

export const createAppointment = async (req, res, next) => {
    try {
        const {
            fisioterapeutaId,
            fecha,
            hora
        } = req.body || {};

        // 1. Validar campos obligatorios
        if (!fisioterapeutaId || !fecha || !hora) {
            return res.status(400).json({
                message: "Fisioterapeuta, fecha y hora son obligatorios"
            });
        }

        // 2. Validar formato de fecha
        const formatoFecha = /^\d{4}-\d{2}-\d{2}$/;

        if (!formatoFecha.test(fecha)) {
            return res.status(400).json({
                message: "La fecha debe tener el formato YYYY-MM-DD"
            });
        }

        // 3. Validar que la fecha exista realmente
        const date = new Date(`${fecha}T00:00:00`);

        if (
            isNaN(date.getTime()) ||
            date.toISOString().slice(0, 10) !== fecha
        ) {
            return res.status(400).json({
                message: "La fecha no es válida"
            });
        }

        // 4. Validar formato de hora
        const horaValida = /^([01]\d|2[0-3]):00$/.test(hora);

        if (!horaValida) {
            return res.status(400).json({
                message: "La hora debe tener formato HH:00"
            });
        }

        // 5. Validar que la cita sea futura
        const fechaHoraCita = new Date(`${fecha}T${hora}:00`);

        if (fechaHoraCita <= new Date()) {
            return res.status(400).json({
                message: "No puedes agendar una cita en una fecha u hora pasada"
            });
        }

        // 6. Verificar que el horario no esté ocupado
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

        // 7. Obtener el día de la semana
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

        // 8. Consultar disponibilidad activa del fisioterapeuta
        const disponibilidades = await Availability.find({
            fisioterapeuta: fisioterapeutaId,
            dia,
            activo: true
        });

        // 9. Verificar que la hora esté dentro de la disponibilidad
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

        // 10. Crear la cita
        const cita = await Appointment.create({
            paciente: req.usuario.id,
            fisioterapeuta: fisioterapeutaId,
            fecha,
            hora
        });

        return res.status(201).json({
            message: "Cita creada correctamente",
            cita
        });

    } catch (error) {

        // Detectar duplicados generados por MongoDB
        if (error.code === 11000) {
            return res.status(409).json({
                message: "Este horario ya está ocupado"
            });
        }

        next(error);
    }
};


//ver mis citas
export const getMyAppointments = async (req, res, next) => {
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
        next(error);
    }
};

//ver citas
export const getAppointmentById = async (req, res, next) => {
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
        next(error);
    }
};

//cancelar cita

export const cancelAppointment = async (req, res, next) => {
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
        next(error);
    }
};

//cambiar estados de la cita

export const updateAppointmentStatus = async (req, res, next) => {
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

        const transicionesPermitidas = {
            pendiente: ["confirmada", "cancelada"],
            confirmada: ["completada", "cancelada"],
            completada: [],
            cancelada: []
        };

        if (!transicionesPermitidas[cita.estado]?.includes(estado)) {
            return res.status(400).json({
                message: `No se puede cambiar una cita de estado ${cita.estado} a ${estado}`
            });
        }

        cita.estado = estado;
        await cita.save();

        res.json({
            message: "Estado de la cita actualizado correctamente",
            cita
        });
    } catch (error) {
        next(error);
    }
};

//historial de citas
export const getMyAppointmentHistory = async (req, res, next) => {
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
        next(error);
    }
};

//paciente vea las proximas citas
export const getMyFutureAppointments = async (req, res, next) => {
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
        next(error);
    }
};

//ver las citas del fisio

export const getPhysiotherapistAppointments = async (req, res, next) => {
    try {
        const { estado, fecha } = req.query;

        const filtros = {
            fisioterapeuta: req.usuario.id
        };
        if (fecha) {
            const fechaValida =
                /^\d{4}-\d{2}-\d{2}$/.test(fecha) &&
                (() => {
                    const fechaDate = new Date(`${fecha}T00:00:00Z`);

                    return (
                        !Number.isNaN(fechaDate.getTime()) &&
                        fechaDate.toISOString().slice(0, 10) === fecha
                    );
                })();

            if (!fechaValida) {
                return res.status(400).json({
                    message: "La fecha no es válida. Usa el formato YYYY-MM-DD"
                });
            }

            filtros.fecha = fecha;
        }

        const estadosValidos = [
            "pendiente",
            "confirmada",
            "cancelada",
            "completada"
        ];

        if (estado) {
            if (!estadosValidos.includes(estado)) {
                return res.status(400).json({
                    message: "Estado no válido",
                    estadosPermitidos: estadosValidos
                });
            }

            filtros.estado = estado;
        }

        const citas = await Appointment.find(filtros)
            .populate("paciente", "nombre correo")
            .sort({
                fecha: 1,
                hora: 1
            });

        res.json({
            total: citas.length,
            citas
        });
    } catch (error) {
        next(error);
    }
};

//resumen de citas 

export const getPhysiotherapistAppointmentSummary = async (req, res, next) => {
    try {
        const fisioterapeutaId = req.usuario.id;

        const resumen = await Appointment.aggregate([
            {
                $match: {
                    fisioterapeuta: new mongoose.Types.ObjectId(
                        fisioterapeutaId
                    )
                }
            },
            {
                $group: {
                    _id: "$estado",
                    cantidad: { $sum: 1 }
                }
            }
        ]);

        const resultado = {
            total: 0,
            pendientes: 0,
            confirmadas: 0,
            canceladas: 0,
            completadas: 0
        };

        resumen.forEach((item) => {
            resultado.total += item.cantidad;

            if (item._id === "pendiente") {
                resultado.pendientes = item.cantidad;
            } else if (item._id === "confirmada") {
                resultado.confirmadas = item.cantidad;
            } else if (item._id === "cancelada") {
                resultado.canceladas = item.cantidad;
            } else if (item._id === "completada") {
                resultado.completadas = item.cantidad;
            }
        });

        res.json(resultado);
    } catch (error) {
        next(error);
    }
};
