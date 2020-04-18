const fs = require('fs');
const path = require('path');

const PDFDocument = require('pdfkit');
const stripe = require('stripe')(`${process.env.STRIPE_KEY}`);

const Product = require('../models/product');
const Order = require('../models/order');

const ITEMS_PER_PAGE = 1;

exports.getIndex = (req, res, next) => {
    const page = +req.query.page || 1;
    let totalItems;
    Product.find()
        .countDocuments()
        .then((numProducts) => {
            totalItems = numProducts;
            return Product.find()
                .skip((page - 1) * ITEMS_PER_PAGE)
                .limit(ITEMS_PER_PAGE);
        })
        .then((products) => {
            res.render('shop/index', {
                prods: products,
                docTitle: 'Home',
                path: '/',
                currentPage: page,
                lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
                hasNextPage: page * ITEMS_PER_PAGE < totalItems,
                hasPreviousPage: page > 1,
                nextPage: page + 1,
                previousPage: page - 1,
            });
        })
        .catch((err) => {
            console.log('exports.getIndex -> err', err);
        });
};

exports.getProducts = (req, res, next) => {
    const page = +req.query.page || 1;
    let totalItems;
    Product.find()
        .countDocuments()
        .then((numProducts) => {
            totalItems = numProducts;
            return Product.find()
                .skip((page - 1) * ITEMS_PER_PAGE)
                .limit(ITEMS_PER_PAGE);
        })
        .then((products) => {
            res.render('shop/products', {
                prods: products,
                docTitle: 'Products',
                path: '/products',
                currentPage: page,
                lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
                hasNextPage: page * ITEMS_PER_PAGE < totalItems,
                hasPreviousPage: page > 1,
                nextPage: page + 1,
                previousPage: page - 1,
            });
        })
        .catch((err) => {
            console.log('exports.getIndex -> err', err);
        });
};

exports.getProduct = (req, res, next) => {
    const prodId = req.params.productId;
    Product.findById(prodId)
        .then((product) => {
            res.render('shop/product-detail', {
                product: product,
                docTitle: 'Product Details',
                path: '/products',
            });
        })
        .catch((err) => {
            console.log('exports.getProduct -> err', err);
        });
};

exports.getCart = (req, res, next) => {
    req.user
        .populate('cart.items.productId')
        .execPopulate()
        .then((user) => {
            const products = user.cart.items;
            res.render('shop/cart', {
                docTitle: 'Cart',
                path: '/cart',
                products: products,
            });
        })
        .catch((err) => {
            console.log('exports.getCart -> err', err);
        });
};

exports.postCart = (req, res, next) => {
    const productId = req.body.productId;
    Product.findById(productId)
        .then((product) => {
            return req.user.addToCart(product);
        })
        .then((result) => {
            res.redirect('/cart');
        })
        .catch((err) => {
            console.log(err);
        });
};

exports.deleteCartItem = (req, res, next) => {
    const id = req.body.productId;
    req.user
        .deleteCartItem(id)
        .then(() => {
            res.redirect('/cart');
        })
        .catch((err) => {
            console.log(err);
        });
};

exports.getCheckout = (req, res, next) => {
    let products;
    let total = 0;
    req.user
        .populate('cart.items.productId')
        .execPopulate()
        .then((user) => {
            products = user.cart.items;
            const lineItems = products.map((p) => {
                total += p.quantity * p.productId.price;
                return {
                    name: p.productId.title,
                    description: p.productId.description,
                    quantity: p.quantity,
                    amount: p.productId.price * 100,
                    currency: 'inr',
                };
            });
            console.log("exports.getCheckout -> lineItems", lineItems)

            return stripe.checkout.sessions.create({
                success_url: `${req.protocol}://${req.get(
                    'host'
                )}/checkout/success`,
                cancel_url: `${req.protocol}://${req.get(
                    'host'
                )}/checkout/cancel`,
                payment_method_types: ['card'],
                line_items: lineItems,
            });
        })
        .then((session) => {
            res.render('shop/checkout', {
                docTitle: 'Checkout',
                path: '/checkout',
                products: products,
                totalPrice: total,
                sessionId: session.id
            });
        })
        .catch((err) => {
            console.log('exports.getCart -> err', err);
        });
};

exports.getOrders = (req, res, next) => {
    Order.find({ 'user.userId': req.user._id })
        .then((orders) => {
            res.render('shop/orders', {
                docTitle: 'Orders',
                path: '/orders',
                orders: orders,
            });
        })
        .catch((err) => {
            console.log(err);
        });
};

exports.postOrder = (req, res, next) => {
    req.user
        .populate('cart.items.productId')
        .execPopulate()
        .then((user) => {
            const products = user.cart.items.map((p) => {
                return {
                    quantity: p.quantity,
                    product: { ...p.productId._doc },
                    // product: p.productId,
                };
            });
            const order = new Order({
                products: products,
                user: {
                    email: req.user.email,
                    userId: req.user,
                },
            });
            return order.save();
        })
        .then(() => {
            return req.user.clearCart();
        })
        .then(() => {
            res.redirect('/orders');
        })
        .catch((err) => {
            console.log(err);
        });
};

exports.getCheckoutSuccess = (req, res, next) => {
    req.user
        .populate('cart.items.productId')
        .execPopulate()
        .then((user) => {
            const products = user.cart.items.map((p) => {
                return {
                    quantity: p.quantity,
                    product: { ...p.productId._doc },
                    // product: p.productId,
                };
            });
            const order = new Order({
                products: products,
                user: {
                    email: req.user.email,
                    userId: req.user,
                },
            });
            return order.save();
        })
        .then(() => {
            return req.user.clearCart();
        })
        .then(() => {
            res.redirect('/orders');
        })
        .catch((err) => {
            console.log(err);
        });
};

exports.getInvoice = (req, res, next) => {
    const orderId = req.params.orderId;
    Order.findById(orderId)
        .then((order) => {
            if (!order) {
                return next(new Error());
            }
            if (order.user.userId.toString() !== req.user._id.toString()) {
                return next(new Error());
            }
            const invoiceName = `invoice-${orderId}.pdf`;
            const invoicePath = path.join('data', 'invoice', invoiceName);
            const pdfDoc = new PDFDocument();
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader(
                'Content-Disposition',
                `attachment; filename="${invoiceName}"`
            );
            pdfDoc.pipe(fs.createWriteStream(invoicePath));
            pdfDoc.pipe(res);

            let totalPrice = 0;
            pdfDoc.fontSize(20).text('INVOICE');
            pdfDoc.text(
                '----------------------------------------------------------------'
            );
            order.products.map((p) => {
                totalPrice += p.quantity * p.product.price;
                pdfDoc
                    .fontSize(14)
                    .text(
                        `${p.product.title} ---- ${p.quantity} * ${p.product.price}`
                    );
            });
            pdfDoc.text('-----------------------------------');
            pdfDoc.text(`Total Price ----- ${totalPrice}`);
            pdfDoc.end();
            /* Reading file consumes memory */
            // fs.readFile(invoicePath, (err, data) => {
            //     if (err) return next(err);
            //     res.setHeader('Content-Type', 'application/pdf');
            //     res.setHeader(
            //         'Content-Disposition',
            //         `attachment; filename="${invoiceName}"`
            //     );
            //     res.send(data);
            // });
            /* Streaming */
            // const file = fs.createReadStream(invoicePath);
            // res.setHeader('Content-Type', 'application/pdf');
            // res.setHeader(
            //     'Content-Disposition',
            //     `attachment; filename="${invoiceName}"`
            // );
            // file.pipe(res);
        })
        .catch((err) => {
            return next(err);
        });
};
