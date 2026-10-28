import mongoose from 'mongoose';

/**
 * Order Schema — Buy Resources Marketplace Orders
 */
const orderSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'order.buyer_required'],
      index: true,
    },
    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: [true, 'order.product_required'],
        },
        quantity: {
          type: Number,
          required: [true, 'order.quantity_required'],
          min: [1, 'order.quantity_min_1'],
        },
        price: {
          type: Number,
          required: [true, 'order.price_required'],
          min: [0, 'order.price_negative'],
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: [true, 'order.total_amount_required'],
      min: [0, 'order.total_amount_negative'],
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'shipped', 'delivered'],
        message: 'order.status_invalid',
      },
      default: 'pending',
      index: true,
    },
    shippingAddress: {
      type: String,
      required: [true, 'order.shipping_address_required'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model('Order', orderSchema);

export default Order;
