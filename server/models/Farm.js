import mongoose from 'mongoose';

/**
 * Farm Schema
 * Each farm is owned by exactly one farmer (User with role 'farmer').
 * Admins can read all farms; farmers can only CRUD their own.
 */
const farmSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'farm.name_required'],
      trim: true,
      maxlength: [100, 'farm.name_too_long'],
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'farm.owner_required'],
      index: true, // fast lookup for "my farms"
    },

    location: {
      address:  { type: String, trim: true, default: '' },
      village:  { type: String, trim: true, default: '' },
      district: { type: String, trim: true, default: '' },
      state:    { type: String, trim: true, default: '' },
      pincode:  {
        type: String,
        trim: true,
        default: '',
        match: [/^\d{0,6}$/, 'farm.pincode_invalid'],
      },
    },

    sizeAcres: {
      type: Number,
      min: [0, 'farm.size_negative'],
      default: 0,
    },

    soilType: {
      type: String,
      lowercase: true,
      trim: true,
      enum: {
        values: ['alluvial', 'black', 'red', 'laterite', 'arid', 'forest', 'loamy', 'clayey', 'sandy', 'other', ''],
        message: 'farm.soil_type_invalid',
      },
      default: '',
    },

    description: {
      type: String,
      trim: true,
      maxlength: [500, 'farm.description_too_long'],
      default: '',
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/* ------------------------------------------------------------------ */
/*  Virtual — populate crops without storing redundant data           */
/* ------------------------------------------------------------------ */
farmSchema.virtual('crops', {
  ref:          'Crop',
  localField:   '_id',
  foreignField: 'farm',
});

const Farm = mongoose.model('Farm', farmSchema);

export default Farm;
