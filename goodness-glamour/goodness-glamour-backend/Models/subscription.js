import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Plan",
    required: true
  },
  razorpaySubscriptionId: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ["trial", "pending", "active", "suspended", "cancelled", "expired"],
    default: "pending"
  },
  startDate: {
    type: Date
  },
  renewalDate: {
    type: Date
  }
}, {
  timestamps: true
});

const Subscription = mongoose.model("Subscription", subscriptionSchema);
export default Subscription;
