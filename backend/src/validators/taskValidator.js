const Joi = require('joi');

const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/, 'ObjectId');

const createTaskSchema = Joi.object({
  title: Joi.string().min(2).max(200).required(),
  description: Joi.string().allow('').max(5000),
  project: objectId.required(),
  assignedTo: objectId.allow(null),
  status: Joi.string().valid('todo', 'in_progress', 'done').default('todo'),
  priority: Joi.string().valid('low', 'medium', 'high').default('medium'),
  dueDate: Joi.date().iso().allow(null),
});

const updateTaskSchema = Joi.object({
  title: Joi.string().min(2).max(200),
  description: Joi.string().allow('').max(5000),
  assignedTo: objectId.allow(null),
  status: Joi.string().valid('todo', 'in_progress', 'done'),
  priority: Joi.string().valid('low', 'medium', 'high'),
  dueDate: Joi.date().iso().allow(null),
}).min(1);

module.exports = { createTaskSchema, updateTaskSchema };
