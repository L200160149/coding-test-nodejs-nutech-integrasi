// tests/services/transaction-services.test.js
import transactionServices from "../../services/transaction-service.js";
import { pool } from "../../applications/database.js";
import { ResponseError } from "../../errors/response-error.js";
import { validate } from "../../validations/validation.js";

jest.mock("../../applications/database.js", () => ({
  pool: {
    getConnection: jest.fn(),
    execute: jest.fn(),
    query: jest.fn(), // For transactionHistory
  },
}));
jest.mock("../../validations/validation.js", () => ({
  validate: jest.fn(),
}));

describe("transactionServices", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getBalance", () => {
    it("should return user balance when user exists", async () => {
      const req = { email: "test@example.com" };
      const mockBalance = [{ balance: "1234.56" }];
      pool.execute.mockResolvedValueOnce([mockBalance]);
      const result = await transactionServices.getBalance(req);
      expect(result).toEqual({ balance: 1234.56 });
    });
    it("should throw 404 if user is not found", async () => {
      const req = { email: "nonexistent@example.com" };
      pool.execute.mockResolvedValueOnce([[]]);
      await expect(transactionServices.getBalance(req)).rejects.toThrow(
        new ResponseError(404, "User tidak ditemukan")
      );
    });
    it("should throw raw error if database query fails", async () => {
      const req = { email: "test@example.com" };
      pool.execute.mockRejectedValueOnce(new Error("Database error"));
      await expect(transactionServices.getBalance(req)).rejects.toThrow(
        "Database error"
      );
    });
  });

  describe("topup", () => {
    it("should throw 400 if top_up_amount is less than or equal to 0", async () => {
      const req = {
        body: { top_up_amount: 0 },
        user: { email: "test@example.com" },
      };
      validate.mockReturnValue({ top_up_amount: 0 });
      await expect(transactionServices.topup(req)).rejects.toThrow(
        new ResponseError(
          400,
          "Parameter top_up_amount hanya boleh angka dan tidak boleh lebih kecil dari 0"
        )
      );
    });

    it("should throw 404 if user not found", async () => {
      const req = {
        body: { top_up_amount: 500 },
        user: { email: "test@example.com" },
      };
      validate.mockReturnValue({ top_up_amount: 500 });
      pool.execute.mockResolvedValueOnce([{ affectedRows: 0 }]);
      await expect(transactionServices.topup(req)).rejects.toThrow(
        new ResponseError(404, "User tidak ditemukan")
      );
    });

    it("should throw 400 if validation fails", async () => {
      const req = {
        body: { top_up_amount: "invalid" },
        user: { email: "test@example.com" },
      };
      validate.mockImplementation(() => {
        throw new ResponseError(400, "Invalid input");
      });
      await expect(transactionServices.topup(req)).rejects.toThrow(
        new ResponseError(400, "Invalid input")
      );
    });

    it("should throw 404 if balance not found after update", async () => {
      const req = {
        body: { top_up_amount: 500 },
        user: { email: "test@example.com" },
      };
      validate.mockReturnValue({ top_up_amount: 500 });
      pool.execute
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        .mockResolvedValueOnce([[]]);
      await expect(transactionServices.topup(req)).rejects.toThrow(
        new ResponseError(404, "User tidak ditemukan")
      );
    });

    it("should throw raw error if update query fail", async () => {
      const req = {
        body: { top_up_amount: 500 },
        user: { email: "test@example.com" },
      };
      validate.mockReturnValue({ top_up_amount: 500 });
      pool.execute.mockRejectedValueOnce(new Error("Update error"));
      await expect(transactionServices.topup(req)).rejects.toThrow(
        "Update error"
      );
    });

    it("should throw raw error if fetch query fail", async () => {
      const req = {
        body: { top_up_amount: 500 },
        user: { email: "test@example.com" },
      };
      validate.mockReturnValue({ top_up_amount: 500 });
      pool.execute
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        .mockRejectedValueOnce(new Error("Fetch error"));
      await expect(transactionServices.topup(req)).rejects.toThrow(
        "Fetch error"
      );
    });
  });

  describe("transaction", () => {
    it("should complete transaction and return details", async () => {
      const req = {
        body: { service_code: "PLN" },
        user: { email: "test@example.com" },
      };

      // Define mockConnection for this test
      const mockConnection = {
        beginTransaction: jest.fn().mockResolvedValue(),
        execute: jest.fn(),
        commit: jest.fn().mockResolvedValue(),
        rollback: jest.fn().mockResolvedValue(),
        release: jest.fn(),
      };

      // Mock pool.getConnection
      pool.getConnection.mockResolvedValue(mockConnection);

      // Mock other dependencies
      validate.mockReturnValue({ service_code: "PLN" });
      pool.execute.mockResolvedValueOnce([
        [
          {
            id: 1,
            service_code: "PLN",
            service_tariff: "100.00",
            service_name: "Service One",
          },
        ],
      ]);
      mockConnection.execute
        .mockResolvedValueOnce([[{ balance: "200.00" }]]) // Balance check
        .mockResolvedValueOnce([{ affectedRows: 1 }]) // Update balance
        .mockResolvedValueOnce([]) // Insert transaction
        .mockResolvedValueOnce([[{ created_on: "2025-03-08T12:00:00Z" }]]); // Fetch created_on

      const result = await transactionServices.transaction(req);

      expect(result).toEqual({
        invoice_number: expect.stringMatching(/^INV\d+$/),
        service_code: "PLN",
        service_name: "Service One",
        transaction_type: "PAYMENT",
        total_amount: 100.0,
        created_on: "2025-03-08T12:00:00Z",
      });
      expect(pool.getConnection).toHaveBeenCalled();
      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(mockConnection.rollback).not.toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
    });

    it("should throw 400 if service is not found", async () => {
      const req = {
        body: { service_code: "INVALID_SERVICE" },
        user: { email: "test@example.com" },
      };

      // Define mockConnection
      const mockConnection = {
        beginTransaction: jest.fn().mockResolvedValue(),
        execute: jest.fn(),
        commit: jest.fn().mockResolvedValue(),
        rollback: jest.fn().mockResolvedValue(),
        release: jest.fn(),
      };

      // Mock pool.getConnection
      pool.getConnection.mockResolvedValue(mockConnection);

      // Mock other dependencies
      validate.mockReturnValue({ service_code: "INVALID_SERVICE" });
      pool.execute.mockResolvedValueOnce([[]]); // Service not found

      await expect(transactionServices.transaction(req)).rejects.toThrow(
        new ResponseError(400, "Service atau Layanan tidak ditemukan")
      );

      expect(pool.getConnection).toHaveBeenCalled();
      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.rollback).toHaveBeenCalled();
      expect(mockConnection.commit).not.toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
      expect(mockConnection.execute).not.toHaveBeenCalled();
    });

    it("should throw 400 if balance < tariff", async () => {
      const req = {
        body: { service_code: "PLN" },
        user: { email: "test@example.com" },
      };

      const mockConnection = {
        beginTransaction: jest.fn().mockResolvedValue(),
        execute: jest.fn(),
        commit: jest.fn().mockResolvedValue(),
        rollback: jest.fn().mockResolvedValue(),
        release: jest.fn(),
      };

      pool.getConnection.mockResolvedValue(mockConnection);
      validate.mockReturnValue({ service_code: "PLN" });
      pool.execute.mockResolvedValueOnce([
        [
          {
            id: 1,
            service_code: "PLN",
            service_tariff: "100.00",
            service_name: "Service One",
          },
        ],
      ]);
      mockConnection.execute.mockResolvedValueOnce([[{ balance: "50.00" }]]); // Balance < tariff

      await expect(transactionServices.transaction(req)).rejects.toThrow(
        new ResponseError(400, "Saldo tidak mencukupi")
      );

      expect(pool.getConnection).toHaveBeenCalled();
      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.rollback).toHaveBeenCalled();
      expect(mockConnection.commit).not.toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
      expect(mockConnection.execute).toHaveBeenCalledTimes(1); // Only balance check
    });

    it("should throw error if transaction insert fails", async () => {
      const req = {
        body: { service_code: "PLN" },
        user: { email: "test@example.com" },
      };

      const mockConnection = {
        beginTransaction: jest.fn().mockResolvedValue(),
        execute: jest.fn(),
        commit: jest.fn().mockResolvedValue(),
        rollback: jest.fn().mockResolvedValue(),
        release: jest.fn(),
      };

      pool.getConnection.mockResolvedValue(mockConnection);
      validate.mockReturnValue({ service_code: "PLN" });
      pool.execute.mockResolvedValueOnce([
        [
          {
            id: 1,
            service_code: "PLN",
            service_tariff: "100.00",
            service_name: "Service One",
          },
        ],
      ]);
      mockConnection.execute
        .mockResolvedValueOnce([[{ balance: "200.00" }]]) // Balance check
        .mockResolvedValueOnce([{ affectedRows: 1 }]) // Update balance
        .mockRejectedValueOnce(new Error("Insert failed")); // Insert transaction fails

      await expect(transactionServices.transaction(req)).rejects.toThrow(
        "Insert failed"
      );

      expect(pool.getConnection).toHaveBeenCalled();
      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.rollback).toHaveBeenCalled();
      expect(mockConnection.commit).not.toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
      expect(mockConnection.execute).toHaveBeenCalledTimes(3);
    });
  });

  describe("transactionHistory", () => {
    it("should return transaction history with valid query", async () => {
      const query = { offset: 0, limit: 2 };
      const user = { email: "test@example.com" };

      validate.mockReturnValue({ offset: 0, limit: 2 });
      pool.execute.mockResolvedValueOnce([[{ id: 1 }]]); // User exists
      pool.query.mockResolvedValueOnce([
        [
          {
            invoice_number: "INV1",
            transaction_type: "PAYMENT",
            description: "Test",
            total_amount: "100.00",
            created_on: "2025-03-08T12:00:00Z",
          },
          {
            invoice_number: "INV2",
            transaction_type: "TOPUP",
            description: "Top Up",
            total_amount: "50.00",
            created_on: "2025-03-07T12:00:00Z",
          },
        ],
      ]);

      const result = await transactionServices.transactionHistory(query, user);

      expect(result).toEqual({
        offset: 0,
        limit: 2,
        records: [
          {
            invoice_number: "INV1",
            transaction_type: "PAYMENT",
            description: "Test",
            total_amount: 100.0,
            created_on: "2025-03-08T12:00:00Z",
          },
          {
            invoice_number: "INV2",
            transaction_type: "TOPUP",
            description: "Top Up",
            total_amount: 50.0,
            created_on: "2025-03-07T12:00:00Z",
          },
        ],
      });
      expect(pool.execute).toHaveBeenCalledWith(
        "SELECT id FROM users WHERE email = ?",
        ["test@example.com"]
      );
      expect(pool.query).toHaveBeenCalledWith(
        "SELECT invoice_number, transaction_type, description, total_amount, created_on " +
          "FROM transactions WHERE user_id = ? " +
          "ORDER BY created_on DESC " +
          "LIMIT ? OFFSET ?",
        [1, 2, 0]
      );
    });

    it("should throw 400 if offset is negative", async () => {
      const query = { offset: -1, limit: 10 };
      const user = { email: "test@example.com" };

      validate.mockReturnValue({ offset: -1, limit: 10 });

      await expect(
        transactionServices.transactionHistory(query, user)
      ).rejects.toThrow(
        new ResponseError(400, "Offset harus lebih besar atau sama dengan 0")
      );
      expect(pool.execute).not.toHaveBeenCalled();
    });

    it("should throw 400 if limit is zero via validation", async () => {
      const query = { offset: 0, limit: 0 };
      const user = { email: "test@example.com" };

      validate.mockImplementation(() => {
        throw new ResponseError(400, "Limit must be greater than 0");
      });

      await expect(
        transactionServices.transactionHistory(query, user)
      ).rejects.toThrow(new ResponseError(400, "Limit must be greater than 0"));
      expect(pool.execute).not.toHaveBeenCalled();
    });

    it("should throw 404 if user is not found", async () => {
      const query = { offset: 0, limit: 10 };
      const user = { email: "test@example.com" };

      validate.mockReturnValue({ offset: 0, limit: 10 });
      pool.execute.mockResolvedValueOnce([[]]);

      await expect(
        transactionServices.transactionHistory(query, user)
      ).rejects.toThrow(new ResponseError(404, "User tidak ditemukan"));
      expect(pool.query).not.toHaveBeenCalled();
    });
  });
});
