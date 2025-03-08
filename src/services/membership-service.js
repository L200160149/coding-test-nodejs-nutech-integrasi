import { pool } from "../applications/database.js";
import { validate } from "../validations/validation.js";
import {
  loginUserValidation,
  registerUserValidation,
  updateUserImageValidation,
  updateUserValidation,
} from "../validations/membership-validation.js";
import { ResponseError } from "../errors/response-error.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { encryptData } from "../utils/security.js";

dotenv.config();

const register = async (request) => {
  const user = validate(registerUserValidation, request);

  // Check if user already exists
  const [rows] = await pool.execute("SELECT email FROM users WHERE email = ?", [
    request.email,
  ]);

  if (rows.length > 0) {
    throw new ResponseError(400, "Email sudah terdaftar");
  }

  // Hash password
  user.password = await bcrypt.hash(user.password, 10);

  // Insert user
  return await pool.execute(
    `INSERT INTO users (email, first_name, last_name, password) VALUES (?, ?, ?, ?)`,
    [request.email, request.first_name, request.last_name, user.password]
  );
};

const login = async (request) => {
  const loginRequest = validate(loginUserValidation, request);

  // Fetch user from DB
  const [rows] = await pool.execute(
    `SELECT email, password, balance, first_name, last_name, profile_image FROM users WHERE email = ?`,
    [loginRequest.email]
  );

  // User not found
  if (rows.length === 0) {
    throw new ResponseError(401, "Email atau password salah");
  }

  const user = rows[0];

  const isPasswordValid = await bcrypt.compare(
    loginRequest.password,
    user.password
  );

  if (!isPasswordValid) {
    throw new ResponseError(401, "Email atau password salah");
  }

  // Generate JWT token
  const payload = {
    data: encryptData({
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      profile_image: user.profile_image,
      balance: user.balance,
    }),
  };
  const jwtSecretKey = process.env.JWT_SECRET_KEY;
  const access_token = jwt.sign(payload, jwtSecretKey, { expiresIn: "12h" });

  return access_token;
};

const profile = async (request) => {
  const [rows] = await pool.execute(
    `SELECT email, first_name, last_name, profile_image FROM users WHERE email = ?`,
    [request.email]
  );
  if (rows.length === 0) {
    throw new ResponseError(404, "user tidak ditemukan");
  }
  return {
    email: request.email,
    first_name: rows[0].first_name,
    last_name: rows[0].last_name,
    profile_image: rows[0].profile_image,
  };
};

const updateProfile = async (request) => {
  const { first_name, last_name } = validate(
    updateUserValidation,
    request.body
  );
  // Extract from decoded JWT
  const email = request.user.email;
  const profile_image = request.user.profile_image;

  // Update user in database
  const [result] = await pool.execute(
    "UPDATE users SET first_name = ?, last_name = ? WHERE email = ?",
    [first_name, last_name, email]
  );

  if (result.affectedRows === 0) {
    throw new ResponseError(404, "User not found");
  }

  return { email, first_name, last_name, profile_image };
};

const updateProfileImage = async (request, file) => {
  if (!file) {
    throw new ResponseError(400, "Field file tidak boleh kosong");
  }

  // Validate request body
  validate(updateUserImageValidation, request.body);

  // Extract email from decoded JWT
  const email = request.user.email;
  // Store relative path
  const profile_image = `${process.env.API_URL}/uploads/profile/${file.filename}`;

  // Update user in the database
  const [result] = await pool.execute(
    "UPDATE users SET profile_image = ? WHERE email = ?",
    [profile_image, email]
  );

  if (result.affectedRows === 0) {
    throw new ResponseError(404, "User not found");
  }

  // Fetch updated user data
  const [updatedUser] = await pool.execute(
    "SELECT first_name, last_name, profile_image FROM users WHERE email = ?",
    [email]
  );

  if (updatedUser.length === 0) {
    throw new ResponseError(404, "User data not found after update");
  }

  return { email, ...updatedUser[0] };
};

export default {
  register,
  login,
  profile,
  updateProfile,
  updateProfileImage,
};
