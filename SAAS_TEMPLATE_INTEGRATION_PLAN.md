# SaaS Monetization Templates Integration Plan

## Overview

**Purpose**: Integrate network license database architecture learnings from `create-qa-architect` v4.1.1+ into `saas-monetization-templates` v1.1.0

**Status**: Planning Phase
**Target Version**: v1.1.0
**Estimated Completion**: December 2024

---

## Security Improvements to Integrate

### 1. Network License Database Architecture

**Current State (v1.0.0)**: Local-only license validation with HMAC-SHA256 signatures
**New State (v1.1.0)**: Network license database with SHA256 integrity checking

**Benefits**:

- ✅ Server maintains single source of truth for purchased licenses
- ✅ CLI validates against live server database (with offline fallback)
- ✅ No Stripe secrets ever on user machines
- ✅ SHA256 integrity verification prevents database tampering
- ✅ Configurable registry URL for enterprise self-hosting

**Security Review Findings Addressed**:

- QA-2025-11-23-07: CRITICAL - CLI requiring STRIPE_SECRET_KEY (impossible for production)
- QA-2025-11-23-09: Hardcoded vendor URLs creating single point of failure
- QA-2025-11-23-12: Mandatory SHA256 integrity verification
- QA-2025-11-23-13: Server-side dependencies properly separated

---

## Files to Add/Update in saas-monetization-templates

### New Files to Add

#### 1. `templates/lib/license-validator.js`

**Source**: `create-qa-architect/lib/license-validator.js`

**Key Features**:

- Network license database fetching via configurable URL
- Mandatory SHA256 integrity verification
- Offline fallback to cached database
- No Stripe dependencies (user-side only)
- Environment variable override: `{{PROJECT_SLUG}}_LICENSE_DB_URL`

**Template Variables**:

```javascript
{
  {
    PROJECT_SLUG
  }
} // e.g., "create-qa-architect" → "QAA"
{
  {
    PROJECT_NAME
  }
} // e.g., "Create Quality Automation"
{
  {
    DOMAIN
  }
} // e.g., "license.aibuilderlab.com"
```

**Placeholders to Add**:

- `{{LICENSE_DB_URL}}` - Default: `https://{{DOMAIN}}/{{PROJECT_SLUG_LOWER}}/legitimate-licenses.json`
- `{{LICENSE_ENV_VAR}}` - Default: `{{PROJECT_SLUG}}_LICENSE_DB_URL`

#### 2. `templates/server/webhook-handler.js`

**Source**: `create-qa-architect/webhook-handler.js`

**Key Features**:

- Express server handling Stripe webhooks
- Automatic license database population
- SHA256 hash stamping for integrity
- License key generation from customer ID
- Serves `/legitimate-licenses.json` endpoint

**Dependencies (server-only)**:

- express@^4.18.0
- stripe@^14.25.0

**Environment Variables Required**:

- `STRIPE_SECRET_KEY` - Stripe API secret key (server-side)
- `STRIPE_WEBHOOK_SECRET` - Webhook signing secret
- `LICENSE_DATABASE_PATH` - Path to license database JSON file
- `PORT` - Server port (default: 3000)

**Template Variables**:

```javascript
{
  {
    PROJECT_SLUG
  }
} // For license key prefix: QAA-XXXX-XXXX-XXXX-XXXX
{
  {
    PROJECT_NAME
  }
} // For logging and responses
{
  {
    STRIPE_PRICE_PRO
  }
} // Stripe price ID for Pro tier
{
  {
    STRIPE_PRICE_ENTERPRISE
  }
} // Stripe price ID for Enterprise tier
{
  {
    STRIPE_PRICE_PRO_FOUNDER
  }
} // Stripe price ID for Pro Founder
{
  {
    STRIPE_PRICE_ENTERPRISE_FOUNDER
  }
} // Stripe price ID for Enterprise Founder
```

#### 3. `templates/server/admin-license.js`

**Source**: `create-qa-architect/admin-license.js`

**Key Features**:

- Manual license database management tool
- Add/revoke licenses without Stripe
- Useful for testing, special cases, enterprise deals
- No external dependencies required

**Usage**:

```bash
node admin-license.js LICENSE_KEY CUSTOMER_ID TIER IS_FOUNDER EMAIL
```

**Template Variables**:

```javascript
{
  {
    PROJECT_SLUG
  }
} // For license storage path
{
  {
    LICENSE_DIR
  }
} // Default: ~/.{{PROJECT_SLUG_LOWER}}
```

#### 4. `templates/docs/SERVER_README.md`

**Source**: `create-qa-architect/SERVER_README.md`

**Content**:

- Server deployment guide
- Webhook handler setup
- Admin tool usage
- Architecture diagrams
- Security considerations

**Placeholders**:

- `{{PROJECT_NAME}}`
- `{{PROJECT_SLUG}}`
- `{{DOMAIN}}`
- `{{CLI_COMMAND}}` - e.g., `npx create-qa-architect@latest`

#### 5. `templates/docs/DEPLOYMENT_GUIDE.md`

**Source**: `create-qa-architect/DEPLOYMENT_GUIDE.md`

**Content**:

- Complete deployment instructions
- Vercel/Netlify/Docker options
- CDN distribution setup
- Environment variable configuration
- SSL/TLS requirements

---

### Files to Update

#### 1. `templates/lib/licensing.js` → Deprecate or Rename

**Decision Options**:

**Option A: Deprecate and replace** (Recommended)

- Rename to `licensing-legacy.js`
- Add deprecation notice
- Point users to `license-validator.js`
- Keep for backward compatibility only

**Option B: Update in place**

- Refactor to use network architecture
- Maintain existing API for compatibility
- Add migration guide

**Recommendation**: Option A - Clean break for security improvements

#### 2. `templates/lib/stripe-integration.js` → Update

**Changes Needed**:

- Remove direct license validation logic
- Delegate to webhook handler for license issuance
- Update documentation to reflect server-side webhook approach
- Add webhook verification examples

**Current Approach**: Direct Stripe API calls for license creation
**New Approach**: Webhook handler populates license database automatically

#### 3. `templates/scripts/create-saas-monetization.js` → Update

**Changes Needed**:

- Add server-side file generation (webhook-handler, admin-license)
- Prompt for license database URL configuration
- Generate environment variable templates
- Update documentation references

**New Prompts to Add**:

```javascript
{
  type: 'input',
  name: 'licenseDomain',
  message: 'License server domain (e.g., license.example.com):',
  default: 'license.{{DOMAIN}}'
}
```

---

## Documentation Updates

### 1. Update VERSION.md for v1.1.0

**Add to Changelog**:

```markdown
## v1.1.0 - Network License Architecture (2025-12)

### 🛡️ Security Improvements

- **Network License Database**: Server-hosted signed license registry with offline fallback
- **SHA256 Integrity**: Mandatory cryptographic verification of license database
- **No Client Secrets**: Stripe credentials never exposed to CLI users
- **Configurable Registry**: Enterprise self-hosting via environment variable override

### 📁 New Templates

- `templates/lib/license-validator.js` - Network license validation (replaces licensing.js)
- `templates/server/webhook-handler.js` - Stripe webhook processor
- `templates/server/admin-license.js` - Manual license management tool
- `templates/docs/SERVER_README.md` - Server deployment guide
- `templates/docs/DEPLOYMENT_GUIDE.md` - Complete deployment instructions

### 🔄 Migration Guide

- Legacy `licensing.js` moved to `licensing-legacy.js`
- Existing projects should migrate to network architecture
- See MIGRATION.md for step-by-step instructions

### 📊 Based on Production Experience

- **Source**: Create Quality Automation v4.1.1+ (security-hardened)
- **Security Reviews**: QA-2025-11-23-07 through QA-2025-11-23-16
- **Production Status**: Validated with real paying customers
```

### 2. Create MIGRATION.md

**Sections**:

1. Why Migrate (security improvements)
2. Architecture Comparison (local vs network)
3. Step-by-Step Migration
4. Server Deployment
5. Testing Migration
6. Rollback Plan

### 3. Update README.md

**Add Section**: Network License Architecture

````markdown
## Network License Architecture

### Overview

The v1.1.0 templates use a **network license database** architecture that eliminates
the need for Stripe secrets on user machines while providing offline fallback support.

### How It Works

1. **Purchase Flow**: Customer purchases via Stripe → Webhook populates server database
2. **Activation Flow**: User activates license → CLI fetches database → Validates locally
3. **Offline Mode**: Previously activated licenses work without network access
4. **Security**: SHA256 integrity verification prevents database tampering

### Components

- **Client-Side** (`lib/license-validator.js`): No secrets, validates against cached database
- **Server-Side** (`server/webhook-handler.js`): Handles payments, populates database
- **Admin Tool** (`server/admin-license.js`): Manual license management for testing

### Enterprise Self-Hosting

Set `{{PROJECT_SLUG}}_LICENSE_DB_URL` to your private license server:

```bash
export {{PROJECT_SLUG}}_LICENSE_DB_URL=https://your-domain.com/licenses.json
```
````

```

---

## Testing Plan

### 1. Template Generation Tests

**Test Cases**:
- Generate all new templates with placeholder substitution
- Verify no hardcoded values remain
- Validate JavaScript syntax
- Check environment variable references

### 2. Integration Tests

**Test Cases**:
- Webhook handler receives Stripe events correctly
- License database populated with valid entries
- SHA256 hashes computed correctly
- CLI fetches and validates network database
- Offline fallback works when server unavailable
- Admin tool adds/revokes licenses properly

### 3. Security Validation

**Test Cases**:
- No Stripe secrets in client-side code
- SHA256 verification fails on tampered database
- Unknown licenses properly rejected
- Expired licenses handled correctly
- Environment variable overrides work

### 4. Backward Compatibility

**Test Cases**:
- Legacy `licensing.js` still available for existing projects
- Migration path clearly documented
- Both architectures can coexist during transition

---

## Implementation Phases

### Phase 1: File Creation (Week 1)
- [ ] Copy and templatize `lib/license-validator.js`
- [ ] Copy and templatize `server/webhook-handler.js`
- [ ] Copy and templatize `server/admin-license.js`
- [ ] Copy and templatize `docs/SERVER_README.md`
- [ ] Copy and templatize `docs/DEPLOYMENT_GUIDE.md`

### Phase 2: Update Existing Files (Week 1)
- [ ] Rename `lib/licensing.js` → `lib/licensing-legacy.js`
- [ ] Update `lib/stripe-integration.js` documentation
- [ ] Update `scripts/create-saas-monetization.js` generator

### Phase 3: Documentation (Week 2)
- [ ] Create MIGRATION.md
- [ ] Update VERSION.md for v1.1.0
- [ ] Update README.md with network architecture section
- [ ] Add security review findings documentation

### Phase 4: Testing (Week 2)
- [ ] Template generation tests
- [ ] Integration tests
- [ ] Security validation tests
- [ ] Backward compatibility tests

### Phase 5: Release (Week 3)
- [ ] Final review
- [ ] Update version tags
- [ ] Publish v1.1.0
- [ ] Announcement and migration guide

---

## Placeholder System Additions

### New Placeholders for v1.1.0

**License Configuration**:
- `{{LICENSE_DB_URL}}` - License database URL
- `{{LICENSE_ENV_VAR}}` - Environment variable name for custom registry
- `{{PROJECT_SLUG_LOWER}}` - Lowercase project slug for paths

**Stripe Configuration**:
- `{{STRIPE_PRICE_PRO}}` - Pro tier Stripe price ID
- `{{STRIPE_PRICE_ENTERPRISE}}` - Enterprise tier Stripe price ID
- `{{STRIPE_PRICE_PRO_FOUNDER}}` - Pro Founder tier Stripe price ID
- `{{STRIPE_PRICE_ENTERPRISE_FOUNDER}}` - Enterprise Founder tier Stripe price ID

**Server Configuration**:
- `{{SERVER_PORT}}` - Default server port (default: 3000)
- `{{LICENSE_DATABASE_PATH}}` - Path to license database file
- `{{WEBHOOK_ENDPOINT}}` - Webhook URL path (default: /webhook)

---

## Risk Assessment

### Low Risk
- ✅ New files don't affect existing templates
- ✅ Legacy licensing.js remains available
- ✅ Architecture proven in production

### Medium Risk
- ⚠️ Users must deploy server component (webhook handler)
- ⚠️ Requires DNS and SSL configuration
- ⚠️ Migration requires coordination with active users

### Mitigation Strategies
1. **Clear Documentation**: Comprehensive deployment and migration guides
2. **Gradual Migration**: Support both architectures during transition
3. **Testing**: Thorough validation before release
4. **Support**: Dedicated migration assistance channel

---

## Success Criteria

### Technical
- [ ] All new templates generate without errors
- [ ] All integration tests pass
- [ ] Security validation tests pass
- [ ] No hardcoded secrets in client-side code

### Documentation
- [ ] Migration guide complete and tested
- [ ] Deployment guide covers all platforms
- [ ] README.md updated with architecture overview
- [ ] VERSION.md changelog accurate

### User Experience
- [ ] Setup time remains under 10 minutes
- [ ] Migration path clear and straightforward
- [ ] Error messages helpful and actionable
- [ ] Deployment options flexible (Vercel/Netlify/Docker/CDN)

---

## Questions to Resolve

1. **Backward Compatibility Duration**: How long to maintain `licensing-legacy.js`?
   - **Recommendation**: Maintain through v1.x, deprecate in v2.0

2. **Server Deployment Default**: Which deployment option to recommend first?
   - **Recommendation**: Vercel Functions (easiest for most users)

3. **License Database Hosting**: Where should users host the license database?
   - **Recommendation**: Same server as webhook handler, with CDN option documented

4. **Testing Environment**: How to handle testing without Stripe webhook?
   - **Recommendation**: Admin tool for manual license addition during testing

---

## Next Steps

1. **Review this plan** with stakeholders
2. **Set timeline** for v1.1.0 release
3. **Begin Phase 1** (File Creation)
4. **Update project board** with integration tasks

---

**Document Created**: November 24, 2024
**Last Updated**: November 24, 2024
**Author**: Security-Hardened Implementation (QA-2025-11-23 series)
**Target Audience**: Template maintainers and contributors
```
