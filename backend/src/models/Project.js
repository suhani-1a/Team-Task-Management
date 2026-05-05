const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

projectSchema.methods.hasAccess = function (userId) {
  const id = String(userId);
  return String(this.owner) === id || this.members.some((m) => String(m) === id);
};

module.exports = mongoose.model('Project', projectSchema);
