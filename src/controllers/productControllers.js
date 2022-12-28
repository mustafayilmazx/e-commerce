const { db } = require('../../db.js');
const createError = require('http-errors')
const Jwt = require('jsonwebtoken');
const services = require('../services/baseService.js');


// get products by barcode,name or category
const getProducts = async (request, response,next) => {
    let q = 'SELECT products.* FROM products';
    console.log(request.query)
    const barcode = request.query.barcode;
    const name = request.query.name;
    const category = request.query.category;

    if ([barcode,name,category].filter(Boolean).length > 0) {
        q += ` WHERE `;
        if(request.query.barcode){
            q += ` products.barcode = ${request.query.barcode}`;
        }
        if(request.query.name){
            if (request.query.barcode) {
                q += ` AND `;
            }
            q += ` products.name LIKE "%${request.query.name}%"`;
        }
        if(request.query.category){
            if (request.query.barcode || request.query.name) {
                q += ` AND `;
            }
            const childs = await services.getChildCategories(request.query.category);

            q += ` products.category IN (${childs.join(',')})`;
        }
    }
    console.log(q)
    let rows;
    try {
        rows = await db.awaitQuery(q);
        // response.status(200).send(rows);
    } catch (error) {
        next(createError(500,error));
    }


    // get month_least_sold table and transfer product id's
    const q2 = "SELECT * FROM `month_least_sold`"
    const result2 = await db.awaitQuery(q2);
    const least_sold_ids = []
    for (let index = 0; index < result2.length; index++) {
        const element = result2[index];
        least_sold_ids.push(element.product_id)
    }

    for (let index = 0; index < rows.length; index++) {
        const element = rows[index];
        if (least_sold_ids.includes(element.id)) {
            element.discount_rate += result2[0].monthly_discount;
            element.discounted_price = element.price * (100 - element.discount_rate) / 100;
        }
        else {
            element.discounted_price = element.price * (100 - element.discount_rate) / 100;
        }
    }
    response.status(200).send(rows)

}

// get categories with using service.getCatgories

const getCategories = async (request, response,next) => {
    const categories = await services.getCategories();
    response.status(200).send(categories);
}


module.exports = {
    getProducts,
    getCategories
}
