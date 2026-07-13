const { 
  SignUpCommand, 
  AdminAddUserToGroupCommand, 
  InitiateAuthCommand, 
  ConfirmSignUpCommand 
} = require("@aws-sdk/client-cognito-identity-provider");
const { cognitoClient } = require("../config/cognito");
const jwt = require("jsonwebtoken");

const CLIENT_ID = process.env.COGNITO_CLIENT_ID;
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;

const register = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ message: "Email, password, and role are required" });
    }

    if (role !== "admin" && role !== "user") {
      return res.status(400).json({ message: "Role must be 'admin' or 'user'" });
    }

    // 1. Sign up the user in Cognito
    const signUpCommand = new SignUpCommand({
      ClientId: CLIENT_ID,
      Username: email,
      Password: password,
      UserAttributes: [
        { Name: "email", Value: email }
      ]
    });
    
    const response = await cognitoClient.send(signUpCommand);

console.log(response);
    console.log("Role:", role);
    // 2. Add the user to the requested group
    const addToGroupCommand = new AdminAddUserToGroupCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
      GroupName: role
    });

    await cognitoClient.send(addToGroupCommand);

    res.status(201).json({ 
      message: "User registered successfully. Please check your email for the verification code.",
      role
    });

  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ message: error.message || "Failed to register user" });
  }
};

const confirm = async (req, res) => {
  try {
    console.log("BODY:", req.body);

    const { email, code } = req.body;

    console.log("EMAIL:", email);
    console.log("CODE:", code);
    console.log("CODE LENGTH:", code.length);

    const command = new ConfirmSignUpCommand({
      ClientId: CLIENT_ID,
      Username: email,
      ConfirmationCode: code.trim()
    });

    await cognitoClient.send(command);

    return res.status(200).json({
      message: "Account verified successfully."
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: error.message
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const command = new InitiateAuthCommand({
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: CLIENT_ID,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password
      }
    });

    const response = await cognitoClient.send(command);

    // Get the tokens
    const accessToken = response.AuthenticationResult.AccessToken;
    const idToken = response.AuthenticationResult.IdToken;
    const refreshToken = response.AuthenticationResult.RefreshToken;

    // Decode ID Token to extract role (Cognito Groups) and user ID (sub)
    const decodedIdToken = jwt.decode(idToken);
    const groups = decodedIdToken["cognito:groups"] || [];
    const userId = decodedIdToken.sub;
    
    // Determine primary role
    let role = "user";
    if (groups.includes("admin")) {
      role = "admin";
    }

    res.status(200).json({
      message: "Login successful",
      tokens: {
        accessToken,
        idToken,
        refreshToken
      },
      user: {
        userId,
        email,
        role
      }
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(401).json({ message: error.message || "Invalid credentials" });
  }
};

module.exports = {
  register,
  confirm,
  login
};
