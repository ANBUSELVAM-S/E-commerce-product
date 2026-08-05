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

    if (!iss || typeof iss !== 'string') {
      return res.status(401).json({ message: "Invalid token issuer" });
    }

    // SSRF Prevention: Strictly validate and reconstruct the URL
    const match = iss.match(/^https:\/\/(cognito-idp\.[a-z0-9-]+\.amazonaws\.com)\/([a-zA-Z0-9_-]+)$/);
    if (!match) {
      return res.status(401).json({ message: "Invalid token issuer format" });
    }
    
    const safeIss = `https://${match[1]}/${match[2]}`;

    if (!cachedKeys[safeIss] || !cachedKeys[safeIss][kid]) {
      const response = await axios.get(`${safeIss}/.well-known/jwks.json`);
      const keys = response.data.keys || [];
      cachedKeys[safeIss] = {};
      for (const key of keys) {
        cachedKeys[safeIss][key.kid] = jwkToPem(key);
      }
    }

    const pem = cachedKeys[safeIss][kid];
    if (!pem) {
      return res.status(401).json({ message: "Unknown token signing key" });
    }

    const payload = jwt.verify(token, pem, { issuers: [safeIss] });

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
