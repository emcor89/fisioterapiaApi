import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
    {
        paciente: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        fisioterapeuta: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        fecha: {
            type: String,
            required: true
        },

        hora: {
            type: String,
            required: true
        },

        estado: {
            type: String,
            enum: [
                "pendiente",
                "confirmada",
                "cancelada",
                "completada"
            ],
            default: "pendiente"
        }
    },
    {
        timestamps: true
    }
);

const Appointment = mongoose.model(
    "Appointment",
    appointmentSchema
);

export default Appointment;