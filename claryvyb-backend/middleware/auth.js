import jwt from "jsonwebtoken";
import TokenBlocklist from "../models/TokenBlocklist.js";

export default async function auth(req, res, next) {
  const header = req.header("Authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const blocklisted = await TokenBlocklist.findOne({ token }).lean();
    if (blocklisted) return res.status(401).json({ error: "Token is invalidated" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id };
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}