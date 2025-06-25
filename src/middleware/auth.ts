import { Request, Response, NextFunction } from "express";
import { config } from "../config/index.js";

export const authenticateApiKey = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const apiKey = req.header("x-api-key");

  if (!apiKey || apiKey !== config.api.key) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Valid API key required",
    });
  }

  next();
};
export default authenticateApiKey;
