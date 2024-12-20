// Error Handling Middleware
const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Something went wrong';
    const error = err.error || null;
    const success = err.success !== undefined ? err.success : false;

    // Send the error response in JSON format
    return res.status(statusCode).json({
        success: success,
        message: message,
        error: error,
        stack: err.stack || null, // You can choose to omit stack trace in production
    });
};

export default errorHandler;
