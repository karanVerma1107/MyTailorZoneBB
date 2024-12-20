import express from 'express';
import { isAuthenticatedUser } from '../Middleware/authentications.js';
import { applyDiscountToProduct, createDiscount, getDiscountedProducts } from '../Controllers/discountControllers.js';


const Disroute = express.Router();

Disroute.route('/create-discount').post(isAuthenticatedUser, createDiscount);
Disroute.route('/apply-discount/:productId').put(applyDiscountToProduct);
Disroute.route("/view-discounted-product").get(getDiscountedProducts);

export default Disroute;