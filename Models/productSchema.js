import mongoose from 'mongoose';

// Schema for Product
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be less than 0'],
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  category: [{
    type: String,
    required: true,
    
  }],
  stock: {
    type: Number,
    required: true,
    default: 0, // Assuming initial stock could be 0
  },
  images: [{
    type: String,
    required: true,
  }],
  DiscountId: {
    type: mongoose.Schema.Types.ObjectId
  },
  discount: {
    type: Number,
    default: 0, // Default value for discount is 0
  },
  discounted_price:{
    type:Number,
    default: 0
  },
  discount_validity:{
    type:Date,
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0, // Default rating set to 0
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  // Reviews - Array of review objects
  reviews: [
    {
      reviewerName: {
        type: String,
        required: true,
      },
      rating: {
        type: Number,
        required: true,
        min: 0,
        max: 5,
      },
      comment: {
        type: String,
        required: true,
        trim: true,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    }
  ],
  // FAQs - Array of FAQ objects
  faqs: [
    {
      question: {
        type: String,
        required: true,
      },
      answer: {
        type: String, // Optional answer
       
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    }
  ],
});

// To ensure that the `updatedAt` field is automatically updated on every save operation
productSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Model based on schema
const Product = mongoose.model('Product', productSchema);

export default Product;
