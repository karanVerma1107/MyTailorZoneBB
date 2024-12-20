import Product from "../Models/productSchema.js";
import User from "../Models/userSchema.js";
import Discount from "../Models/discountModel.js";
import ErrorHandler from "../Utility/APIerror.js";
import asyncHandler from "../Utility/AsyncHandler.js";



// Function to create a discount and add products based on condition
export const createDiscount = asyncHandler(async (req, res, next) => {
    const { conditionType, value, discountName, validityDate, discountPercentage, choice } = req.body;

    try {

          // Check if user is admin
    if (req.user.role !== 'admin') {
        return next(new ErrorHandler('You are not authorized to add a product', 403));
    }

        // Validate input fields
        if (!conditionType || !value || !discountName || !validityDate || !discountPercentage || !choice) {
            return next(new ErrorHandler('Please provide conditionType, value, discountName, validityDate, discountPercentage, and choice', 400));
        }

        // Create a new discount document
        const discount = new Discount({
            discountName,
            discountPercentage,
            discountValidity: validityDate,
            conditionType,
            choice,
            value,
            products: [],  // Initially, no products are added
        });

        // Query the products to apply the discount based on condition
        const products = await Product.find({}).sort({ createdAt: -1 }); // Sort products (most recent first)

        let productsAdded = 0;

        // Iterate over products and add them to the discount if they meet the condition
        for (let i = 0; i < products.length; i++) {
            const product = products[i];

            // Skip product if it is already added or if stock/price does not meet the condition
            if (discount.products.includes(product._id) || product.discounted_price>0) {
                continue;  // Skip to next product
            }

            // Check if the product meets the specified condition (stock or price)
            let conditionMet = false;

            if (conditionType === 'stock') {
                // Apply the 'greater than' or 'less than' condition for stock
                if (choice === 'greater than') {
                    conditionMet = (product.stock > value);
                } else if (choice === 'less than') {
                    conditionMet = (product.stock < value);
                }
            } else if (conditionType === 'price') {
                // Apply the 'greater than' or 'less than' condition for price
                if (choice === 'greater than') {
                    conditionMet = (product.price > value);
                } else if (choice === 'less than') {
                    conditionMet = (product.price < value);
                }
            }

            // If condition is met and less than 15 products are added, update product price and add it to the discount
            if (conditionMet && productsAdded < 15) {
                // Calculate the discounted price
                const discountAmount = (product.price * discountPercentage) / 100;
                const discountedPrice = product.price - discountAmount;

                // Update the product with the new discounted price
                product.discount = discountPercentage;
                product.discounted_price = discountedPrice;
                product.discount_validity = validityDate;

                // Save the updated product
                await product.save();

                // Add the product to the discount
                discount.products.push(product._id);
                productsAdded++;

                // Stop if 15 products are added
                if (discount.products.length >= 15) {
                    break;
                }
            }
        }

        // Save the discount document after adding the products
        await discount.save();

        // Return a success message after discount is created
        return res.status(201).json({
            success: true,
            message: 'Discount created and products updated successfully',
            discount
        });

    } catch (error) {
        console.log('Error creating discount:', error);
        return next(new ErrorHandler('Something went wrong, please try again later', 500));
    }
});



// Function to apply a discount to a product if not already applied
export const applyDiscountToProduct = asyncHandler(async (req, res, next) => {
    const { productId } = req.params;

    try {
        // Step 1: Find the product by its ID
        const product = await Product.findById(productId);
        if (!product) {
            return next(new ErrorHandler('Product not found', 404));
        }

        // Step 2: Check if the product already has a discount
        if (product.DiscountId) {
            // If the product already has a discount, let it go (do nothing)
            return;
        }

        // Step 3: Query all discounts (limit to 5 discounts for performance)
        const discounts = await Discount.find({}).limit(5); // No more than 5 discounts
        let discountApplied = false;

        // Step 4: Check each discount for applicability
        for (let i = 0; i < discounts.length; i++) {
            const discount = discounts[i];
            let conditionMet = false;

            // Check if product qualifies for this discount
            if (discount.conditionType === 'stock') {
                // Stock-based condition
                if (discount.choice === 'greater than' && product.stock > discount.value) {
                    conditionMet = true;
                } else if (discount.choice === 'less than' && product.stock < discount.value) {
                    conditionMet = true;
                }
            } else if (discount.conditionType === 'price') {
                // Price-based condition
                if (discount.choice === 'greater than' && product.price > discount.value) {
                    conditionMet = true;
                } else if (discount.choice === 'less than' && product.price < discount.value) {
                    conditionMet = true;
                }
            }

            // Step 5: If the product qualifies for the discount, apply it
            if (conditionMet) {
                // Apply the discount to the product
                product.DiscountId = discount._id;
                await product.save();

                // Add product reference to the discount schema if not already added
                if (!discount.products.includes(product._id)) {
                    discount.products.push(product._id);
                    await discount.save();
                }

                discountApplied = true;
                break; // Stop once the first applicable discount is found
            }
        }

        // Step 6: If no discount applies, nothing happens (no response sent)
        if (!discountApplied) {
            return;
        }

    } catch (error) {
        console.error('Error applying discount:', error);
        return next(new ErrorHandler('Something went wrong while applying the discount', 500));
    }
});




// Function to get products associated with a discount
export const getDiscountedProducts = async (req, res) => {
    try {
        const discountId = req.body.discountId;  // Get discountId from the request body
        const page = parseInt(req.query.page) || 1;  // Get page number from the query (default is 1)
        const limit = 6;  // Number of products per request (6 products per page)

        // Check if discountId is provided
        if (!discountId) {
            return res.status(400).json({ message: 'Discount ID is required' });
        }

        // Find the discount by ID
        const discount = await Discount.findById(discountId).populate('products');
        
        if (!discount) {
            return res.status(404).json({ message: 'Discount not found' });
        }

        // Calculate the number of products to skip based on the current page
        const skip = (page - 1) * limit;

        // Get the products associated with the discount
        const discountedProducts = discount.products
            .map(product => ({
                _id: product._id,
                price: product.price,
                discounted_price: product.discounted_price,
                images: product.images,
                rating: product.rating,
            }))
            .slice(skip, skip + limit);  // Apply pagination to the products array

        return res.status(200).json({ products: discountedProducts });

    } catch (error) {
        return res.status(500).json({ message: `Error fetching discounted products: ${error.message}` });
    }
};