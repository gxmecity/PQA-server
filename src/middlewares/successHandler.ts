import { Request, Response, NextFunction } from "express";

// Extend the Response interface to include the success method

declare module "express-serve-static-core" {
  interface Response {
    success: (data: any, message?: string, statusCode?: number) => void;
  }
}

const successHandler = (req: Request, res: Response, next: NextFunction) => {
  res.success = (
    data: any,
    message: string = "Request was successful",
    statusCode: number = 200
  ) => {
    res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  };

  next();
};

export default successHandler;
