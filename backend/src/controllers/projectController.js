const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');

exports.create = async (req, res) => {
  const { name, description, members } = req.body;

  if (members && members.length) {
    const found = await User.countDocuments({ _id: { $in: members } });
    if (found !== members.length) {
      return res.status(400).json({ message: 'One or more member ids are invalid' });
    }
  }

  const project = await Project.create({
    name,
    description,
    owner: req.user._id,
    members: members || [],
  });

  await project.populate([
    { path: 'owner', select: 'name email role' },
    { path: 'members', select: 'name email role' },
  ]);
  res.status(201).json(project);
};

exports.list = async (req, res) => {
  const filter = { $or: [{ owner: req.user._id }, { members: req.user._id }] };
  const projects = await Project.find(filter)
    .sort({ createdAt: -1 })
    .populate('owner', 'name email role')
    .populate('members', 'name email role');
  res.json(projects);
};

exports.get = async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate('owner', 'name email role')
    .populate('members', 'name email role');
  if (!project) return res.status(404).json({ message: 'Project not found' });
  if (!project.hasAccess(req.user._id)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  res.json(project);
};

exports.update = async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ message: 'Project not found' });

  if (String(project.owner) !== String(req.user._id)) {
    return res.status(403).json({ message: 'Only the project owner can update it' });
  }

  const { name, description, members } = req.body;
  if (members) {
    const found = await User.countDocuments({ _id: { $in: members } });
    if (found !== members.length) {
      return res.status(400).json({ message: 'One or more member ids are invalid' });
    }
    project.members = members;
  }
  if (name !== undefined) project.name = name;
  if (description !== undefined) project.description = description;

  await project.save();
  await project.populate([
    { path: 'owner', select: 'name email role' },
    { path: 'members', select: 'name email role' },
  ]);
  res.json(project);
};

exports.remove = async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ message: 'Project not found' });
  if (String(project.owner) !== String(req.user._id)) {
    return res.status(403).json({ message: 'Only the project owner can delete it' });
  }
  await Task.deleteMany({ project: project._id });
  await project.deleteOne();
  res.json({ message: 'Project deleted' });
};
