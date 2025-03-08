// tests/middlewares/auth-middleware.test.js
import { authMiddleware } from "../../middleware/auth-middleware.js";
import jwt from "jsonwebtoken";
import { decryptData } from "../../utils/security.js";

jest.mock("jsonwebtoken");
jest.mock("../../utils/security.js");

describe("authMiddleware", () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      header: jest.fn(),
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();

    process.env.JWT_SECRET_KEY = "test-secret-key";
  });

  it("should attach user to req and call with valid token", async () => {
    const token = "valid-token";
    const decodedData = { data: "encrypted-data" };
    const decryptedUser = { email: "test@example.com" };

    req.header.mockReturnValue(`Bearer ${token}`);
    jwt.verify.mockReturnValue(decodedData);
    decryptData.mockReturnValue(decryptedUser);

    await authMiddleware(req, res, next);

    expect(req.header).toHaveBeenCalledWith("Authorization");
    expect(jwt.verify).toHaveBeenCalledWith(token, "test-secret-key");
    expect(decryptData).toHaveBeenCalledWith("encrypted-data");
    expect(req.user).toEqual(decryptedUser);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should return 401 if no Authorization header is provided", async () => {
    req.header.mockReturnValue(undefined);

    await authMiddleware(req, res, next);

    expect(req.header).toHaveBeenCalledWith("Authorization");
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      status: 108,
      message: "Token tidak valid atau kadaluwarsa",
      data: null,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 if Authorization header is not Bearer", async () => {
    req.header.mockReturnValue("Basic some-token");

    await authMiddleware(req, res, next);

    expect(req.header).toHaveBeenCalledWith("Authorization");
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      status: 108,
      message: "Token tidak valid atau kadaluwarsa",
      data: null,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 if token verification fails", async () => {
    const token = "invalid-token";
    req.header.mockReturnValue(`Bearer ${token}`);
    jwt.verify.mockImplementation(() => {
      throw new Error("Invalid token");
    });

    await authMiddleware(req, res, next);

    expect(req.header).toHaveBeenCalledWith("Authorization");
    expect(jwt.verify).toHaveBeenCalledWith(token, "test-secret-key");
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      status: 108,
      message: "Token tidak valid atau kadaluwarsa",
      data: null,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 if decryptData falis", async () => {
    const token = "valid-token";
    const decodedData = { data: "encrypted-data" };
    req.header.mockReturnValue(`Bearer ${token}`);
    jwt.verify.mockReturnValue(decodedData);
    decryptData.mockImplementation(() => {
      throw new Error("Decryption failed");
    });

    await authMiddleware(req, res, next);

    expect(req.header).toHaveBeenCalledWith("Authorization");
    expect(jwt.verify).toHaveBeenCalledWith(token, "test-secret-key");
    expect(decryptData).toHaveBeenCalledWith("encrypted-data");
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      status: 108,
      message: "Token tidak valid atau kadaluwarsa",
      data: null,
    });
    expect(next).not.toHaveBeenCalled();
  });
});
