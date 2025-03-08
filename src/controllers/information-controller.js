import informationService from "../services/information-service.js";
import { ResponseError } from "../errors/response-error.js";

const getAllServices = async (req, res, next) => {
  try {
    const result = await informationService.getAllService();
    res.status(200).json({
      status: 0,
      message: "Sukses",
      data: result,
    });
  } catch (error) {
    if (error instanceof ResponseError) {
      return res.status(error.status).json({ errors: error.errors });
    }
    next(error);
  }
};

const getAllBanner = async (req, res, next) => {
  try {
    const result = await informationService.getAllBanner();
    res.status(200).json({
      status: 0,
      message: "Sukses",
      data: result,
    });
  } catch (error) {
    if (error instanceof ResponseError) {
      return res.status(error.status).json({ errors: error.errors });
    }
    next(error);
  }
};

export default {
  getAllServices,
  getAllBanner,
};
