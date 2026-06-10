import mongoose from "mongoose";

const planSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  price: {
    type: Number,
    required: true
  },
  billingCycle: {
    type: String,
    default: "month"
  },
  razorpayPlanId: {
    type: String,
    required: true
  },
  features: [{
    type: String
  }]
}, {
  timestamps: true
});

const Plan = mongoose.model("Plan", planSchema);
export default Plan;
