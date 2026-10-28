import mongoose from 'mongoose';

const pestAlertSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: true,
    },
    region: { type: String, required: true, trim: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('PestAlert', pestAlertSchema);