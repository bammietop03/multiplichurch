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
        background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
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
        border: 2px dashed #14b8a6;
        border-radius: 8px;
        padding: 20px;
        text-align: center;
        margin: 20px 0;
      }
      .code {
        font-size: 32px;
        font-weight: bold;
        letter-spacing: 8px;
        color: #0d9488;
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
        background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
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
        background: #14b8a6;
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
        <p style='word-break: break-all; color: #0d9488;'>{{url}}</p>
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
        background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
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
        background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
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

export const CHURCH_INVITE_EMAIL = `<html>
  <head>
    <meta charset='utf-8' />
    <meta name='viewport' content='width=device-width, initial-scale=1.0' />
    <title>You've Been Invited to a Church</title>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
      .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
      .button { display: inline-block; padding: 14px 36px; background: #14b8a6; color: white; text-decoration: none; border-radius: 6px; margin: 24px 0; font-size: 16px; }
      .footer { text-align: center; margin-top: 30px; color: #999; font-size: 12px; }
      .info-box { background: #e6f7f6; border-left: 4px solid #14b8a6; padding: 15px; margin: 20px 0; border-radius: 0 6px 6px 0; }
    </style>
  </head>
  <body>
    <div class='container'>
      <div class='header'>
        <h1>You're Invited!</h1>
      </div>
      <div class='content'>
        <p>Hi there,</p>
        <p>You have been invited to join <strong>{{churchName}}</strong> as a <strong>{{role}}</strong>.</p>
        <div class='info-box'>
          <strong>Church:</strong> {{churchName}}<br/>
          <strong>Role:</strong> {{role}}<br/>
          <strong>Expires:</strong> 7 days from now
        </div>
        <p>Click the button below to accept the invitation:</p>
        <div style='text-align: center;'>
          <a href='{{url}}' class='button'>Accept Invitation</a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style='word-break: break-all; color: #0d9488;'>{{url}}</p>
        <p style='color: #666; font-size: 14px;'>If you don't have an account yet, you'll be prompted to create one before accepting the invitation. This invitation will expire in 7 days.</p>
        <p style='color: #999; font-size: 12px;'>If you did not expect this invitation, you can safely ignore this email.</p>
      </div>
      <div class='footer'>
        <p>&copy; 2026 MultipliChurch. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>`;

export const CHURCH_WELCOME_CREDENTIALS_EMAIL = `<html>
  <head>
    <meta charset='utf-8' />
    <meta name='viewport' content='width=device-width, initial-scale=1.0' />
    <title>You've Been Added to a Church</title>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
      .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
      .credentials-box { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; }
      .credential-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
      .credential-row:last-child { border-bottom: none; }
      .credential-label { color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
      .credential-value { font-family: 'Courier New', monospace; font-size: 15px; font-weight: bold; color: #0f172a; }
      .button { display: inline-block; padding: 14px 36px; background: #14b8a6; color: white; text-decoration: none; border-radius: 6px; margin: 24px 0; font-size: 16px; }
      .warning-box { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 0 6px 6px 0; font-size: 14px; }
      .footer { text-align: center; margin-top: 30px; color: #999; font-size: 12px; }
    </style>
  </head>
  <body>
    <div class='container'>
      <div class='header'>
        <h1>Welcome to {{churchName}}!</h1>
      </div>
      <div class='content'>
        <p>Hi {{name}},</p>
        <p>You have been added to <strong>{{churchName}}</strong> as a <strong>{{role}}</strong> by the church admin.</p>
        <p>An account has been created for you. Here are your login credentials:</p>
        <div class='credentials-box'>
          <div class='credential-row'>
            <span class='credential-label'>Email</span>
            <span class='credential-value'>{{email}}</span>
          </div>
          <div class='credential-row'>
            <span class='credential-label'>Password</span>
            <span class='credential-value'>{{password}}</span>
          </div>
        </div>
        <div class='warning-box'>
          <strong>⚠️ Important:</strong> Please log in and change your password immediately. Do not share these credentials with anyone.
        </div>
        <div style='text-align: center;'>
          <a href='{{loginUrl}}' class='button'>Log In Now</a>
        </div>
        <p style='color: #666; font-size: 14px;'>Or copy and paste this link into your browser: <span style='color: #0d9488;'>{{loginUrl}}</span></p>
        <p style='color: #999; font-size: 12px;'>If you did not expect this, please contact the church admin.</p>
      </div>
      <div class='footer'>
        <p>&copy; 2026 MultipliChurch. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>`;
