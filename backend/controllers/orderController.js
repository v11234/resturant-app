import Order from "../models/orderModel.js";
import Cart from "../models/cartModel.js";

export const placeOrder = async (req, res) => {
  try {
    const { id } = req.user;
    const { address, paymentMethod } = req.body;
    if (!address)
      return res
        .status(400)
        .json({ message: "Delivery address is required", success: false });

    const cart = await Cart.findOne({ user: id }).populate("items.menuItem");

    if (!cart || cart.items.length === 0)
      return res.status(400).json({ message: "Your cart is empty" });

    const totalAmount = cart.items.reduce(
      (sum, item) => sum + item.menuItem.price * item.quantity,
      0
    );

    const newOrder = await Order.create({
      user: id,
      items: cart.items.map((i) => ({
        menuItem: i.menuItem._id,
        quantity: i.quantity,
      })),
      totalAmount,
      address,
      paymentMethod,
    });

    // Clear cart
    cart.items = [];
    await cart.save();

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order: newOrder,
    });
  } catch (error) {
    console.log(error);
    return res.json({ message: "Internal server error", success: false });
  }
};

export const getUserOrders = async (req, res) => {
  try {
    const { id } = req.user;
    const orders = await Order.find({ user: id }).sort({ createdAt: -1 });
    res.status(200).json({ orders, success: true });
  } catch (error) {
    console.log(error);
    return res.json({ message: "Internal server error", success: false });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user")
      .populate("items.menuItem")
      .sort({ createdAt: -1 });
    res.status(200).json({ orders, success: true });
  } catch (error) {
    console.log(error);
    return res.json({ message: "Internal server error", success: false });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const allowedStatuses = ["Pending", "Preparing", "Delivered", "Cancelled"];
    if (!allowedStatuses.includes(status)) {
      return res
        .status(400)
        .json({ message: "Invalid status", success: false });
    }
    if (req.user?.role === "delivery") {
      const deliveryAllowed = ["Preparing", "Delivered"];
      if (!deliveryAllowed.includes(status)) {
        return res
          .status(403)
          .json({ message: "Forbidden", success: false });
      }
    }
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.status = status;
    await order.save();

    res.json({ message: "order status updated", success: true });
  } catch (error) {
    console.log(error);
    return res.json({ message: "Internal server error", success: false });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { id } = req.user;
    const order = await Order.findOne({ _id: orderId, user: id });
    if (!order) {
      return res
        .status(404)
        .json({ message: "Order not found", success: false });
    }
    if (order.status === "Delivered") {
      return res
        .status(400)
        .json({ message: "Delivered orders cannot be cancelled", success: false });
    }
    if (order.status !== "Pending") {
      return res
        .status(400)
        .json({ message: "Only pending orders can be cancelled", success: false });
    }
    order.status = "Cancelled";
    await order.save();
    return res.json({ success: true, message: "Order cancelled" });
  } catch (error) {
    console.log(error);
    return res.json({ message: "Internal server error", success: false });
  }
};
