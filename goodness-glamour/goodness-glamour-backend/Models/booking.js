import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true
  },

  phone: {
    type: String,
    required: true
  },

  service: {
    type: String,
    required: true
  },

  date: {
    type: String,
    required: true
  },

  time: {
    type: String,
    required: true
  },

  stylist: {
    type: String
  },

  price: {
    type: String
  },

  oneHourReminderSent: {
    type: Boolean,
    default: false
  },

  fifteenMinReminderSent: {
    type: Boolean,
    default: false
  },

  source: {
    type: String,
    default: "manual"
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

});

const booking = mongoose.model(
  "Booking",
  bookingSchema
);

export default booking;