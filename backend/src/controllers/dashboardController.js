const Project = require('../models/Project');
const Task = require('../models/Task');

exports.summary = async (req, res) => {
  const projects = await Project.find({
    $or: [{ owner: req.user._id }, { members: req.user._id }],
  }).select('_id name');
  const projectIds = projects.map((p) => p._id);

  const baseFilter = { project: { $in: projectIds } };

  const [total, todo, inProgress, done, overdue, perUserAgg, mineCount] = await Promise.all([
    Task.countDocuments(baseFilter),
    Task.countDocuments({ ...baseFilter, status: 'todo' }),
    Task.countDocuments({ ...baseFilter, status: 'in_progress' }),
    Task.countDocuments({ ...baseFilter, status: 'done' }),
    Task.countDocuments({ ...baseFilter, status: { $ne: 'done' }, dueDate: { $lt: new Date() } }),
    Task.aggregate([
      { $match: { project: { $in: projectIds }, assignedTo: { $ne: null } } },
      { $group: { _id: '$assignedTo', count: { $sum: 1 } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          name: '$user.name',
          email: '$user.email',
          count: 1,
        },
      },
      { $sort: { count: -1 } },
    ]),
    Task.countDocuments({ ...baseFilter, assignedTo: req.user._id }),
  ]);

  res.json({
    totals: {
      projects: projects.length,
      tasks: total,
      todo,
      inProgress,
      done,
      overdue,
      assignedToMe: mineCount,
    },
    tasksPerUser: perUserAgg,
    projects,
  });
};
