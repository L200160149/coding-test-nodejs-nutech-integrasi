import express from "express";
import informationController from "../controllers/information-controller.js";
import membershipController from "../controllers/membership-controller.js";
import { authMiddleware } from "../middleware/auth-middleware.js";
import { createUploadMiddleware } from "../utils/upload-file.js";
import transactionController from "../controllers/transaction-controller.js";

const apiRouter = new express.Router();

// Module Membership
apiRouter.get("/profile", authMiddleware, membershipController.profile);
apiRouter.put(
  "/profile/update",
  authMiddleware,
  membershipController.updateProfile
);
apiRouter.put(
  "/profile/image",
  authMiddleware,
  createUploadMiddleware("profile_image"),
  membershipController.updateProfileImage
);

// Module Information
apiRouter.get("/services", informationController.getAllServices);
apiRouter.get("/banner", informationController.getAllBanner);

// Module Transaction
apiRouter.get("/balance", authMiddleware, transactionController.getBalance);
apiRouter.post("/topup", authMiddleware, transactionController.topup);
apiRouter.post(
  "/transaction",
  authMiddleware,
  transactionController.transaction
);
apiRouter.get(
  "/transaction/history",
  authMiddleware,
  transactionController.transactionHistory
);

export { apiRouter };
