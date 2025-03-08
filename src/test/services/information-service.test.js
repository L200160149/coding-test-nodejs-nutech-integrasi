// tests/services/information-service.test.js
import informationService from "../../services/information-service.js";
import { pool } from "../../applications/database.js";
import { ResponseError } from "../../errors/response-error.js";

jest.mock("../../applications/database.js", () => ({
  pool: { execute: jest.fn() },
}));

describe("informationService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllService", () => {
    it("should return all services", async () => {
      const mockServices = [
        {
          service_code: "PAJAK",
          service_name: "Pajak PBB",
          service_icon: "https://nutech-integrasi.app/dummy.jpg",
          service_tariff: 40000,
        },
        {
          service_code: "PLN",
          service_name: "Listrik",
          service_icon: "https://nutech-integrasi.app/dummy.jpg",
          service_tariff: 10000,
        },
      ];

      pool.execute.mockResolvedValueOnce([mockServices]);

      const result = await informationService.getAllService();

      expect(result).toEqual([
        {
          service_code: "PAJAK",
          service_name: "Pajak PBB",
          service_icon: "https://nutech-integrasi.app/dummy.jpg",
          service_tariff: 40000,
        },
        {
          service_code: "PLN",
          service_name: "Listrik",
          service_icon: "https://nutech-integrasi.app/dummy.jpg",
          service_tariff: 10000,
        },
      ]);
      expect(pool.execute).toHaveBeenCalledWith(
        "SELECT service_code, service_name, service_icon, service_tariff FROM services"
      );
    });

    it("should return an empty array when no services exist", async () => {
      pool.execute.mockResolvedValueOnce([[]]);

      const result = await informationService.getAllService();

      expect(result).toEqual([]);
      expect(pool.execute).toHaveBeenCalledWith(
        "SELECT service_code, service_name, service_icon, service_tariff FROM services"
      );
    });

    it("should throw raw error if database query fail", async () => {
      pool.execute.mockRejectedValueOnce(new Error("Database error"));

      await expect(informationService.getAllService()).rejects.toThrow(
        "Database error"
      );
    });
  });

  describe("getAllBanner", () => {
    it("should return all banner", async () => {
      const mockServices = [
        {
          banner_name: "Banner 1",
          banner_image: "https://nutech-integrasi.app/dummy.jpg",
          description: "Lerem Ipsum Dolor sit amet",
        },
        {
          banner_name: "Banner 2",
          banner_image: "https://nutech-integrasi.app/dummy.jpg",
          description: "Lerem Ipsum Dolor sit amet",
        },
      ];

      pool.execute.mockResolvedValueOnce([mockServices]);

      const result = await informationService.getAllBanner();

      expect(result).toEqual([
        {
          banner_name: "Banner 1",
          banner_image: "https://nutech-integrasi.app/dummy.jpg",
          description: "Lerem Ipsum Dolor sit amet",
        },
        {
          banner_name: "Banner 2",
          banner_image: "https://nutech-integrasi.app/dummy.jpg",
          description: "Lerem Ipsum Dolor sit amet",
        },
      ]);
      expect(pool.execute).toHaveBeenCalledWith(
        "SELECT banner_name, banner_image, description FROM banner"
      );
    });

    it("should return an empty array when no services exist", async () => {
      pool.execute.mockResolvedValueOnce([[]]);

      const result = await informationService.getAllBanner();

      expect(result).toEqual([]);
      expect(pool.execute).toHaveBeenCalledWith(
        "SELECT banner_name, banner_image, description FROM banner"
      );
    });

    it("should throw raw error if database query fails", async () => {
      pool.execute.mockRejectedValueOnce(new Error("Database error"));

      await expect(informationService.getAllService()).rejects.toThrow(
        "Database error"
      );
    });
  });
});
