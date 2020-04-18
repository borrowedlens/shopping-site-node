const express = require('express');

const shopController = require('../controllers/ShopController');
const authChecker = require('../middleware/auth-checker');

const router = express.Router();

router.get('/', shopController.getIndex);

router.get('/products', shopController.getProducts);

router.get('/products/:productId', shopController.getProduct);

router.get('/cart', authChecker, shopController.getCart);

router.post('/cart', authChecker, shopController.postCart);

router.post('/cart-delete-item', authChecker, shopController.deleteCartItem);

// router.post('/create-order', authChecker, shopController.postOrder); // using this for checkout success, same controller just renamed to getCheckoutSuccess

router.get('/checkout', authChecker, shopController.getCheckout);

router.get('/checkout/success', authChecker, shopController.getCheckoutSuccess); //here

router.get('/checkout/cancel', authChecker, shopController.getCheckout);

router.get('/orders', authChecker, shopController.getOrders);

router.get('/orders/:orderId', authChecker, shopController.getInvoice);

module.exports = router;
