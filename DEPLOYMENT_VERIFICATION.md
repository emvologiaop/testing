# MailPro Nafij - Deployment Verification Checklist

**Project**: MailPro Nafij Gmail OAuth Service
**Deployment Target**: Vercel
**Primary Domain**: mailpro.nafij.me
**Database**: MongoDB Atlas
**Date**: April 25, 2026

---

## Pre-Deployment Verification

### Configuration Files

- [ ] `package.json` exists with Node.js >=18.0.0 requirement
- [ ] `vercel.json` created with correct configuration
- [ ] `.gitignore` includes `.env`, `.env.local`, `.vercel/`, `node_modules/`
- [ ] No `.env` file committed to repository
- [ ] `env.example` contains all required variables (11 total)

### Code Quality

- [ ] No hardcoded secrets in any source files
- [ ] No API keys, passwords, or tokens in code
- [ ] No console.log statements exposing sensitive data
- [ ] Error handling doesn't expose stack traces
- [ ] Mongoose connection uses environment variables
- [ ] OAuth client uses environment variables

### Dependencies

- [ ] All dependencies in package.json:
  - [ ] express (latest)
  - [ ] mongoose (>=8.0.3)
  - [ ] googleapis (>=131.0.0)
  - [ ] cookie-session (>=2.0.0)
  - [ ] cors (>=2.8.5)
  - [ ] dotenv (>=16.3.1)
- [ ] No unused dependencies
- [ ] package-lock.json is current and committed
- [ ] npm audit shows no critical vulnerabilities

---

## Environment Variables Verification

### Required Variables (11 Total)

| Variable | Status | Value Format | Verified |
|----------|--------|--------------|----------|
| GOOGLE_CLIENT_ID | ✓ Required | `***.apps.googleusercontent.com` | [ ] |
| GOOGLE_CLIENT_SECRET | ✓ Required | `GOCSPX-*` | [ ] |
| OAUTH_CALLBACK_URL | ✓ Required | `https://mailpro.nafij.me/auth/google/callback` | [ ] |
| MONGO_URI | ✓ Required | `mongodb+srv://user:pass@cluster.mongodb.net/mail-service` | [ ] |
| SESSION_KEYS | ✓ Required | `key1,key2,key3` (comma-separated) | [ ] |
| ADMIN_PASSWORD | ✓ Required | Minimum 16 chars, mixed case, numbers, symbols | [ ] |
| NODE_ENV | ✓ Required | `production` | [ ] |
| CANONICAL_DOMAIN | ✓ Required | `mailpro.nafij.me` | [ ] |
| SERVICE_NAME | ✓ Required | `Mail Service` | [ ] |
| SUPPORT_EMAIL | ✓ Required | `support@nafijrahaman.me` | [ ] |
| HOSTING_CREDIT | ✓ Required | `nafijrahaman.me` | [ ] |

### Variable Validation

- [ ] GOOGLE_CLIENT_ID matches Google Cloud project
- [ ] GOOGLE_CLIENT_SECRET from same OAuth credentials
- [ ] OAUTH_CALLBACK_URL matches authorized URI in Google console
- [ ] MONGO_URI is valid MongoDB Atlas connection string
- [ ] MONGO_URI includes `retryWrites=true&w=majority`
- [ ] SESSION_KEYS contains at least 1 key (preferably 3 for rotation)
- [ ] ADMIN_PASSWORD is strong (16+ chars with mixed case, numbers, symbols)
- [ ] NODE_ENV is exactly `production`
- [ ] CANONICAL_DOMAIN does not include protocol or path
- [ ] SUPPORT_EMAIL is reachable and monitored
- [ ] HOSTING_CREDIT references correct entity

### Vercel Dashboard Configuration

- [ ] All 11 variables added in "Settings > Environment Variables"
- [ ] Each variable set for Production: ✓
- [ ] Each variable set for Preview: ✓
- [ ] Each variable set for Development: ✓
- [ ] No variables accidentally exposed in logs
- [ ] Variables properly masked (showing *** for secrets)

---

## OAuth Configuration Verification

### Google Cloud Project

- [ ] Project created: `MailPro Nafij`
- [ ] Gmail API enabled
- [ ] OAuth 2.0 Client ID created
- [ ] Client type: "Web application"
- [ ] Client credentials downloaded and stored securely

### Authorized Redirect URIs

- [ ] https://mailpro.nafij.me/auth/google/callback ✓
- [ ] https://mailpro.nafijrahaman.me/auth/google/callback ✓
- [ ] https://mailpro.vercel.app/auth/google/callback ✓
- [ ] http://localhost:3000/auth/google/callback ✓ (for testing)

### Authorized JavaScript Origins

- [ ] https://mailpro.nafij.me ✓
- [ ] https://mailpro.nafijrahaman.me ✓
- [ ] https://mailpro.vercel.app ✓
- [ ] http://localhost:3000 ✓ (for testing)

### OAuth Consent Screen

- [ ] App name: "MailPro Nafij"
- [ ] Logo/favicon provided
- [ ] User support email: support@nafijrahaman.me
- [ ] Developer contact: support@nafijrahaman.me
- [ ] Privacy policy URL provided (if published)
- [ ] Terms of service URL provided (if published)

### OAuth Scopes

All four required scopes configured and authorized:

| Scope | Purpose | Configured |
|-------|---------|-----------|
| `gmail.readonly` | Read emails and metadata | [ ] |
| `gmail.send` | Send emails on behalf of user | [ ] |
| `userinfo.email` | Access user email address | [ ] |
| `userinfo.profile` | Access user profile information | [ ] |

- [ ] Scopes appear in Google consent screen
- [ ] Scopes are non-sensitive (can be auto-approved)
- [ ] Test users added if app not yet verified

---

## MongoDB Atlas Verification

### Cluster Configuration

- [ ] Cluster created: `mail-service`
- [ ] Cluster tier: M0 Free (or higher for production)
- [ ] Provider: AWS
- [ ] Region: Appropriate geographic location
- [ ] Cluster status: "Active" and running

### Database Structure

- [ ] Database: `mail-service` exists
- [ ] Collection: `accounts` exists
- [ ] Collection: `sendingActivity` (optional, embedded in Account)

### Database User & Authentication

- [ ] Database user created: `mailpro_user`
- [ ] User has appropriate permissions
- [ ] Password is strong and unique
- [ ] Connection string obtained and verified

### Network Access

- [ ] IP whitelist includes: `0.0.0.0/0` (for Vercel)
- [ ] IP whitelist description: "Vercel deployment"
- [ ] Whitelist updated (changes can take 5 minutes)
- [ ] Local development IP also whitelisted (if testing locally)

### Database Indexes

Verify these indexes exist in MongoDB Atlas or created by Mongoose:

| Index | Unique | Status |
|-------|--------|--------|
| `email` | Yes | [ ] |
| `lock.isLocked` | No | [ ] |
| `lock.timestamp` | No | [ ] |
| `createdAt` | No | [ ] |
| `sendingActivity.timestamp` | No | [ ] |

- [ ] Indexes created automatically by Mongoose on first run
- [ ] Or manually verified in MongoDB Atlas UI
- [ ] Index performance monitoring visible in Atlas dashboard

### Backup Configuration

- [ ] Cluster tier M2 or higher (for automatic backups)
- [ ] Or manual backup strategy documented
- [ ] Backup retention: at least 7 days

### Connection Testing

- [ ] MongoDB URI connects successfully from local machine
- [ ] MongoDB URI connects successfully from Vercel deployment
- [ ] Connection pooling configured correctly
- [ ] Connection timeout is appropriate (5000ms default OK)

---

## CORS Configuration Verification

### Express CORS Setup

In `server.js`:
```javascript
app.use(cors({
  origin: true,
  credentials: true
}));
```

- [ ] CORS middleware enabled
- [ ] Origin set to `true` (allows all origins) OR specific domains
- [ ] Credentials set to `true`
- [ ] Headers properly passed through

### CORS Preflight Testing

```bash
curl -H "Origin: https://mailpro.nafij.me" \
  -H "Access-Control-Request-Method: GET" \
  -X OPTIONS https://mailpro.nafij.me/available-accounts -v
```

Expected response headers:
- [ ] `access-control-allow-origin: *` OR specific origin
- [ ] `access-control-allow-credentials: true`
- [ ] `access-control-allow-methods: GET, POST, OPTIONS`
- [ ] `access-control-allow-headers: Content-Type`

### Cross-Origin Cookie Handling

- [ ] SameSite attribute configured (if applicable)
- [ ] Cookies accessible from all authorized domains
- [ ] Cookie session expires after 24 hours
- [ ] Session keys properly configured

---

## API Endpoints Verification

### Health Check Endpoints

| Endpoint | Method | Expected Response | Status |
|----------|--------|------------------|--------|
| `/` | GET | HTML home page | [ ] |
| `/privacy` | GET | HTML privacy page | [ ] |
| `/terms` | GET | HTML terms page | [ ] |
| `/author` | GET | HTML author page | [ ] |
| `/credits` | GET | HTML credits page | [ ] |

Testing:
```bash
# Test home page
curl https://mailpro.nafij.me/ | grep -q "MailPro" && echo "✓"

# Test other pages
curl https://mailpro.nafij.me/privacy | grep -q "Privacy" && echo "✓"
curl https://mailpro.nafij.me/terms | grep -q "Terms" && echo "✓"
```

- [ ] All pages return HTTP 200
- [ ] All pages contain expected content
- [ ] All pages have proper HTML structure
- [ ] All pages include canonical meta tag

### OAuth Endpoints

| Endpoint | Method | Expected Behavior | Status |
|----------|--------|------------------|--------|
| `/auth/google` | GET | Redirects to Google login | [ ] |
| `/auth/google/callback` | GET | Processes OAuth response | [ ] |

Testing:
```bash
# Test OAuth redirect
curl -L https://mailpro.nafij.me/auth/google -H "User-Agent: Mozilla" | grep -q "accounts.google.com" && echo "✓ OAuth redirect works"
```

- [ ] Redirect to Google login successful
- [ ] Callback URL is exact match in Google Console
- [ ] Error handling for failed OAuth
- [ ] Session created after successful auth

### Account Endpoints

| Endpoint | Method | Auth Required | Expected Behavior | Status |
|----------|--------|---------------|------------------|--------|
| `/available-accounts` | GET | None | Returns list of public accounts | [ ] |
| `/inbox/:email` | GET | Account owner | Returns emails for account | [ ] |
| `/email/:email/:messageId` | GET | Account owner | Returns full email | [ ] |
| `/accounts` | GET | Admin | Returns all accounts | [ ] |

Testing:
```bash
# Public endpoint (no auth)
curl https://mailpro.nafij.me/available-accounts | jq '.' && echo "✓ Public endpoint works"

# Admin endpoint (requires auth)
curl https://mailpro.nafij.me/accounts \
  -H "Cookie: isAdmin=true" | grep -q "error" && echo "Need valid session"
```

- [ ] Public endpoints accessible without authentication
- [ ] Protected endpoints require proper auth
- [ ] Error responses are descriptive but don't leak info
- [ ] Rate limiting (if implemented) working

### Admin Endpoints

| Endpoint | Method | Status |
|----------|--------|--------|
| `/admin` | GET | [ ] Returns admin page |
| `/admin/login` | POST | [ ] Validates password |
| `/admin/lock/:email` | POST | [ ] Locks account |
| `/admin/unlock/:email` | POST | [ ] Unlocks account |
| `/admin/lock-history/:email` | GET | [ ] Shows audit trail |
| `/admin/accounts/search` | GET | [ ] Searches accounts |

Testing:
```bash
# Login endpoint
curl -X POST https://mailpro.nafij.me/admin/login \
  -H "Content-Type: application/json" \
  -d '{"password":"your_admin_password"}' | jq '.'
```

- [ ] Admin login accepts password from environment
- [ ] Admin endpoints restricted to authenticated admins
- [ ] Lock/unlock operations logged
- [ ] Audit history accessible and accurate

### Email Sending Endpoint

| Endpoint | Method | Expected Behavior | Status |
|----------|--------|------------------|--------|
| `/send` | POST | Sends email via Gmail API | [ ] |
| `/sending-activity/:email` | GET | Shows sending history | [ ] |

Testing:
```bash
# Mock send request
curl -X POST https://mailpro.nafij.me/send \
  -H "Content-Type: application/json" \
  -H "Cookie: session_data" \
  -d '{"to":"test@example.com","subject":"Test","body":"Test"}' | jq '.'
```

- [ ] Send endpoint properly validates input
- [ ] Gmail API properly invoked
- [ ] Error handling for failed sends
- [ ] Sending activity logged to database

---

## SEO Assets Verification

### robots.txt

- [ ] File exists at: `/public/robots.txt`
- [ ] Content includes:
  - [ ] `User-agent: *`
  - [ ] `Disallow:` (or specific paths)
  - [ ] `Sitemap: https://mailpro.nafij.me/sitemap.xml`

Testing:
```bash
curl https://mailpro.nafij.me/robots.txt | head -5
```

Expected output:
```
User-agent: *
Allow: /
Sitemap: https://mailpro.nafij.me/sitemap.xml
```

### sitemap.xml

- [ ] File exists at: `/public/sitemap.xml`
- [ ] Valid XML structure
- [ ] Includes all public pages:
  - [ ] /
  - [ ] /privacy
  - [ ] /terms
  - [ ] /author
  - [ ] /credits
- [ ] Each URL includes `<lastmod>` and `<priority>`
- [ ] All URLs use primary domain: mailpro.nafij.me

Testing:
```bash
curl https://mailpro.nafij.me/sitemap.xml | xmllint --format - | head -20
```

- [ ] Valid XML (no parsing errors)
- [ ] All URLs properly formatted
- [ ] Priority values between 0.0-1.0
- [ ] Changefreq valid (always, hourly, daily, weekly, monthly, yearly, never)

### Canonical Tags

- [ ] All pages have `<link rel="canonical">` tag
- [ ] Canonical URL matches primary domain: mailpro.nafij.me
- [ ] Canonical includes full URL with protocol

Example:
```html
<link rel="canonical" href="https://mailpro.nafij.me/">
```

- [ ] Home page: https://mailpro.nafij.me/
- [ ] Privacy: https://mailpro.nafij.me/privacy
- [ ] Terms: https://mailpro.nafij.me/terms
- [ ] Author: https://mailpro.nafij.me/author
- [ ] Credits: https://mailpro.nafij.me/credits

### Meta Tags

Every page should include:

| Meta Tag | Required | Verified |
|----------|----------|----------|
| `<meta name="description">` | Yes | [ ] |
| `<meta name="viewport">` | Yes | [ ] |
| `<meta property="og:title">` | Yes | [ ] |
| `<meta property="og:description">` | Yes | [ ] |
| `<meta property="og:url">` | Yes | [ ] |
| `<meta property="og:type">` | Yes | [ ] |
| `<meta property="og:image">` | Yes | [ ] |
| `<meta name="twitter:card">` | Yes | [ ] |
| `<meta name="twitter:title">` | Yes | [ ] |
| `<meta name="twitter:description">` | Yes | [ ] |

Testing:
```bash
# Extract meta tags
curl https://mailpro.nafij.me/ | grep -E '<meta (name|property)=' | head -10
```

### JSON-LD Schema

- [ ] Schema markup present on home page
- [ ] Schema type: Organization or WebSite
- [ ] Includes: name, url, description, image, contact

Testing:
```bash
# Validate schema
curl https://mailpro.nafij.me/ | grep -o '<script type="application/ld\+json">.*</script>'
```

---

## Database Functionality Verification

### Connection Test

```bash
# Test from Vercel logs
vercel logs --follow

# Look for: "✅ Connected to MongoDB Atlas"
```

- [ ] Database connects successfully on deploy
- [ ] No connection timeout errors
- [ ] Connection retries working

### Basic CRUD Operations

- [ ] Create: Can insert test account
- [ ] Read: Can query account by email
- [ ] Update: Can update account fields
- [ ] Delete: Can remove test account (if needed)

### Account Schema Validation

In MongoDB, verify all fields exist on test account:

```javascript
{
  _id: ObjectId,
  email: "test@example.com",
  refreshToken: "token_string",
  isPremium: false,
  lock: {
    isLocked: false,
    reason: null,
    actor: null,
    timestamp: null,
    expiry: null,
    unlockHistory: []
  },
  createdAt: ISODate,
  lastAccessed: ISODate,
  lastSentEmail: null,
  sendingActivity: [],
  updatedAt: ISODate,
  __v: 0
}
```

- [ ] All fields present
- [ ] Types correct
- [ ] Defaults applied correctly

### Index Performance

```bash
# In MongoDB Atlas, check index usage statistics
# Indexes should show high selectivity for query optimization
```

- [ ] Email index has high selectivity
- [ ] Lock status queries use index
- [ ] Date range queries optimized
- [ ] No full collection scans in logs

### Data Integrity

- [ ] Email field is unique (no duplicates possible)
- [ ] Email field is lowercase and trimmed
- [ ] Timestamp fields auto-populate
- [ ] Null fields handled correctly

---

## SSL/HTTPS Verification

### Certificate Status

- [ ] Primary domain: mailpro.nafij.me → ✓ Valid certificate
- [ ] Alt domain: mailpro.nafijrahaman.me → ✓ Valid certificate
- [ ] Alt domain: mailpro.vercel.app → ✓ Valid certificate

Testing:
```bash
# Check certificate validity
openssl s_client -connect mailpro.nafij.me:443 -servername mailpro.nafij.me 2>/dev/null | grep "Verify return code"
# Expected: "Verify return code: 0 (ok)"

# Check expiration date
openssl s_client -connect mailpro.nafij.me:443 -servername mailpro.nafij.me 2>/dev/null | grep "notAfter"
```

- [ ] Certificates issued by Let's Encrypt (Vercel standard)
- [ ] Certificate expiration date in future (90+ days)
- [ ] No certificate warnings in browser
- [ ] Vercel auto-renews before expiry

### HTTPS Redirect

- [ ] HTTP requests redirect to HTTPS
- [ ] Redirect status code: 301 (permanent)
- [ ] All subdomains redirect to HTTPS

Testing:
```bash
# Test redirect
curl -I http://mailpro.nafij.me/ | grep -i "location"
# Expected: Location: https://mailpro.nafij.me/

curl -I http://mailpro.nafijrahaman.me/ | grep -i "location"
```

- [ ] Primary domain redirects
- [ ] All alternate domains redirect
- [ ] No mixed content warnings in browser

---

## Performance Verification

### Response Times

| Endpoint | Expected | Actual | Status |
|----------|----------|--------|--------|
| `/` (home) | <1s | [ ] | [ ] |
| `/privacy` | <1s | [ ] | [ ] |
| `/available-accounts` | <2s | [ ] | [ ] |
| `/auth/google` | <1s | [ ] | [ ] |
| OAuth callback | <3s | [ ] | [ ] |

Testing:
```bash
# Measure response time
time curl https://mailpro.nafij.me/ > /dev/null

# Check in Vercel Analytics:
# Project > Analytics > Response Time
```

- [ ] All pages load within acceptable time
- [ ] No responses exceed 5 seconds
- [ ] Database queries optimized (use indexes)

### Cold Start Performance

- [ ] First request after deployment: <3s
- [ ] Subsequent requests: <500ms
- [ ] Function initialization logs show fast startup

### Static Asset Delivery

- [ ] CSS files compressed and cached
- [ ] Images optimized
- [ ] Fonts preloaded (if used)
- [ ] CDN serving static assets

Testing:
```bash
# Check cache headers
curl -I https://mailpro.nafij.me/style.css | grep -i "cache-control"
# Expected: cache-control: public, max-age=31536000
```

---

## Domain Configuration Verification

### Primary Domain: mailpro.nafij.me

- [ ] DNS records created:
  - [ ] Type: CNAME
  - [ ] Name: mailpro
  - [ ] Target: cname.vercel-dns.com
  - [ ] TTL: Auto or 3600

- [ ] Domain added in Vercel dashboard
- [ ] Domain status: "Valid Configuration"
- [ ] Verification complete (may take 24-48 hours)

Testing:
```bash
# Verify DNS propagation
nslookup mailpro.nafij.me

# Should resolve to Vercel's nameservers
# Expected output includes: namerserver = *, *.vercel-dns.com
```

### Alternate Domains

#### mailpro.nafijrahaman.me

- [ ] DNS records created
- [ ] Added as separate domain in Vercel (or alias)
- [ ] HTTPS working
- [ ] Canonical tag points to primary domain

#### mailpro.vercel.app

- [ ] Automatically provisioned by Vercel
- [ ] Working and accessible
- [ ] Optional: Add as alias or separate domain

### Domain Validation

```bash
# Test all domains
for domain in mailpro.nafij.me mailpro.nafijrahaman.me mailpro.vercel.app
do
  echo "Testing $domain..."
  curl -I https://$domain | head -1
  echo ""
done
```

- [ ] All domains return HTTP 200
- [ ] All domains accessible over HTTPS
- [ ] No certificate warnings
- [ ] Content served correctly from all domains

---

## Security Verification

### Secrets & Credentials

- [ ] No hardcoded API keys in code
- [ ] No hardcoded passwords in code
- [ ] No credentials in error messages
- [ ] Environment variables used for all secrets
- [ ] `.env` file in `.gitignore`
- [ ] Vercel environment variables masked in logs

### Password Security

- [ ] ADMIN_PASSWORD minimum 16 characters
- [ ] ADMIN_PASSWORD contains: uppercase, lowercase, numbers, symbols
- [ ] ADMIN_PASSWORD not stored in version control
- [ ] ADMIN_PASSWORD rotated if ever compromised

### Session Management

- [ ] SESSION_KEYS properly configured (comma-separated)
- [ ] SESSION_KEYS use cryptographically secure random values
- [ ] Sessions expire after 24 hours (maxAge: 24 * 60 * 60 * 1000)
- [ ] Session keys can be rotated without breaking existing sessions

### OAuth Security

- [ ] OAuth Client Secret never exposed
- [ ] OAuth Client ID only used on server (not client-side)
- [ ] OAuth redirect URIs whitelist exact matches only
- [ ] No sensitive data leaked in OAuth state parameter
- [ ] OAuth tokens stored securely in MongoDB

### CORS Security

- [ ] CORS origin properly configured
- [ ] Credentials only sent to trusted origins
- [ ] SameSite cookie attribute set (if applicable)
- [ ] Preflight requests handled correctly

### SQL/NoSQL Injection Prevention

- [ ] Mongoose schema validation used
- [ ] No raw query strings constructed
- [ ] All user inputs sanitized
- [ ] Query parameterization used throughout

### Error Handling

- [ ] Stack traces not exposed to users
- [ ] Generic error messages to users
- [ ] Detailed errors logged server-side
- [ ] No database credentials in error messages

---

## Monitoring & Logging Verification

### Log Access

- [ ] Logs accessible via Vercel dashboard
- [ ] Logs accessible via Vercel CLI: `vercel logs --follow`
- [ ] Build logs show successful deployment
- [ ] Runtime logs show no errors

### Key Log Entries

Expected on deployment:
- [ ] "✅ Connected to MongoDB Atlas"
- [ ] "📊 Database ready for operations"
- [ ] Application started on port 3000 (internally)
- [ ] No error messages

### Performance Metrics

In Vercel Analytics:
- [ ] Response Time graph visible
- [ ] Edge Network metrics available
- [ ] Function execution times tracked
- [ ] Error rate <0.1%

### Error Tracking

- [ ] 404 errors logged for debugging
- [ ] 500 errors logged with full context
- [ ] OAuth errors captured
- [ ] Database errors logged

### Alerts Configured

- [ ] Alert for high error rate (>5%)
- [ ] Alert for slow response times (>2s average)
- [ ] Alert for deployment failures
- [ ] Notification method configured (email, Slack, etc.)

---

## Functional Testing Checklist

### Full User Flow Testing

1. **Anonymous User**
   - [ ] Can access home page
   - [ ] Can view privacy policy
   - [ ] Can view terms
   - [ ] Can view author page
   - [ ] Can view credits page
   - [ ] Can see available public accounts
   - [ ] Cannot access protected endpoints

2. **OAuth Login Flow**
   - [ ] "Login with Google" link present
   - [ ] Redirects to Google login correctly
   - [ ] Can select Gmail account
   - [ ] Receives OAuth scopes consent dialog
   - [ ] Scopes: gmail.readonly, gmail.send, email, profile
   - [ ] Redirects back to app after auth
   - [ ] Session created and persisted

3. **Authenticated User**
   - [ ] Can see inbox for connected account
   - [ ] Can view individual emails
   - [ ] Can see email list with pagination
   - [ ] Can see sender, subject, date, preview
   - [ ] Can see email headers in raw view
   - [ ] Can see email in HTML view (if applicable)
   - [ ] Can toggle between view modes

4. **Admin Functions**
   - [ ] Can access admin panel with correct password
   - [ ] Can see all accounts
   - [ ] Can lock account with reason
   - [ ] Can unlock account with reason
   - [ ] Can view lock history
   - [ ] Can search/filter accounts
   - [ ] Lock/unlock actions logged

5. **Sending Email**
   - [ ] Compose form present
   - [ ] Can enter recipient, subject, body
   - [ ] Send button functional
   - [ ] Email sends via Gmail API
   - [ ] Sending activity logged
   - [ ] User sees success/error message

### Cross-Browser Testing

- [ ] Chrome/Edge (latest): ✓ Working
- [ ] Firefox (latest): ✓ Working
- [ ] Safari (latest): ✓ Working
- [ ] Mobile browsers: ✓ Responsive

### Responsive Design Testing

- [ ] Mobile (320px): ✓ Functional
- [ ] Tablet (768px): ✓ Functional
- [ ] Desktop (1024px+): ✓ Functional
- [ ] Touch interactions responsive
- [ ] No horizontal scroll issues

### Accessibility Testing

- [ ] Keyboard navigation works
- [ ] Screen reader labels present
- [ ] Focus indicators visible
- [ ] Color contrast adequate (WCAG AA)
- [ ] Form labels associated

---

## Deployment Completion Sign-Off

### Final Verification

- [ ] All 11 environment variables configured
- [ ] All endpoints tested and functional
- [ ] Database connection verified
- [ ] OAuth flow working
- [ ] All domains accessible
- [ ] HTTPS/SSL working on all domains
- [ ] Performance acceptable
- [ ] No critical errors in logs
- [ ] Admin functions tested
- [ ] SEO assets verified

### Post-Launch Monitoring (First 24 Hours)

- [ ] Monitor error rate (should be <0.1%)
- [ ] Monitor response times (should be <500ms typical)
- [ ] Monitor database connection pool
- [ ] Watch logs for any issues
- [ ] Verify OAuth tokens working
- [ ] Test admin functions periodically
- [ ] Monitor database growth

### Sign-Off

- **Deployment Date**: _______________
- **Deployer Name**: _______________
- **Verification Date**: _______________
- **Verifier Name**: _______________
- **Issues Found**: [ ] None [ ] Minor [ ] Critical
- **Notes**: _______________________________________________

### Approval

- **Project Owner**: _________________ Date: _________
- **Tech Lead**: _________________ Date: _________

---

## Rollback Triggers

Automatic rollback recommended if:

- [ ] Error rate exceeds 5% for 5+ minutes
- [ ] Database connection pool exhausted
- [ ] Response time exceeds 5 seconds for 10+ requests
- [ ] OAuth flow completely broken
- [ ] Admin access lost or compromised
- [ ] Data corruption detected

**Rollback Command**:
```bash
vercel promote [PREVIOUS_DEPLOYMENT_ID]
```

---

## Documentation

- [ ] Deployment guide (deploy.md) created
- [ ] Team trained on deployment process
- [ ] Monitoring instructions documented
- [ ] Rollback procedures documented
- [ ] Admin credentials stored securely
- [ ] Emergency contacts updated

---

**Verification Status**: Ready for Production
**Last Updated**: April 25, 2026
**Version**: 1.0.0
