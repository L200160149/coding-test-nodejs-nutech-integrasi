import transactionService from "../services/transaction-service.js";

const getBalance = async (req, res, next) => {
  try {
    const result = await transactionService.getBalance(req.user);
    res.status(200).json({
      status: 0,
      message: "Get Balance Berhasil",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const topup = async (req, res, next) => {
  try {
    const result = await transactionService.topup(req);
    res.status(200).json({
      status: 0,
      message: "Top Up Balance berhasil",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const transaction = async (req, res, next) => {
  try {
    const result = await transactionService.transaction(req);
    res.status(200).json({
      status: 0,
      message: "Transaksi berhasil",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const transactionHistory = async (req, res, next) => {
  try {
    const result = await transactionService.transactionHistory(
      req.query,
      req.user
    );
    res.status(200).json({
      status: 0,
      message: "Get History Berhasil",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export default { getBalance, topup, transaction, transactionHistory };
