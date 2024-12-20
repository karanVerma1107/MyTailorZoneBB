import jwt from 'jsonwebtoken';
import User from '../Models/userSchema.js';
import asyncHandler from '../Utility/AsyncHandler.js';
import ErrorHandler from '../Utility/APIerror.js';

// Verify Access Token Helper Function
const verifyAccess = async (token) => {
    try {
        if (!token) {
            throw new ErrorHandler('Login to access this resource', 401);
        }

        const decodedData = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        if (!decodedData || decodedData === undefined) {
            throw new ErrorHandler('User not found, login to access this resource', 401);
        }

        const user = await User.findById(decodedData._id);

        if (!user || user === undefined) {
            throw new ErrorHandler('User not found', 401);
        }

        return { user, decodedData };
    } catch (error) {
        console.log('Token verification error: ', error);
        throw new ErrorHandler('Invalid token', 402);
    }
}

// Middleware to authenticate user
export const isAuthenticatedUser = asyncHandler(async (req, res, next) => {
    console.log("runned hai");
    const token = req.cookies.accessToken;
    console.log("token is:", token);

    if (!token) {
        return next(new ErrorHandler('Login to access this resource', 401));
    }

    try {
        const { user, decodedData } = await verifyAccess(token);

        // If user or decoded data is missing or undefined
        if (!user || !decodedData || user === undefined) {
            return next(new ErrorHandler('Login to access this resource', 400));
        }

        // Assign user and tokenData to the request object
        req.user = user;
        req.tokenData = decodedData;

        console.log("Decoded data: ", decodedData);

        next();
    } catch (error) {
        console.log('Auth error: ', error);
        return next(new ErrorHandler('Unauthorized', 401));
    }
});
