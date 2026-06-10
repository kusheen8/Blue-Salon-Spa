import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subscription",
    required: true
  },
  paymentId: {
    type: String,
    required: true,
    unique: true
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    required: true
  },
  paidAt: {
    type: Date
  }
}, {
  timestamps: true
});

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;
