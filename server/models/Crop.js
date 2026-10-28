import mongoose from 'mongoose';

/**
 * Crop Schema
 * A crop always belongs to a Farm. Ownership is resolved transitively:
 * if you own the farm, you own the crop.
 */
const cropSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'crop.name_required'],
      trim: true,
      maxlength: [100, 'crop.name_too_long'],
    },

    farm: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Farm',
      required: [true, 'crop.farm_required'],
      index: true,
    },

    variety: {
      type: String,
      trim: true,
      maxlength: [100, 'crop.variety_too_long'],
      default: '',
    },

    season: {
      type: String,
      enum: {
        values: ['kharif', 'rabi', 'zaid', 'year-round', ''],
        message: 'crop.season_invalid',
      },
      default: '',
    },

    status: {
      type: String,
      enum: {
        values: ['planned', 'planted', 'growing', 'ready', 'harvested', 'failed'],
        message: 'crop.status_invalid',
      },
      default: 'planned',
    },

    areaUsedAcres: {
      type: Number,
      min: [0, 'crop.area_negative'],
      default: 0,
    },

    plantedAt: {
      type: Date,
      default: null,
    },

    expectedHarvestDate: {
      type: Date,
      default: null,
    },

    actualHarvestDate: {
      type: Date,
      default: null,
    },

    yieldKg: {
      type: Number,
      min: [0, 'crop.yield_negative'],
      default: null,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'crop.notes_too_long'],
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const Crop = mongoose.model('Crop', cropSchema);

export default Crop;
