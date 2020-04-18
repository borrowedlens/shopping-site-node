const express = require('express');
const { body } = require('express-validator');

const adminController = require('../controllers/AdminController');
const authChecker = require('../middleware/auth-checker');

const router = express.Router();

router.get('/add-product', authChecker, adminController.getAddProduct);

router.post(
    '/add-product',
    [
        body('title').isString().isLength({ min: 3 }).trim(),
        body('price').isFloat(),
        body('description').isString().isLength({ min: 5 }).trim(),
    ],
    authChecker,
    adminController.postAddProduct
);

router.get('/product-list', authChecker, adminController.getProductList);

router.get(
    '/edit-product/:productId',
    authChecker,
    adminController.getEditProduct
);

router.post(
    '/edit-product',
    [
        body('title').isString().isLength({ min: 3 }).trim(),
        body('price').isFloat(),
        body('description').isString().isLength({ min: 5 }).trim(),
    ],
    authChecker,
    adminController.postEditProduct
);

router.delete('/products/:productId', authChecker, adminController.deleteProduct);

// router.post('/delete-product', authChecker, adminController.postDeleteProduct); // Without using async requests

module.exports = router;
