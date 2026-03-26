import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import menuRoutes from "./routes/menuRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import dotenv from "dotenv";
import connectCloudinary from "./config/cloudinary.js";

dotenv.config();

const app = express();

// database connection
connectDB();
connectCloudinary();

const getAllowedOrigins = () => {
  const origins = [
    "http://localhost:5173",
    process.env.CLIENT_URL,
    process.env.ADMIN_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  ]
    .filter(Boolean)
    .map((origin) => origin.trim());

  if (process.env.CORS_ORIGINS) {
    process.env.CORS_ORIGINS.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
      .forEach((origin) => origins.push(origin));
  }

  return Array.from(new Set(origins));
};

const allowedOrigins = getAllowedOrigins();

// middlewares
app.use(express.json());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(null, false);
    },
    credentials: true,
  })
);
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Hello from server");
});

app.use("/api/auth", authRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/booking", bookingRoutes);

export default app;
