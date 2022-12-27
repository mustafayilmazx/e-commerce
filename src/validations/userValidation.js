// import joi
const Joi = require('joi');

// validate address object on request body
const addressValidation = Joi.object({
        full_adress: Joi.string().min(15).required(),
        district: Joi.string().min(3).required(),
        city: Joi.number().required().min(1).max(81),
    });


const creditCardValidation = Joi.object({
    cc_no: Joi.number().required().min(1000000000000000).max(9999999999999999),
    cc_month: Joi.number().required().min(1).max(12),
    cc_year: Joi.number().required().min(2022).max(2030),
});

const favoritesToCartValidation = Joi.object({
    product_id: Joi.number().required().min(1),
    quantity: Joi.number().required().min(1),
});

const registerValidation = Joi.object({
    name: Joi.string().min(3).required(),
    mail: Joi.string().min(6).required().email(),
    password: Joi.string().min(6).required(),
});

const emailValidation = Joi.object({
    mail: Joi.string().min(6).required().email(),
});

module.exports = {
    addressValidation,
    creditCardValidation,
    favoritesToCartValidation,
    registerValidation,
    emailValidation
}