const Joi = require("joi");

const email = Joi.string().email().max(254).required();
const password = Joi.string().min(6).max(128).required();

const registerSchema = Joi.object({
  email,
  password
});

const loginSchema = Joi.object({
  email,
  password
});

const saveApiKeySchema = Joi.object({
  apiKey: Joi.string().min(20).max(200).required() // allow future formats
});

const promptSchema = Joi.object({
  input: Joi.string().min(1).max(8000).required()
});

module.exports = {
  registerSchema,
  loginSchema,
  saveApiKeySchema,
  promptSchema
};