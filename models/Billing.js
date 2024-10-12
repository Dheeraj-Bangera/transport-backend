const mongoose = require("mongoose");
const Counter = require("./Counter"); // Adjust the path as needed

const billSchema = new mongoose.Schema(
  {
    billId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    shipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shipment",
      required: true,
    },
    issueDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    taxAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "overdue"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["card", "bank transfer", "cash"],
    },
    paymentDate: {
      type: Date,
      required: false,
    },
    GSTIN: {
      type: String,
      required: false,
    },

    specialInstructions: {
      type: String,
      required: false,
    },
    fuelCost: {
      type: Number,
      required: false,
    },
  },
  { timestamps: true },
);

// Pre-save hook to auto-increment billId
billSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findOneAndUpdate(
        { _id: "billId" },
        { $inc: { sequence: 1 } },
        { new: true, upsert: true },
      );
      this.billId = counter.sequence;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

const Bill = mongoose.model("Bill", billSchema);

module.exports = Bill;