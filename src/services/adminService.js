const { db } = require('../../db.js');
const createError = require('http-errors');
const Jwt = require('jsonwebtoken');


const generateToken = async (req,uid) => {
    const body = {
        adminMail: req.body.adminMail,
        adminId: uid
    }
    const token = await Jwt.sign(body,process.env.JWT_SECRET,{expiresIn : '3 days'});
    return token;
}

// admin login function
const adminLogin = async (request, response, next) => {
    const { mail, password } = request.body;
    const q = 'SELECT * FROM admin WHERE mail = ? AND password = ?';
    try {
        const rows = await db.awaitQuery(q, [mail, password]);
        if (rows.length > 0) {
            const token = await generateToken(request, rows[0].id);
            response.status(200).send({
                message: 'Login Success',
                token: token
            });
        } else {
            response.status(401).send({
                message: 'Invalid Credentials'
            });
        }
    } catch (error) {
        next(createError(500, error));
    }
}


// admin register function
const adminRegister = async (request, response, next) => {
    const { mail, password } = request.body;

    //check mail,password is empty
    if (!mail || !password) {
        response.status(400).send({
            message: 'Mail or Password is empty'
        });
        return;
    }

    // check if admin already exists
    const q1 = 'SELECT * FROM admin WHERE mail = ?';
    try {
        const rows = await db.awaitQuery(q1, [mail]);
        if (rows.length > 0) {
            response.status(409).send({
                message: `Admin already exists with mail: ${mail}`
            });
            return;
        }
    } catch (error) {
        next(createError(500, error));
    }
    

    const q = 'INSERT INTO admin (mail,password) VALUES (?,?)';
    try {
        const rows = await db.awaitQuery(q, [mail, password]);
        if (rows.affectedRows > 0) {
            response.status(200).send({
                message: 'Register Success'
            });
        } else {
            response.status(401).send({
                message: 'Register Failed'
            });
        }
    } catch (error) {
        next(createError(500, error));
    }
}

const checkAdmin = async (req,res,next) => {
    // check req.body.admin_id
    if (!req.body.adminId) return {
        success: false,
        message: "Admin id is required",
        statusCode: 400
    };

    // check req.body.admin_id is exist
    const q = "SELECT * FROM admin WHERE id = ?;";
    try {
        const admin = await db.awaitQuery(q,[req.body.adminId]);
        if(admin.length == 0) return {
            success: false,
            message: "Admin id is not exist",
            statusCode: 400
        };
    } catch (error) {
        throw error;
    }

    return {
        success: true,
        message: "Admin id is exist",
        statusCode: 200
    };
}

const adminProductDiscount = async (req,res,next) => {
    // check req.body.admin_id
    if (!req.body.adminId) return {
        success: false,
        message: "You  didn't login as admin",
        statusCode: 400
    };

    // check req.body.admin_id is exist
    const isAdmin = await checkAdmin(req,res,next);
    if(!isAdmin.success) return isAdmin;


    // check req.body.product_ids
    if (!req.body.product_ids) return {
        success: false,
        message: "Product ids is required",
        statusCode: 400
    };

    // check req.body.discount
    if (!req.body.discount) return {
        success: false,
        message: "Discount is required",
        statusCode: 400
    };

    // check req.body.discount is number
    if (isNaN(req.body.discount)) return {
        success: false,
        message: "Discount must be number",
        statusCode: 400
    };

    // check req.body.discount is between 0 and 100
    if (req.body.discount < 0 || req.body.discount > 100) return {
        success: false,
        message: "Discount must be between 0 and 100",
        statusCode: 400
    };

    // check req.body.product_ids is array
    if (!Array.isArray(req.body.product_ids)) return {
        success: false,
        message: "Product ids must be array",
        statusCode: 400
    };

    // check req.body.product_ids is not empty
    if (req.body.product_ids.length == 0) return {
        success: false,
        message: "Product ids must be not empty",
        statusCode: 400
    };

    // check req.body.product_ids is array of numbers
    for (let i = 0; i < req.body.product_ids.length; i++) {
        if (isNaN(req.body.product_ids[i])) return {
            success: false,
            message: "Product ids must be array of numbers",
            statusCode: 400
        };
    }

    // check req.body.product_ids is exist
    const q = "SELECT * FROM products WHERE id IN (?);";
    try {
        const products = await db.awaitQuery(q,[req.body.product_ids]);
        if(products.length != req.body.product_ids.length) return {
            success: false,
            message: "Product ids is not exist",
            statusCode: 400
        };
    } catch (error) {
        throw error;
    }

    // // set discount_rate column with 0 for all products
    // const q1 = "UPDATE products SET discount_rate = 0;";
    // try {
    //     const products = await db.awaitQuery(q1);
    // } catch (error) {
    //     throw error;
    // }
    

    // set discount from products table and discount_rate column with using product_ids
    const q2 = "UPDATE products SET discount_rate = ? WHERE id IN (?);";
    try {
        const products = await db.awaitQuery(q2,[req.body.discount,req.body.product_ids]);
        return {
            success: true,
            message: "Discount set successfully",
            statusCode: 200
        };
    } catch (error) {
        throw error;
    }
}

const getMonthlyLeastDiscountRate = async (req, res, next) => {

    const q = "SELECT * FROM month_least_sold"
    const result = await db.awaitQuery(q);

    return {
        success: true,
        statusCode: 200,
        data : result
    };
}

const changeMonthlyLeastDiscountRate = async (req,res,next) => {
    // check req.body.admin_id
    if (!req.body.adminId) return {
        success: false,
        message: "You  didn't login as admin",
        statusCode: 400
    };

    // check req.body.admin_id is exist
    const isAdmin = await checkAdmin(req,res,next);
    if(!isAdmin.success) return isAdmin;

    // check req.body.monthly_least_discount_rate
    if (!req.body.monthly_least_discount_rate) return {
        success: false,
        message: "Monthly least discount rate is required",
        statusCode: 400
    };

    // check req.body.monthly_least_discount_rate is number
    if (isNaN(req.body.monthly_least_discount_rate)) return {
        success: false,
        message: "Monthly least discount rate must be number",
        statusCode: 400
    };

    // check req.body.monthly_least_discount_rate is between 0 and 100
    if (req.body.monthly_least_discount_rate < 0 || req.body.monthly_least_discount_rate > 100) return {
        success: false,
        message: "Monthly least discount rate must be between 0 and 100",
        statusCode: 400
    };

    // set monthly_least_discount_rate column with req.body.monthly_least_discount_rate


    const query = 'CREATE OR REPLACE VIEW month_least_sold AS (SELECT product_id, category_id, order_id, SUM(quantity) as total_sale ,  ? as "monthly_discount"  from product_orders where (YEAR(date) = YEAR(now()) AND MONTH(date) = MONTH(now()) ) GROUP BY product_id order by (SUM(quantity))) LIMIT 10;';

    try {
        const result = await db.awaitQuery(query,[req.body.monthly_least_discount_rate]);
        return {
            success: true,
            message: "Monthly least discount rate set successfully",
            statusCode: 200
        };
    } catch (error) {
        throw error;
    }
}

        
const getTopTenCustomers = async (req, res, next) => {
    // check req.body.admin_id
    if (!req.body.adminId) return {
        success: false,
        message: "You  didn't login as admin",
        statusCode: 400
    };

    // check req.body.admin_id is exist
    const isAdmin = await checkAdmin(req,res,next);
    if(!isAdmin.success) return isAdmin;

    // there is admin_top10_discounts table in database

    const q = "SELECT * FROM admin_top10_discounts";
    try {
        const result = await db.awaitQuery(q);
        return {
            success: true,
            statusCode: 200,
            data : result
        };
    } catch (error) {
        throw error;
    }
}

const changeTopTenCustomersDiscountRate = async (req,res,next) => {
    // check req.body.admin_id
    if (!req.body.adminId) return {
        success: false,
        message: "You  didn't login as admin",
        statusCode: 400
    };

    // check req.body.admin_id is exist
    const isAdmin = await checkAdmin(req,res,next);
    if(!isAdmin.success) return isAdmin;

    // check req.body.top_ten_discount_rate
    if (!req.body.top_ten_discount_rate) return {
        success: false,
        message: "Top ten discount rate is required",
        statusCode: 400
    };

    // check req.body.top_ten_discount_rate is number
    if (isNaN(req.body.top_ten_discount_rate)) return {
        success: false,
        message: "Top ten discount rate must be number",
        statusCode: 400
    };

    // check req.body.top_ten_discount_rate is between 0 and 100
    if (req.body.top_ten_discount_rate < 0 || req.body.top_ten_discount_rate > 100) return {
        success: false,
        message: "Top ten discount rate must be between 0 and 100",
        statusCode: 400
    };

    // set top_ten_discount_rate column with req.body.top_ten_discount_rate
    const q = "CREATE OR REPLACE VIEW `admin_top10_discounts` AS SELECT `t1`.`customer_id`,`t1`.`total` * 5 AS total, ? AS `extra_discount`, `c1`.`name` FROM `total_order_comments` AS t1, `customer` as c1 WHERE `t1`.`customer_id` = `c1`.`id` ORDER BY `t1`.`total`  DESC LIMIT 10 ;";
    try {
        const result = await db.awaitQuery(q,[req.body.top_ten_discount_rate]);
        return {
            success: true,
            message: "Top ten discount rate set successfully",
            statusCode: 200
        };
    } catch (error) {
        throw error;
    }
}


const deleteComment = async (req,res,next) => {
    // check req.body.admin_id
    if (!req.body.adminId) return {
        success: false,
        message: "You  didn't login as admin",
        statusCode: 400
    };

    // check req.body.admin_id is exist
    const isAdmin = await checkAdmin(req,res,next);
    if(!isAdmin.success) return isAdmin;

    // check req.body.user_id
    if (!req.body.user_id) return {
        success: false,
        message: "User id is required",
        statusCode: 400
    };

    // check req.body.comment_id
    if (!req.body.comment_id) return {
        success: false,
        message: "Comment id is required",
        statusCode: 400
    };
    // type casting comment_id to int
    req.body.comment_id = parseInt(req.body.comment_id);

    const haventOrdered = {
        success: false,
        message: "There is no comment with this filter",
        statusCode: 404
    }

    // get user's made comment with using comment_id and user_id
    const q = "SELECT * FROM comments WHERE customer_id = ? and id= ?;";
    let img_id;
    try {
        const comment = await db.awaitQuery(q,[req.body.user_id,req.body.comment_id]);
        if(comment.length == 0) return haventOrdered;
        img_id = comment[0].image;

    } catch (error) {
        throw error;
    }

    // delete comment from comment table
    const q4 = "DELETE FROM comments WHERE id = ? AND customer_id = ?;";
    try {
        const comment = await db.awaitQuery(q4,[req.body.comment_id,req.body.user_id]);
    } catch (error) {
        throw error;
    }

    // delete comment_img from comment_img table
    const q5 = "DELETE FROM comment_img WHERE id = ?;";
    try {
        const comment = await db.awaitQuery(q5,[img_id]);
        return {
            success: true,
            message: "Comment deleted successfully",
            statusCode: 200
        };
    }
    catch (error) {
        throw error;
    }
    
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
}
