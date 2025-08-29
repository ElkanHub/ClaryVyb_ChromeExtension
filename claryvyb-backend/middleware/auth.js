import jwt from "jsonwebtoken";

export default function auth(req, res, next) {
  const header = req.header("Authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id };
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}