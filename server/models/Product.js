import mongoose from 'mongoose';

/**
 * Product Schema — Buy Resources Marketplace
 * Categories: seeds, fertilizers, pesticides, equipment
 */
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'product.name_required'],
      trim: true,
      maxlength: [150, 'product.name_too_long'],
    },
    category: {
      type: String,
      required: [true, 'product.category_required'],
      enum: {
        values: ['seeds', 'fertilizers', 'pesticides', 'equipment'],
        message: 'product.category_invalid',
      },
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    price: {
      type: Number,
      required: [true, 'product.price_required'],
      min: [0, 'product.price_negative'],
    },
    stock: {
      type: Number,
      required: [true, 'product.stock_required'],
      min: [0, 'product.stock_negative'],
      default: 0,
    },
    imageUrl: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model('Product', productSchema);

export default Product;
