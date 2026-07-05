const mongoose = require('mongoose');

const StatusSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  vibeBadge: {
    emoji: { type: String, required: true },
    text: { type: String, required: true }
  },
  statusText: { type: String, required: true, maxLength: 100 },
  createdAt: { type: Date, default: Date.now, expires: 86400 }, // Auto-deletes in 24 hours
  reactions: {
    hug: { type: Number, default: 0 },
    chocolate: { type: Number, default: 0 }
  }
});

module.exports = mongoose.model('Status', StatusSchema);