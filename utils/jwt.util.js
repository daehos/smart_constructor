import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

export function signToken(data) {
  const token = jwt.sign(data, process.env.JWT_SECRET);
  return token;
}

export function verifyToken(token) {
  const data = jwt.verify(token, process.env.JWT_SECRET);
  return data;
}
