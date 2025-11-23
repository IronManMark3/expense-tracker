const Joi = require('joi');

function validate(schema) {
  return (req, res, next) => {
    const data = { ...req.body, ...req.params, ...req.query };
    const { error, value } = schema.validate(data, { abortEarly: false });
    if (error) return res.status(400).json({ errors: error.details.map(d => d.message) });
    req.validated = value;
    next();
  };
}

module.exports = validate;
