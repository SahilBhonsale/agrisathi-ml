const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Seeds', 'Fertilizers', 'Tools', 'Organic Products', 
      'Pesticides', 'Equipment', 'Fruits', 'Vegetables', 
      'Grains', 'Dairy', 'Other'
    ]
  },
  images: [{
    type: String,
    required: true
  }],
  condition: {
    type: String,
    enum: ['New', 'Used', 'Refurbished'],
    default: 'New'
  },
  location: {
    city: String,
    state: String,
    pincode: String
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  contactInfo: {
    phone: String,
    email: String,
    whatsapp: String
  },
  availability: {
    type: String,
    enum: ['Available', 'Sold', 'Out of Stock'],
    default: 'Available'
  },
  quantity: {
    type: Number,
    default: 1
  },
  unit: {
    type: String,
    enum: ['kg', 'liter', 'piece', 'ton', 'quintal', 'dozen'],
    default: 'piece'
  },
  featured: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Add indexes for better search performance
productSchema.index({ title: 'text', description: 'text' });
productSchema.index({ category: 1, availability: 1 });
productSchema.index({ seller: 1 });

module.exports = mongoose.model('Product', productSchema);