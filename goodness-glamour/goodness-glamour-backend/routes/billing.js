import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import { verifyToken } from "../middleware/auth.js";
import User from "../Models/user.js";
import Plan from "../Models/plan.js";
import Subscription from "../Models/subscription.js";
import Payment from "../Models/payment.js";

const router = express.Router();

const isRazorpayConfigured = !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
let razorpay = null;
if (isRazorpayConfigured) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
} else {
  console.warn("⚠️ Razorpay credentials missing. Running billing in Mock Mode.");
}

// ── GET /api/billing/status — Fetch subscription status
router.get("/status", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("currentPlan");
    if (!user) return res.status(404).json({ error: "User not found" });

    const payments = await Payment.find({ vendorId: req.user.id }).sort({ paidAt: -1 });
    const plans = await Plan.find();

    res.json({
      success: true,
      subscriptionStatus: user.subscriptionStatus || "trial",
      trialCallsRemaining: user.trialCallsRemaining !== undefined ? user.trialCallsRemaining : 2,
      currentPlan: user.currentPlan,
      renewalDate: user.renewalDate,
      payments,
      plans
    });
  } catch (err) {
    console.error("Billing Status Error:", err);
    res.status(500).json({ error: "Failed to fetch billing status", details: err.message });
  }
});

// ── POST /api/billing/create-subscription — Initialize subscription
router.post("/create-subscription", verifyToken, async (req, res) => {
  const { planId } = req.body;
  if (!planId) return res.status(400).json({ error: "planId is required" });

  try {
    const plan = await Plan.findById(planId);
    if (!plan) return res.status(404).json({ error: "Plan not found" });

    // Prevent duplicate active subscriptions
    const existing = await Subscription.findOne({ vendorId: req.user.id, status: "active" });
    if (existing) {
      return res.status(400).json({ error: "You already have an active subscription." });
    }

    if (!isRazorpayConfigured) {
      const mockSubId = `sub_mock_${Date.now()}`;
      await Subscription.create({
        vendorId: req.user.id,
        planId: plan._id,
        razorpaySubscriptionId: mockSubId,
        status: "pending",
        startDate: new Date(),
        renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
      return res.json({
        success: true,
        subscriptionId: mockSubId,
        isMock: true
      });
    }

    const rpSub = await razorpay.subscriptions.create({
      plan_id: plan.razorpayPlanId,
      customer_notify: 1,
      total_count: 12,
      quantity: 1,
    });

    await Subscription.create({
      vendorId: req.user.id,
      planId: plan._id,
      razorpaySubscriptionId: rpSub.id,
      status: "pending",
      startDate: new Date(),
      renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    res.json({
      success: true,
      subscriptionId: rpSub.id,
      key: process.env.RAZORPAY_KEY_ID,
      isMock: false
    });
  } catch (err) {
    console.error("Create Subscription Error:", err);
    res.status(500).json({ error: "Failed to initiate subscription", details: err.message });
  }
});

// ── POST /api/billing/verify — Verify payment signature
router.post("/verify", verifyToken, async (req, res) => {
  const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = req.body;
  if (!razorpay_payment_id || !razorpay_subscription_id) {
    return res.status(400).json({ error: "Missing verification parameters" });
  }

  try {
    const subscription = await Subscription.findOne({ razorpaySubscriptionId: razorpay_subscription_id });
    if (!subscription) return res.status(404).json({ error: "Subscription record not found" });

    const plan = await Plan.findById(subscription.planId);
    if (!plan) return res.status(404).json({ error: "Plan record not found" });

    // Handle mock verification
    if (razorpay_subscription_id.startsWith("sub_mock_")) {
      subscription.status = "active";
      subscription.startDate = new Date();
      subscription.renewalDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await subscription.save();

      await Payment.create({
        vendorId: req.user.id,
        subscriptionId: subscription._id,
        paymentId: razorpay_payment_id,
        amount: plan.price,
        status: "captured",
        paidAt: new Date()
      });

      const user = await User.findById(req.user.id);
      user.subscriptionStatus = "active";
      user.currentPlan = plan._id;
      user.renewalDate = subscription.renewalDate;
      await user.save();

      return res.json({ success: true, message: "Mock subscription active!" });
    }

    if (!isRazorpayConfigured) {
      return res.status(400).json({ error: "Razorpay is not configured" });
    }

    const text = `${razorpay_payment_id}|${razorpay_subscription_id}`;
    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ error: "Signature verification failed" });
    }

    subscription.status = "active";
    subscription.startDate = new Date();
    subscription.renewalDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await subscription.save();

    await Payment.create({
      vendorId: req.user.id,
      subscriptionId: subscription._id,
      paymentId: razorpay_payment_id,
      amount: plan.price,
      status: "captured",
      paidAt: new Date()
    });

    const user = await User.findById(req.user.id);
    user.subscriptionStatus = "active";
    user.currentPlan = plan._id;
    user.renewalDate = subscription.renewalDate;
    await user.save();

    res.json({ success: true, message: "Subscription verified successfully!" });
  } catch (err) {
    console.error("Verification Error:", err);
    res.status(500).json({ error: "Failed to verify signature", details: err.message });
  }
});

// ── POST /api/billing/cancel — Cancel subscription
router.post("/cancel", verifyToken, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ vendorId: req.user.id, status: "active" });
    if (!subscription) return res.status(404).json({ error: "No active subscription found" });

    if (subscription.razorpaySubscriptionId.startsWith("sub_mock_")) {
      subscription.status = "cancelled";
      await subscription.save();

      const user = await User.findById(req.user.id);
      user.subscriptionStatus = "cancelled";
      await user.save();

      return res.json({ success: true, message: "Subscription cancelled successfully (Mock Mode)!" });
    }

    if (!isRazorpayConfigured) {
      return res.status(400).json({ error: "Razorpay is not configured" });
    }

    await razorpay.subscriptions.cancel(subscription.razorpaySubscriptionId);

    subscription.status = "cancelled";
    await subscription.save();

    const user = await User.findById(req.user.id);
    user.subscriptionStatus = "cancelled";
    await user.save();

    res.json({ success: true, message: "Subscription cancelled successfully!" });
  } catch (err) {
    console.error("Cancel Error:", err);
    res.status(500).json({ error: "Failed to cancel subscription", details: err.message });
  }
});

// ── POST /api/billing/webhook — Handle Razorpay webhooks
router.post("/webhook", async (req, res) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers["x-razorpay-signature"];

  if (webhookSecret && signature) {
    const rawBody = req.rawBody ? req.rawBody.toString() : JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== signature) {
      console.warn("⚠️ Razorpay Webhook Invalid Signature");
      return res.status(400).send("Invalid signature");
    }
  }

  const event = req.body.event;
  const payload = req.body.payload;

  console.log(`[Razorpay Webhook] Event: ${event}`);

  try {
    if (event === "subscription.activated" || event === "subscription.charged") {
      const rpSub = payload.subscription.entity;
      const paymentEntity = payload.payment ? payload.payment.entity : null;

      const subscription = await Subscription.findOne({ razorpaySubscriptionId: rpSub.id });
      if (subscription) {
        subscription.status = "active";
        subscription.startDate = new Date(rpSub.start_at * 1000 || Date.now());
        subscription.renewalDate = new Date(rpSub.charge_at * 1000 || (Date.now() + 30 * 24 * 60 * 60 * 1000));
        await subscription.save();

        const plan = await Plan.findById(subscription.planId);
        if (paymentEntity) {
          const existingPayment = await Payment.findOne({ paymentId: paymentEntity.id });
          if (!existingPayment) {
            await Payment.create({
              vendorId: subscription.vendorId,
              subscriptionId: subscription._id,
              paymentId: paymentEntity.id,
              amount: paymentEntity.amount / 100,
              status: paymentEntity.status,
              paidAt: new Date(paymentEntity.created_at * 1000 || Date.now())
            });
          }
        }

        const user = await User.findById(subscription.vendorId);
        if (user) {
          user.subscriptionStatus = "active";
          user.currentPlan = subscription.planId;
          user.renewalDate = subscription.renewalDate;
          await user.save();
        }
      }
    } else if (event === "subscription.cancelled" || event === "subscription.completed" || event === "subscription.expired") {
      const rpSub = payload.subscription.entity;
      const subscription = await Subscription.findOne({ razorpaySubscriptionId: rpSub.id });
      if (subscription) {
        subscription.status = event === "subscription.cancelled" ? "cancelled" : "expired";
        await subscription.save();

        const user = await User.findById(subscription.vendorId);
        if (user) {
          user.subscriptionStatus = subscription.status;
          await user.save();
        }
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Webhook Event Error:", err);
    res.status(500).send("Webhook handler failed");
  }
});

export default router;
