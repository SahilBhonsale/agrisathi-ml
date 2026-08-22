const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  from: { type: String, enum: ['user', 'bot'], required: true },
  text: { type: String, required: true, maxlength: 10000 },
  timestamp: { type: Date, default: Date.now },
  isError: { type: Boolean, default: false },
  model: String
}, { _id: false });

const chatSessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, required: true },
  messages: [messageSchema]
}, { timestamps: true });

module.exports = mongoose.model('ChatSession', chatSessionSchema);
