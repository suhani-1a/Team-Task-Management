const Task = require('../models/Task');
const Project = require('../models/Project');

async function loadAccessibleProject(projectId, user) {
  const project = await Project.findById(projectId);
  if (!project) return { error: { status: 404, message: 'Project not found' } };
  if (!project.hasAccess(user._id)) return { error: { status: 403, message: 'Forbidden' } };
  return { project };
}

exports.create = async (req, res) => {
  const { project: projectId, assignedTo } = req.body;

  const { project, error } = await loadAccessibleProject(projectId, req.user);
  if (error) return res.status(error.status).json({ message: error.message });

  const isOwner = String(project.owner) === String(req.user._id);
  if (req.user.role !== 'admin' && !isOwner) {
    return res.status(403).json({ message: 'Only admins or the project owner can create tasks' });
  }

  if (assignedTo && !project.hasAccess(assignedTo)) {
    return res.status(400).json({ message: 'Assignee must be a project member or owner' });
  }

  const task = await Task.create({ ...req.body, createdBy: req.user._id });
  await task.populate([
    { path: 'assignedTo', select: 'name email role' },
    { path: 'createdBy', select: 'name email role' },
  ]);
  res.status(201).json(task);
};

exports.list = async (req, res) => {
  const { project: projectId, status, assignedToMe, overdue } = req.query;

  const filter = {};

  if (projectId) {
    const { project, error } = await loadAccessibleProject(projectId, req.user);
    if (error) return res.status(error.status).json({ message: error.message });
    filter.project = project._id;
  } else {
    const projects = await Project.find({
      $or: [{ owner: req.user._id }, { members: req.user._id }],
    }).select('_id');
    filter.project = { $in: projects.map((p) => p._id) };
  }

  if (status) filter.status = status;
  if (assignedToMe === 'true') filter.assignedTo = req.user._id;
  if (overdue === 'true') {
    filter.dueDate = { $lt: new Date() };
    filter.status = { $ne: 'done' };
  }

  const tasks = await Task.find(filter)
    .sort({ createdAt: -1 })
    .populate('assignedTo', 'name email role')
    .populate('createdBy', 'name email role')
    .populate('project', 'name');
  res.json(tasks);
};

exports.update = async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ message: 'Task not found' });

  const project = await Project.findById(task.project);
  if (!project || !project.hasAccess(req.user._id)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const isOwner = String(project.owner) === String(req.user._id);
  const isAdmin = req.user.role === 'admin';
  const isAssignee = task.assignedTo && String(task.assignedTo) === String(req.user._id);

  const allowedForMember = ['status'];
  const updates = req.body;

  if (!isAdmin && !isOwner) {
    const fields = Object.keys(updates);
    const onlyAllowed = fields.every((f) => allowedForMember.includes(f));
    if (!onlyAllowed || !isAssignee) {
      return res.status(403).json({
        message: 'Members can only update the status of tasks assigned to them',
      });
    }
  }

  if (updates.assignedTo && !project.hasAccess(updates.assignedTo)) {
    return res.status(400).json({ message: 'Assignee must be a project member or owner' });
  }

  Object.assign(task, updates);
  await task.save();
  await task.populate([
    { path: 'assignedTo', select: 'name email role' },
    { path: 'createdBy', select: 'name email role' },
    { path: 'project', select: 'name' },
  ]);
  res.json(task);
};

exports.remove = async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ message: 'Task not found' });

  const project = await Project.findById(task.project);
  if (!project) return res.status(404).json({ message: 'Project not found' });

  const isOwner = String(project.owner) === String(req.user._id);
  if (req.user.role !== 'admin' && !isOwner) {
    return res.status(403).json({ message: 'Only admins or the project owner can delete tasks' });
  }

  await task.deleteOne();
  res.json({ message: 'Task deleted' });
};
