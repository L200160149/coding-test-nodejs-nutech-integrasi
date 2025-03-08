// tests/services/membership-service.test.js
import membershipService from "../../services/membership-service.js";
import { pool } from "../../applications/database.js";
import { validate } from "../../validations/validation.js";
import { ResponseError } from "../../errors/response-error.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { encryptData } from "../../utils/security.js";

jest.mock("../../applications/database.js", () => ({
  pool: { execute: jest.fn() },
}));
jest.mock("../../validations/validation.js", () => ({
  validate: jest.fn(),
}));
jest.mock("bcrypt", () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));
jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(),
}));
jest.mock("../../utils/security.js", () => ({
  encryptData: jest.fn(),
}));

// Register Services
describe("membershipService.register", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should register user successfully", async () => {
    const request = {
      email: "test@example.com",
      first_name: "Test",
      last_name: "User",
      password: "password123",
    };

    validate.mockReturnValue(request);
    pool.execute
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);
    bcrypt.hash.mockResolvedValue("hashed-password123");

    const result = await membershipService.register(request);

    expect(result).toEqual([{ affectedRows: 1 }]);
    expect(validate).toHaveBeenCalledWith(expect.anything(), request);
    expect(pool.execute).toHaveBeenCalledWith(
      "SELECT email FROM users WHERE email = ?",
      ["test@example.com"]
    );
    expect(bcrypt.hash).toHaveBeenCalledWith("password123", 10);
    expect(pool.execute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO users"),
      ["test@example.com", "Test", "User", "hashed-password123"]
    );
  });

  it("should throw 400 if email is already exists", async () => {
    const request = {
      email: "test@example.com",
      first_name: "Test",
      last_name: "User",
      password: "password123",
    };

    validate.mockReturnValue(request);
    pool.execute.mockResolvedValueOnce([[{ email: "test@example.com" }]]);

    await expect(membershipService.register(request)).rejects.toThrow(
      new ResponseError(400, "Email sudah terdaftar")
    );
    expect(pool.execute).toHaveBeenCalledTimes(1);
  });

  it("should throw 400 if validation fails", async () => {
    const request = { email: "invalid" };

    validate.mockImplementation(() => {
      throw new ResponseError(400, "Invalid input");
    });

    await expect(membershipService.register(request)).rejects.toThrow(
      new ResponseError(400, "Invalid input")
    );
    expect(pool.execute).not.toHaveBeenCalled();
  });

  it("should throw 500 if database insert fails/error code", async () => {
    const request = {
      email: "test@example.com",
      first_name: "Test",
      last_name: "User",
      password: "password123",
    };

    validate.mockReturnValue(request);
    pool.execute
      .mockResolvedValueOnce([[]])
      .mockRejectedValueOnce(new Error("Database error"));
    bcrypt.hash.mockResolvedValue("hashed-password123");

    await expect(membershipService.register(request)).rejects.toThrow(
      "Database error"
    );
  });
});

// Login Services
describe("membershipService.login", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("should return a JWT token on successful login", async () => {
    const request = {
      email: "test@example.com",
      password: "password123",
    };
    const user = {
      email: "test@example.com",
      password: "hashed-password123",
      balance: "1000.00",
      first_name: "Test",
      last_name: "User",
      profile_image: "supridev.jpg",
    };

    validate.mockReturnValue(request);
    pool.execute.mockResolvedValueOnce([[user]]);
    bcrypt.compare.mockResolvedValue(true);
    encryptData.mockReturnValue("encrypted-data");
    jwt.sign.mockReturnValue("jwt-token");

    const result = await membershipService.login(request);

    expect(result).toBe("jwt-token");
    expect(validate).toHaveBeenCalledWith(expect.anything(), request);
    expect(pool.execute).toHaveBeenCalledWith(
      expect.stringContaining("SELECT email, password, balance"),
      ["test@example.com"]
    );
    expect(bcrypt.compare).toHaveBeenCalledWith(
      "password123",
      "hashed-password123"
    );
    expect(encryptData).toHaveBeenCalledWith({
      email: "test@example.com",
      first_name: "Test",
      last_name: "User",
      profile_image: "supridev.jpg",
      balance: "1000.00",
    });
    expect(jwt.sign).toHaveBeenCalledWith(
      { data: "encrypted-data" },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "12h" }
    );
  });

  it("should throw 401 if email not found", async () => {
    const request = {
      email: "test@example.com",
      password: "password123",
    };

    validate.mockReturnValue(request);
    pool.execute.mockResolvedValueOnce([[]]);

    await expect(membershipService.login(request)).rejects.toThrow(
      new ResponseError(401, "Email atau password salah")
    );
    expect(pool.execute).toHaveBeenCalledTimes(1);
    expect(bcrypt.compare).not.toHaveBeenCalled();
  });

  it("should throw 401 if password wrong", async () => {
    const request = {
      email: "test@example.com",
      password: "wrongpassword",
    };
    const user = {
      email: "test@example.com",
      password: "hashed-password123",
    };

    validate.mockReturnValue(request);
    pool.execute.mockResolvedValueOnce([[user]]);
    bcrypt.compare.mockResolvedValue(false);

    await expect(membershipService.login(request)).rejects.toThrow(
      new ResponseError(401, "Email atau password salah")
    );
    expect(bcrypt.compare).toHaveBeenCalledWith(
      "wrongpassword",
      "hashed-password123"
    );
    expect(encryptData).not.toHaveBeenCalled();
  });

  it("should throw 400 if validation fails", async () => {
    const request = { email: "invalid" };

    validate.mockImplementation(() => {
      throw new ResponseError(400, "Invalid input");
    });

    await expect(membershipService.login(request)).rejects.toThrow(
      new ResponseError(400, "Invalid input")
    );
    expect(pool.execute).not.toHaveBeenCalled();
  });

  it("should throw 500 if database query fails", async () => {
    const request = {
      email: "test@example.com",
      password: "password123",
    };

    validate.mockReturnValue(request);
    pool.execute.mockRejectedValueOnce(new Error("Database error"));

    await expect(membershipService.login(request)).rejects.toThrow(
      "Database error"
    );
    expect(bcrypt.compare).not.toHaveBeenCalled();
  });

  it("should return user profile if user exists", async () => {
    const request = { email: "test@example.com" };
    const user = {
      email: "test@example.com",
      first_name: "Test",
      last_name: "User",
      profile_image: "supridev.jpg",
    };

    pool.execute.mockResolvedValueOnce([[user]]);

    const result = await membershipService.profile(request);

    expect(result).toEqual({
      email: "test@example.com",
      first_name: "Test",
      last_name: "User",
      profile_image: "supridev.jpg",
    });
    expect(pool.execute).toHaveBeenCalledWith(
      expect.stringContaining(
        "SELECT email, first_name, last_name, profile_image"
      ),
      ["test@example.com"]
    );
  });
});

// Profile Services
describe("membershipService.profile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("should return user profile when user exists", async () => {
    const request = { email: "test@example.com" };
    const user = {
      email: "test@example.com",
      first_name: "Test",
      last_name: "User",
      profile_image: "supridev.jpg",
    };

    pool.execute.mockResolvedValueOnce([[user]]);

    const result = await membershipService.profile(request);

    expect(result).toEqual({
      email: "test@example.com",
      first_name: "Test",
      last_name: "User",
      profile_image: "supridev.jpg",
    });
    expect(pool.execute).toHaveBeenCalledWith(
      expect.stringContaining(
        "SELECT email, first_name, last_name, profile_image"
      ),
      ["test@example.com"]
    );
  });

  it("should throw 404 if user not found", async () => {
    const request = { email: "test@example.com" };

    pool.execute.mockResolvedValueOnce([[]]);

    await expect(membershipService.profile(request)).rejects.toThrow(
      new ResponseError(404, "user tidak ditemukan")
    );
    expect(pool.execute).toHaveBeenCalledWith(
      expect.stringContaining(
        "SELECT email, first_name, last_name, profile_image"
      ),
      ["test@example.com"]
    );
  });

  it("should throw 500 if database query fails", async () => {
    const request = { email: "test@example.com" };

    pool.execute.mockRejectedValueOnce(new Error("Database error"));

    await expect(membershipService.profile(request)).rejects.toThrow(
      "Database error"
    );
  });
});

// Update Profile Services
describe("membershipService.updateProfile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("should update and return user profile when user exists", async () => {
    const request = {
      body: { first_name: "firstName", last_name: "lastName" },
      user: { email: "test@example.com", profile_image: "supridev.jpg" },
    };

    validate.mockReturnValue({
      first_name: "firstName",
      last_name: "lastName",
    });
    pool.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);

    const result = await membershipService.updateProfile(request);

    expect(result).toEqual({
      email: "test@example.com",
      first_name: "firstName",
      last_name: "lastName",
      profile_image: "supridev.jpg",
    });
    expect(validate).toHaveBeenCalledWith(expect.anything(), request.body);
    expect(pool.execute).toHaveBeenCalledWith(
      "UPDATE users SET first_name = ?, last_name = ? WHERE email = ?",
      ["firstName", "lastName", "test@example.com"]
    );
  });

  it("should thow 404 if user not found", async () => {
    const request = {
      body: { first_name: "firtName", last_name: "lastName" },
      user: { email: "test@example.com", profile_image: "supridev.jpg" },
    };

    validate.mockReturnValue({
      first_name: "firtName",
      last_name: "lastName",
    });
    pool.execute.mockResolvedValueOnce([{ affectedRows: 0 }]);

    await expect(membershipService.updateProfile(request)).rejects.toThrow(
      new ResponseError(404, "User not found")
    );
    expect(pool.execute).toHaveBeenCalledWith(
      "UPDATE users SET first_name = ?, last_name = ? WHERE email = ?",
      ["firtName", "lastName", "test@example.com"]
    );
  });

  it("should throw 400 if validation fail", async () => {
    const request = {
      body: { first_name: "Invalid" },
      user: { email: "test@example.com", profile_image: "supridev.jpg" },
    };

    validate.mockImplementation(() => {
      throw new ResponseError(400, "Invalid input");
    });

    await expect(membershipService.updateProfile(request)).rejects.toThrow(
      new ResponseError(400, "Invalid input")
    );
    expect(pool.execute).not.toHaveBeenCalled();
  });

  it("should throw 500 if database update fails", async () => {
    const request = {
      body: { first_name: "NewFirst", last_name: "NewLast" },
      user: { email: "test@example.com", profile_image: "supridev.jpg" },
    };

    validate.mockReturnValue({
      first_name: "NewFirst",
      last_name: "NewLast",
    });
    pool.execute.mockRejectedValueOnce(new Error("Database error"));

    await expect(membershipService.updateProfile(request)).rejects.toThrow(
      "Database error"
    );
  });
});

// Update Profile Image Services
describe("membershipService.updateProfileImage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("should update and return user profile image when user exists", async () => {
    const request = { body: {}, user: { email: "test@example.com" } };
    const file = { filename: "supri.jpg" };
    const updatedUser = {
      first_name: "Test",
      last_name: "User",
      profile_image: `${process.env.API_URL}/uploads/profile/supri.jpg`,
    };

    validate.mockReturnValue({});
    pool.execute
      .mockResolvedValueOnce([{ affectedRows: 1 }]) // Update
      .mockResolvedValueOnce([[updatedUser]]); // Fetch

    const result = await membershipService.updateProfileImage(request, file);

    expect(result).toEqual({
      email: "test@example.com",
      first_name: "Test",
      last_name: "User",
      profile_image: `${process.env.API_URL}/uploads/profile/supri.jpg`,
    });
    expect(validate).toHaveBeenCalledWith(expect.anything(), request.body);
    expect(pool.execute).toHaveBeenCalledWith(
      "UPDATE users SET profile_image = ? WHERE email = ?",
      [`${process.env.API_URL}/uploads/profile/supri.jpg`, "test@example.com"]
    );
    expect(pool.execute).toHaveBeenCalledWith(
      "SELECT first_name, last_name, profile_image FROM users WHERE email = ?",
      ["test@example.com"]
    );
  });

  it("should throw 400 if file is missing", async () => {
    const request = { body: {}, user: { email: "test@example.com" } };
    const file = null;

    await expect(
      membershipService.updateProfileImage(request, file)
    ).rejects.toThrow(new ResponseError(400, "Field file tidak boleh kosong"));
    expect(validate).not.toHaveBeenCalled();
    expect(pool.execute).not.toHaveBeenCalled();
  });

  it("should throw 400 if validation fails", async () => {
    const request = {
      body: { invalid: "data" },
      user: { email: "test@example.com" },
    };
    const file = { filename: "supridev.jpg" };

    validate.mockImplementation(() => {
      throw new ResponseError(400, "Invalid input");
    });

    await expect(
      membershipService.updateProfileImage(request, file)
    ).rejects.toThrow(new ResponseError(400, "Invalid input"));
    expect(pool.execute).not.toHaveBeenCalled();
  });

  it("should throw 404 if user is not found during update", async () => {
    const request = { body: {}, user: { email: "test@example.com" } };
    const file = { filename: "supridev.jpg" };

    validate.mockReturnValue({});
    pool.execute.mockResolvedValueOnce([{ affectedRows: 0 }]);

    await expect(
      membershipService.updateProfileImage(request, file)
    ).rejects.toThrow(new ResponseError(404, "User not found"));
    expect(pool.execute).toHaveBeenCalledTimes(1); // Only update called
  });

  it("should throw 500 if database update fails", async () => {
    const request = { body: {}, user: { email: "test@example.com" } };
    const file = { filename: "supri.jpg" };

    validate.mockReturnValue({});
    pool.execute.mockRejectedValueOnce(new Error("Database error"));

    await expect(
      membershipService.updateProfileImage(request, file)
    ).rejects.toThrow("Database error");
  });
});
