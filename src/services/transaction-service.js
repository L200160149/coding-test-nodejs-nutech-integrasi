import { pool } from "../applications/database.js";
import { ResponseError } from "../errors/response-error.js";
import Decimal from "decimal.js";
import {
  topupValidation,
  transactionHistoryValidation,
  transactionValidation,
} from "../validations/trancation-validation.js";
import { validate } from "../validations/validation.js";

const getBalance = async (req) => {
  const [rows] = await pool.execute(
    "SELECT balance FROM users WHERE email = ?",
    [req.email]
  );

  // User not found
  if (rows.length === 0) {
    throw new ResponseError(404, "User tidak ditemukan");
  }
  const balance = new Decimal(rows[0].balance);
  return { balance: balance.toNumber() };
};

const topup = async (req) => {
  // Validate and extract top_up_amount
  const validatedData = validate(topupValidation, req.body);
  const top_up_amount = validatedData.top_up_amount;

  const email = req.user.email;

  // Convert top_up_amount to Decimal
  const amount = new Decimal(top_up_amount);

  if (amount.lessThanOrEqualTo(0)) {
    throw new ResponseError(
      400,
      "Parameter top_up_amount hanya boleh angka dan tidak boleh lebih kecil dari 0"
    );
  }

  // Update balance and Convert Decimal back to string for MySQL
  const [rows] = await pool.execute(
    "UPDATE users SET balance = balance + ? WHERE email = ?",
    [amount.toString(), email]
  );

  if (rows.affectedRows === 0) {
    throw new ResponseError(404, "User tidak ditemukan");
  }

  // Fetch updated balance (optional, for response)
  const [userRows] = await pool.execute(
    "SELECT balance FROM users WHERE email = ?",
    [email]
  );

  if (userRows.length === 0) {
    throw new ResponseError(404, "User tidak ditemukan");
  }

  const newBalance = new Decimal(userRows[0].balance).toNumber();

  // Insert into transactions table
  const invoiceNumber = `INV${Date.now()}`;
  await pool.execute(
    "INSERT INTO transactions (invoice_number, transaction_type, description, total_amount, user_id, created_on) VALUES (?, ?, ?, ?, (SELECT id FROM users WHERE email = ?), NOW())",
    [invoiceNumber, "TOPUP", "Top Up balance", amount.toString(), email]
  );

  return { balance: newBalance };
};

const transaction = async (req) => {
  // Validate data
  const validateData = validate(transactionValidation, req.body);
  const serviceCode = validateData.service_code;
  const email = req.user.email;

  // Start transcation
  const connection = await pool.getConnection();
  if (!connection) {
    throw new Error("Failed to obtain database connection");
  }
  try {
    await connection.beginTransaction();
    const [serviceRows] = await pool.execute(
      "SELECT id, service_code, service_tariff, service_name FROM services WHERE service_code = ?",
      [serviceCode]
    );

    if (serviceRows.length === 0) {
      throw new ResponseError(400, "Service atau Layanan tidak ditemukan");
    }

    const service = serviceRows[0];
    const serviceTariff = new Decimal(service.service_tariff);

    // Get current balance
    const [balanceRow] = await connection.execute(
      "SELECT balance FROM users WHERE email = ?",
      [email]
    );

    if (balanceRow.length === 0) {
      throw new ResponseError(404, "User tidak ditemukan");
    }

    const currentBalance = new Decimal(balanceRow[0].balance);

    // Check if balance < tarif
    if (currentBalance.lessThan(serviceTariff)) {
      throw new ResponseError(400, "Saldo tidak mencukupi");
    }

    // Decrease balnace
    const [updateResult] = await connection.execute(
      "UPDATE users SET balance = balance - ? WHERE email = ?",
      [serviceTariff.toString(), email]
    );

    if (updateResult.affectedRows === 0) {
      throw new ResponseError(400, "User tidak ditemukan");
    }

    // Insert into transactions table
    const invoiceNumber = `INV${Date.now()}`;
    await connection.execute(
      "INSERT INTO transactions (invoice_number, transaction_type, description, total_amount, user_id, service_id, created_on) VALUES (?, ?, ?, ?, (SELECT id FROM users WHERE email = ?), ?, NOW())",
      [
        invoiceNumber,
        "PAYMENT",
        service.service_name,
        serviceTariff.toString(),
        email,
        service.id,
      ]
    );

    // Fetch created_on
    const [transactionRows] = await connection.execute(
      "SELECT created_on FROM transactions WHERE invoice_number = ?",
      [invoiceNumber]
    );
    const createdOn = transactionRows[0].created_on;

    await connection.commit();

    return {
      invoice_number: invoiceNumber,
      service_code: service.service_code,
      service_name: service.service_name,
      transaction_type: "PAYMENT",
      total_amount: serviceTariff.toNumber(),
      created_on: createdOn,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const transactionHistory = async (query, user) => {
  const validatedData = validate(transactionHistoryValidation, query);
  const email = user.email;
  const offset = validatedData.offset || 0;
  const limit = validatedData.limit || 10;

  if (!Number.isInteger(offset) || offset < 0) {
    throw new ResponseError(400, "Offset harus lebih besar atau sama dengan 0");
  }
  if (!Number.isInteger(limit) || limit <= 0) {
    throw new ResponseError(400, "Limit harus lebih besar atau sama dengan 1");
  }

  // Verify user exists
  const [userRows] = await pool.execute(
    "SELECT id FROM users WHERE email = ?",
    [email]
  );

  if (userRows.length === 0) {
    throw new ResponseError(404, "User tidak ditemukan");
  }
  const userId = userRows[0].id;

  // Fetch transactions
  const [transactionRows] = await pool.query(
    "SELECT invoice_number, transaction_type, description, total_amount, created_on " +
      "FROM transactions WHERE user_id = ? " +
      "ORDER BY created_on DESC " +
      "LIMIT ? OFFSET ?",
    [userId, limit, offset]
  );

  // Convert total_amount to numbers
  const records = transactionRows.map((row) => ({
    invoice_number: row.invoice_number,
    transaction_type: row.transaction_type,
    description: row.description,
    total_amount: new Decimal(row.total_amount).toNumber(),
    created_on: row.created_on,
  }));

  return {
    offset,
    limit,
    records,
  };
};

export default {
  getBalance,
  topup,
  transaction,
  transactionHistory,
};
