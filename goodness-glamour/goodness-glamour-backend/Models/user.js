import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user"
  },
  salonName: {
    type: String,
    default: "Blue Spa & Salon"
  },
  lastLogin: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  subscriptionStatus: {
    type: String,
    enum: ["trial", "active", "suspended", "cancelled", "expired"],
    default: "trial"
  },
  trialCallsRemaining: {
    type: Number,
    default: 2
  },
  currentPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Plan",
    default: null
  },
  renewalDate: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

const User = mongoose.model("User", userSchema);
export default User;
