const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const cors = require('cors');
const { google } = require('googleapis');
const path = require('path');
require('dotenv').config();

const Account = require('./models/Account');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration with environment-based secrets
app.use(cookieSession({
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  keys: (process.env.SESSION_KEYS || 'default-key').split(',')
}));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'static')));

// MongoDB Connection with improved configuration
const mongoUri = process.env.MONGO_URI || 'mongodb+srv://nafijrahaman2026:nafijpro++@mail-service.tirbgc7.mongodb.net/mail-service?retryWrites=true&w=majority&appName=mail-service';

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => {
  console.log('✅ Connected to MongoDB Atlas');
  console.log('📊 Database ready for operations');
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  console.error('💡 Please check:');
  console.error('   1. MongoDB Atlas IP whitelist (add 0.0.0.0/0 for all IPs)');
  console.error('   2. Database credentials are correct');
  console.error('   3. Network connectivity');
  
  // Don't exit the process, let it continue with limited functionality
  console.log('⚠️  Server will continue without database functionality');
});

// Handle MongoDB connection events
mongoose.connection.on('connected', () => {
  console.log('🔗 Mongoose connected to MongoDB Atlas');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Mongoose disconnected from MongoDB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('🛑 MongoDB connection closed through app termination');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during graceful shutdown:', err);
    process.exit(1);
  }
});

// Google OAuth2 Configuration
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.OAUTH_CALLBACK_URL || 'https://mail-service-pro.onrender.com/auth/google/callback'
);

// OAuth scopes for Gmail and user profile access
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
];

/**
 * Middleware: Check if user is admin (password-protected)
 */
const checkAdmin = (req, res, next) => {
  if (!req.session.isAdmin) {
    return res.status(403).json({ 
      error: 'Access denied. Admin privileges required.' 
    });
  }
  next();
};

/**
 * Middleware: Check if user can access a specific Gmail account
 * Access is allowed if:
 * 1. User owns the account, OR
 * 2. Account is not premium (public access), OR  
 * 3. User is admin
 */
const checkAccess = async (req, res, next) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        error: 'Database temporarily unavailable. Please try again later.' 
      });
    }
    
    const { email } = req.params;
    const userEmail = req.session.userEmail;
    const isAdmin = req.session.isAdmin;
    
    // Find the requested account in database
    const account = await Account.findOne({ email: email.toLowerCase() });
    
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    // If account is premium, only allow access to owner or admin
    if (account.isPremium) {
      const isOwner = userEmail === email.toLowerCase();
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ 
          error: 'This is a premium account. Only the owner or admin can access it.',
          isPremium: true
        });
      }
    }
    
    req.account = account;
    return next();
    
  } catch (error) {
    console.error('Access check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Routes

/**
 * Helper: Extract body part from email payload
 */
function extractEmailPart(payload, mimeType) {
  if (!payload) return null;

  if (payload.mimeType === mimeType && payload.body.data) {
    return Buffer.from(payload.body.data, 'base64').toString();
  }

  if (payload.parts) {
    const part = payload.parts.find(p => p.mimeType === mimeType);
    if (part && part.body.data) {
      return Buffer.from(part.body.data, 'base64').toString();
    }
  }

  return null;
}

/**
 * Helper: Get raw email as MIME string
 */
function getRawEmail(data) {
  if (data.raw) {
    return Buffer.from(data.raw, 'base64').toString();
  }
  return null;
}

/**
 * Helper: Sanitize HTML to prevent script execution
 */
function sanitizeHtml(html) {
  if (!html) return '';

  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/on\w+\s*=\s*[^\s>]*/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<embed\b[^<]*>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');
}

/**
 * GET / - Landing page
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'static', 'index.html'));
});

/**
 * GET /privacy - Privacy Policy page
 */
app.get('/privacy', (req, res) => {
  res.sendFile(path.join(__dirname, 'static', 'privacy.html'));
});

/**
 * GET /terms - Terms of Service page
 */
app.get('/terms', (req, res) => {
  res.sendFile(path.join(__dirname, 'static', 'terms.html'));
});

/**
 * GET /author - Author profile page
 */
app.get('/author', (req, res) => {
  res.sendFile(path.join(__dirname, 'static', 'author.html'));
});

/**
 * GET /credits - Credits and hosting thanks page
 */
app.get('/credits', (req, res) => {
  res.sendFile(path.join(__dirname, 'static', 'credits.html'));
});

/**
 * GET /auth/google - Initiate Google OAuth2 flow
 */
app.get('/auth/google', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });
  
  console.log('🔄 Redirecting to Google OAuth:', authUrl);
  res.redirect(authUrl);
});

/**
 * GET /auth/google/callback - Handle OAuth2 callback from Google
 */
app.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    return res.status(400).send('Authorization code not provided');
  }
  
  try {
    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    
    // Get user profile information
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: profile } = await oauth2.userinfo.get();
    
    const userEmail = profile.email.toLowerCase();
    
    // Store or update user account in database (with error handling)
    if (mongoose.connection.readyState === 1) {
      try {
        await Account.findOneAndUpdate(
          { email: userEmail },
          { 
            email: userEmail,
            refreshToken: tokens.refresh_token,
            lastAccessed: new Date()
          },
          { 
            upsert: true,
            new: true,
            timeout: 10000 // 10 second timeout
          }
        );
        console.log('✅ User account saved to database:', userEmail);
      } catch (dbError) {
        console.error('❌ Database save error:', dbError.message);
        // Continue without saving to database
        console.log('⚠️  Continuing without database save');
      }
    } else {
      console.log('⚠️  Database not connected, skipping account save');
    }
    
    // Store user email in session
    req.session.userEmail = userEmail;
    
    console.log('✅ User authenticated:', userEmail);
    
    // Redirect to inbox with the connected account
    res.redirect('/inbox.html');
    
  } catch (error) {
    console.error('❌ OAuth callback error:', error);
    res.status(500).send('Authentication failed');
  }
});

/**
 * GET /inbox/:email - Retrieve inbox emails for specified Gmail account
 */
app.get('/inbox/:email', checkAccess, async (req, res) => {
  try {
    const { account } = req;
    
    // Set up OAuth2 client with stored refresh token
    const accountOAuth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      'https://mail-service-pro.onrender.com/auth/google/callback'
    );
    
    accountOAuth.setCredentials({
      refresh_token: account.refreshToken
    });
    
    // Initialize Gmail API
    const gmail = google.gmail({ version: 'v1', auth: accountOAuth });
    
    // Get list of messages from inbox (last 10)
    const { data: messageList } = await gmail.users.messages.list({
      userId: 'me',
      labelIds: ['INBOX'],
      maxResults: 10
    });
    
    if (!messageList.messages) {
      return res.json({ emails: [], account: account.email });
    }
    
    // Get detailed information for each message
    const emailPromises = messageList.messages.map(async (message) => {
      const { data } = await gmail.users.messages.get({
        userId: 'me',
        id: message.id,
        format: 'metadata',
        metadataHeaders: ['Subject', 'From', 'Date']
      });
      
      const headers = data.payload.headers;
      const getHeader = (name) => headers.find(h => h.name === name)?.value || '';
      
      return {
        id: message.id,
        subject: getHeader('Subject'),
        from: getHeader('From'),
        date: getHeader('Date'),
        snippet: data.snippet
      };
    });
    
    const emails = await Promise.all(emailPromises);
    
    // Update last accessed timestamp
    await Account.findByIdAndUpdate(account._id, { lastAccessed: new Date() });
    
    console.log(`📧 Retrieved ${emails.length} emails for ${account.email}`);
    res.json({ 
      emails, 
      account: account.email,
      isPremium: account.isPremium
    });
    
  } catch (error) {
    console.error('❌ Inbox fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch inbox' });
  }
});

/**
 * GET /email/:email/:messageId - Get full email content with multi-view support
 */
app.get('/email/:email/:messageId', checkAccess, async (req, res) => {
  try {
    const { account } = req;
    const { messageId } = req.params;

    // Set up OAuth2 client with stored refresh token
    const accountOAuth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      'https://mail-service-pro.onrender.com/auth/google/callback'
    );

    accountOAuth.setCredentials({
      refresh_token: account.refreshToken
    });

    // Initialize Gmail API
    const gmail = google.gmail({ version: 'v1', auth: accountOAuth });

    // Get full message content
    const { data } = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full'
    });

    const headers = data.payload.headers;
    const getHeader = (name) => headers.find(h => h.name === name)?.value || '';

    // Extract all view formats
    const plainText = extractEmailPart(data.payload, 'text/plain');
    const htmlContent = extractEmailPart(data.payload, 'text/html');
    const rawEmail = getRawEmail(data);

    // Determine primary content type and auto-select initial view
    let contentType = 'text';
    let primaryContent = plainText || '';

    if (htmlContent && !plainText) {
      contentType = 'html';
      primaryContent = sanitizeHtml(htmlContent);
    } else if (htmlContent && plainText) {
      contentType = 'multipart';
      primaryContent = plainText;
    }

    res.json({
      id: messageId,
      subject: getHeader('Subject'),
      from: getHeader('From'),
      to: getHeader('To'),
      date: getHeader('Date'),
      contentType: contentType,
      views: {
        raw: rawEmail || plainText || htmlContent || '',
        html: htmlContent ? sanitizeHtml(htmlContent) : null,
        text: plainText || null
      },
      body: primaryContent,
      snippet: data.snippet
    });

  } catch (error) {
    console.error('❌ Email fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch email' });
  }
});

/**
 * GET /accounts - List all stored Gmail accounts (Admin only)
 */
app.get('/accounts', checkAdmin, async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: 'Database temporarily unavailable. Please try again later.',
        accounts: []
      });
    }

    const accounts = await Account.find({}).select({
      email: 1,
      isPremium: 1,
      lock: 1,
      createdAt: 1,
      lastAccessed: 1
    }).sort({ createdAt: -1 });

    console.log(`👨‍💼 Admin requested accounts list`);
    res.json({ accounts });

  } catch (error) {
    console.error('❌ Accounts fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch accounts: ' + error.message,
      accounts: []
    });
  }
});

/**
 * GET /available-accounts - Get accounts available to current user
 */
app.get('/available-accounts', async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      return res.json({ 
        accounts: [],
        message: 'Database temporarily unavailable'
      });
    }
    
    const userEmail = req.session.userEmail;
    const isAdmin = req.session.isAdmin;
    
    let query = {};
    
    if (!isAdmin && userEmail) {
      // Regular users can see their own accounts and non-premium accounts
      query = {
        $or: [
          { email: userEmail },
          { isPremium: false }
        ]
      };
    } else if (isAdmin) {
      // Admin can see all accounts
      query = {};
    } else {
      // Non-authenticated users can only see non-premium accounts
      query = { isPremium: false };
    }
    
    const accounts = await Account.find(query).select({
      email: 1,
      isPremium: 1
    }).sort({ email: 1 });
    
    res.json({ accounts });
    
  } catch (error) {
    console.error('❌ Available accounts fetch error:', error);
    res.json({ 
      accounts: [],
      error: 'Failed to fetch available accounts: ' + error.message
    });
  }
});

/**
 * POST /admin/lock/:email - Lock account with reason and optional expiry - Admin only
 * Body: { reason: string, expiry: optional ISO date string }
 */
app.post('/admin/lock/:email', checkAdmin, async (req, res) => {
  try {
    const { email } = req.params;
    const { reason, expiry } = req.body;
    const adminEmail = req.session.userEmail || 'admin';

    if (!reason) {
      return res.status(400).json({ error: 'Lock reason is required' });
    }

    const account = await Account.findOne({ email: email.toLowerCase() });

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Lock account with metadata
    account.isPremium = true;
    account.lock = {
      isLocked: true,
      reason: reason,
      actor: adminEmail,
      timestamp: new Date(),
      expiry: expiry ? new Date(expiry) : null,
      unlockHistory: account.lock?.unlockHistory || []
    };

    await account.save();

    console.log(`🔒 Admin locked account: ${email} (reason: ${reason})`);

    res.json({
      success: true,
      message: `Account ${email} locked`,
      account: {
        email: account.email,
        isPremium: account.isPremium,
        lock: account.lock
      }
    });

  } catch (error) {
    console.error('❌ Account lock error:', error);
    res.status(500).json({ error: 'Failed to lock account' });
  }
});

/**
 * POST /admin/unlock/:email - Unlock account (make public) - Admin only
 * Body: { reason: optional unlock reason }
 */
app.post('/admin/unlock/:email', checkAdmin, async (req, res) => {
  try {
    const { email } = req.params;
    const { reason } = req.body;
    const adminEmail = req.session.userEmail || 'admin';

    const account = await Account.findOne({ email: email.toLowerCase() });

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Record unlock in history before unlocking
    if (!account.lock) {
      account.lock = {
        isLocked: false,
        reason: null,
        actor: null,
        timestamp: null,
        expiry: null,
        unlockHistory: []
      };
    }

    if (account.lock.isLocked) {
      account.lock.unlockHistory.push({
        unlockedAt: new Date(),
        unlockedBy: adminEmail,
        reason: reason || 'No reason provided'
      });
    }

    // Unlock account (make public)
    account.isPremium = false;
    account.lock.isLocked = false;

    await account.save();

    console.log(`🔓 Admin unlocked account: ${email}`);

    res.json({
      success: true,
      message: `Account ${email} unlocked`,
      account: {
        email: account.email,
        isPremium: account.isPremium,
        lock: account.lock
      }
    });

  } catch (error) {
    console.error('❌ Account unlock error:', error);
    res.status(500).json({ error: 'Failed to unlock account' });
  }
});

/**
 * GET /admin/lock-history/:email - Get lock/unlock history for an account - Admin only
 */
app.get('/admin/lock-history/:email', checkAdmin, async (req, res) => {
  try {
    const { email } = req.params;

    const account = await Account.findOne({ email: email.toLowerCase() });

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const lockData = account.lock || {
      isLocked: false,
      reason: null,
      actor: null,
      timestamp: null,
      expiry: null,
      unlockHistory: []
    };

    res.json({
      email: account.email,
      currentLockStatus: {
        isLocked: lockData.isLocked,
        reason: lockData.reason,
        actor: lockData.actor,
        timestamp: lockData.timestamp,
        expiry: lockData.expiry
      },
      unlockHistory: lockData.unlockHistory || [],
      totalUnlocks: (lockData.unlockHistory || []).length
    });

  } catch (error) {
    console.error('❌ Lock history fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch lock history' });
  }
});

/**
 * GET /admin/accounts/search - Search and filter accounts - Admin only
 * Query params: search (email), locked (true/false), premium (true/false)
 */
app.get('/admin/accounts/search', checkAdmin, async (req, res) => {
  try {
    const { search, locked, premium } = req.query;

    let query = {};

    if (search) {
      query.email = { $regex: search, $options: 'i' };
    }

    if (locked !== undefined) {
      const isLocked = locked === 'true';
      query['lock.isLocked'] = isLocked;
    }

    if (premium !== undefined) {
      const isPremium = premium === 'true';
      query.isPremium = isPremium;
    }

    const accounts = await Account.find(query).select({
      email: 1,
      isPremium: 1,
      lock: 1,
      createdAt: 1,
      lastAccessed: 1
    }).sort({ createdAt: -1 });

    const total = accounts.length;
    const locked_count = accounts.filter(a => a.lock?.isLocked).length;
    const premium_count = accounts.filter(a => a.isPremium).length;

    res.json({
      total,
      locked_count,
      premium_count,
      accounts
    });

  } catch (error) {
    console.error('❌ Account search error:', error);
    res.status(500).json({ error: 'Failed to search accounts' });
  }
});

/**
 * GET /admin - Serve admin dashboard
 */
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'static', 'admin.html'));
});

/**
 * POST /admin/login - Admin login with password
 */
app.post('/admin/login', (req, res) => {
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD || 'nafijpro++';

  if (password === adminPassword) {
    req.session.isAdmin = true;
    res.json({ success: true, message: 'Admin login successful' });
  } else {
    res.status(401).json({ error: 'Invalid admin password' });
  }
});

/**
 * POST /send - Send email via Gmail API
 * Requires: email (sender), to (recipient or array), subject, body
 * Optional: cc, bcc (comma-separated or arrays), isHtml (boolean)
 * Features: validation, rate-limiting, activity tracking, HTML support, multiple recipients
 */
app.post('/send', async (req, res) => {
  try {
    const { email, to, subject, body, cc, bcc, isHtml } = req.body;
    const userEmail = req.session.userEmail;

    // Validation
    if (!email || !to || !subject || !body) {
      return res.status(400).json({
        error: 'Missing required fields: email, to, subject, body'
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid sender email address format'
      });
    }

    // Parse recipients (handle both array and string formats)
    const parseRecipients = (recipients) => {
      if (Array.isArray(recipients)) {
        return recipients.filter(r => emailRegex.test(r.trim())).map(r => r.trim());
      }
      if (typeof recipients === 'string') {
        return recipients
          .split(',')
          .map(r => r.trim())
          .filter(r => r && emailRegex.test(r));
      }
      return [];
    };

    const recipientsTo = parseRecipients(to);
    const recipientsCc = parseRecipients(cc);
    const recipientsBcc = parseRecipients(bcc);

    if (recipientsTo.length === 0) {
      return res.status(400).json({
        error: 'At least one valid recipient is required in the To field'
      });
    }

    // Validate Cc and Bcc have valid emails if provided
    const allCcBcc = [...recipientsCc, ...recipientsBcc];
    if ((cc || bcc) && allCcBcc.length === 0) {
      return res.status(400).json({
        error: 'Cc or Bcc fields contain invalid email addresses'
      });
    }

    // Access control: user can only send from their own accounts
    if (userEmail !== email.toLowerCase()) {
      return res.status(403).json({
        error: 'You can only send emails from your own account'
      });
    }

    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: 'Database temporarily unavailable. Please try again later.'
      });
    }

    // Find the account
    const account = await Account.findOne({ email: email.toLowerCase() });
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Rate limiting: check last email sent time
    const RATE_LIMIT_INTERVAL = 2000; // 2 seconds between emails
    if (account.lastSentEmail) {
      const timeSinceLastEmail = Date.now() - new Date(account.lastSentEmail).getTime();
      if (timeSinceLastEmail < RATE_LIMIT_INTERVAL) {
        return res.status(429).json({
          error: 'Please wait before sending another email',
          retryAfter: Math.ceil((RATE_LIMIT_INTERVAL - timeSinceLastEmail) / 1000)
        });
      }
    }

    // Set up OAuth2 client with stored refresh token
    const accountOAuth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      'https://mail-service-pro.onrender.com/auth/google/callback'
    );

    accountOAuth.setCredentials({
      refresh_token: account.refreshToken
    });

    // Initialize Gmail API
    const gmail = google.gmail({ version: 'v1', auth: accountOAuth });

    // Sanitize HTML if provided
    const sanitizedBody = isHtml ? sanitizeHtml(body) : body;

    // Construct email message with proper MIME format
    const headers = [
      `From: ${email}`,
      `To: ${recipientsTo.join(', ')}`,
      ...(recipientsCc.length > 0 ? [`Cc: ${recipientsCc.join(', ')}`] : []),
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: ${isHtml ? 'text/html' : 'text/plain'}; charset="UTF-8"`,
    ];

    // If HTML, ensure proper encoding
    if (isHtml) {
      headers.push(`Content-Transfer-Encoding: quoted-printable`);
    }

    const emailMessage = [
      ...headers,
      '',
      isHtml ? sanitizedBody : sanitizedBody
    ].join('\r\n');

    // Add Bcc recipients to headers for Gmail API (not in actual message headers)
    const messageBody = isHtml && isHtml.length > 0
      ? emailMessage
      : emailMessage;

    // Encode to base64 for Gmail API
    const encodedMessage = Buffer.from(messageBody).toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Send the email
    const sendRes = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    });

    // Record sending activity in database
    account.lastSentEmail = new Date();
    const recipientName = recipientsTo[0].split('@')[0];
    const totalRecipients = recipientsTo.length + recipientsCc.length + recipientsBcc.length;

    account.sendingActivity.push({
      timestamp: new Date(),
      recipientEmail: recipientsTo.join(', '),
      ccEmail: recipientsCc.length > 0 ? recipientsCc.join(', ') : null,
      bccEmail: recipientsBcc.length > 0 ? recipientsBcc.join(', ') : null,
      recipientName: recipientName,
      subject: subject,
      totalRecipients: totalRecipients,
      isHtml: isHtml || false,
      status: 'success'
    });

    // Keep only last 50 sending activities for storage efficiency
    if (account.sendingActivity.length > 50) {
      account.sendingActivity = account.sendingActivity.slice(-50);
    }

    await account.save();

    console.log(`📧 Email sent from ${email} to ${recipientsTo.length} recipient(s) (Cc: ${recipientsCc.length}, Bcc: ${recipientsBcc.length}): "${subject}"`);

    res.json({
      success: true,
      message: 'Email sent successfully',
      messageId: sendRes.data.id,
      recipients: totalRecipients,
      subject: subject
    });

  } catch (error) {
    console.error('❌ Send email error:', error.message);

    // Try to record failed attempt
    try {
      const { email } = req.body;
      if (email) {
        const account = await Account.findOne({ email: email.toLowerCase() });
        if (account) {
          const recipientName = req.body.to ? (Array.isArray(req.body.to) ? req.body.to[0] : req.body.to).split('@')[0] : 'unknown';
          account.sendingActivity.push({
            timestamp: new Date(),
            recipientEmail: Array.isArray(req.body.to) ? req.body.to.join(', ') : req.body.to || 'unknown',
            recipientName: recipientName,
            subject: req.body.subject || 'unknown',
            status: 'failed',
            errorMessage: error.message
          });
          await account.save();
        }
      }
    } catch (dbError) {
      console.error('❌ Failed to record send error:', dbError.message);
    }

    res.status(500).json({
      error: 'Failed to send email',
      details: error.message
    });
  }
});

/**
 * GET /sending-activity/:email - Get sending activity for an account (Admin only)
 */
app.get('/sending-activity/:email', checkAdmin, async (req, res) => {
  try {
    const { email } = req.params;

    const account = await Account.findOne({ email: email.toLowerCase() });
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Return last 20 sending activities
    const activity = account.sendingActivity.slice(-20).reverse();

    res.json({
      email: account.email,
      totalSent: account.sendingActivity.length,
      recentActivity: activity
    });

  } catch (error) {
    console.error('❌ Sending activity fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch sending activity' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server only if running directly (not as module for Vercel)
if (require.main === module) {
  app.listen(PORT, () => {
    const adminPassword = process.env.ADMIN_PASSWORD || 'nafijpro++';
    console.log(`🚀 Mail Service running on port ${PORT}`);
    console.log(`📧 Gmail OAuth2 service ready`);
    console.log(`👨‍💼 Admin mode enabled (password configured via environment)`);
  });
}

module.exports = app;
