import mongoose from 'mongoose';

const discountSchema = new mongoose.Schema({
    discountName: {
        type: String,
        required: true, // Name of the discount (e.g., "Summer Sale", "Winter Offer")
        trim: true,
    },
    discountPercentage: {
        type: Number,
        required: true, // Percentage of discount (e.g., 10 for 10% discount)
        min: [0, 'Discount cannot be less than 0'],
        max: [100, 'Discount cannot be more than 100'],
    },
    discountValidity: {
        type: Date,
        required: true, // The date until the discount is valid (e.g., '2024-12-31')
    },
    conditionType: {
        type: String,
        enum: ['stock', 'price'],
        required: true, // Condition type for discount (stock or price)
    },
    value: {
        type: Number,
        required: true, // The value for the condition (e.g., minimum stock or price)
    },
    products: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product', // Referencing the Product model
        required: true, // List of product IDs that this discount applies to
    }],
    discountAmount: {
        type: Number,
        default: 0, // The calculated discount amount for each product (optional if needed)
    },
    discountedPrice: {
        type: Number,
        default: 0, // The new price after applying the discount (optional if needed)
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

// To ensure the `updatedAt` field is automatically updated on every save operation
discountSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Model based on schema
const Discount = mongoose.model('Discount', discountSchema);

export default Discount;
