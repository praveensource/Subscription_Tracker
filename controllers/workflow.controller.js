import { createRequire } from 'module';
import Subscription from '../models/subscription.model.js';
import dayjs from 'dayjs';
import nodemailer from 'nodemailer';
import { EMAIL_USER, EMAIL_PASS, SERVER_URL } from '../config/env.js';

const require = createRequire(import.meta.url);
const { serve } = require('@upstash/workflow/express');

// --- Email transporter (Single Responsibility) ---
const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
    },
});

const REMINDER_DAYS = [7, 5, 2, 1];

// --- Reusable helpers (DRY Principle) ---
const sendEmail = async (subscription, days, reminderDate) => {
    const subject = 'Subscription Reminder';
    const text = `Your subscription for ${subscription.name} will renew in ${days} days on ${reminderDate.format('YYYY-MM-DD')}`;

    const info = await transporter.sendMail({
        from: `"Subscription Tracker" <${EMAIL_USER}>`,
        to: subscription.user.email,
        subject,
        text,
    });

    console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    return info;
};

const markAsSent = async (subscriptionId, days) => {
    return Subscription.findByIdAndUpdate(
        subscriptionId,
        { $push: { notificationsSent: days } },
        { new: true }
    );
};

// --- Production handler (uses QStash for durable scheduling) ---
export const sendRemainders = serve(async (context) => {
    const { subscriptionId } = context.requestPayload;

    const subscription = await context.run('get subscription', () => {
        return Subscription.findById(subscriptionId).populate('user', 'name email');
    });

    if (!subscription || subscription.status !== 'active') {
        console.log(`Subscription ${subscriptionId} is not active. Stopping Workflow`);
        return;
    }

    const renewalDate = dayjs(subscription.renewalDate);

    if (renewalDate.isBefore(dayjs())) {
        console.log(`Renewal date has passed for subscription ${subscriptionId}. Stopping Workflow`);
        return;
    }

    for (const days of REMINDER_DAYS) {
        const reminderDate = renewalDate.subtract(days, 'day');

        if (reminderDate.isAfter(dayjs())) {
            await context.sleepUntil(`sleep-until-${days}-days-before`, reminderDate.toDate());
        }

        const isSent = subscription.notificationsSent.includes(days);

        if (!isSent) {
            await context.run(`send-${days}-day-reminder`, () => sendEmail(subscription, days, reminderDate));
            await context.run(`mark-${days}-day-sent`, () => markAsSent(subscription._id, days));
        }
    }
}, {
    baseUrl: SERVER_URL,
});

// --- Local test handler (skips QStash, runs directly) ---
export const sendRemainderTest = async (req, res, next) => {
    try {
        const { subscriptionId } = req.body;

        if (!subscriptionId) {
            return res.status(400).json({ success: false, message: 'subscriptionId is required' });
        }

        const subscription = await Subscription.findById(subscriptionId).populate('user', 'name email');

        if (!subscription || subscription.status !== 'active') {
            return res.status(404).json({ success: false, message: 'Subscription not found or not active' });
        }

        const renewalDate = dayjs(subscription.renewalDate);

        if (renewalDate.isBefore(dayjs())) {
            return res.status(400).json({ success: false, message: 'Renewal date has already passed' });
        }

        const results = [];

        for (const days of REMINDER_DAYS) {
            const reminderDate = renewalDate.subtract(days, 'day');
            const isSent = subscription.notificationsSent.includes(days);

            if (!isSent && reminderDate.isBefore(dayjs())) {
                const info = await sendEmail(subscription, days, reminderDate);
                await markAsSent(subscription._id, days);
                results.push({ days, previewUrl: nodemailer.getTestMessageUrl(info) });
            }
        }

        res.status(200).json({
            success: true,
            message: results.length > 0 ? 'Reminders sent' : 'No reminders due at this time',
            data: results,
        });
    } catch (error) {
        next(error);
    }
};