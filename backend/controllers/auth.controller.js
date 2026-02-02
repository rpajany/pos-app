import jwt from "jsonwebtoken";
import UserModel from "../models/User.model.js";
import { addToSyncQueue } from "../services/syncService.js"
import logger from "../utils/logger.js";

// Register new user
export const register = async (req, res, next) => {
 
  try {
    const { username, password, role } = req.body;
    // Check if user already exists
    const existingUser = await UserModel.findOne({ username: { $eq: username }});
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: { message: "User with this username already exists" },
      });
    }
   

    // 2. Create the new user
    // Note: Ensure your UserModel has a pre-save hook to hash the password!
    const newUser = await UserModel.create({
        username,
        password,
        role:role||'user' // Default role if none provided
    });

  await addToSyncQueue("users", "create", newUser._id.toString(), {
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      createdAt: newUser.createdAt,
    })

    // 3. Respond with success
    // Don't send the password back in the response
    return res.status(201).json({
        success:true,
        data: {
            id:newUser._id,
            username:newUser.username,
            role:newUser.role
        },
    });


  } catch (error) {
    logger.error("User Registration error:", error);
    next(error);
  }
};

// login
export const login = async (req, res, next) => {
    try {
        const {username, password} = req.body;
        const user = await UserModel.findOne({username: { $eq: username }});

        // 2. Validate user and password
        if(!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ 
                success: false, 
                message: "Invalid username or password" });
        }

         // 3. Check if user is active
         if(!user.isActive) {
            return res.status(403).json({ 
                success: false,
                error: { message: "Account is deactivated" },
            });
         }

       

        // 1. Generate Access Token (Short-lived), Generate JWT Data you want to store in the token
        const payload = {id: user._id, role: user.role };
        const JWT_SECRET = process.env.JWT_SECRET;
       const options = { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }; // Changed to 15 mins for better security "15m"

         // generate token         
         const accessToken = jwt.sign(payload, JWT_SECRET, options);

         // 2. Generate Refresh Token (Long-lived)
        const refreshToken = jwt.sign(
            { id: user._id }, 
            process.env.REFRESH_TOKEN_SECRET, 
            { expiresIn: '7d' }
        );

        // 3. Save Refresh Token to Database & Update last login
        user.refreshToken = refreshToken;
        user.lastLogin = new Date();
        await user.save();

        // 4. Send Refresh Token via secure httpOnly cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // true in production
            sameSite: 'Strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });


        // 5. Respond with Access Token
         return res.json({
            success:true,
            token: accessToken, // Frontend uses this for Authorization header
            message: "Login successful",           
            user: { id: user._id, username: user.username, role: user.role },
         });
         
    } catch (error) {
        logger.error("User Login error:", error);
        next(error);
    }
};

// Get current user
export const getCurrentUser = async (req, res, next) => {

  try {
    // req.user was set by the protect middleware
    const userId = req.user.id || req.user;
    const user = await UserModel.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error(error.message);
    next(error);
  }
};

// Refresh token
export const refreshToken = async (req, res, next) => {
  const oldRefreshToken = req.cookies.refreshToken;
  if (!oldRefreshToken) return res.sendStatus(401);

  try {
    // 1. Verify the token
    const payload = jwt.verify(oldRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    
    // 2. Check if it exists in DB (optional but recommended for revoking access)
    const user = await UserModel.findById(payload.id);

    if (!user || user.refreshToken !== oldRefreshToken) return res.sendStatus(403);

// 1. Generate NEW tokens
    const accessToken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN});
    const newRefreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

    // 2. Update DB
    user.refreshToken = newRefreshToken;
    await user.save();

    // 3. Set new cookie
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ accessToken });
  } catch (err) {
    return res.sendStatus(403); // Refresh token expired or invalid
  }
};

// Logout
export const logout = async (req, res) => {
  try {
        const refreshToken = req.cookies.refreshToken;
        
        // Remove refreshToken from DB
        if (refreshToken) {
            await UserModel.findOneAndUpdate(
                { refreshToken }, 
                { $unset: { refreshToken: 1 } }
            );
        }

        // Clear the cookie
        res.clearCookie('refreshToken', {
            httpOnly: true,
            sameSite: 'Strict',
            secure: process.env.NODE_ENV === 'production'
        });

        return res.status(200).json({ success: true, message: "Logged out successfully" });
    } catch (error) {
        next(error);
    }
};
