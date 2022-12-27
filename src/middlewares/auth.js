const jwt = require('jsonwebtoken');


const auth = (req, res, next) => {
    const token = req.headers["x-access-token"];
  
    if (!token) {
      return res.status(403).send({
        message: "No token provided!"
      });
    }
  
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).send({
          message: "Unauthorized!"
        });
      }
      console.log(decoded);
      req.body.tokenmail = decoded.mail;
      req.body.tokenuid = decoded.uid;
      next();
    });
  };

module.exports = auth;