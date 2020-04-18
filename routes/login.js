const express = require('express');
const { check, body } = require('express-validator');

const loginController = require('../controllers/loginController');
const User = require('../models/user');

const router = express.Router();

router.get('/signup', loginController.getSignup);

router.post(
    '/signup',
    [
        check('email')
            .isEmail()
            .withMessage('enter an email, dufus.')
            .custom((value, { res }) => {
                // if (value === 'test1@test.com') {
                //     throw new Error('You have been BLOCKED, haha.');
                // }
                // return true;
                return User.findOne({ email: value }).then((existingUser) => {
                    if (existingUser) {
                        return Promise.reject(
                            'this email already exists, make another one'
                        );
                    }
                });
            })
            .normalizeEmail(),
        //same as check, but checks only the passwords in the body of the request
        body(
            'password',
            'quit pissing around. PASSWORD: letters, numbers, 5 characters long.'
        )
            .trim()
            .isAlphanumeric()
            .isLength({ min: 5 }),
        body(
            'confirmPassword',
            'do you think this is a joke? Enter the same passwords, IDIOT.'
        )
            .trim()
            .custom((value, { req }) => {
                if (value !== req.body.password) {
                    throw new Error();
                }
                return true;
            }),
    ],
    loginController.postSignup
);

router.get('/login', loginController.getLogin);

router.post(
    '/login',
    [
        check('email').isEmail().withMessage('enter an email, dufus.'),
        body(
            'password',
            'quit pissing around. PASSWORD: letters, numbers, 5 characters long.'
        )
            .isAlphanumeric()
            .isLength({ min: 5 }),
    ],
    loginController.postLogin
);

router.post('/logout', loginController.postLogout);

router.get('/reset', loginController.getReset);

router.post('/reset', loginController.postReset);

router.get('/reset/:token', loginController.getSetPassword);

router.post('/set-password', loginController.postSetPassword);

module.exports = router;
