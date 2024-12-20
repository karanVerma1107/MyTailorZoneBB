import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

// User schema definition
const userSchema = new mongoose.Schema({
    // User's unique username
    userName: {
        type: String,
    },
    
    // Full name of the user (required)
    name: {
        type: String,
        required: true,
    },

    // User's email (required and unique to prevent duplicates)
    email: {
        type: String,
        required: true,
        unique: true,
    },

    // OTP (One Time Password) for verifying user (optional)
    OTP: {
        type: String,
    },

    // OTP expiration date
    OTP_EXPIRE: {
        type: Date,
    },

    // Role of the user, can either be 'customer' or 'admin'
    role: {
        type: String,
        enum: ['customer', 'admin'], // Admin role for backend management
        default: 'customer', // Default role for new users
    },

    // Wishlist to store products that the user wants to purchase later
    wishList: [{
        type: mongoose.Schema.ObjectId,
        ref: 'Product', // Reference to the Product model
    }],

    // Cart stores products that the user intends to purchase
    cart: [{
        productId: {
            type: mongoose.Schema.ObjectId,
            ref: 'Product', // Reference to the Product model
        },
        quantity: {
            type: Number,
            default: 1, // Default quantity is 1
        },
    }],

    // Order history stores all completed orders for the user
    orderHistory: [{
        orderId: {
            type: mongoose.Schema.ObjectId,
            ref: 'Order', // Reference to the Order model
        },
        status: {
            type: String,
            enum: ['pending', 'completed', 'shipped'], // Order status options
            default: 'pending', // Default status is 'pending'
        },
        totalAmount: {
            type: Number, // Total cost of the order
        },
        orderedAt: {
            type: Date,
            default: Date.now, // Timestamp when the order was made
        },
    }],

    // User's phone number (optional)
    phoneNo: {
        type: String,
    },

    // Refresh token to authenticate user (used for generating new access tokens)
    refreshToken: {
        type: String,
    },

    // Array of user addresses, can contain multiple addresses
    addresses: [{
        street: {
            type: String,
            required: true, // Street address is required
        },
        city: {
            type: String,
            required: true, // City is required
        },
        state: {
            type: String,
            required: true, // State is required
        },
        country: {
            type: String,
            required: true, // Country is required
        },
        zipCode: {
            type: String,
            required: true, // Zip code is required
        },
        isPrimary: {
            type: Boolean,
            default: false, // Marks the primary address, default is false
        },
    }],
}, {
    timestamps: true, // Automatically adds createdAt and updatedAt timestamps
});

// Hash the OTP before saving to database if it's modified
userSchema.pre('save', async function(next) {
    if (this.isModified('OTP')) {
        const saltRounds = await bcrypt.genSalt(10); // Generate salt for hashing
        this.OTP = await bcrypt.hash(this.OTP, saltRounds); // Hash OTP before saving
    }
    next(); // Proceed to save the document
});

// Method to check if the provided OTP matches the stored OTP
userSchema.methods.isOTPcorrect = async function(OtP) {
    return await bcrypt.compare(OtP, this.OTP); // Compare provided OTP with the stored hashed OTP
}

// Method to generate an access token for authentication
userSchema.methods.generateAccessToken = function() {
    return jwt.sign({
        _id: this._id,       // User's unique ID
        username: this.userName,  // Username of the user
        name: this.name,     // Full name of the user
        email: this.email,   // Email address of the user
        role: this.role,     // Role of the user (customer/admin)
    }, 
    process.env.ACCESS_TOKEN_SECRET, { // Use the secret key from environment variables
        expiresIn: process.env.ACCESS_TOKEN_EXPIRE, // Expiry time for the access token
    });
}

// Method to generate a refresh token (used to renew access token)
userSchema.methods.generateRefreshToken = function() {
    return jwt.sign({
        _id: this._id,       // User's unique ID
    },
    process.env.REFRESH_TOKEN_SECRET, { // Use the refresh token secret from environment variables
        expiresIn: process.env.REFRESH_TOKEN_EXPIRE, // Expiry time for the refresh token
    });
}

// Create and export the User model based on the schema
const User = mongoose.model('User', userSchema);
export default User;
