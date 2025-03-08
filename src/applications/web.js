import express from "express";
import { publicRouter } from "../routes/public-api.js";
import { apiRouter } from "../routes/api.js";
import { errorMiddleware } from "../middleware/error-middleware.js";
import cors from "cors";

export const web = express();
web.use(express.json());

web.use(cors());

web.use("/api/v1", apiRouter);
web.use("/api/v1", publicRouter);

web.use(errorMiddleware);

// Serve uploaded images
web.use("/uploads", express.static("uploads"));
