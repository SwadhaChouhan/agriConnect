import Product from '../models/Product.js';

/**
 * GET /api/products
 * Any authenticated user can browse marketplace products.
 * Optional query param: ?category=seeds|fertilizers|pesticides|equipment
 */
export const getProducts = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = {};

    if (category && category !== 'all') {
      filter.category = category.toLowerCase().trim();
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      count: products.length,
      products,
    });
  } catch (err) {
    console.error('[getProducts]', err);
    return res.status(500).json({ message: 'server.internal_error' });
  }
};

/**
 * GET /api/products/:id
 * Fetch a single product by ID
 */
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'product.not_found' });
    }

    return res.status(200).json({ product });
  } catch (err) {
    console.error('[getProductById]', err);
    return res.status(500).json({ message: 'server.internal_error' });
  }
};

/**
 * POST /api/products
 * Admin only: Create a new product / add stock
 */
export const createProduct = async (req, res) => {
  try {
    const { name, category, description, price, stock, imageUrl } = req.body;

    if (!name || !category || price === undefined || stock === undefined) {
      return res.status(400).json({
        message: 'product.required_fields_missing',
      });
    }

    const product = await Product.create({
      name: name.trim(),
      category: category.toLowerCase().trim(),
      description: description ? description.trim() : '',
      price: parseFloat(price),
      stock: parseInt(stock, 10),
      imageUrl: imageUrl ? imageUrl.trim() : '',
    });

    return res.status(201).json({
      message: 'product.created',
      product,
    });
  } catch (err) {
    console.error('[createProduct]', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    return res.status(500).json({ message: 'server.internal_error' });
  }
};

/**
 * PUT /api/products/:id
 * Admin only: Update existing product details or stock
 */
export const updateProduct = async (req, res) => {
  try {
    const { name, category, description, price, stock, imageUrl } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'product.not_found' });
    }

    if (name !== undefined) product.name = name.trim();
    if (category !== undefined) product.category = category.toLowerCase().trim();
    if (description !== undefined) product.description = description.trim();
    if (price !== undefined) product.price = parseFloat(price);
    if (stock !== undefined) product.stock = parseInt(stock, 10);
    if (imageUrl !== undefined) product.imageUrl = imageUrl.trim();

    await product.save();

    return res.status(200).json({
      message: 'product.updated',
      product,
    });
  } catch (err) {
    console.error('[updateProduct]', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    return res.status(500).json({ message: 'server.internal_error' });
  }
};

/**
 * DELETE /api/products/:id
 * Admin only: Delete a product
 */
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'product.not_found' });
    }

    return res.status(200).json({ message: 'product.deleted' });
  } catch (err) {
    console.error('[deleteProduct]', err);
    return res.status(500).json({ message: 'server.internal_error' });
  }
};
