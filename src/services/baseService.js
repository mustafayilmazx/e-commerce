// import db.js from 
const { db } = require('../../db.js');
const createError = require('http-errors');
const { addressValidation, creditCardValidation, favoritesToCartValidation,  emailValidation } = require('../validations/userValidation.js');

const checkUser = async (mail) => {
    const checkQuery = 'SELECT * FROM customer WHERE mail = ?'
    const rows = await db.awaitQuery(checkQuery, [mail]);
    if (rows.length > 0) {
        return rows;
    }
    return false;
}


// get orders by user id
const getOrders = async (req,res,next) => {
    // check if req.query.id is not null if it is not null get specific order
    let q = ""
    if(req.query.id){
        q = `SELECT * FROM \`order\` WHERE customer_id = ? AND id = ${req.query.id} order by customer_id, date DESC`;
    }
    else{
        q = `SELECT * FROM \`order\` WHERE customer_id = ? order by customer_id, date DESC`;
    }

    try {
        const orders = await db.awaitQuery(q,[req.body.tokenuid]);

        for (let index = 0; index < orders.length; index++) {
            const element = orders[index];

            // get address with city name
            const q3 = `SELECT address.district,address.full_adress,city.name as city_name FROM \`address\` INNER JOIN \`city\` on city.id = address.city and address.id = ?`;
            

            const address = await db.awaitQuery(q3,[element.adress_id]);
            orders[index].address = address[0];

            // get order items
            const q2 = `SELECT * FROM product_orders WHERE order_id = ?`;
            const products = await db.awaitQuery(q2,[element.id]);
            orders[index].products = products;

        }

        return orders;
    } catch (error) {
        next(createError(500,error));
    }
}

// list specific customer's cart items in cart table
const getCart = async (req,res,next) => {
    const q = "SELECT `cart`.`user_id`, `cart`.`quantity`, `products`.* from `cart` INNER JOIN `products` ON `cart`.`product_id` = `products`.`id` and `cart`.`user_id` = ?;";
    try {
        const cart = await db.awaitQuery(q,[req.body.tokenuid]);
        return cart;
    } catch (error) {
        next(createError(500,error));
    }
}


const getUserDiscount = async (req,res,next) => {
    // get user discount from total_order_comments view in discount_rate column
    const q = "SELECT * FROM total_order_comments WHERE customer_id = ?;";
    let discount_data = 0
    try {
        const discount = await db.awaitQuery(q,[req.body.tokenuid]);
        discount_data += discount[0].discount;
    } catch (error) {
        next(createError(500,error));
    }
    
    // get user discount from admin_top10_discounts
    try {
        const q2 = "SELECT * FROM `admin_top10_discounts` where customer_id = ?"
        const result2 = await db.awaitQuery(q2, [req.body.tokenuid])

        if (result2.length > 0) {
            discount_data += result2[0].extra_discount
        }

    } catch (error) {
        next(createError(500, error))
    }

    return discount_data
}

const getChildCategories = async (category_id) => {
    const q = "SELECT * FROM category WHERE parent_category = ?;";
    try {
        const categories = await db.awaitQuery(q,[category_id]);
        const categoriesWithChild = [];
        for (let index = 0; index < categories.length; index++) categoriesWithChild.push(categories[index].id);
        categoriesWithChild.push(category_id);
        return categoriesWithChild;
    } catch (error) {
        throw error;
    }
}


// get user address by user id
const getUserAddress = async (req,res,next) => {
    const q = "SELECT `address`.* , `city`.`name` AS city_name FROM address INNER JOIN `city` ON `address`.`city` = `city`.`id` and `address`.`customer_id` = ?;";
    try {
        const address = await db.awaitQuery(q,[req.body.tokenuid]);
        return address;
    } catch (error) {
        next(createError(500,error));
    }
}

// validate address on body and if okey insert to db
const validateAddressAndInsert = async (req,res,next) => {
    const data = {
        full_adress: req.body.full_adress,
        district: req.body.district,
        city: req.body.city
    }
    const { error } = addressValidation.validate(data);
    if(error)  return (error.details[0].message);

    const q = "INSERT INTO address (customer_id,city,district,full_adress) VALUES (?,?,?,?);";
    try {
        const address = await db.awaitQuery(q,[req.body.tokenuid,req.body.city,req.body.district,req.body.full_adress]);
        return address.insertId;
    } catch (error) {
        throw (createError(500,error));
    }
}


// get credit card by user id
const getUserCreditCard = async (req,res,next) => {
    const q = "SELECT * FROM credit_cards WHERE user_id = ?;";
    try {
        const credit_card = await db.awaitQuery(q,[req.body.tokenuid]);
        return credit_card;
    } catch (error) {
        next(createError(500,error));
    }
}

// validate request body and add credit card to db by user id
const addCreditCard = async (req,res,next) => {
    const data = {
        cc_no: req.body.cc_no,
        cc_month: req.body.cc_month,
        cc_year: req.body.cc_year,
    }
    const { error } = creditCardValidation.validate(data);
    if(error)  return {
        success: false,
        message: error.details[0].message
    };

    const q = "INSERT INTO credit_cards (user_id,cc_no,cc_month,cc_year) VALUES (?,?,?,?);";
    try {
        const credit_card = await db.awaitQuery(q,[req.body.tokenuid,req.body.cc_no,req.body.cc_month,req.body.cc_year]);
        return {
            success: true,
            message: "Credit card added successfully",
            card_id : credit_card.insertId
        };
    } catch (error) {
        throw (createError(500,error));
    }
}

const checkProductExist = async (product_id) => {
    const q = "SELECT * FROM products WHERE id = ?;";
    try {
        const product = await db.awaitQuery(q,[product_id]);
        if(product.length > 0) return true;
        return false;
    } catch (error) {
        throw error;
    }
}

const addToFavorites = async (req,res,next) => {
    //check if product exist
    const productExist = await checkProductExist(req.body.product_id);
    if(!productExist) return {
        success: false,
        message: "Product not found",
        statusCode: 404
    };

    //check if product already in favorites
    const q = "SELECT * FROM favorites WHERE customer_id = ? AND product_id = ?;";
    try {
        const product = await db.awaitQuery(q,[req.body.tokenuid,req.body.product_id]);
        if(product.length > 0) return {
            success: false,
            message: "Product already in favorites",
            statusCode: 400
        };
    } catch (error) {
        throw error;
    }

    //add product to favorites
    const q2 = "INSERT INTO favorites (customer_id,product_id) VALUES (?,?);";
    try {
        const product = await db.awaitQuery(q2,[req.body.tokenuid,req.body.product_id]);
        return {
            success: true,
            message: "Product added to favorites successfully",
            statusCode: 200
        };
    } catch (error) {
        throw error;
    }
}

const removeFromFavorites = async (req,res,next) => {
    //check if product exist
    const productExist = await checkProductExist(req.body.product_id);
    if(!productExist) return {
        success: false,
        message: "Product not found",
        statusCode: 404
    };

    //check if product already in favorites
    const q = "SELECT * FROM favorites WHERE customer_id = ? AND product_id = ?;";
    try {
        const product = await db.awaitQuery(q,[req.body.tokenuid,req.body.product_id]);
        if(product.length == 0) return {
            success: false,
            message: "Product not in favorites",
            statusCode: 400
        };
    } catch (error) {
        throw error;
    }

    //remove product from favorites
    const q2 = "DELETE FROM favorites WHERE customer_id = ? AND product_id = ?;";
    try {
        const product = await db.awaitQuery(q2,[req.body.tokenuid,req.body.product_id]);
        return {
            success: true,
            message: "Product removed from favorites successfully",
            statusCode: 200
        };
    } catch (error) {
        throw error;
    }
}

const favoritesToCart = async (req,res,next) => {
    // check req body
    const data = {
        product_id: req.body.product_id,
        quantity: req.body.quantity
    }
    const { error } = favoritesToCartValidation.validate(data);
    if(error)  return {
        success: false,
        message: error.details[0].message
    };

    //check if product exist
    const productExist = await checkProductExist(req.body.product_id);
    if(!productExist) return {
        success: false,
        message: "Product not found",
        statusCode: 404
    };

    //check if product already in favorites
    const q = "SELECT * FROM favorites WHERE customer_id = ? AND product_id = ?;";
    try {
        const product = await db.awaitQuery(q,[req.body.tokenuid,req.body.product_id]);
        if(product.length == 0) return {
            success: false,
            message: "Product not in favorites",
            statusCode: 400
        };
    } catch (error) {
        throw error;
    }

    //remove product from favorites
    const q2 = "DELETE FROM favorites WHERE customer_id = ? AND product_id = ?;";
    try {
        const product = await db.awaitQuery(q2,[req.body.tokenuid,req.body.product_id]);
    } catch (error) {
        throw error;
    }
    const q3 = "INSERT INTO cart (user_id,product_id,quantity) VALUES (?,?,?);";
    try {
        const product = await db.awaitQuery(q3,[req.body.tokenuid,req.body.product_id,req.body.quantity]);
        return {
            success: true,
            message: "Product added to cart successfully",
            statusCode: 200
        };
    } catch (error) {
        throw error;
    }
}

const selectAddress = async (req,res,next) => {
    // check req.body.address_id
    if (!req.body.address_id) return {
        success: false,
        message: "Address id is required",
        statusCode: 400
    };
    // type casting address_id to int
    req.body.address_id = parseInt(req.body.address_id);

    // check address id exist in address table for this user
    const q = "SELECT * FROM address WHERE id = ? AND customer_id = ?;";
    try {
        const address = await db.awaitQuery(q,[req.body.address_id,req.body.tokenuid]);
        if(address.length == 0) return {
            success: false,
            message: "Address not found",
            statusCode: 404
        };
    } catch (error) {
        throw error;
    }

    // update selected_address in customer table
    const q2 = "UPDATE customer SET selected_address = ? WHERE id = ?;";
    try {
        const address = await db.awaitQuery(q2,[req.body.address_id,req.body.tokenuid]);
        return {
            success: true,
            message: "Address selected successfully",
            statusCode: 200
        };
    } catch (error) {
        throw error;
    }
}

const addToCart = async (req,res,next) => {
    // check req body
    const data = {
        product_id: req.body.product_id,
        quantity: req.body.quantity
    }
    const { error } = favoritesToCartValidation.validate(data);
    if(error)  return {
        success: false,
        message: error.details[0].message
    };

    //check if product exist
    const productExist = await checkProductExist(req.body.product_id);
    if(!productExist) return {
        success: false,
        message: "Product not found",
        statusCode: 404
    };

    //check if product already in cart
    const q = "SELECT * FROM cart WHERE user_id = ? AND product_id = ?;";
    try {
        const product = await db.awaitQuery(q,[req.body.tokenuid,req.body.product_id]);
        if(product.length > 0) return {
            success: false,
            message: "Product already in cart",
            statusCode: 400
        };
    } catch (error) {
        throw error;
    }

    //add product to cart
    const q2 = "INSERT INTO cart (user_id,product_id,quantity) VALUES (?,?,?);";
    try {
        const product = await db.awaitQuery(q2,[req.body.tokenuid,req.body.product_id,req.body.quantity]);
        return {
            success: true,
            message: "Product added to cart successfully",
            statusCode: 200
        };
    } catch (error) {
        throw error;
    }
}


const removeFromCart = async (req,res,next) => {
    // check req.body.product_id
    if (!req.body.product_id) return {
        success: false,
        message: "Product id is required",
        statusCode: 400
    };
    // type casting product_id to int
    req.body.product_id = parseInt(req.body.product_id);

    // check product id exist in cart table for this user
    const q = "SELECT * FROM cart WHERE product_id = ? AND user_id = ?;";
    try {
        const product = await db.awaitQuery(q,[req.body.product_id,req.body.tokenuid]);
        if(product.length == 0) return {
            success: false,
            message: "Product not found in cart",
            statusCode: 404
        };
    } catch (error) {
        throw error;
    }

    // remove product from cart
    const q2 = "DELETE FROM cart WHERE product_id = ? AND user_id = ?;";
    try {
        const product = await db.awaitQuery(q2,[req.body.product_id,req.body.tokenuid]);
        return {
            success: true,
            message: "Product removed from cart successfully",
            statusCode: 200
        };
    } catch (error) {
        throw error;
    }
}

const updateCart = async (req,res,next) => {
    // check req.body.product_id and quantity
    if (!req.body.product_id) return {
        success: false,
        message: "Product id is required",
        statusCode: 400
    };
    if (!req.body.quantity) return {
        success: false,
        message: "Quantity is required",
        statusCode: 400
    };
    // type casting product_id to int
    req.body.product_id = parseInt(req.body.product_id);
    req.body.quantity = parseInt(req.body.quantity);
    
    // check product id exist in cart table for this user
    const q = "SELECT * FROM cart WHERE product_id = ? AND user_id = ?;";
    try {
        const product = await db.awaitQuery(q,[req.body.product_id,req.body.tokenuid]);
        if(product.length == 0) return {
            success: false,
            message: "Product not found in cart",
            statusCode: 404
        };
    } catch (error) {
        throw error;
    }

    // update product quantity in cart
    const q2 = "UPDATE cart SET quantity = ? WHERE product_id = ? AND user_id = ?;";
    try {
        const product = await db.awaitQuery(q2,[req.body.quantity,req.body.product_id,req.body.tokenuid]);
        return {
            success: true,
            message: "Product quantity updated successfully",
            statusCode: 200
        };
    } catch (error) {
        throw error;
    }
}


const makeComment = async (req,res,next) => {
    // check req.body.product_id and comment and img_url
    if (!req.body.product_id) return {
        success: false,
        message: "Product id is required",
        statusCode: 400
    };
    if (!req.body.comment) return {
        success: false,
        message: "Comment is required",
        statusCode: 400
    };
    // type casting product_id to int
    req.body.product_id = parseInt(req.body.product_id);

    const haventOrdered = {
        success: false,
        message: "You have not ordered this product",
        statusCode: 404
    }

    // get user's orders_id
    const q = "SELECT * FROM \`order\` WHERE customer_id = ? ;";
    const order_ids = [];
    try {
        const orders = await db.awaitQuery(q,[req.body.tokenuid]);
        if(orders.length == 0) return haventOrdered;
        orders.map(order => order_ids.push(order.id));
    } catch (error) {
        throw error;
    }

    // get products's id's with order_ids variable in product_orders table with product_id
    const q2 = "SELECT * FROM product_orders WHERE order_id IN (?) ;";
    try {
        const products = await db.awaitQuery(q2,[order_ids]);
        if(products.length == 0) return haventOrdered;
        const product_ids = products.map(product => product.product_id);

        // check if product_id exist in product_ids
        if(!product_ids.includes(req.body.product_id)) return haventOrdered;

    } catch (error) {
        throw error;
    }

    // if img_url is provided then insert it to comment_img table and get its id
    if(req.body.img_url) {
        const q3 = "INSERT INTO comment_img (url) VALUES (?);";
        try {
            const img = await db.awaitQuery(q3,[req.body.img_url]);
            req.body.img_id = img.insertId;
        } catch (error) {
            throw error;
        }
    }

    // insert comment to comment table
    const q4 = "INSERT INTO comments (customer_id,product_id,content,image) VALUES (?,?,?,?);";
    try {
        const comment = await db.awaitQuery(q4,[req.body.tokenuid,req.body.product_id,req.body.comment,req.body.img_id]);
        return {
            success: true,
            message: "Comment added successfully",
            statusCode: 200
        };
    } catch (error) {
        throw error;
    }
}

const updateComment = async (req,res,next) => {
    // check req.body.comment_id and comment and img_url
    if (!req.body.comment_id) return {
        success: false,
        message: "Comment id is required",
        statusCode: 400
    };
    if (!req.body.comment) return {
        success: false,
        message: "Comment is required",
        statusCode: 400
    };
    // type casting comment_id to int
    req.body.comment_id = parseInt(req.body.comment_id);


    const haventOrdered = {
        success: false,
        message: "You have not commented this product",
        statusCode: 404
    }

    // get user's made comment with using comment_id and user_id
    const q = "SELECT * FROM comments WHERE id = ? AND customer_id = ? ;";
    let img_id = null;
    try {
        const comment = await db.awaitQuery(q,[req.body.comment_id,req.body.tokenuid]);
        if(comment.length == 0) return haventOrdered;
        img_id = comment[0].image;
    } catch (error) {
        throw error;
    }

    // if img_url is provided then insert it to comment_img table and get its id
    if(req.body.img_url) {
        const q3 = "UPDATE comment_img set url = ? where id = ?;";
        try {
            const img = await db.awaitQuery(q3,[req.body.img_url,img_id]);
            req.body.img_id = img.insertId;
        } catch (error) {
            throw error;
        }
    }

    // update comment to comment table
    const q4 = "UPDATE comments SET content = ? WHERE id = ? AND customer_id = ?;";
    try {
        const comment = await db.awaitQuery(q4,[req.body.comment,req.body.comment_id,req.body.tokenuid]);
        return {
            success: true,
            message: "Comment updated successfully",
            statusCode: 200
        };
    } catch (error) {
        throw error;
    }
}


const getComments = async (req,res,next) => {
    // get user's made comment with using comment_id and user_id
    const q = "SELECT comments.id, comments.content, comment_img.url, products.name FROM comment_img, comments, products WHERE comment_img.id = comments.image AND comments.product_id = products.id and comments.customer_id = ?;";
    try {
        const comments = await db.awaitQuery(q,[req.body.tokenuid]);
        return {
            success: true,
            message: "Comments fetched successfully",
            statusCode: 200,
            data: comments
        };
    } catch (error) {
        throw error;
    }
}


const deleteComment = async (req,res,next) => {
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
        message: "You have not ordered this product",
        statusCode: 404
    }

    // get user's made comment with using comment_id and user_id
    const q = "SELECT * FROM comments WHERE customer_id = ? and id= ?;";
    let img_id;
    try {
        const comment = await db.awaitQuery(q,[req.body.tokenuid,req.body.comment_id]);
        if(comment.length == 0) return haventOrdered;
        img_id = comment[0].image;

    } catch (error) {
        throw error;
    }

    // delete comment from comment table
    const q4 = "DELETE FROM comments WHERE id = ? AND customer_id = ?;";
    try {
        const comment = await db.awaitQuery(q4,[req.body.comment_id,req.body.tokenuid]);
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

const changePassword = async (req,res,next) => {
    // check req.body.new_password
    if (!req.body.new_password) return {
        success: false,
        message: "Password is required",
        statusCode: 400
    };

    // check req.body.old_password
    if (!req.body.old_password) return {
        success: false,
        message: "Old password is required",
        statusCode: 400
    };


    // check old password
    const q = "SELECT * FROM customer WHERE id = ? AND password = ?;";
    try {
        const user = await db.awaitQuery(q,[req.body.tokenuid,req.body.old_password]);
        if(user.length == 0) return {
            success: false,
            message: "Old password is wrong",
            statusCode: 400
        };
    } catch (error) {
        throw error;
    }

    // update password
    const q2 = "UPDATE customer SET password = ? WHERE id = ?;";
    try {
        const user = await db.awaitQuery(q2,[req.body.new_password,req.body.tokenuid]);
        return {
            success: true,
            message: "Password changed successfully",
            statusCode: 200
        };
    } catch (error) {
        throw error;
    }
}

const changeMail = async (req,res,next) => {
    // check req.body.new_mail
    if (!req.body.new_mail) return {
        success: false,
        message: "Mail is required",
        statusCode: 400
    };

    const {error} = emailValidation.validate({mail:req.body.new_mail});
    if(error) return {
        success: false,
        message: error,
        statusCode: 400
    };


    // check req.body.new_mail is exist
    const q = "SELECT * FROM customer WHERE mail = ?;";
    try {
        const user = await db.awaitQuery(q,[req.body.new_mail]);
        if(user.length != 0) return {
            success: false,
            message: "Mail is already exist",
            statusCode: 400
        };
    } catch (error) {
        throw error;
    }

    // update mail
    const q2 = "UPDATE customer SET mail = ? WHERE id = ?;";
    try {
        const user = await db.awaitQuery(q2,[req.body.new_mail,req.body.tokenuid]);
        return {
            success: true,
            message: "Mail changed successfully",
            statusCode: 200
        };
    } catch (error) {
        throw error;
    }
}


const getCategories = async () => {
    // get all categories
    const q = "SELECT * FROM category;";
    try {
        const categories = await db.awaitQuery(q);
        return {
            success: true,
            message: "Categories fetched successfully",
            statusCode: 200,
            data: categories
        };
    } catch (error) {
        throw error;
    }
}





module.exports = {
    checkUser,
    getOrders,
    getCart,
    getUserDiscount,
    getChildCategories,
    getUserAddress,
    validateAddressAndInsert,
    getUserCreditCard,
    addCreditCard,
    addToFavorites,
    removeFromFavorites,
    favoritesToCart,
    selectAddress,
    addToCart,
    removeFromCart,
    updateCart,
    makeComment,
    getComments,
    updateComment,
    deleteComment,
    changePassword,
    changeMail,
    getCategories,
    
}