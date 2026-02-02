// middleware/auth.js
import jwt from "jsonwebtoken";
import logger from "../utils/logger.js";

const JWT_SECRET = process.env.JWT_SECRET;

export const verifyToken = (req, res, next) => {
  try {
    // Get token from cookies // Use 'let' so you can reassign it // Consider also accepting Bearer headers:
    let token = req.headers.authorization?.startsWith("Bearer") 
                ? req.headers.authorization.split(" ")[1] 
                : null;

    // console.log("token :", token);

    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized - No token provided" });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    logger.error(`Auth middleware error: ${error.message}`);
    
    if (error.name === 'TokenExpiredError') {
      // Very important: Frontend looks for this message/status to call /refresh-token
      return res.status(401).json({ 
        success: false, 
        code: "TOKEN_EXPIRED", 
        message: 'JWT expired' 
      });
    }
    return res.status(401).json({ success: false, message: 'Invalid token.' });
 
  }
};
