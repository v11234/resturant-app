import express from "express";

import { protect, staffOnly } from "../middlewares/authMiddleware.js";
import {
  cancelOrder,
  getAllOrders,
  getUserOrders,
  placeOrder,
  updateOrderStatus,
} from "../controllers/orderController.js";
const orderRoutes=express.Router();
orderRoutes.post("/place",protect,placeOrder);
orderRoutes.get("/my-orders",protect,getUserOrders);
orderRoutes.get("/orders",staffOnly,getAllOrders);
orderRoutes.put("/update-status/:orderId",staffOnly,updateOrderStatus);
orderRoutes.put("/cancel/:orderId",protect,cancelOrder);


export default orderRoutes;
