const { validationResult } = require('express-validator');

const Product = require('../models/product');
const fileHelper = require('../util/file');

exports.getAddProduct = (req, res, next) => {
    res.render('admin/edit-product', {
        docTitle: 'Add Product',
        path: '/admin/add-product',
        edit: false,
        errorMessage: null,
        hasError: false,
        validationErrors: [],
    });
};

exports.postAddProduct = (req, res, next) => {
    const title = req.body.title;
    const image = req.file;
    const price = req.body.price;
    const description = req.body.description;
    if (!image) {
        return res.status(422).render('admin/edit-product', {
            docTitle: 'Add Product',
            path: '/admin/edit-product',
            edit: false,
            errorMessage:
                'Unable to save to database, please select an image file.',
            product: {
                title: title,
                price: price,
                description: description,
            },
            hasError: true,
            validationErrors: [],
        });
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render('admin/edit-product', {
            docTitle: 'Add Product',
            path: '/admin/edit-product',
            edit: false,
            errorMessage: errors.array()[0].msg,
            product: {
                title: title,
                price: price,
                description: description,
            },
            hasError: true,
            validationErrors: errors.array(),
        });
    }
    const imageUrl = image.path;
    const product = new Product({
        title: title,
        imageUrl: imageUrl,
        price: price,
        description: description,
        userId: req.user,
    });
    product
        .save()
        .then((result) => {
            console.log('exports.postAddProduct -> result', result);
            res.redirect('product-list');
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getProductList = (req, res, next) => {
    Product.find({ userId: req.user._id })
        // .select('title price -_id')
        // .populate('userId', 'name')
        .then((products) => {
            res.render('admin/product-list', {
                prods: products,
                docTitle: 'Product-list: Admin',
                path: '/admin/product-list',
            });
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};
exports.getEditProduct = (req, res, next) => {
    const editMode = req.query.edit;
    if (!editMode) {
        res.redirect('/');
    }
    const prodId = req.params.productId;
    Product.findById(prodId)
        .then((product) => {
            // throw new Error('Dummy Error');
            if (!product) {
                return res.redirect('/');
            }
            res.render('admin/edit-product', {
                docTitle: 'Edit Product',
                path: '/admin/edit-product',
                edit: editMode,
                product: product,
                errorMessage: null,
                hasError: false,
                validationErrors: [],
            });
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postEditProduct = (req, res, next) => {
    const id = req.body.productId;
    const title = req.body.title;
    const image = req.file;
    const price = req.body.price;
    const description = req.body.description;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render('admin/edit-product', {
            docTitle: 'Add Product',
            path: '/admin/edit-product',
            edit: true,
            hasError: true,
            errorMessage: errors.array()[0].msg,
            product: {
                _id: id,
                title: title,
                price: price,
                description: description,
            },
            validationErrors: errors.array(),
        });
    }

    Product.findById(id)
        .then((product) => {
            if (product.userId.toString() !== req.user._id.toString()) {
                return res.redirect('product-list');
            }
            product.title = title;
            if (image) {
                fileHelper.deleteFile(product.imageUrl);
                product.imageUrl = image.path;
            }
            product.price = price;
            product.description = description;
            return product.save().then((result) => {
                console.log('exports.postEditProduct -> result', result);
                res.redirect('product-list');
            });
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.deleteProduct = (req, res, next) => {
    const id = req.params.productId;
    Product.findById(id)
        .then((product) => {
            if (!product) {
                return next(new Error());
            }
            fileHelper.deleteFile(product.imageUrl);
            return Product.deleteOne({ _id: id, userId: req.user._id })
        })
        .then((result) => {
            return req.user.deleteCartItem(id);
        })
        .then(() => {
            res.status(200).json({ message: 'Succeeded!' });
        })
        .catch((err) => {
            res.status(500).json({ message: 'Failed to delete product!' });
        });
};
/* Without using async requests */
// exports.postDeleteProduct = (req, res, next) => {
//     const id = req.body.productId;
//     Product.findById(id)
//         .then((product) => {
//             if (!product) {
//                 return next(new Error());
//             }
//             fileHelper.deleteFile(product.imageUrl);
//             return Product.deleteOne({ _id: id, userId: req.user._id })
//                 .then((result) => {
//                     return req.user.deleteCartItem(id);
//                 })
//                 .then(() => {
//                     res.redirect('product-list');
//                 });
//         })
//         .catch((err) => {
//             const error = new Error(err);
//             error.httpStatusCode = 500;
//             return next(error);
//         });
// };
