// controllers/careTips.js
const CareTip = require('../models/CareTip');

exports.getAllTips = async (req, res) => {
  try {
    const tips = await CareTip.find();
    res.json(tips);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createTip = async (req, res) => {
  try {
    const tip = new CareTip(req.body);
    await tip.save();
    res.status(201).json(tip);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateTip = async (req, res) => {
  try {
    const tip = await CareTip.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!tip) {
      return res.status(404).json({ message: 'Tip not found' });
    }
    res.json(tip);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteTip = async (req, res) => {
  try {
    const tip = await CareTip.findByIdAndDelete(req.params.id);
    if (!tip) {
      return res.status(404).json({ message: 'Tip not found' });
    }
    res.json({ message: 'Tip deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};