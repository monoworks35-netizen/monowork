// models/Due.js
import mongoose from "mongoose";

const DueSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    contact: { type: String, required: true },
    amount: { type: String, required: true },
    dueDate: { type: String, required: true },
    status: { type: String, enum: ["Pending", "Cleared"], default: "Pending" },
    highlight: { type: String, enum: ["none", "yellow", "red"], default: "none" },
  },
  { timestamps: true }
);

const Due = mongoose.models.Due || mongoose.model("Due", DueSchema);

export default Due;
