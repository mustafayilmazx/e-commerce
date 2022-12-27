require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const middleware = require('./src/middlewares/index.js');
const routes = require('./src/routers/index.js');

// parse application/json
app.use(bodyParser.json());
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// route to /api/user/register
app.use('/api/user/', routes.user);

// branch routes
app.use('/api/branch/', routes.branch);

// product routes
app.use('/api/product/', routes.product);

// admin routes
app.use('/api/admin/', routes.admin); 

app.get("/", function(req, res){
    res.send("Hello World")
});


app.use(middleware.errorHandler)

const port = process.env.PORT || 3000;
app.listen(port,() => {
    console.log(`Uygulama ${port} portunda çalışmaya başladı...`)
})