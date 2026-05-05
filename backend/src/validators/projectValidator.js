const Joi = require('joi');

const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/, 'ObjectId');

const createProjectSchema = Joi.object({
  name: Joi.string().min(2).max(120).required(),
  description: Joi.string().allow('').max(2000),
  members: Joi.array().items(objectId).default([]),
});

const updateProjectSchema = Joi.object({
  name: Joi.string().min(2).max(120),
  description: Joi.string().allow('').max(2000),
  members: Joi.array().items(objectId),
}).min(1);

module.exports = { createProjectSchema, updateProjectSchema };
