const { db } = require('../../db.js');
const createError = require('http-errors')
const Jwt = require('jsonwebtoken');
const services = require('../services/baseService.js');
const { registerValidation } = require('../validations/userValidation.js');

// create a function to create a user in the database from customer table and columns are name,mail,password
const createUser = async (request, response,next) => {
    const { name, mail, password } = request.body;
    const { error } = registerValidation.validate(request.body);
    if (error) {
        response.status(400).send(error.details[0].message);
        return;
    }

    const checked = await services.checkUser(mail);


    if (checked) {
        response.status(409).send({
            message: `User already exists with mail: ${mail}`
        });
        return;
    }

    const q = 'INSERT INTO customer (name, mail, password) VALUES (?, ?, ?)'
    try {
        db.awaitQuery(q, [name, mail, password], (error, results) => {
            if (error) {
                throw next(new createError(500,error));
            }
            console.log(results)
            response.status(201).send(`User added with ID: ${results.insertId}`);
        });
    } catch (error) {
        next(createError(500,error));
        
    }
};



const generateToken = async (req,uid) => {
    const body = {
        email: req.body.email,
        uid: uid
    }
    const token = await Jwt.sign(body,process.env.JWT_SECRET,{expiresIn : '3 days'});
    return token;
}

const loginUser = async (req,res,next) => {
    const {mail,password} = req.body;
    const q = 'SELECT * FROM customer WHERE mail = ? AND password = ?';
    try {
        const rows = await db.awaitQuery(q,[mail,password]);
        if(rows.length > 0){
            const token = await generateToken(req,rows[0].id);
            res.status(200).send({
                message: 'Login Success',
                token: token
            });
        }else{
            res.status(401).send({
                message: 'Login Failed'
            });
        }
    } catch (error) {
        next(createError(500,error));
    }
}

const getOrders = async (req,res,next) => {
    const orders = await services.getOrders(req,res,next);
    res.status(200).send(orders);
}

const getCart = async (req,res,next) => {
    const response = {
        total_price: 0,
        discount_rate: 0,
        discounted_price: 0,
        cart: [],
    }
    response.cart = await services.getCart(req,res,next);
    for (let index = 0; index < response.cart.length; index++) {
        const element = response.cart[index];
        response.total_price += element.price * element.quantity * (100 - element.discount_rate) / 100;
        console.log(element)
    }
    response.discount_rate = await services.getUserDiscount(req,res,next);
    response.discounted_price = response.total_price * (100 - response.discount_rate) / 100;
    res.status(200).send(response);
}

const getAddress = async (req,res,next) => {
    const adress = await services.getUserAddress(req,res,next);
    res.status(200).send(adress);
}

const addAddress = async (req,res,next) => {
    const address = await services.validateAddressAndInsert(req,res,next);
    res.status(200).send({
        message: 'Address added',
        address: address
    });
}

const getCreditCards = async (req,res,next) => {
    const cards = await services.getUserCreditCard(req,res,next);
    res.status(200).send(cards);
}

const addCreditCard = async (req,res,next) => {
    const card = await services.addCreditCard(req,res,next);
    res.status(200).send(card);

}

const addToFavorites = async (req,res,next) => {
    const result = await services.addToFavorites(req,res,next);
    res.status(result.statusCode).send(result);
}

const RemoveFromFavorites = async (req,res,next) => {
    const result = await services.removeFromFavorites(req,res,next);
    res.status(result.statusCode).send(result);
}

const favoritesToCart = async (req,res,next) => {
    const result = await services.favoritesToCart(req,res,next);
    res.status(result.statusCode).send(result);
}

const selectAddress = async (req,res,next) => {
    const result = await services.selectAddress(req,res,next);
    res.status(result.statusCode).send(result);
}

const addToCart = async (req,res,next) => {
    const result = await services.addToCart(req,res,next);
    res.status(result.statusCode).send(result);
}

const removeFromCart = async (req,res,next) => {
    const result = await services.removeFromCart(req,res,next);
    res.status(result.statusCode).send(result);
}

const updateCart = async (req,res,next) => {
    const result = await services.updateCart(req,res,next);
    res.status(result.statusCode).send(result);
}

const makeComment = async (req,res,next) => {
    const result = await services.makeComment(req,res,next);
    res.status(result.statusCode).send(result);
}

const getComments = async (req,res,next) => {
    const result = await services.getComments(req,res,next);
    res.status(result.statusCode).send(result);
}

const updateComment = async (req,res,next) => {
    const result = await services.updateComment(req,res,next);
    res.status(result.statusCode).send(result);
}

const deleteComment = async (req,res,next) => {
    const result = await services.deleteComment(req,res,next);
    res.status(result.statusCode).send(result);
}

const changePassword = async (req,res,next) => {
    const result = await services.changePassword(req,res,next);
    res.status(result.statusCode).send(result);
}

const changeMail = async (req,res,next) => {
    const result = await services.changeMail(req,res,next);
    res.status(result.statusCode).send(result);
}

module.exports = {
    createUser,
    loginUser,
    getOrders,
    getCart,
    getAddress,
    addAddress,
    getCreditCards,
    addCreditCard,
    addToFavorites,
    RemoveFromFavorites,
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
    changeMail
};
