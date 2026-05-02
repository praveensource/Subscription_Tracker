import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Subscription name is required'],
        trim: true,
        minLength: 2,
        maxLength: 50,
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price must be a greater than 0'],
    },
    currency: {
        type: String,
        required: [true, 'Currency is required'],
        enum: ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD'],
        default: 'USD',
    },
    frequency: {
        type: String,
        required: [true, 'Frequency is required'],
        enum: ['daily', 'weekly', 'monthly', 'yearly'],
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: ['entertainment', 'utilities', 'health', 'education', 'other'],
    },
    paymentMethod:{
        type: String,
        required: [true, 'Payment method is required'],
        trim: true,

    },
    status: {
        type: String,
        required: [true, 'Status is required'],
        enum: ['active', 'expired', 'canceled'],
        default: 'active',
    },
    startDate: {
        type: Date,
        required: [true, 'Start date is required'],
        // Allow any date - past, present, or future
    },
    renewalDate: {
        type: Date,
        validate: {
            validator: function(value) {
                if (!value) return true; // Skip validation if not provided
                return value > new Date();
            },
            message: 'Renewal date must be in the future',
        },
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User is required'],
        index: true,
    },
    notificationsSent: {
        type: [Number],
        default: [],
    },
}, { timestamps: true });

// autocalculate renewal date if missing
subscriptionSchema.pre('save', async function() {
    if (!this.renewalDate) {
        const renewalPeriods = {
            daily: 1,
            weekly: 7,
            monthly: 30,
            yearly: 365,
        };

        this.renewalDate = new Date(this.startDate);
        this.renewalDate.setDate(this.renewalDate.getDate() + renewalPeriods[this.frequency]);
    }
    // if renewal date passed
    if (this.renewalDate <= new Date()) {
        this.status = 'expired';
    }
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);

export default Subscription;