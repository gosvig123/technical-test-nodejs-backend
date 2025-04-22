import { Request, Response, NextFunction } from 'express';

export const authenticateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.header('x-api-key');
 
  if (!apiKey || apiKey !== process.env.VERY_SECRET_API_KEY) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Valid API key required'
    });
  }

  next();
};
export default authenticateApiKey;
