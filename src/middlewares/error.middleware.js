
// ¿Qué hará este middleware?
// - Recibirá los errores que se produzcan en la API.
// - Registrará los detalles del error en la terminal.
// - Devolverá una respuesta JSON uniforme.
// - Evitará mostrar detalles internos del servidor al cliente.


const errorHandler = (err, req, res, next) => {
    console.error("Error:", err);

    if (res.headersSent) {
        return next(err);
    }

    const statusCode = err.statusCode || 500;

    const message =
        statusCode >= 500
            ? "Error interno del servidor"
            : err.message;

    res.status(statusCode).json({
        message
    });
};

export default errorHandler;
