const jwt = require('jsonwebtoken');


const adminAuth = (req, res, next) => {
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
      req.body.adminMail = decoded.adminMail;
      req.body.adminId = decoded.adminId;
      next();
    });
  };

module.exports = adminAuth;