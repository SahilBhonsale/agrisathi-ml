const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { authenticate } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const isServerless = Boolean(process.env.VERCEL);
const uploadsDir = isServerless ? '/tmp/agrisathi-products' : 'uploads/products';
if (!isServerless && !fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for image uploads
const diskStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir)
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname))
  }
});

const storage = isServerless ? multer.memoryStorage() : diskStorage;

const getStoredImage = (file) => file.buffer
  ? `data:${file.mimetype};base64,${file.buffer.toString('base64')}`
  : `/uploads/products/${file.filename}`;

const upload = multer({ 
  storage: storage,
  limits: { fileSize: (isServerless ? 2 : 5) * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Get all products with filters and search
router.get('/products', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 12, 
      category, 
      search, 
      minPrice, 
      maxPrice,
      condition,
      location,
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query;

    // Build query. Independent search/location clauses are combined so using
    // both filters never silently replaces one of them.
    const query = { isDeleted: false, availability: { $ne: 'Sold' } };
    const compoundFilters = [];

    // Category filter
    if (category && category !== 'All') {
      query.category = category;
    }

    // Search functionality
    if (search) {
      compoundFilters.push({ $or: [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ] });
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Condition filter
    if (condition) {
      query.condition = condition;
    }

    // Location filter
    if (location) {
      compoundFilters.push({ $or: [
        { 'location.city': { $regex: location, $options: 'i' } },
        { 'location.state': { $regex: location, $options: 'i' } }
      ] });
    }

    if (compoundFilters.length > 0) query.$and = compoundFilters;

    // Sorting
    const sortOptions = {};
    if (sortBy === 'price') {
      sortOptions.price = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'views') {
      sortOptions.views = -1;
    } else if (sortBy === 'likes') {
      sortOptions.likes = -1;
    } else {
      sortOptions.createdAt = sortOrder === 'desc' ? -1 : 1;
    }

    // Execute query with pagination
    const products = await Product.find(query)
      .populate('seller', 'name phone email isVerified')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Get total count for pagination
    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      data: products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products'
    });
  }
});

// Get single product with enhanced details
router.get('/products/:id', async (req, res) => {
  try {
    const userId = req.user?._id;
    
    const product = await Product.findById(req.params.id)
      .populate('seller', 'name phone email isVerified createdAt')
      .lean();

    if (!product || product.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if user has liked this product
    const hasLiked = userId ? product.likes.some(like => like.toString() === userId.toString()) : false;
    
    // Get related products (same category, different seller)
    const relatedProducts = await Product.find({
      category: product.category,
      seller: { $ne: product.seller._id },
      isDeleted: false,
      availability: 'Available',
      _id: { $ne: product._id }
    })
    .populate('seller', 'name isVerified')
    .select('title price images condition location createdAt')
    .limit(4)
    .lean();

    // Get seller's other products
    const sellerProducts = await Product.find({
      seller: product.seller._id,
      isDeleted: false,
      availability: 'Available',
      _id: { $ne: product._id }
    })
    .select('title price images condition')
    .limit(3)
    .lean();

    // Increment views (don't wait for it)
    Product.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }).exec();

    // Enhanced product data
    const enhancedProduct = {
      ...product,
      hasLiked,
      likesCount: product.likes.length,
      relatedProducts,
      sellerProducts,
      seller: {
        ...product.seller,
        totalProducts: await Product.countDocuments({ 
          seller: product.seller._id, 
          isDeleted: false 
        })
      }
    };

    res.json({
      success: true,
      data: enhancedProduct
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product'
    });
  }
});

// Create new product (authenticated)
router.post('/products', authenticate, upload.array('images', 5), async (req, res) => {
  try {
    const {
      title, description, price, category, condition,
      city, state, pincode, phone, email, whatsapp,
      quantity, unit
    } = req.body;

    // Validate required fields
    if (!title || !description || !price || !category) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, price, and category are required'
      });
    }

    // Process uploaded images
    const images = req.files ? req.files.map(getStoredImage) : [];

    if (images.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one image is required'
      });
    }

    const product = new Product({
      title,
      description,
      price: Number(price),
      category,
      condition,
      images,
      location: { city, state, pincode },
      seller: req.user._id,
      contactInfo: { phone, email, whatsapp },
      quantity: quantity ? Number(quantity) : 1,
      unit
    });

    await product.save();

    const populatedProduct = await Product.findById(product._id)
      .populate('seller', 'name phone email isVerified');

    res.status(201).json({
      success: true,
      message: 'Product listed successfully',
      data: populatedProduct
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product'
    });
  }
});

// Update product (authenticated, owner or admin)
router.put('/products/:id', authenticate, upload.array('images', 5), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product || product.isDeleted) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (product.seller.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this product' });
    }

    const allowedFields = [
      'title', 'description', 'category', 'condition', 'availability', 'unit'
    ];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) product[field] = req.body[field];
    });

    if (req.body.price !== undefined) product.price = Number(req.body.price);
    if (req.body.quantity !== undefined) product.quantity = Number(req.body.quantity);

    product.location = {
      city: req.body.city ?? product.location?.city,
      state: req.body.state ?? product.location?.state,
      pincode: req.body.pincode ?? product.location?.pincode
    };
    product.contactInfo = {
      phone: req.body.phone ?? product.contactInfo?.phone,
      email: req.body.email ?? product.contactInfo?.email,
      whatsapp: req.body.whatsapp ?? product.contactInfo?.whatsapp
    };

    const existingImages = Array.isArray(req.body.existingImages)
      ? req.body.existingImages
      : req.body.existingImages ? [req.body.existingImages] : [];
    const newImages = (req.files || []).map(getStoredImage);
    product.images = [...existingImages, ...newImages];

    if (product.images.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one image is required' });
    }

    await product.save();
    await product.populate('seller', 'name email');

    return res.json({ success: true, message: 'Product updated successfully', data: product });
  } catch (error) {
    console.error('Error updating product:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to update product' });
  }
});

// Like/Unlike product
router.post('/products/:id/like', authenticate, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product || product.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const userId = req.user._id;
    const hasLiked = product.likes.includes(userId);

    if (hasLiked) {
      product.likes.pull(userId);
    } else {
      product.likes.push(userId);
    }

    await product.save();

    res.json({
      success: true,
      data: {
        likes: product.likes.length,
        hasLiked: !hasLiked
      }
    });
  } catch (error) {
    console.error('Error liking product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to like product'
    });
  }
});

// Get user's products
router.get('/my-products', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const products = await Product.find({ 
      seller: req.user._id, 
      isDeleted: false 
    })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Product.countDocuments({ 
      seller: req.user._id, 
      isDeleted: false 
    });

    res.json({
      success: true,
      data: products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching user products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your products'
    });
  }
});

// Delete product (authenticated, owner only)
router.delete('/products/:id', authenticate, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product || product.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if user is the owner or admin
    if (product.seller.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this product'
      });
    }

    product.isDeleted = true;
    await product.save();

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product'
    });
  }
});

module.exports = router;
