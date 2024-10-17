const mongoose = require("mongoose");
const Counter = require("./Counter"); // Adjust the path as needed

const clientSchema = new mongoose.Schema(
  {
    clientId: {
      type: Number,
      unique: true,
      required: true,
    },
    clientName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phoneNumber: {
      type: Number,
      required: true,
    },
    companyName: {
      type: String,
      required: true,
    },
    industry: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    note: {
      type: String,
      required: false,
    },
  },
  { timestamps: true },
);

clientSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        { _id: "clientId" },
        { $inc: { sequence: 1 } },
        { new: true, upsert: true }, // Create counter if it doesn't exist
      );
      this.clientId = counter.sequence;
      next();
    } catch (error) {
      console.error("Error incrementing clientId:", error);
      return next(error);
    }
  } else {
    next();
  }
});

const Client = mongoose.model("Client", clientSchema);
module.exports = Client;
