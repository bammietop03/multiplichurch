export const VERIFICATION_EMAIL = `<html>
  <head>
    <meta charset='utf-8' />
    <meta name='viewport' content='width=device-width, initial-scale=1.0' />
    <title>Verify Your Email</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        color: #333;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
      }
      .header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 30px;
        text-align: center;
        border-radius: 10px 10px 0 0;
      }
      .content {
        background: #f9f9f9;
        padding: 30px;
        border-radius: 0 0 10px 10px;
      }
      .code-box {
        background: white;
        border: 2px dashed #667eea;
        border-radius: 8px;
        padding: 20px;
        text-align: center;
        margin: 20px 0;
      }
      .code {
        font-size: 32px;
        font-weight: bold;
        letter-spacing: 8px;
        color: #667eea;
        font-family: 'Courier New', monospace;
      }
      .footer {
        text-align: center;
        margin-top: 30px;
        color: #999;
        font-size: 12px;
      }
    </style>
  </head>
  <body>
    <div class='container'>
      <div class='header'>
        <h1>Verify Your Email Address</h1>
      </div>
      <div class='content'>
        <p>Hi {{name}},</p>
        <p>Thank you for registering! Please use the verification code below to verify your email address:</p>
        <div class='code-box'>
          <div class='code'>{{code}}</div>
        </div>
        <p style='text-align: center; color: #666;'>Enter this code on the verification page to complete your registration.</p>
        <p>This code will expire in 24 hours.</p>
        <p>If you didn't create an account, please ignore this email.</p>
      </div>
      <div class='footer'>
        <p>&copy; 2026 Your Company. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>`;

export const PASSWORD_RESET_EMAIL = `<html>
  <head>
    <meta charset='utf-8' />
    <meta name='viewport' content='width=device-width, initial-scale=1.0' />
    <title>Reset Your Password</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        color: #333;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
      }
      .header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 30px;
        text-align: center;
        border-radius: 10px 10px 0 0;
      }
      .content {
        background: #f9f9f9;
        padding: 30px;
        border-radius: 0 0 10px 10px;
      }
      .button {
        display: inline-block;
        padding: 12px 30px;
        background: #667eea;
        color: white;
        text-decoration: none;
        border-radius: 5px;
        margin: 20px 0;
      }
      .footer {
        text-align: center;
        margin-top: 30px;
        color: #999;
        font-size: 12px;
      }
      .warning {
        background: #fff3cd;
        border-left: 4px solid #ffc107;
        padding: 15px;
        margin: 20px 0;
      }
    </style>
  </head>
  <body>
    <div class='container'>
      <div class='header'>
        <h1>Reset Your Password</h1>
      </div>
      <div class='content'>
        <p>Hi {{name}},</p>
        <p>We received a request to reset your password. Click the button below
          to create a new password:</p>
        <div style='text-align: center;'>
          <a href='{{url}}' class='button'>Reset Password</a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style='word-break: break-all; color: #667eea;'>{{url}}</p>
        <div class='warning'>
          <strong>⚠️ Security Notice:</strong>
          This link will expire in 1 hour. If you didn't request a password
          reset, please ignore this email and your password will remain
          unchanged.
        </div>
      </div>
      <div class='footer'>
        <p>&copy; 2026 Your Company. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>`;

export const PASSWORD_CHANGED_EMAIL = `<html>
  <head>
    <meta charset='utf-8' />
    <meta name='viewport' content='width=device-width, initial-scale=1.0' />
    <title>Password Changed</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        color: #333;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
      }
      .header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 30px;
        text-align: center;
        border-radius: 10px 10px 0 0;
      }
      .content {
        background: #f9f9f9;
        padding: 30px;
        border-radius: 0 0 10px 10px;
      }
      .success {
        background: #d4edda;
        border-left: 4px solid #28a745;
        padding: 15px;
        margin: 20px 0;
      }
      .footer {
        text-align: center;
        margin-top: 30px;
        color: #999;
        font-size: 12px;
      }
    </style>
  </head>
  <body>
    <div class='container'>
      <div class='header'>
        <h1>✓ Password Changed Successfully</h1>
      </div>
      <div class='content'>
        <p>Hi {{name}},</p>
        <div class='success'>
          <strong>Success!</strong>
          Your password has been changed successfully.
        </div>
        <p>If you did not make this change, please contact our support team
          immediately.</p>
        <p>For your security, we recommend:</p>
        <ul>
          <li>Use a strong, unique password</li>
          <li>Enable two-factor authentication if available</li>
          <li>Never share your password with anyone</li>
        </ul>
      </div>
      <div class='footer'>
        <p>&copy; 2026 Your Company. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>`;

export const WELCOME_EMAIL = `<html>
  <head>
    <meta charset='utf-8' />
    <meta name='viewport' content='width=device-width, initial-scale=1.0' />
    <title>Welcome!</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        color: #333;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
      }
      .header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 30px;
        text-align: center;
        border-radius: 10px 10px 0 0;
      }
      .content {
        background: #f9f9f9;
        padding: 30px;
        border-radius: 0 0 10px 10px;
      }
      .footer {
        text-align: center;
        margin-top: 30px;
        color: #999;
        font-size: 12px;
      }
    </style>
  </head>
  <body>
    <div class='container'>
      <div class='header'>
        <h1>🎉 Welcome Aboard!</h1>
      </div>
      <div class='content'>
        <p>Hi {{name}},</p>
        <p>Welcome to our platform! We're excited to have you on board.</p>
        <p>Your account has been successfully verified and you can now access
          all features.</p>
        <p>If you have any questions or need assistance, feel free to reach out
          to our support team.</p>
        <p>Happy exploring!</p>
      </div>
      <div class='footer'>
        <p>&copy; 2026 Your Company. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>`;
