import Joi from "joi";

const email = Joi.string().email().max(254).required();
const password = Joi.string().min(6).max(128).required();

export const registerSchema = Joi.object({
  email,
  password
});

export const loginSchema = Joi.object({
  email,
  password
});

export const saveApiKeySchema = Joi.object({
  apiKey: Joi.string().min(20).max(200).required() // allow future formats
});

export const promptSchema = Joi.object({
  input: Joi.string().min(1).max(8000).required()
});