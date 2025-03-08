import { pool } from "../applications/database.js";
import Decimal from "decimal.js";

const getAllService = async () => {
  const [rows] = await pool.execute(
    "SELECT service_code, service_name, service_icon, service_tariff FROM services"
  );
  return rows.map((service) => ({
    ...service,
    service_tariff: new Decimal(service.service_tariff).toNumber(),
  }));
};

const getAllBanner = async () => {
  const [rows] = await pool.execute(
    "SELECT banner_name, banner_image, description FROM banner"
  );
  return rows;
};

export default {
  getAllService,
  getAllBanner,
};
