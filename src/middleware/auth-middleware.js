import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { decryptData } from "../utils/security.js";

dotenv.config();

export const authMiddleware = async (req, res, next) => {
  // Get bearer token
  const authHeader = req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      status: 108,
      message: "Token tidak valid atau kadaluwarsa",
      data: null,
    });
  }

  // Extract token
  const token = authHeader.split(" ")[1];
  const jwtSecretKey = process.env.JWT_SECRET_KEY;

  try {
    const decoded = jwt.verify(token, jwtSecretKey);
    // Attach user data to request
    decoded.data = decryptData(decoded.data); // Decrypt the payload
    req.user = decoded.data;
    next();
  } catch (error) {
    return res.status(401).json({
      status: 108,
      message: "Token tidak valid atau kadaluwarsa",
      data: null,
    });
  }
};
