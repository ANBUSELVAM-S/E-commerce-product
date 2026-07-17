module.exports = {
  testEnvironment: 'node',
  clearMocks: true,
  moduleNameMapper: {
    '^axios$': '<rootDir>/node_modules/axios',
    '^jsonwebtoken$': '<rootDir>/node_modules/jsonwebtoken',
    '^@aws-sdk/lib-dynamodb$': '<rootDir>/node_modules/@aws-sdk/lib-dynamodb',
    '^@aws-sdk/client-sns$': '<rootDir>/node_modules/@aws-sdk/client-sns',
    '^@aws-sdk/client-sqs$': '<rootDir>/node_modules/@aws-sdk/client-sqs',
    '^@aws-sdk/client-cognito-identity-provider$': '<rootDir>/node_modules/@aws-sdk/client-cognito-identity-provider'
  }
};
