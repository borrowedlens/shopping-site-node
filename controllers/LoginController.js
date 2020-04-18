const bcryptjs = require('bcryptjs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { validationResult } = require('express-validator');

const User = require('../models/user');

const transporter = nodemailer.createTransport({
    host: 'localhost',
    port: '25',
});

exports.getSignup = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('login/signup', {
        docTitle: 'Sign up',
        path: '/signup',
        errorMessage: message,
        oldInput: {
            email: '',
            password: '',
            confirmPassword: '',
        },
        validationErrors: [],
    });
};

exports.postSignup = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render('login/signup', {
            docTitle: 'Sign up',
            path: '/signup',
            errorMessage: errors.array()[0].msg,
            oldInput: {
                email: email,
                password: password,
                confirmPassword: req.body.confirmPassword,
            },
            validationErrors: errors.array(),
        });
    }
    bcryptjs
        .hash(password, 12)
        .then((hashedPassword) => {
            const user = new User({
                email: email,
                password: hashedPassword,
                cart: { items: [] },
            });
            return user.save();
        })
        .then(() => {
            res.redirect('/login');
            return transporter.sendMail({
                to: email,
                from: 'shop@completenode.com',
                subject: 'Signup Succeeded!',
                html: '<h1>You Succeeded in signing up!</h1>',
            });
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getLogin = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('login/login', {
        docTitle: 'Login',
        path: '/login',
        errorMessage: message,
        oldInput: {
            email: '',
            password: '',
        },
        validationErrors: [],
    });
};

exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render('login/login', {
            docTitle: 'Login',
            path: '/login',
            errorMessage: errors.array()[0].msg,
            oldInput: {
                email: email,
                password: password,
            },
            validationErrors: errors.array(),
        });
    }
    User.findOne({ email: email })
        .then((user) => {
            if (!user) {
                return res.status(422).render('login/login', {
                    docTitle: 'Login',
                    path: '/login',
                    errorMessage: 'Invalid username or password',
                    oldInput: {
                        email: email,
                        password: password,
                    },
                    validationErrors: errors.array(),
                });
            } else {
                bcryptjs
                    .compare(password, user.password)
                    .then((doMatch) => {
                        if (doMatch) {
                            req.session.user = user;
                            req.session.isLoggedIn = true;
                            //Only needed to ensure the database is updated with the session so redirect does not happend before the updation
                            return req.session.save((err) => {
                                res.redirect('/');
                            });
                        }
                        return res.status(422).render('login/login', {
                            docTitle: 'Login',
                            path: '/login',
                            errorMessage: 'Invalid username or password',
                            oldInput: {
                                email: email,
                                password: password,
                            },
                            validationErrors: errors.array(),
                        });
                    })
                    .catch((err) => {
                        const error = new Error(err);
                        error.httpStatusCode = 500;
                        return next(error);
                    });
            }
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
    // res.setHeader('Set-Cookie', 'isLoggedIn=true; Max-Age=10; HttpOnly')
};

exports.postLogout = (req, res, next) => {
    // req.session.isLoggedIn = false;
    req.session.destroy(() => {
        res.redirect('/login');
    });
};

exports.getReset = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('login/reset', {
        docTitle: 'Reset Password',
        path: '/reset',
        errorMessage: message,
    });
};

exports.postReset = (req, res, next) => {
    crypto.randomBytes(32, (err, Buffer) => {
        if (err) {
            console.log('exports.postReset -> err', err);
            return res.redirect('reset');
        }
        const token = Buffer.toString('hex');
        User.findOne({ email: req.body.email })
            .then((user) => {
                if (!user) {
                    req.flash('error', 'No user found with that email');
                    return res.redirect('/reset');
                }
                user.resetToken = token;
                user.resetExpirationDate = Date.now() + 3600000;
                return user.save();
            })
            .then((result) => {
                res.redirect('/login');
                transporter.sendMail({
                    to: req.body.email,
                    from: 'shop@completenode.com',
                    subject: 'Password Reset',
                    html: `<p>You requested for a password reset</p>
                    <p>Please click this <a href="http://localhost:3000/reset/${token}">link</a> to reset your password!</p>`,
                });
            })
            .catch((err) => {
                const error = new Error(err);
                error.httpStatusCode = 500;
                return next(error);
            });
    });
};

exports.getSetPassword = (req, res, next) => {
    const token = req.params.token;
    User.findOne({
        resetToken: token,
        resetExpirationDate: { $gt: Date.now() },
    })
        .then((user) => {
            if (!user) {
                req.flash(
                    'error',
                    'Seems the link is either broken or has expired.'
                );
                return res.redirect('/reset');
            }
            let message = req.flash('error');
            if (message.length > 0) {
                message = message[0];
            } else {
                message = null;
            }
            res.render('login/set-password', {
                docTitle: 'Set Password',
                path: '/set-password',
                errorMessage: message,
                userId: user._id,
                resetToken: token,
            });
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postSetPassword = (req, res, next) => {
    const userId = req.body.userId;
    console.log('exports.postSetPassword -> userId', userId);
    const password = req.body.password;
    const token = req.body.resetToken;
    console.log('exports.postSetPassword -> token', token);
    let user;
    User.findOne({
        resetToken: token,
        resetExpirationDate: { $gt: Date.now() },
        _id: userId,
    })
        .then((foundUser) => {
            if (!foundUser) {
                req.flash(
                    'error',
                    'Seems the link is either broken or has expired.'
                );
                return req.session.save((err) => {
                    return res.redirect('/reset');
                });
            }
            user = foundUser;
            bcryptjs
                .hash(password, 12)
                .then((hashedPassword) => {
                    user.password = hashedPassword;
                    user.resetToken = undefined;
                    user.resetExpirationDate = undefined;
                    return user.save();
                })
                .then(() => {
                    return res.redirect('/login');
                })
                .catch((err) => {
                    const error = new Error(err);
                    error.httpStatusCode = 500;
                    return next(error);
                });
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};
