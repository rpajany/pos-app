// routes/auth.js
import express from "express";
const router = express.Router();

import User from "../models/User.model.js"; // Your User model
import { verifyToken } from "../middleware/auth.middleware.js";
import {
  register,
  login,
  getCurrentUser,
  refreshToken,
} from "../controllers/auth.controller.js";

// @route   GET /api/auth/me
// @desc    Get current logged in user
// @access  Private
router.get("/me", verifyToken, getCurrentUser);

router.post("/register", register);
router.post("/login", login);

// Refresh token
router.post("/refresh-token", refreshToken);

// Logout
// router.post("/logout", verifyToken, authController.logout);
export default router;
