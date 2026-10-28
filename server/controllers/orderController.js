import Order from '../models/Order.js';
import Product from '../models/Product.js';

/**
 * CREATE POST /api/orders
 * Farmer creates a new order, validating inventory and reducing product stock
 */
export const createOrder = async (req, res) => {
  try {
    const { products, shippingAddress } = req.body;

    if (!shippingAddress || !shippingAddress.trim()) {
      return res.status(400).json({ message: 'order.shipping_address_required' });
    }

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: 'order.products_required' });
    }

    // Step 1: Validate all products and stock availability before altering any records
    const orderItems = [];
    let totalAmount = 0;
    const productsToUpdate = [];

    for (const item of products) {
      const quantity = parseInt(item.quantity, 10);
      if (!quantity || quantity < 1) {
        return res.status(400).json({ message: 'order.invalid_quantity' });
      }

      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({
          message: `Product with ID ${item.productId} was not found.`,
        });
      }

      if (product.stock < quantity) {
        return res.status(400).json({
          message: `Insufficient stock for "${product.name}". Available: ${product.stock}, Requested: ${quantity}`,
        });
      }

      const itemTotal = product.price * quantity;
      totalAmount += itemTotal;

      orderItems.push({
        productId: product._id,
        quantity,
        price: product.price,
      });

      productsToUpdate.push({ product, quantity });
    }

    // Step 2: Deduct stock from each product
    for (const { product, quantity } of productsToUpdate) {
      product.stock -= quantity;
      await product.save();
    }

    // Step 3: Create the order
    const order = await Order.create({
      buyer: req.user.id,
      products: orderItems,
      totalAmount,
      shippingAddress: shippingAddress.trim(),
      status: 'pending',
    });

    const populatedOrder = await Order.findById(order._id)
      .populate('buyer', 'name email')
      .populate('products.productId', 'name category price imageUrl');

    return res.status(201).json({
      message: 'order.created',
      order: populatedOrder,
    });
  } catch (err) {
    console.error('[createOrder]', err);
    return res.status(500).json({ message: 'server.internal_error' });
  }
};

/**
 * READ GET /api/orders/my
 * Farmer views their own order history
 */
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user.id })
      .populate('products.productId', 'name category price imageUrl')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: orders.length,
      orders,
    });
  } catch (err) {
    console.error('[getMyOrders]', err);
    return res.status(500).json({ message: 'server.internal_error' });
  }
};

/**
 * READ ALL GET /api/orders
 * Admin views all orders placed across the platform
 */
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('buyer', 'name email')
      .populate('products.productId', 'name category price imageUrl')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: orders.length,
      orders,
    });
  } catch (err) {
    console.error('[getAllOrders]', err);
    return res.status(500).json({ message: 'server.internal_error' });
  }
};

/**
 * UPDATE PUT /api/orders/:id/status
 * Admin updates the order processing status (pending -> shipped -> delivered)
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ['pending', 'shipped', 'delivered'];
    if (!status || !allowedStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({
        message: 'order.status_invalid',
        allowed: allowedStatuses,
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'order.not_found' });
    }

    order.status = status.toLowerCase();
    await order.save();

    const updatedOrder = await Order.findById(order._id)
      .populate('buyer', 'name email')
      .populate('products.productId', 'name category price imageUrl');

    return res.status(200).json({
      message: 'order.status_updated',
      order: updatedOrder,
    });
  } catch (err) {
    console.error('[updateOrderStatus]', err);
    return res.status(500).json({ message: 'server.internal_error' });
  }
};
