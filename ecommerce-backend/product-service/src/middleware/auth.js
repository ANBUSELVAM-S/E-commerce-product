const jwt = require("jsonwebtoken");
const axios = require("axios");
const crypto = require("crypto");

// In-memory cache for Cognito public keys (JWKS)
let cachedKeys = {};

// Helper to convert JWK to PEM
function jwkToPem(jwk) {
  try {
    const publicKey = crypto.createPublicKey({
      key: jwk,
      format: "jwk"
    });
    return publicKey.export({
      type: "pkcs1",
      format: "pem"
    });
  } catch (err) {
    throw new Error("Failed to export public key: " + err.message);
  }
}

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded || !decoded.header || !decoded.payload) {
      return res.status(401).json({ message: "Invalid token format" });
    }

    const { kid } = decoded.header;
    const { iss } = decoded.payload;

    // Strict SSRF protection: only allow valid AWS Cognito issuer URLs
    const cognitoIssuerRegex = /^https:\/\/cognito-idp\.[a-z0-9-]+\.amazonaws\.com\/[a-zA-Z0-9-_]+$/;
    if (!iss || !cognitoIssuerRegex.test(iss)) {
      return res.status(401).json({ message: "Invalid token issuer" });
    }

    if (!cachedKeys[iss] || !cachedKeys[iss][kid]) {
      const jwksUrl = `${iss}/.well-known/jwks.json`;
      const response = await axios.get(jwksUrl);
      const keys = response.data.keys || [];
      cachedKeys[iss] = {};
      for (const key of keys) {
        cachedKeys[iss][key.kid] = jwkToPem(key);
      }
    }

    const pem = cachedKeys[iss][kid];
    if (!pem) {
      return res.status(401).json({ message: "Unknown token signing key" });
    }

    const payload = jwt.verify(token, pem, { issuers: [iss] });

    req.user = {
      sub: payload.sub,
      username: payload.username,
      groups: payload["cognito:groups"] || [],
      role: (payload["cognito:groups"] || []).includes("admin") ? "admin" : "user"
    };

    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    return res.status(401).json({ message: "Unauthorized: " + error.message });
  }
};

const authorizeGroups = (allowedGroups) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (req.user.groups.includes("admin")) {
      return next();
    }

    const hasAccess = allowedGroups.some(group => req.user.groups.includes(group));
    if (!hasAccess) {
      return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeGroups
};
