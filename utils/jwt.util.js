import jwt from "jsonwebtoken";
import { config } from "../configs/env.js";

export function signToken(data) {
  const token = jwt.sign(data, config.jwt.secret);
  return token;
}

export function verifyToken(token) {
  const data = jwt.verify(token, config.jwt.secret);
  return data;
}
