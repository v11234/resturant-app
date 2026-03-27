import express from "express";
import {
  adminLogin,
  createDeliveryPersonnel,
  deleteDeliveryPersonnel,
  getDeliveryPersonnel,
  getProfile,
  isAuth,
  loginUser,
  logoutUser,
  registerUser,
} from "../controllers/authController.js";
import { adminOnly, protect } from "../middlewares/authMiddleware.js";
const authRoutes = express.Router();

authRoutes.post("/register", registerUser);
authRoutes.post("/login", loginUser);
authRoutes.post("/admin/login", adminLogin);
authRoutes.post("/logout", logoutUser);
authRoutes.get("/profile", protect, getProfile);
authRoutes.get("/is-auth", protect, isAuth);
authRoutes.post("/admin/personnel", adminOnly, createDeliveryPersonnel);
authRoutes.get("/admin/personnel", adminOnly, getDeliveryPersonnel);
authRoutes.delete("/admin/personnel/:id", adminOnly, deleteDeliveryPersonnel);

export default authRoutes;
