const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    resetToken: String,
    resetExpirationDate: Date,
    cart: {
        items: [
            {
                productId: {
                    type: Schema.Types.ObjectId,
                    ref: 'Product',
                    required: true,
                },
                quantity: {
                    type: String,
                    required: true,
                },
            },
        ],
    },
});

userSchema.methods.addToCart = function (product) {
    let cartProductIndex = this.cart.items.findIndex((p) => {
        return p.productId.toString() === product._id.toString();
    });

    let newQuantity = 1;
    let updatedCartItems = [...this.cart.items];
    if (cartProductIndex === -1) {
        updatedCartItems.push({
            productId: product._id,
            quantity: newQuantity,
        });
    } else {
        updatedCartItems[cartProductIndex].quantity =
            +updatedCartItems[cartProductIndex].quantity + 1;
    }
    this.cart = { items: updatedCartItems };
    return this.save();
};

userSchema.methods.deleteCartItem = function (id) {
    let updatedCartItems = this.cart.items.filter(
        (p) => p.productId.toString() !== id.toString()
    );
    this.cart.items = updatedCartItems;
    return this.save();
};

userSchema.methods.clearCart = function () {
    this.cart.items = [];
    return this.save();
};

module.exports = mongoose.model('User', userSchema);
