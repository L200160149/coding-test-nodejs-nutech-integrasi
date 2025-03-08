import { v4 as uuidv4 } from "uuid";
import { logger } from "../utils/logger.js";
import { ResponseError } from "../errors/response-error.js";

const errorMiddleware = (err, req, res, next) => {
  const isClientError =
    err instanceof ResponseError && err.status >= 400 && err.status < 500;
  const statusCode = isClientError ? err.status : 500;
  let errorResponse;

  if (isClientError) {
    if (err.customResponse) {
      errorResponse = err.customResponse;
    } else {
      errorResponse = { status: statusCode, message: err.message };
    }
  } else {
    const errorId = uuidv4();
    logger.error(`[${errorId}] ${err.message}\nStack: ${err.stack}`);
    errorResponse = {
      status: 500,
      message: "Internal Server Error",
      errorId: errorId,
    };
  }

  res.status(statusCode).json(errorResponse);
};

export { errorMiddleware };
