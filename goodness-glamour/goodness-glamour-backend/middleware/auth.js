import jwt from "jsonwebtoken";
import User from "../Models/user.js";

const JWT_SECRET = process.env.JWT_SECRET || "gg_super_secret_jwt_key_123!@#";

// Middleware to verify JWT token
export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Access denied. Please sign in to continue." });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Access denied. Please sign in to continue." });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if user still exists and is active
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: "User no longer exists." });
    }
    if (!user.isActive) {
      return res.status(401).json({ error: "Account is disabled. Please contact support." });
    }

    req.user = {
      id: user._id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      salonName: user.salonName
    };
    next();
  } catch (err) {
    console.error("Token verification error:", err.message);
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired. Please sign in again.", code: "TOKEN_EXPIRED" });
    }
    return res.status(401).json({ error: "Invalid token. Please sign in again." });
  }
};

// Middleware to restrict access based on user role
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied. You do not have permission to view this resource." });
    }
    next();
  };
};
