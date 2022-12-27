const { db } = require('../../db.js');
const createError = require('http-errors')
const Jwt = require('jsonwebtoken');


// create a function to get all branchs from branches table
const getBranchs = async (request, response,next) => {
    let q = 'SELECT branches.* FROM branches';
    console.log(request.query)

    // get city by id
    if(request.query.city){
        q += ` INNER JOIN city ON branches.city = city.id AND city.name LIKE "%${request.query.city}%"`;
    }
    else if(request.query.zip_code){
        q += ` WHERE branches.zip_code = ${request.query.zip_code}`;
    }
    else if(request.query.street){
        q += ` WHERE branches.street LIKE "%${request.query.street}%"`;
    }

    try {
        const rows = await db.awaitQuery(q);
        response.status(200).send(rows);
    } catch (error) {
        next(createError(500,error));
    }
};

module.exports = {
    getBranchs
};