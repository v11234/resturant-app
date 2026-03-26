import mongoose from "mongoose";
import Cart from "../models/cartModel.js";
import Menu from "../models/menuModel.js";
export const addToCart = async (req, res) => {
  try {
    const { menuId, quantity } = req.body;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Not Authorized", success: false });
    }
    if (!menuId || !mongoose.Types.ObjectId.isValid(menuId)) {
      return res
        .status(400)
        .json({ message: "Invalid menu id", success: false });
    }
    const qty = Number(quantity) || 1;
    if (qty < 1) {
      return res
        .status(400)
        .json({ message: "Invalid quantity", success: false });
    }
    const menuItem = await Menu.findById(menuId);
    if (!menuItem)
      return res.status(404).json({ message: "Menu item not found" });

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    const existingItem = cart.items.find(
      (item) => item.menuItem.toString() === menuId
    );

    if (existingItem) {
      existingItem.quantity += qty;
    } else {
      cart.items.push({ menuItem: menuId, quantity: qty });
    }

    await cart.save();
    return res
      .status(200)
      .json({ message: "Item added to cart", success: true, cart });
  } catch (error) {
    console.log("addToCart error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", success: false });
  }
};

// Get user cart
export const getCart = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Not Authorized", success: false });
    }
    const cart = await Cart.findOne({ user: userId }).populate("items.menuItem");
    if (!cart) {
      return res.status(200).json({ cart: { items: [] }, success: true });
    }
    return res.status(200).json({ cart, success: true });
  } catch (error) {
    console.log("getCart error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", success: false });
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { menuId } = req.params;
    if (!userId) {
      return res.status(401).json({ message: "Not Authorized", success: false });
    }
    if (!menuId || !mongoose.Types.ObjectId.isValid(menuId)) {
      return res
        .status(400)
        .json({ message: "Invalid menu id", success: false });
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });
    cart.items = cart.items.filter(
      (item) => item.menuItem.toString() !== menuId
    );
    await cart.save();
    return res
      .status(200)
      .json({ message: "Item removed from cart", success: true });
  } catch (error) {
    console.log("removeFromCart error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", success: false });
  }
};
