import express from "express";
import membershipController from "../controllers/membership-controller.js";
import swaggerUi from "swagger-ui-express"
import swaggerDocument from "../../apispec.json" with { type: "json" }

const publicRouter = new express.Router();

// membership module
publicRouter.post('/registration', membershipController.register)
publicRouter.post('/login', membershipController.login)

publicRouter.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

export {
    publicRouter
}