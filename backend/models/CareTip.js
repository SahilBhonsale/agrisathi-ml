const mongoose = require('mongoose');

const careTipSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Plant name is required'],
    trim: true,
    maxlength: [100, 'Plant name cannot exceed 100 characters']
  },
  watering: { 
    type: String, 
    required: [true, 'Watering instructions are required'],
    trim: true
  },
  sunlight: { 
    type: String, 
    required: [true, 'Sunlight requirements are required'],
    trim: true
  },
  remedies: { 
    type: String, 
    required: [true, 'Remedies information is required'],
    trim: true
  },
  diseases: { 
    type: String, 
    required: [true, 'Diseases information is required'],
    trim: true
  },
  plantType: { 
    type: String,
    trim: true,
    enum: ['Vegetable', 'Fruit', 'Herb', 'Flower', 'Tree', 'General'],
    default: 'General'
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, { 
  timestamps: true,
  collection: 'caretips',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add text index for search functionality
careTipSchema.index({
  name: 'text',
  watering: 'text',
  sunlight: 'text',
  remedies: 'text',
  diseases: 'text'
});

// Soft delete method
careTipSchema.methods.softDelete = function(userId) {
  this.isDeleted = true;
  this.deletedBy = userId;
  return this.save();
};

const CareTip = mongoose.model('CareTip', careTipSchema);

module.exports = CareTip;