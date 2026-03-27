import User from "../models/userModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
const getCookieOptions = () => {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 24 * 60 * 60 * 1000,
  };
};

// Generate JWT
const generateToken = (res, payload) => {
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1d" });
  res.cookie("token", token, getCookieOptions());
  return token;
};

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.json({
        message: "Please fill all the fields",
        success: false,
      });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.json({ message: "User already exists", success: false });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "user",
    });
    return res.json({ message: "User registered successfully", success: true });
  } catch (error) {
    console.log(error.message);
    return res.json({ message: "Internal server error", success: false });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.json({
        message: "Please fill all the fields",
        success: false,
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ message: "User does not exist", success: false });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({ message: "Invalid credentials", success: false });
    }

    const role = user.role || (user.isAdmin ? "admin" : "user");
    generateToken(res, { id: user._id, role, email: user.email });
    res.json({
      message: "User logged in successfully",
      success: true,
      user: {
        name: user.name,
        email: user.email,
        role,
      },
    });
  } catch (error) {
    console.log(error.message);
    return res.json({ message: "Internal server error", success: false });
  }
};

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.json({
        message: "Please fill all the fields",
        success: false,
      });
    }
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (email !== adminEmail || password !== adminPassword) {
      return res.json({ message: "Invalid credentials", success: false });
    }

    const token = jwt.sign({ email, role: "admin" }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.cookie("token", token, getCookieOptions());

    return res.json({
      success: true,
      message: "Admin logged in successfully",
      admin: {
        admin: adminEmail,
      },
    });
  } catch (error) {
    console.log(error.message);
    return res.json({ message: "Internal server error", success: false });
  }
};

export const logoutUser = async (req, res) => {
  try {
    res.clearCookie("token", getCookieOptions());
    return res.json({ message: "User logged out successfully", success: true });
  } catch (error) {
    console.log(error.message);
    return res.json({ message: "Internal server error", success: false });
  }
};

export const getProfile = async (req, res) => {
  try {
    const userDoc = await User.findById(req.user.id).select("-password");
    const role = userDoc?.role || (userDoc?.isAdmin ? "admin" : "user");
    const user = userDoc ? { ...userDoc.toObject(), role } : null;
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found", success: false });
    }
    res.json(user);
  } catch (error) {
    return res.json({ message: "Internal server error", success: false });
  }
};

export const isAuth = async (req, res) => {
  try {
    const { id } = req.user;
    const userDoc = await User.findById(id).select("-password");
    const role = userDoc?.role || (userDoc?.isAdmin ? "admin" : "user");
    const user = userDoc ? { ...userDoc.toObject(), role } : null;
    res.json({ success: true, user });
  } catch (error) {
    return res.json({ message: "Internal server error", success: false });
  }
};

export const createDeliveryPersonnel = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "All fields are required", success: false });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User already exists", success: false });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const personnel = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "delivery",
      isAdmin: false,
    });

    return res.status(201).json({
      success: true,
      message: "Delivery personnel registered",
      personnel: {
        _id: personnel._id,
        name: personnel.name,
        email: personnel.email,
        role: personnel.role,
      },
    });
  } catch (error) {
    console.log(error.message);
    return res.json({ message: "Internal server error", success: false });
  }
};

export const getDeliveryPersonnel = async (req, res) => {
  try {
    const personnel = await User.find({ role: "delivery" })
      .select("-password")
      .sort({ createdAt: -1 });
    return res.status(200).json({ success: true, personnel });
  } catch (error) {
    console.log(error.message);
    return res.json({ message: "Internal server error", success: false });
  }
};

export const deleteDeliveryPersonnel = async (req, res) => {
  try {
    const { id } = req.params;
    const personnel = await User.findById(id);
    if (!personnel) {
      return res
        .status(404)
        .json({ message: "User not found", success: false });
    }
    if (personnel.role !== "delivery") {
      return res
        .status(400)
        .json({ message: "Only delivery personnel can be deleted", success: false });
    }
    await User.findByIdAndDelete(id);
    return res
      .status(200)
      .json({ success: true, message: "Personnel deleted" });
  } catch (error) {
    console.log(error.message);
    return res.json({ message: "Internal server error", success: false });
  }
};
