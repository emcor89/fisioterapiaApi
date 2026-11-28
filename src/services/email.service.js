import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Verificar conexión con Gmail
export const verifyEmailConnection = async () => {
    return await transporter.verify();
};

// Enviar correo electrónico
export const sendEmail = async ({ to, subject, html }) => {
    return await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to,
        subject,
        html
    });
};