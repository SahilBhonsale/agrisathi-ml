const express = require('express');
const router = express.Router();
const CareTip = require('../models/CareTip');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Test route
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Care tips routes working!',
    timestamp: new Date()
  });
});

// GET /api/care-tips - Get all care tips from database
router.get('/', async (req, res) => {
  try {
    const tips = await CareTip.find({ isDeleted: false })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: tips
    });
  } catch (error) {
    console.error('Error fetching care tips:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch care tips'
    });
  }
});

// POST /api/care-tips - Create new care tip (admin only)
router.post('/', authenticate, async (req, res) => {
  try {
    console.log('🌱 Care tip creation attempt by user:', req.user ? req.user.email : 'No user');
    console.log('🔐 User isAdmin:', req.user ? req.user.isAdmin : 'No user');
    console.log('📝 Request body:', req.body);

    if (!req.user.isAdmin) {
      console.log('❌ Access denied: User is not admin');
      return res.status(403).json({
        success: false,
        message: 'Admin access required to create care tips'
      });
    }

    const { name, watering, sunlight, remedies, diseases, plantType } = req.body;

    if (!name || !watering || !sunlight || !remedies || !diseases) {
      console.log('❌ Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'All fields are required: name, watering, sunlight, remedies, diseases'
      });
    }

    console.log('✅ Creating care tip...');
    const newTip = new CareTip({
      name,
      watering,
      sunlight,
      remedies,
      diseases,
      plantType: plantType || 'General',
      createdBy: req.user._id
    });

    await newTip.save();
    await newTip.populate('createdBy', 'name email');

    console.log('✅ Care tip created successfully:', newTip._id);

    res.status(201).json({
      success: true,
      message: 'Care tip created successfully',
      data: newTip
    });
  } catch (error) {
    console.error('❌ Error creating care tip:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create care tip',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PUT /api/care-tips/:id - Update care tip (admin only)
router.put('/:id', authenticate, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { name, watering, sunlight, remedies, diseases, plantType } = req.body;
    const tipId = req.params.id;

    const updatedTip = await CareTip.findByIdAndUpdate(
      tipId,
      {
        name,
        watering,
        sunlight,
        remedies,
        diseases,
        plantType: plantType || 'General'
      },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    if (!updatedTip) {
      return res.status(404).json({
        success: false,
        message: 'Care tip not found'
      });
    }

    res.json({
      success: true,
      message: 'Care tip updated successfully',
      data: updatedTip
    });
  } catch (error) {
    console.error('Error updating care tip:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update care tip'
    });
  }
});

// DELETE /api/care-tips/:id - Delete care tip (admin only)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const tipId = req.params.id;
    
    const deletedTip = await CareTip.findByIdAndUpdate(
      tipId,
      { 
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: req.user._id
      },
      { new: true }
    );

    if (!deletedTip) {
      return res.status(404).json({
        success: false,
        message: 'Care tip not found'
      });
    }

    res.json({
      success: true,
      message: 'Care tip deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting care tip:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete care tip'
    });
  }
});

module.exports = router;