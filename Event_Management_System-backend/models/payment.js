const moongose = require("mongoose");

const paymentSchema = new moongose.Schema({
    user: {
        type: moongose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    activity: {
        type: moongose.Schema.Types.ObjectId,
        ref: 'Activity',
        required: false,
    },
    venue: {
        type: moongose.Schema.Types.ObjectId,
        ref: 'Venue',
        required: false,
    },
    amount: {
        type: Number,
        required: true,
    },
    payment_status: {
        type: Boolean,
        default: false,
    },
    payment_id: {
        type: String,
    },
    date: {
        type: Date,
        default: Date.now,
    },
});

module.exports = moongose.model("Payment", paymentSchema);