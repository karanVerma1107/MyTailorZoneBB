import express from 'express'
import { isAuthenticatedUser } from '../Middleware/authentications.js';
import { addProduct, customizeProduct, getProducts, searchProducts } from '../Controllers/ProductContollers.js';
import { upload } from '../Middleware/multer.js';




const ProductRoute = express.Router();

ProductRoute.route('/add-product').post(isAuthenticatedUser, upload.array('images', 5), addProduct);

ProductRoute.route('/customize/:productId').put(isAuthenticatedUser, customizeProduct);

ProductRoute.route('/getProduct').get(getProducts);

ProductRoute.route('/searchProduct').get(searchProducts)

export default ProductRoute;