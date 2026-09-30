import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        nombre: {
            type: String,
            required: true,
            trim: true
        },

        cedula: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        correo: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        edad: {
            type: Number,
            required: true,
            min: 1
        },

        sexo: {
            type: String,
            required: true,
            enum: ["masculino", "femenino", "otro"]
        },

        password: {
            type: String,
            required: true,
            minlength: 6
        },

        rol: {
            type: String,
            enum: ["paciente", "fisioterapeuta", "admin"],
            default: "paciente"
        }
    },
    {
        timestamps: true
    }
);

const User = mongoose.model("User", userSchema);

export default User;