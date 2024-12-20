class ErrorHandler extends Error {
    // Constructor to handle message, status code, and optional error details
    constructor(message, statusCode, error = [], stack = '') {
        super(message);
        this.statusCode = statusCode; // Set HTTP status code
        this.data = null; // Additional data (can be used if needed)
        this.error = error; // Error details (can be an array of errors)
        this.success = false; // Success flag

        // Capture the stack trace if it's provided, else default behavior
        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export default ErrorHandler;
