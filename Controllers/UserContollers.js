import sendEmail from "../Helpers/SendEmail.js";
import asyncHandler from "../Utility/AsyncHandler.js";
import ErrorHandler from "../Utility/APIerror.js";
import User from "../Models/userSchema.js";
import Product from "../Models/productSchema.js";
import jwt from 'jsonwebtoken';

// OTP creator function
const generateOTP = () => {
    const otp = Math.floor(100000 + Math.random() * 900000);
    return otp.toString(); // Return OTP as a string
};

// Generate and save tokens function
const generateAndSaveTokens = async (user, res) => {
    try {
        // Generate refresh token
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken;

        // Save user with refresh token
        await user.save();

        // Generate access token
        const accessToken = user.generateAccessToken();

        // Set access token as a cookie
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'None',
            expires: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
            path: '/'
        });

        console.log('refreshToken:', refreshToken);
        console.log('accessToken:', accessToken);

        return { refreshToken, accessToken };
    } catch (error) {
        console.log('Error generating tokens:', error);
        throw new Error('Error in generating tokens');
    }
};

// OTP Send for Signup
export const otpSendToVerify = asyncHandler(async (req, res, next) => {
    const { name, email } = req.body;

    try {
        console.log('Email is:', email);

        // Check if the user already exists
        let existingUser = await User.findOne({ email: email });
        if (existingUser) {
            return next(new ErrorHandler('User already exists with this email', 400));
        }

        // Generate OTP and set its expiration
        const otp = generateOTP();
        const otpExpire = Date.now() + 10 * 60 * 1000; // OTP expires in 10 minutes

        // Create a temporary user document for OTP verification
        const tempUser = new User({
            name: name,
            email: email,
            OTP: otp,
            OTP_EXPIRE: otpExpire,
            
        });

        

        // Compose the OTP email text
        const text = `Your OTP for sign-up in My_Tailor_Zone with username: ${tempUser.name} is: ${otp}`;

        // Send OTP email to the user
        await sendEmail({
            email: tempUser.email,
            subject: 'My_Tailor_Zone Verification for Sign-Up',
            text
        });

        // Save the temporary user document
        await tempUser.save();

        // Respond back with success message
        return res.status(200).json({
            success: true,
            message: "OTP has been successfully sent to your email"
        });

    } catch (error) {
        console.log('Error while sending OTP:', error);
        return next(new ErrorHandler('Something went wrong, please try again', 500));
    }
});



// OTP Verification and Account Creation
export const verifyOtpAndCreateAccount = asyncHandler(async (req, res, next) => {
    const { email, otp } = req.body;

    try {
        // Find the temporary user based on email
        const tempUser = await User.findOne({ email: email });
        if (!tempUser) {
            return next(new ErrorHandler('Invalid user or incorrect OTP', 400));
        }

        // Check if OTP has expired
        if (tempUser.OTP_EXPIRE < Date.now()) {
            await tempUser.deleteOne(); // Optionally delete expired OTP
            return next(new ErrorHandler('OTP has expired, please try again', 400));
        }

        // Verify if the provided OTP matches the stored OTP
        const isCorrect = await tempUser.isOTPcorrect(otp);
        if (!isCorrect) {
            await tempUser.deleteOne(); // Optionally delete the invalid OTP attempt
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP or OTP expired, please try again'
            });
        }

        // Generate username based on email (before the @ symbol)
        const username = email.split('@')[0];

        // Create a new user and transfer data from tempUser
        const user = new User({
            name: tempUser.name,
            email: tempUser.email,
            userName: username, // Set username from email
        });


         // Delete the temporary user after successful signup
         await tempUser.deleteOne();

        // Save the new user in the database
        await user.save();

       

        // Generate and save tokens
        await generateAndSaveTokens(user, res);

        console.log('OTP verified and account created successfully');

        return res.status(201).json({
            success: true,
            message: 'Account created and OTP verified successfully',
            user // Return the user object or other data as needed
        });

    } catch (error) {
        console.log('Error during OTP verification:', error);
        return next(new ErrorHandler('Internal server error', 500));
    }
});



// LogOut user by deleting the token from cookies
export const logout = asyncHandler(async (req, res, next) => {
    try {
        const user = req.user;

        if (!user) {
            return next(new ErrorHandler('User is not logged in', 400));
        }

        // Clear the access token from cookies
        res.clearCookie('accessToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',  // Set to true in production for HTTPS
            sameSite: 'None',
            path: '/'
        });

        // Optionally, clear refresh token from the user object
        user.refreshToken = null;
        await user.save();  // Save the user after clearing the refresh token

        

        // Return a successful response
        return res.status(200).json({
            success: true,
            message: 'User logged out successfully'
        });

    } catch (error) {
        console.log('Error during logout:', error);
        return next(new ErrorHandler('Logout failed', 500));
    }
});



export const sendLoginOtp = asyncHandler(async (req, res, next) => {
    const { email } = req.body;  // Get the email from the request body

    try {
        // Check if the user exists
        const user = await User.findOne({ email: email });
        if (!user) {
            return next(new ErrorHandler('User not found with this email', 404));
        }

        // Generate OTP and set its expiration time (10 minutes)
        const otp = generateOTP();
        const otpExpire = Date.now() + 10 * 60 * 1000;  // OTP expires in 10 minutes

        // Update the user's OTP and expiration time
        user.OTP = otp;
        user.OTP_EXPIRE = otpExpire;

        // Save the user document with the OTP information
        await user.save();

        // Compose the OTP email text
        const text = `Your OTP for login to My_Tailor_Zone is: ${otp}. This OTP is valid for 10 minutes.`;

        // Send the OTP email to the user
        await sendEmail({
            email: user.email,
            subject: 'My_Tailor_Zone Login OTP',
            text
        });

        // Respond with a success message
        return res.status(200).json({
            success: true,
            message: 'OTP has been successfully sent to your email.'
        });

    } catch (error) {
        console.log('Error while sending login OTP:', error);
        return next(new ErrorHandler('Something went wrong, please try again', 500));
    }
});




// OTP Verification and Login
export const verifyOtpAndLogin = asyncHandler(async (req, res, next) => {
    const { email, otp } = req.body;

    try {
        // Find the user based on email
        const user = await User.findOne({ email: email });
        if (!user) {
            return next(new ErrorHandler('User not found with this email', 400));
        }

        // Check if OTP has expired
        if (user.OTP_EXPIRE < Date.now()) {
            // OTP expired, clear OTP and its expiration
            user.OTP = null;
            user.OTP_EXPIRE = null;
            await user.save();
            return next(new ErrorHandler('OTP has expired, please request a new one', 400));
        }

        // Verify if the provided OTP matches the stored OTP
        const isCorrect = await user.isOTPcorrect(otp);
        if (!isCorrect) {
            // Clear OTP after incorrect attempt
            
            await user.save();
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP, please try again'
            });
        }

        // OTP is valid, now generate and return an access token
        const accessToken = await generateAndSaveTokens(user, res); // Assuming tokens are generated and set via this function

        // Clear OTP after successful verification
       
        await user.save();

        // Respond with success message and the user's details
        return res.status(200).json({
            success: true,
            message: 'OTP verified successfully, login successful',
            accessToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                userName: user.userName,
            },
        });

    } catch (error) {
        console.log('Error during OTP verification and login:', error);
        return next(new ErrorHandler('Something went wrong, please try again', 500));
    }
});





// Function to add a product to the user's cart
export const addToCart = async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;  // Getting productId and quantity from the request body

        // Check if the productId is provided
        if (!productId) {
            return res.status(400).json({ message: 'Product ID is required' });
        }

        // Check if req.user exists, if not, prompt to log in
        if (!req.user) {
            return res.status(401).json({ message: 'Please log in to access this resource' });
        }

        // Find the user from the request object (already authenticated via middleware)
        const user = req.user;

        // Validate if the product exists in the database
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Check if the product is already in the cart
        const existingCartItem = user.cart.find(item => item.productId.toString() === productId.toString());

        if (existingCartItem) {
            // If the product already exists in the cart, update the quantity
            existingCartItem.quantity += quantity;
        } else {
            // If not, add the product to the cart
            user.cart.push({ productId, quantity });
        }

        // Save the updated user document
        await user.save();

        return res.status(200).json({ message: 'Product added to cart', cart: user.cart });
    } catch (error) {
        return res.status(500).json({ message: `Failed to add product to cart: ${error.message}` });
    }
};

// Function to add a product to the user's wishlist
export const addToWishlist = async (req, res) => {
    try {
        const { productId } = req.body;  // Getting productId from the request body

        // Check if the productId is provided
        if (!productId) {
            return res.status(400).json({ message: 'Product ID is required' });
        }

        // Check if req.user exists, if not, prompt to log in
        if (!req.user) {
            return res.status(401).json({ message: 'Please log in to access this resource' });
        }

        // Find the user from the request object (already authenticated via middleware)
        const user = req.user;

        // Validate if the product exists in the database
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Check if the product is already in the wishlist
        const existingWishlistItem = user.wishList.find(item => item.toString() === productId.toString());

        if (existingWishlistItem) {
            return res.status(400).json({ message: 'Product already in wishlist' });
        }

        // If not, add the product to the wishlist
        user.wishList.push(productId);

        // Save the updated user document
        await user.save();

        return res.status(200).json({ message: 'Product added to wishlist', wishList: user.wishList });
    } catch (error) {
        return res.status(500).json({ message: `Failed to add product to wishlist: ${error.message}` });
    }
};





// Function to remove a product from the user's cart
export const removeFromCart = async (req, res) => {
    try {
        const { productId } = req.body;  // Getting productId from the request body

        // Check if the productId is provided
        if (!productId) {
            return res.status(400).json({ message: 'Product ID is required' });
        }

        // Check if req.user exists, if not, prompt to log in
        if (!req.user) {
            return res.status(401).json({ message: 'Please log in to access this resource' });
        }

        // Find the user from the request object (already authenticated via middleware)
        const user = req.user;

        // Check if the product exists in the database
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Check if the product exists in the user's cart
        const productIndex = user.cart.findIndex(item => item.productId.toString() === productId.toString());

        if (productIndex === -1) {
            return res.status(404).json({ message: 'Product not found in cart' });
        }

        // Remove the product from the cart
        user.cart.splice(productIndex, 1);

        // Save the updated user document
        await user.save();

        return res.status(200).json({ message: 'Product removed from cart', cart: user.cart });
    } catch (error) {
        return res.status(500).json({ message: `Failed to remove product from cart: ${error.message}` });
    }
};

// Function to remove a product from the user's wishlist
export const removeFromWishlist = async (req, res) => {
    try {
        const { productId } = req.body;  // Getting productId from the request body

        // Check if the productId is provided
        if (!productId) {
            return res.status(400).json({ message: 'Product ID is required' });
        }

        // Check if req.user exists, if not, prompt to log in
        if (!req.user) {
            return res.status(401).json({ message: 'Please log in to access this resource' });
        }

        // Find the user from the request object (already authenticated via middleware)
        const user = req.user;

        // Check if the product exists in the database
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Check if the product exists in the user's wishlist
        const productIndex = user.wishList.findIndex(item => item.toString() === productId.toString());

        if (productIndex === -1) {
            return res.status(404).json({ message: 'Product not found in wishlist' });
        }

        // Remove the product from the wishlist
        user.wishList.splice(productIndex, 1);

        // Save the updated user document
        await user.save();

        return res.status(200).json({ message: 'Product removed from wishlist', wishList: user.wishList });
    } catch (error) {
        return res.status(500).json({ message: `Failed to remove product from wishlist: ${error.message}` });
    }
};

