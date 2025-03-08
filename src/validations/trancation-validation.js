import Joi from "joi";

const topupValidation = Joi.object({
  top_up_amount: Joi.number().required().messages({
    "any.required": "Parameter top_up_amount harus di isi",
    "string.empty": "Parameter top_up_amount harus di isi",
  }),
});

const transactionValidation = Joi.object({
  service_code: Joi.string().required().max(100).messages({
    "any.required": "Parameter service_code harus di isi",
    "string.empty": "Parameter service_code harus di isi",
  }),
});

const transactionHistoryValidation = Joi.object({
  offset: Joi.number().integer().min(0).default(0).optional().messages({
    "number.min": "Parameter offset harus lebih besar atau sama dengan 0",
  }),
  limit: Joi.number().integer().min(1).default(10).optional().messages({
    "number.min": "Parameter limit harus lebih besar atau sama dengan 1",
  }),
});

export { topupValidation, transactionValidation, transactionHistoryValidation };
