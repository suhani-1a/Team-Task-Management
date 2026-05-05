const User = require('../models/User');

exports.list = async (req, res) => {
  const { q } = req.query;
  const filter = q
    ? { $or: [{ name: new RegExp(q, 'i') }, { email: new RegExp(q, 'i') }] }
    : {};
  const users = await User.find(filter).select('name email role').limit(50);
  res.json(users);
};
