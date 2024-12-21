// authRoutes.js

import express from 'express';
import { addToCart, addToWishlist, logout, otpSendToVerify,  removeFromCart,  removeFromWishlist,  sendLoginOtp,   verifyOtpAndCreateAccount, verifyOtpAndLogin } from '../Controllers/UserContollers.js';
import { isAuthenticatedUser } from '../Middleware/authentications.js';

const Userrouter = express.Router();

// Route to send OTP for email verification
Userrouter.route('/send-otp').post(otpSendToVerify);

// Route to verify OTP and create a new user
Userrouter.route('/verify-otp').post( verifyOtpAndCreateAccount);

//route to logout the user
Userrouter.route("/logout").post( isAuthenticatedUser, logout);

//route to login user
Userrouter.route("/login-otp").post(sendLoginOtp);


//route to verify login otp
Userrouter.route("/verify-login-otp").post(verifyOtpAndLogin);


Userrouter.route('/addToCart').post(isAuthenticatedUser, addToCart);

Userrouter.route('/addToWishlist').post(isAuthenticatedUser, addToWishlist);

Userrouter.route('/removeFromWishlist').delete(isAuthenticatedUser, removeFromWishlist);


Userrouter.route('/removeFromCart').delete(isAuthenticatedUser, removeFromCart);


export default Userrouter;
