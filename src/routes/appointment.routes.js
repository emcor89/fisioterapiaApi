
import express from "express";

import {
    getAvailableHours,
    createAppointment,
    getMyAppointments,
    getAppointmentById,
    cancelAppointment,
    updateAppointmentStatus,
    getMyAppointmentHistory,
    getMyFutureAppointments
} from "../controllers/appointment.controller.js";

import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";

const router = express.Router();

// Consultar horarios disponibles
router.get(
    "/disponibles",
    getAvailableHours
);

// Crear una cita
router.post(
    "/",
    authMiddleware,
    roleMiddleware("paciente"),
    createAppointment
);

// Consultar todas mis citas
router.get(
    "/mis-citas",
    authMiddleware,
    roleMiddleware("paciente"),
    getMyAppointments
);

// Consultar historial de citas
router.get(
    "/mis-citas/historial",
    authMiddleware,
    roleMiddleware("paciente"),
    getMyAppointmentHistory
);

// Consultar próximas citas
router.get(
    "/mis-citas/futuras",
    authMiddleware,
    roleMiddleware("paciente"),
    getMyFutureAppointments
);

// Consultar una cita específica
router.get(
    "/mis-citas/:id",
    authMiddleware,
    roleMiddleware("paciente"),
    getAppointmentById
);

// Cancelar una cita
router.patch(
    "/mis-citas/:id/cancelar",
    authMiddleware,
    roleMiddleware("paciente"),
    cancelAppointment
);

// Actualizar estado de una cita
router.patch(
    "/citas/:id/estado",
    authMiddleware,
    roleMiddleware("fisioterapeuta"),
    updateAppointmentStatus
);

export default router;