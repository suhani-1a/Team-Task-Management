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

function refId(ref) {
  if (!ref) return null;
  return ref._id ? String(ref._id) : String(ref);
}

projectSchema.methods.hasAccess = function (userId) {
  const id = String(userId);
  if (refId(this.owner) === id) return true;
  return (this.members || []).some((m) => refId(m) === id);
};

module.exports = mongoose.model('Project', projectSchema);
