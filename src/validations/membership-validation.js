import Joi from "joi";

const registerUserValidation = Joi.object({
  email: Joi.string().email().max(100).required().messages({
    "any.required": "Parameter email harus diisi",
    "string.empty": "Parameter email harus diisi",
    "string.email": "Parameter email tidak sesuai format",
  }),
  first_name: Joi.string().max(100).required().messages({
    "any.required": "Parameter first_name harus diisi",
    "string.empty": "Parameter first_name harus diisi",
  }),
  last_name: Joi.string().max(100).required().messages({
    "any.required": "Parameter last_name harus diisi",
    "string.empty": "Parameter last_name harus diisi",
  }),
  password: Joi.string().max(100).required().min(8).messages({
    "any.required": "Parameter password harus diisi",
    "string.empty": "Parameter password harus diisi",
    "string.min": "password minimal 8 karakter",
  }),
});

const loginUserValidation = Joi.object({
  email: Joi.string().email().max(100).required().messages({
    "any.required": "Parameter email harus diisi",
    "string.empty": "Parameter email harus diisi",
    "string.email": "Parameter email tidak sesuai format",
  }),
  password: Joi.string().max(100).required().messages({
    "any.required": "Parameter password harus diisi",
    "string.empty": "Parameter password harus diisi",
  }),
});

const updateUserValidation = Joi.object({
  first_name: Joi.string().max(100).required().messages({
    "any.required": "Parameter first_name harus diisi",
    "string.empty": "Parameter first_name harus diisi",
  }),
  last_name: Joi.string().max(100).required().messages({
    "any.required": "Parameter last_name harus diisi",
    "string.empty": "Parameter last_name harus diisi",
  }),
});

const updateUserImageValidation = Joi.object({
  profile_image: Joi.string()
    .pattern(/^\/uploads\/.*\.(jpg|jpeg|png)$/i)
    .max(100)
    .optional()
    .messages({
      "string.pattern.base": "Format image tidak sesuai (harus JPG atau PNG)",
    }),
});

export {
  registerUserValidation,
  loginUserValidation,
  updateUserValidation,
  updateUserImageValidation,
};
