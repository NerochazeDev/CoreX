import { Express, Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import crypto from "crypto";
import { storage } from "./storage";
import { signupSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, type SignupData, type LoginData, type ForgotPasswordData, type ResetPasswordData } from "@shared/schema";

// Rate limiting configurations
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Maximum 5 attempts per IP
  message: { error: "Too many authentication attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Maximum 3 forgot password attempts per IP
  message: { error: "Too many password reset attempts. Please try again in 1 hour." },
  standardHeaders: true,
  legacyHeaders: false,
});

const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Maximum 3 reset attempts per IP
  message: { error: "Too many password reset attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Recovery code generator
function generateRecoveryCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const segments = [];
  
  for (let i = 0; i < 3; i++) {
    let segment = "";
    for (let j = 0; j < 4; j++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    segments.push(segment);
  }
  
  return segments.join("-");
}

// Hash password with bcrypt
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Compare password with hash
async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Hash recovery code
async function hashRecoveryCode(recoveryCode: string): Promise<string> {
  return bcrypt.hash(recoveryCode, 12);
}

// Compare recovery code with hash
async function compareRecoveryCode(recoveryCode: string, hash: string): Promise<boolean> {
  return bcrypt.compare(recoveryCode, hash);
}

// Session-based authentication middleware
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

export function setupAuth(app: Express) {
  
  // User signup
  app.post("/api/auth/signup", authLimiter, async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validationResult = signupSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: validationResult.error.errors 
        });
      }
      
      const { email, password, firstName, lastName }: SignupData = validationResult.data;
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }
      
      // Generate recovery code and hash both password and recovery code
      const recoveryCode = generateRecoveryCode();
      const [passwordHash, recoveryHash] = await Promise.all([
        hashPassword(password),
        hashRecoveryCode(recoveryCode)
      ]);
      
      // Create user with hashed password and recovery code
      const user = await storage.createUser({
        email,
        firstName,
        lastName,
        password: passwordHash,
        recoveryHash,
        bitcoinAddress: null,
        privateKey: null
      });
      
      // Set session
      req.session.userId = user.id;
      
      // Return user data and recovery code (only this once!)
      res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        },
        recoveryCode, // IMPORTANT: Only shown once during signup!
        message: "Account created successfully. Please save your recovery code securely - it will not be shown again!"
      });
      
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ error: "Internal server error during signup" });
    }
  });
  
  // User login
  app.post("/api/auth/login", authLimiter, async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validationResult = loginSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: validationResult.error.errors 
        });
      }
      
      const { email, password }: LoginData = validationResult.data;
      
      // Get user by email
      const user = await storage.getUserByEmail(email);
      if (!user || !user.password) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      
      // Verify password
      const isPasswordValid = await comparePassword(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      
      // Set session
      req.session.userId = user.id;
      
      // Return user data (no sensitive information)
      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isAdmin: user.isAdmin
        }
      });
      
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal server error during login" });
    }
  });
  
  // User logout
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ error: "Error during logout" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully" });
    });
  });
  
  // Get current user
  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }
      
      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isAdmin: user.isAdmin
        }
      });
      
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Forgot password (initiate reset)
  app.post("/api/auth/forgot-password", forgotPasswordLimiter, async (req: Request, res: Response) => {
    try {
      const validationResult = forgotPasswordSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: validationResult.error.errors 
        });
      }
      
      const { email }: ForgotPasswordData = validationResult.data;
      
      // Always return the same response (don't reveal if email exists)
      const user = await storage.getUserByEmail(email);
      
      res.json({ 
        message: "If an account with that email exists, you can now use your recovery code to reset your password." 
      });
      
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Reset password with recovery code
  app.post("/api/auth/reset-password", resetPasswordLimiter, async (req: Request, res: Response) => {
    try {
      const validationResult = resetPasswordSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: validationResult.error.errors 
        });
      }
      
      const { email, recoveryCode, newPassword }: ResetPasswordData = validationResult.data;
      
      // Get user by email
      const user = await storage.getUserByEmail(email);
      if (!user || !user.recoveryHash) {
        return res.status(400).json({ error: "Invalid email or recovery code" });
      }
      
      // Verify recovery code
      const isRecoveryCodeValid = await compareRecoveryCode(recoveryCode, user.recoveryHash);
      if (!isRecoveryCodeValid) {
        return res.status(400).json({ error: "Invalid email or recovery code" });
      }
      
      // Hash new password and generate new recovery code
      const newRecoveryCode = generateRecoveryCode();
      const [newPasswordHash, newRecoveryHash] = await Promise.all([
        hashPassword(newPassword),
        hashRecoveryCode(newRecoveryCode)
      ]);
      
      // Update user password and recovery hash
      await storage.updateUserPassword(user.id, newPasswordHash, newRecoveryHash);
      
      res.json({ 
        message: "Password reset successful",
        newRecoveryCode, // Provide new recovery code
        warning: "Your recovery code has been regenerated. Please save it securely!"
      });
      
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // View recovery code (requires password verification)
  app.post("/api/auth/view-recovery", async (req: Request, res: Response) => {
    try {
      // Use the same authentication logic as other endpoints
      let userId = req.session?.userId;
      
      // Check auth token header if no session
      if (!userId) {
        const authToken = req.headers.authorization?.replace('Bearer ', '');
        if (authToken) {
          try {
            const decoded = Buffer.from(authToken, 'base64').toString();
            const [tokenUserId] = decoded.split(':');
            userId = parseInt(tokenUserId);
            if (!userId || isNaN(userId)) {
              userId = null;
            }
          } catch (error) {
            console.log('Auth token decode error:', error);
          }
        }
      }
      
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const { password } = req.body;
      if (!password) {
        return res.status(400).json({ error: "Password is required" });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user || !user.password) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Verify password
      const isPasswordValid = await comparePassword(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid password" });
      }
      
      // Generate a new recovery code to show (we don't store the actual code)
      const newRecoveryCode = generateRecoveryCode();
      const newRecoveryHash = await hashRecoveryCode(newRecoveryCode);
      
      // Update user recovery hash with the new code
      await storage.updateUserRecoveryCode(userId, newRecoveryHash);
      
      res.json({
        recoveryCode: newRecoveryCode,
        message: "Here's your current recovery code. Please save it securely!"
      });
      
    } catch (error) {
      console.error("View recovery code error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Regenerate recovery code (requires password verification)
  app.post("/api/auth/regenerate-recovery", async (req: Request, res: Response) => {
    try {
      // Use the same authentication logic as other endpoints
      let userId = req.session?.userId;
      
      // Check auth token header if no session
      if (!userId) {
        const authToken = req.headers.authorization?.replace('Bearer ', '');
        if (authToken) {
          try {
            const decoded = Buffer.from(authToken, 'base64').toString();
            const [tokenUserId] = decoded.split(':');
            userId = parseInt(tokenUserId);
            if (!userId || isNaN(userId)) {
              userId = null;
            }
          } catch (error) {
            console.log('Auth token decode error:', error);
          }
        }
      }
      
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const { password } = req.body;
      if (!password) {
        return res.status(400).json({ error: "Password is required" });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user || !user.password) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Verify password
      const isPasswordValid = await comparePassword(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid password" });
      }
      
      // Generate new recovery code
      const newRecoveryCode = generateRecoveryCode();
      const newRecoveryHash = await hashRecoveryCode(newRecoveryCode);
      
      // Update user recovery hash
      await storage.updateUserRecoveryCode(userId, newRecoveryHash);
      
      res.json({
        recoveryCode: newRecoveryCode,
        message: "Recovery code regenerated successfully. Please save it securely!"
      });
      
    } catch (error) {
      console.error("Regenerate recovery code error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
}