const Joi = require('joi');

// User signup validation schema
const signupValidationSchema = Joi.object({
  username: Joi.string()
    .max(20)
    .required()
    .messages({
      "string.max": "Username must be less than 20 characters.",
      "any.required": "Username is required.",
    }),
  email: Joi.string()
    .email()
    .required()
    .messages({
      "string.email": "Invalid email format.",
      "any.required": "Email is required.",
    }),
  password: Joi.string()
    .min(10)
    .pattern(
      new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&_]).{10,}$")
    )
    .required()
    .messages({
      "string.min": "Password must be at least 10 characters.",
      "string.pattern.base":
        "Password must contain uppercase, lowercase, numbers, and symbols.",
      "any.required": "Password is required.",
    }),
});

// Login validation schema
const loginValidationSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      "string.email": "Invalid email format.",
      "any.required": "Email is required.",
    }),
  password: Joi.string()
    .required()
    .messages({
      "any.required": "Password is required.",
    })
});

// Validation functions
function validateSignup(data) {
  return signupValidationSchema.validate(data, { abortEarly: false });
}

function validateLogin(data) {
  return loginValidationSchema.validate(data, { abortEarly: false });
}

// Helper function to format validation errors
function formatValidationErrors(validationResult) {
  if (validationResult.error) {
    return validationResult.error.details.map(d => d.message).join(', ');
  }
  return null;
}

module.exports = {
  validateSignup,
  validateLogin,
  formatValidationErrors,
};