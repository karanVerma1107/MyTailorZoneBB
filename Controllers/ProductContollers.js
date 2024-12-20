import cloudinary from 'cloudinary';
import Product from '../Models/productSchema.js';
import asyncHandler from '../Utility/AsyncHandler.js';
import ErrorHandler from '../Utility/APIerror.js';
import fs from 'fs';

cloudinary.config({
    cloud_name: "dwpdxuksp",
    api_key: "611646721796323",
    api_secret: "ejsJOwHcdFugMNDFy88WXPtPMd8"
});

// Add a product to inventory
export const addProduct = asyncHandler(async (req, res, next) => {
    const { name, description, price, category, stock, discount = 0 } = req.body; // Default discount to 0
    const images = req.files; // Assuming `req.files` contains the uploaded images

    // Check if user is admin
    if (req.user.role !== 'admin') {
        return next(new ErrorHandler('You are not authorized to add a product', 403));
    }

    try {
        // Validate input fields
        if (!name || !description || !price || !category || !stock) {
            return next(new ErrorHandler('Please provide all required product details', 400));
        }

        // Check if images were uploaded
        if (!images || images.length === 0) {
            return next(new ErrorHandler('No images uploaded for the product', 400));
        }

        // Upload images to Cloudinary
        let imageUrls = [];
        for (let image of images) {
            // Upload image to Cloudinary
            const result = await cloudinary.uploader.upload(image.path);
            imageUrls.push(result.secure_url); // Store the Cloudinary URL
        }

        // Delete local files after upload to Cloudinary
        for (let image of images) {
            fs.unlink(image.path, (err) => {
                if (err) {
                    console.error(`Failed to delete file: ${image.path}`, err);
                } else {
                    console.log(`File deleted from local server: ${image.path}`);
                }
            });
        }

        // Create the new product with the Cloudinary image URLs
        const newProduct = new Product({
            name,
            description,
            price,
            category,
            stock,
            discount,
            images: imageUrls, // Store Cloudinary image URLs
            createdBy: req.user._id, // Track who added the product
        });

        // Save the product to the database
        await newProduct.save();

        // Respond with success message
        return res.status(201).json({
            success: true,
            message: 'Product added successfully!',
            product: newProduct,
        });

    } catch (error) {
        console.error('Error adding product:', error);
        return next(new ErrorHandler('Error adding product. Please try again.', 500));
    }
});



// Admin can customize Product (price, stock)
export const customizeProduct = asyncHandler(async (req, res, next) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return next(new ErrorHandler('You are not authorized to perform this action', 403));
        }

        // Get product ID from the request params
        const { productId } = req.params;
        const { price, stock } = req.body;

        // Find the product to update
        const product = await Product.findById(productId);
        if (!product) {
            return next(new ErrorHandler('Product not found', 404));
        }

        // Default the price and stock to current values if not provided
        const updatedPrice = price !== undefined ? price : product.price;
        const updatedStock = stock !== undefined ? stock : product.stock;

        // Update the product with new price and/or stock
        product.price = updatedPrice;
        product.stock = updatedStock;

        // Save the updated product to the database
        await product.save();

        return res.status(200).json({
            success: true,
            message: 'Product customized successfully',
            product, // Return the updated product object
        });
    } catch (error) {
        console.log('Error during product customization:', error);
        return next(new ErrorHandler('Something went wrong, please try again', 500));
    }
});


// Function to get products for infinite scrolling with 10 products per page
export const getProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;  // Get page number from the query (default is 1)
        const limit = 10;  // Number of products per request (10 products per page)

        // Calculate the number of products to skip based on the current page
        const skip = (page - 1) * limit;

        // Fetch the products in reverse order (newest first) with pagination
        const products = await Product.find()
            .sort({ createdAt: -1 })  // Sort by creation date, descending (newest first)
            .skip(skip)  // Skip the already fetched products based on the page number
            .limit(limit)  // Limit the number of products returned
            .select('price images rating discounted_price');
        return res.status(200).json({ products });
    } catch (error) {
        return res.status(500).json({ message: `Error fetching products: ${error.message}` });
    }
};


// Function to search products by category
export const searchProducts = async (req, res) => {
    try {
        const searchTerm = req.query.searchTerm || '';  // Get the search term from query parameter

        // Ensure searchTerm is not empty
        if (!searchTerm) {
            return res.status(400).json({ message: 'Search term is required' });
        }

        // Use regex to search for the search term within the category array (case-insensitive)
        const products = await Product.find({
            category: { $regex: searchTerm, $options: 'i' },  // 'i' makes it case-insensitive
        })
        .select('name price discounted_price images rating')  // Select only relevant fields
        .exec();

        // If no products are found
        if (products.length === 0) {
            return res.status(404).json({ message: 'No products found for the given search term' });
        }

        // Return the products with required fields
        return res.status(200).json({ products });
    } catch (error) {
        return res.status(500).json({ message: `Error searching for products: ${error.message}` });
    }
};