const { db } = require('../../db.js');
const createError = require('http-errors')
const Jwt = require('jsonwebtoken');
const services = require('../services/adminService.js');


// admin login function
const adminLogin = async (request, response, next) => {
    await services.adminLogin(request, response, next);
}

// admin register function
const adminRegister = async (request, response, next) => {
    await services.adminRegister(request, response, next);
}


const adminProductDiscount = async (request, response, next) => {
    const result = await services.adminProductDiscount(request, response, next);
    response.status(result.statusCode).send(result);
}

const changeMonthlyLeastDiscountRate = async (request, response, next) => {
    const result = await services.changeMonthlyLeastDiscountRate(request, response, next);
    response.status(result.statusCode).send(result);
}

const getMonthlyLeastDiscountRate = async (request, response, next) => {
    const result = await services.getMonthlyLeastDiscountRate(request, response, next);
    response.status(result.statusCode).send(result);
}


const getTopTenCustomers = async (request, response, next) => {
    const result = await services.getTopTenCustomers(request, response, next);
    response.status(result.statusCode).send(result);
}

const changeTopTenCustomersDiscountRate = async (request, response, next) => {
    const result = await services.changeTopTenCustomersDiscountRate(request, response, next);
    response.status(result.statusCode).send(result);
}

const deleteComment = async (request, response, next) => {
    const result = await services.deleteComment(request, response, next);
    response.status(result.statusCode).send(result);
}



module.exports = {
    adminLogin,
    adminRegister,
    adminProductDiscount,
    changeMonthlyLeastDiscountRate,
    getMonthlyLeastDiscountRate,
    getTopTenCustomers,
    changeTopTenCustomersDiscountRate,
    deleteComment
};