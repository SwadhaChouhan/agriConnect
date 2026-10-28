import mongoose from 'mongoose';

/**
 * Consultation Schema — Expert Consultation ticketing system.
 * Farmer creates a consultation ticket.
 * Admins view tickets and submit an adminReply to resolve it.
 */
const consultationSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'consultation.farmer_required'],
      index: true,
    },
    subject: {
      type: String,
      required: [true, 'consultation.subject_required'],
      trim: true,
      maxlength: [200, 'consultation.subject_too_long'],
    },
    message: {
      type: String,
      required: [true, 'consultation.message_required'],
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'resolved'],
        message: 'consultation.status_invalid',
      },
      default: 'pending',
      index: true,
    },
    adminReply: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Consultation = mongoose.model('Consultation', consultationSchema);

export default Consultation;
