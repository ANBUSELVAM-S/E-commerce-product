// Auth Service - Controller Unit Tests
const { register, confirm, login } = require("../auth-service/src/controllers/authController");

// Mock cognitoClient
jest.mock("../auth-service/src/config/cognito", () => ({
  cognitoClient: {
    send: jest.fn()
  }
}));

// Mock jsonwebtoken
jest.mock("jsonwebtoken", () => ({
  decode: jest.fn()
}));

const { cognitoClient } = require("../auth-service/src/config/cognito");
const jwt = require("jsonwebtoken");

// Set env vars
process.env.COGNITO_CLIENT_ID = "test-client-id";
process.env.COGNITO_USER_POOL_ID = "test-pool-id";

// Helper to create mock req/res
const mockReq = (body = {}, params = {}, query = {}) => ({
  body, params, query
});

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("Auth Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===== REGISTER =====
  describe("register", () => {
    it("should return 400 if email, password, or role is missing", async () => {
      const req = mockReq({ email: "test@test.com" });
      const res = mockRes();

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Email, password, and role are required"
      });
    });

    it("should return 400 if role is invalid", async () => {
      const req = mockReq({ email: "test@test.com", password: "pass123", role: "superadmin" });
      const res = mockRes();

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Role must be 'admin' or 'user'"
      });
    });

    it("should register user successfully", async () => {
      cognitoClient.send
        .mockResolvedValueOnce({ UserSub: "sub-123" }) // SignUpCommand
        .mockResolvedValueOnce({}); // AdminAddUserToGroupCommand

      const req = mockReq({ email: "test@test.com", password: "pass123", role: "user" });
      const res = mockRes();

      await register(req, res);

      expect(cognitoClient.send).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ role: "user" }));
    });

    it("should return 500 on cognito error", async () => {
      cognitoClient.send.mockRejectedValueOnce(new Error("Cognito error"));

      const req = mockReq({ email: "test@test.com", password: "pass123", role: "user" });
      const res = mockRes();

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ===== CONFIRM =====
  describe("confirm", () => {
    it("should confirm user successfully", async () => {
      cognitoClient.send.mockResolvedValueOnce({});

      const req = mockReq({ email: "test@test.com", code: "123456" });
      const res = mockRes();

      await confirm(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Account verified successfully."
      });
    });

    it("should return 500 on error", async () => {
      cognitoClient.send.mockRejectedValueOnce(new Error("Invalid code"));

      const req = mockReq({ email: "test@test.com", code: "wrong" });
      const res = mockRes();

      await confirm(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ===== LOGIN =====
  describe("login", () => {
    it("should return 400 if email or password is missing", async () => {
      const req = mockReq({ email: "test@test.com" });
      const res = mockRes();

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should login successfully and return tokens", async () => {
      cognitoClient.send.mockResolvedValueOnce({
        AuthenticationResult: {
          AccessToken: "access-token",
          IdToken: "id-token",
          RefreshToken: "refresh-token"
        }
      });

      jwt.decode.mockReturnValueOnce({
        sub: "user-sub-123",
        "cognito:groups": ["user"]
      });

      const req = mockReq({ email: "test@test.com", password: "pass123" });
      const res = mockRes();

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: "Login successful",
        tokens: expect.objectContaining({ accessToken: "access-token" }),
        user: expect.objectContaining({ email: "test@test.com", role: "user" })
      }));
    });

    it("should assign admin role when user belongs to admin group", async () => {
      cognitoClient.send.mockResolvedValueOnce({
        AuthenticationResult: {
          AccessToken: "access-token",
          IdToken: "id-token",
          RefreshToken: "refresh-token"
        }
      });

      jwt.decode.mockReturnValueOnce({
        sub: "admin-sub-123",
        "cognito:groups": ["admin"]
      });

      const req = mockReq({ email: "admin@test.com", password: "pass123" });
      const res = mockRes();

      await login(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        user: expect.objectContaining({ role: "admin" })
      }));
    });

    it("should return 401 on login error", async () => {
      cognitoClient.send.mockRejectedValueOnce(new Error("Invalid credentials"));

      const req = mockReq({ email: "test@test.com", password: "wrong" });
      const res = mockRes();

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });
});
