import mongoose from "mongoose";

const availabilitySchema = new mongoose.Schema(
    {
        fisioterapeuta: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        dia: {
            type: String,
            required: true,
            enum: [
                "lunes",
                "martes",
                "miercoles",
                "jueves",
                "viernes",
                "sabado",
                "domingo"
            ]
        },

        horaInicio: {
            type: String,
            required: true
        },

        horaFin: {
            type: String,
            required: true
        },

        activo: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

const Availability = mongoose.model(
    "Availability",
    availabilitySchema
);

export default Availability;