# 📧 PHASE 5: MARKETING AUTOMATION - IMPLEMENTATION PLAN

**Date**: October 13, 2025
**Project**: Florida Local Elite - Marketing Automation Platform
**Estimated Time**: 50 hours
**Status**: 🚧 In Progress

---

## 🎯 OBJECTIVES

Transform Florida Local Elite into a comprehensive marketing automation platform that enables businesses to:
1. Create and manage email marketing campaigns
2. Send SMS marketing messages
3. Build automated marketing workflows
4. Segment customers for targeted campaigns
5. Track campaign performance with detailed analytics
6. Capture and nurture leads automatically

---

## 📊 DATABASE SCHEMA DESIGN

### **New Tables** (10 tables)

#### **1. marketing_campaigns**
```sql
- id (uuid, primary key)
- businessId (uuid, foreign key to businesses)
- name (varchar 255)
- description (text)
- type (enum: 'email', 'sms', 'push', 'multi-channel')
- status (enum: 'draft', 'scheduled', 'active', 'paused', 'completed', 'archived')
- targetSegmentId (uuid, foreign key to customer_segments, nullable)
-
- -- Campaign Content
- subject (varchar 255, for email)
- preheaderText (varchar 150, for email)
- senderName (varchar 100)
- senderEmail (varchar 255, for email)
- senderPhone (varchar 20, for SMS)
- content (text, HTML for email, plain text for SMS)
- plainTextContent (text, for email fallback)
-
- -- Scheduling
- scheduledAt (timestamp, nullable)
- sendAt (varchar 50, e.g., "immediate", "scheduled", "optimal")
- timezone (varchar 50)
-
- -- Tracking
- totalRecipients (integer, default 0)
- sentCount (integer, default 0)
- deliveredCount (integer, default 0)
- openedCount (integer, default 0)
- clickedCount (integer, default 0)
- bouncedCount (integer, default 0)
- unsubscribedCount (integer, default 0)
- spamCount (integer, default 0)
-
- -- Rates (calculated)
- deliveryRate (decimal, precision 5, scale 2)
- openRate (decimal, precision 5, scale 2)
- clickRate (decimal, precision 5, scale 2)
- conversionRate (decimal, precision 5, scale 2)
-
- -- Settings
- trackOpens (boolean, default true)
- trackClicks (boolean, default true)
- allowUnsubscribe (boolean, default true)
- testMode (boolean, default false)
-
- createdAt (timestamp)
- updatedAt (timestamp)
- sentAt (timestamp, nullable)
- completedAt (timestamp, nullable)
```

#### **2. campaign_recipients**
```sql
- id (uuid, primary key)
- campaignId (uuid, foreign key to marketing_campaigns)
- userId (varchar, foreign key to users, nullable)
- email (varchar 255)
- phone (varchar 20, nullable)
- firstName (varchar 100, nullable)
- lastName (varchar 100, nullable)
-
- -- Status Tracking
- status (enum: 'pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'unsubscribed', 'spam', 'failed')
- sentAt (timestamp, nullable)
- deliveredAt (timestamp, nullable)
- openedAt (timestamp, nullable)
- firstClickedAt (timestamp, nullable)
- bouncedAt (timestamp, nullable)
-
- -- Engagement Metrics
- openCount (integer, default 0)
- clickCount (integer, default 0)
- lastOpenedAt (timestamp, nullable)
- lastClickedAt (timestamp, nullable)
-
- -- Error Tracking
- errorMessage (text, nullable)
- bounceType (varchar 50, nullable, e.g., "hard", "soft", "spam")
-
- -- External IDs (for email/SMS provider tracking)
- externalMessageId (varchar 255, nullable)
- externalStatus (varchar 100, nullable)
-
- createdAt (timestamp)
- updatedAt (timestamp)
```

#### **3. campaign_links**
```sql
- id (uuid, primary key)
- campaignId (uuid, foreign key to marketing_campaigns)
- originalUrl (text)
- shortCode (varchar 20, unique)
- trackingUrl (text)
-
- -- Analytics
- clickCount (integer, default 0)
- uniqueClickCount (integer, default 0)
-
- createdAt (timestamp)
```

#### **4. campaign_clicks**
```sql
- id (uuid, primary key)
- campaignId (uuid, foreign key to marketing_campaigns)
- recipientId (uuid, foreign key to campaign_recipients)
- linkId (uuid, foreign key to campaign_links)
-
- -- Click Details
- clickedAt (timestamp)
- ipAddress (varchar 45, nullable)
- userAgent (text, nullable)
- deviceType (varchar 50, nullable)
- browser (varchar 100, nullable)
- os (varchar 100, nullable)
- country (varchar 100, nullable)
- city (varchar 100, nullable)
```

#### **5. customer_segments**
```sql
- id (uuid, primary key)
- businessId (uuid, foreign key to businesses)
- name (varchar 255)
- description (text, nullable)
-
- -- Segment Criteria (stored as JSON)
- criteria (jsonb)
- /* Example structure:
  {
    "rules": [
      { "field": "totalSpent", "operator": "greater_than", "value": 100 },
      { "field": "lastPurchaseDate", "operator": "within_days", "value": 30 },
      { "field": "location", "operator": "in", "value": ["Miami", "Tampa"] }
    ],
    "logic": "AND"
  }
  */
-
- -- Segment Stats
- memberCount (integer, default 0)
- autoUpdate (boolean, default true)
- lastCalculatedAt (timestamp, nullable)
-
- isActive (boolean, default true)
- createdAt (timestamp)
- updatedAt (timestamp)
```

#### **6. segment_members**
```sql
- id (uuid, primary key)
- segmentId (uuid, foreign key to customer_segments)
- userId (varchar, foreign key to users)
- addedAt (timestamp)
- source (varchar 100, e.g., "automatic", "manual", "import")
```

#### **7. marketing_workflows**
```sql
- id (uuid, primary key)
- businessId (uuid, foreign key to businesses)
- name (varchar 255)
- description (text, nullable)
-
- -- Workflow Configuration
- triggerType (varchar 100)
- /* e.g., "user_signup", "purchase_made", "cart_abandoned",
          "lead_created", "date_based", "segment_entry" */
- triggerConfig (jsonb)
- /* Example:
  {
    "eventType": "cart_abandoned",
    "conditions": { "cartValue": { "min": 50 } },
    "delay": { "value": 1, "unit": "hours" }
  }
  */
-
- -- Workflow Steps (stored as JSON array)
- steps (jsonb)
- /* Example:
  [
    {
      "id": "step-1",
      "type": "delay",
      "config": { "value": 1, "unit": "hours" }
    },
    {
      "id": "step-2",
      "type": "send_email",
      "config": { "templateId": "uuid", "subject": "..." }
    },
    {
      "id": "step-3",
      "type": "condition",
      "config": { "field": "email_opened", "operator": "equals", "value": true },
      "trueStep": "step-4",
      "falseStep": "step-5"
    }
  ]
  */
-
- -- Status
- status (enum: 'draft', 'active', 'paused', 'archived')
-
- -- Metrics
- totalEnrolled (integer, default 0)
- activeEnrollments (integer, default 0)
- completedEnrollments (integer, default 0)
-
- createdAt (timestamp)
- updatedAt (timestamp)
- activatedAt (timestamp, nullable)
```

#### **8. workflow_enrollments**
```sql
- id (uuid, primary key)
- workflowId (uuid, foreign key to marketing_workflows)
- userId (varchar, foreign key to users)
-
- -- Enrollment Status
- status (enum: 'active', 'completed', 'exited', 'failed')
- currentStepId (varchar 100, nullable)
- currentStepStartedAt (timestamp, nullable)
-
- -- Tracking
- enrolledAt (timestamp)
- completedAt (timestamp, nullable)
- exitedAt (timestamp, nullable)
- exitReason (text, nullable)
-
- -- Enrollment Data (context for personalization)
- enrollmentData (jsonb, nullable)
```

#### **9. workflow_step_logs**
```sql
- id (uuid, primary key)
- enrollmentId (uuid, foreign key to workflow_enrollments)
- workflowId (uuid, foreign key to marketing_workflows)
- stepId (varchar 100)
-
- -- Step Execution
- stepType (varchar 100, e.g., "send_email", "send_sms", "delay", "condition")
- status (enum: 'pending', 'in_progress', 'completed', 'failed', 'skipped')
-
- -- Details
- startedAt (timestamp)
- completedAt (timestamp, nullable)
- errorMessage (text, nullable)
-
- -- Results (e.g., email sent, SMS delivered, condition result)
- result (jsonb, nullable)
```

#### **10. lead_capture_forms**
```sql
- id (uuid, primary key)
- businessId (uuid, foreign key to businesses)
- name (varchar 255)
- description (text, nullable)
-
- -- Form Configuration
- fields (jsonb)
- /* Example:
  [
    { "name": "email", "type": "email", "required": true, "label": "Email Address" },
    { "name": "firstName", "type": "text", "required": true, "label": "First Name" },
    { "name": "phone", "type": "tel", "required": false, "label": "Phone Number" },
    { "name": "interests", "type": "checkbox", "options": ["Product A", "Product B"] }
  ]
  */
-
- -- Settings
- successMessage (text)
- redirectUrl (varchar 500, nullable)
- addToSegmentId (uuid, foreign key to customer_segments, nullable)
- enrollInWorkflowId (uuid, foreign key to marketing_workflows, nullable)
-
- -- Tracking
- submissionCount (integer, default 0)
- conversionRate (decimal, precision 5, scale 2)
-
- isActive (boolean, default true)
- createdAt (timestamp)
- updatedAt (timestamp)
```

#### **11. lead_submissions**
```sql
- id (uuid, primary key)
- formId (uuid, foreign key to lead_capture_forms)
- businessId (uuid, foreign key to businesses)
- userId (varchar, foreign key to users, nullable)
-
- -- Submission Data
- formData (jsonb) /* All form field values */
- email (varchar 255, indexed)
- phone (varchar 20, nullable)
-
- -- Source Tracking
- ipAddress (varchar 45, nullable)
- userAgent (text, nullable)
- referrer (text, nullable)
- utmSource (varchar 100, nullable)
- utmMedium (varchar 100, nullable)
- utmCampaign (varchar 100, nullable)
-
- -- Status
- status (enum: 'new', 'contacted', 'qualified', 'converted', 'archived')
-
- submittedAt (timestamp)
- createdAt (timestamp)
```

---

## 🛠️ COMPONENTS TO BUILD

### **Email Campaign Management**

#### **1. EmailCampaignBuilder.tsx** (800+ lines)
**Purpose**: Create and edit email marketing campaigns

**Features**:
- Campaign details form (name, subject, sender info)
- Rich text email editor (using TipTap)
- Drag-and-drop email template builder
- Preview with desktop/mobile views
- Test email sending
- Segment/recipient selection
- Scheduling options
- A/B testing configuration

**Key Sections**:
```tsx
<Tabs>
  <Tab value="details">Campaign Details</Tab>
  <Tab value="content">Email Content</Tab>
  <Tab value="recipients">Recipients & Segments</Tab>
  <Tab value="schedule">Schedule & Send</Tab>
  <Tab value="preview">Preview & Test</Tab>
</Tabs>
```

#### **2. EmailCampaignList.tsx** (500+ lines)
**Purpose**: View and manage all email campaigns

**Features**:
- Campaign status filters (draft, scheduled, active, completed)
- Search and sorting
- Quick stats (open rate, click rate, conversions)
- Bulk actions (pause, resume, duplicate, archive)
- Campaign performance cards

#### **3. EmailCampaignAnalytics.tsx** (650+ lines)
**Purpose**: Detailed analytics for email campaigns

**Features**:
- Overview metrics (sent, delivered, opened, clicked, bounced)
- Open/click trends over time (line charts)
- Link click heatmap
- Geographic performance map
- Device/browser breakdown
- Individual recipient activity log
- Export to CSV

---

### **SMS Marketing**

#### **4. SMSCampaignBuilder.tsx** (600+ lines)
**Purpose**: Create SMS marketing campaigns

**Features**:
- SMS message composer with character count
- Personalization tokens ({{firstName}}, {{businessName}})
- Link shortening
- Opt-out compliance text
- Recipient selection
- Send time optimization
- Cost estimator (based on recipient count)

#### **5. SMSCampaignList.tsx** (400+ lines)
**Purpose**: Manage SMS campaigns

**Features**:
- Campaign list with delivery stats
- Quick filters (status, date range)
- Cost tracking
- Reply management (if using two-way SMS)

---

### **Segmentation**

#### **6. SegmentBuilder.tsx** (700+ lines)
**Purpose**: Create customer segments for targeted campaigns

**Features**:
- Visual segment builder with rule groups
- Available criteria:
  - Demographics (location, age, gender)
  - Behavior (total spent, last purchase date, order count)
  - Engagement (email opens, clicks, website visits)
  - Custom fields
- AND/OR logic configuration
- Real-time member count preview
- Segment save and naming

**Example Rule Builder**:
```tsx
<SegmentRule>
  <Select field="totalSpent" />
  <Select operator="greater_than" />
  <Input value={100} />
  <Button remove />
</SegmentRule>
```

#### **7. SegmentList.tsx** (450+ lines)
**Purpose**: View all customer segments

**Features**:
- Segment cards with member counts
- Auto-update status indicators
- Quick actions (edit, duplicate, delete)
- Export segment members to CSV

---

### **Marketing Workflows**

#### **8. WorkflowBuilder.tsx** (1000+ lines)
**Purpose**: Visual workflow automation builder

**Features**:
- Drag-and-drop canvas for workflow steps
- Available step types:
  - Trigger (user signup, purchase, cart abandoned, etc.)
  - Delay (minutes, hours, days, weeks)
  - Send Email (select template)
  - Send SMS
  - Add to Segment
  - Condition/Branch (if/else logic)
  - Wait for Event
  - Update User Field
  - Webhook
- Connection lines between steps
- Step configuration panels
- Workflow testing/preview
- Version history

**Visual Structure**:
```
[Trigger: Cart Abandoned]
   ↓
[Delay: 1 hour]
   ↓
[Send Email: "Complete Your Purchase"]
   ↓
[Condition: Email Opened?]
   ↓ Yes         ↓ No
[Delay: 1 day]  [Send SMS: "Still Interested?"]
   ↓
[Send Email: "15% Off Code"]
```

#### **9. WorkflowList.tsx** (500+ lines)
**Purpose**: Manage all marketing workflows

**Features**:
- Workflow cards with status badges
- Performance metrics (enrolled, active, completed)
- Quick actions (activate, pause, duplicate, edit)
- Filter by status and trigger type

#### **10. WorkflowAnalytics.tsx** (600+ lines)
**Purpose**: Track workflow performance

**Features**:
- Enrollment funnel visualization
- Step completion rates
- Drop-off analysis
- Average time to completion
- Conversion tracking
- Individual enrollment logs

---

### **Lead Capture**

#### **11. LeadFormBuilder.tsx** (700+ lines)
**Purpose**: Create custom lead capture forms

**Features**:
- Drag-and-drop form builder
- Available field types:
  - Text, Email, Phone, Textarea
  - Dropdown, Multi-select, Checkbox, Radio
  - Number, Date, File Upload
- Field validation rules
- Custom success messages
- Auto-enrollment in workflows
- Auto-add to segments
- Embed code generator

#### **12. LeadSubmissionsTable.tsx** (550+ lines)
**Purpose**: View and manage lead submissions

**Features**:
- Sortable/filterable table
- Status management (new, contacted, qualified, converted)
- Quick contact actions (email, SMS)
- Export to CSV
- Bulk status updates
- Source tracking (UTM parameters)

---

### **Marketing Dashboard**

#### **13. MarketingOverviewDashboard.tsx** (650+ lines)
**Purpose**: Central marketing analytics dashboard

**Features**:
- Key metrics overview:
  - Active campaigns
  - Total sends (email + SMS)
  - Average open rate
  - Average click rate
  - Total conversions
  - ROI estimate
- Recent campaign performance table
- Workflow activity summary
- Lead capture form performance
- Segment growth trends
- Campaign calendar view

---

## 🔌 API ENDPOINTS (50+ endpoints)

### **Campaigns**
```
GET    /api/marketing/campaigns                      # List all campaigns
GET    /api/marketing/campaigns/:id                  # Get campaign details
POST   /api/marketing/campaigns                      # Create campaign
PUT    /api/marketing/campaigns/:id                  # Update campaign
DELETE /api/marketing/campaigns/:id                  # Delete campaign
POST   /api/marketing/campaigns/:id/send             # Send campaign
POST   /api/marketing/campaigns/:id/schedule         # Schedule campaign
POST   /api/marketing/campaigns/:id/pause            # Pause campaign
POST   /api/marketing/campaigns/:id/resume           # Resume campaign
POST   /api/marketing/campaigns/:id/test             # Send test email/SMS
GET    /api/marketing/campaigns/:id/recipients       # Get recipients
GET    /api/marketing/campaigns/:id/analytics        # Get campaign analytics
GET    /api/marketing/campaigns/:id/clicks           # Get click tracking data
POST   /api/marketing/campaigns/:id/duplicate        # Duplicate campaign
```

### **Segments**
```
GET    /api/marketing/segments                       # List all segments
GET    /api/marketing/segments/:id                   # Get segment details
POST   /api/marketing/segments                       # Create segment
PUT    /api/marketing/segments/:id                   # Update segment
DELETE /api/marketing/segments/:id                   # Delete segment
GET    /api/marketing/segments/:id/members           # Get segment members
POST   /api/marketing/segments/:id/calculate         # Recalculate members
POST   /api/marketing/segments/:id/export            # Export members CSV
```

### **Workflows**
```
GET    /api/marketing/workflows                      # List all workflows
GET    /api/marketing/workflows/:id                  # Get workflow details
POST   /api/marketing/workflows                      # Create workflow
PUT    /api/marketing/workflows/:id                  # Update workflow
DELETE /api/marketing/workflows/:id                  # Delete workflow
POST   /api/marketing/workflows/:id/activate         # Activate workflow
POST   /api/marketing/workflows/:id/pause            # Pause workflow
GET    /api/marketing/workflows/:id/enrollments      # Get enrollments
GET    /api/marketing/workflows/:id/analytics        # Get workflow analytics
POST   /api/marketing/workflows/:id/test             # Test workflow
```

### **Lead Forms**
```
GET    /api/marketing/forms                          # List all forms
GET    /api/marketing/forms/:id                      # Get form details
POST   /api/marketing/forms                          # Create form
PUT    /api/marketing/forms/:id                      # Update form
DELETE /api/marketing/forms/:id                      # Delete form
POST   /api/marketing/forms/:id/submit               # Submit form (public)
GET    /api/marketing/forms/:id/submissions          # Get submissions
GET    /api/marketing/forms/:id/analytics            # Get form analytics
```

### **Tracking & Webhooks**
```
GET    /api/marketing/track/open/:recipientId        # Track email open (pixel)
GET    /api/marketing/track/click/:linkId            # Track link click
POST   /api/marketing/webhooks/sendgrid              # SendGrid webhook
POST   /api/marketing/webhooks/twilio                # Twilio webhook
POST   /api/marketing/webhooks/mailgun               # Mailgun webhook
```

---

## 🔗 EXTERNAL SERVICE INTEGRATIONS

### **Email Service Providers**

#### **Option 1: SendGrid** (Recommended)
- **Setup**: Requires API key (env: `SENDGRID_API_KEY`)
- **Features**: Transactional + marketing emails, webhooks, templates
- **Pricing**: Free tier (100 emails/day), then $15/month for 40k emails

#### **Option 2: Mailgun**
- **Setup**: Requires API key + domain (env: `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`)
- **Features**: Transactional emails, tracking, webhooks
- **Pricing**: Free tier (5k emails/month), then $35/month for 50k emails

#### **Option 3: AWS SES**
- **Setup**: AWS credentials (env: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`)
- **Features**: High volume, low cost
- **Pricing**: $0.10 per 1,000 emails

**Implementation**: Create abstraction layer in `server/emailService.ts` to support multiple providers

---

### **SMS Service Provider**

#### **Twilio** (Primary Choice)
- **Setup**: Account SID + Auth Token (env: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`)
- **Features**: SMS, MMS, two-way messaging, delivery tracking
- **Pricing**: ~$0.0075 per SMS (varies by country)

**Implementation**: Create service in `server/smsService.ts`

---

## 📋 IMPLEMENTATION CHECKLIST

### **Phase 5A: Database & Core Services** (10 hours)
- [ ] Create marketing automation schema in `shared/schema.ts`
- [ ] Run database migration (`npm run db:push`)
- [ ] Create `server/emailService.ts` with SendGrid integration
- [ ] Create `server/smsService.ts` with Twilio integration
- [ ] Create `server/marketingStorage.ts` with all storage methods
- [ ] Create `server/marketingRoutes.ts` with API endpoints

### **Phase 5B: Campaign Management** (12 hours)
- [ ] Build `EmailCampaignBuilder.tsx`
- [ ] Build `EmailCampaignList.tsx`
- [ ] Build `EmailCampaignAnalytics.tsx`
- [ ] Build `SMSCampaignBuilder.tsx`
- [ ] Build `SMSCampaignList.tsx`
- [ ] Implement campaign sending logic
- [ ] Implement tracking pixels and link wrapping

### **Phase 5C: Segmentation** (8 hours)
- [ ] Build `SegmentBuilder.tsx` with rule builder
- [ ] Build `SegmentList.tsx`
- [ ] Implement segment calculation engine
- [ ] Create segment auto-update cron job

### **Phase 5D: Workflows** (15 hours)
- [ ] Build `WorkflowBuilder.tsx` with drag-and-drop canvas
- [ ] Build `WorkflowList.tsx`
- [ ] Build `WorkflowAnalytics.tsx`
- [ ] Implement workflow execution engine
- [ ] Create workflow processor (runs in background)
- [ ] Implement trigger listeners (event-driven)

### **Phase 5E: Lead Capture** (5 hours)
- [ ] Build `LeadFormBuilder.tsx`
- [ ] Build `LeadSubmissionsTable.tsx`
- [ ] Create public form submission endpoint
- [ ] Implement form embed code generator

### **Phase 5F: Testing & Documentation** (5 hours)
- [ ] Create seed data for marketing campaigns
- [ ] Test email sending with SendGrid
- [ ] Test SMS sending with Twilio
- [ ] Test workflow execution
- [ ] Create comprehensive documentation

---

## 🚀 QUICK START GUIDE

### **Environment Variables Needed**:
```bash
# Email Service (choose one)
SENDGRID_API_KEY=your_sendgrid_api_key
# OR
MAILGUN_API_KEY=your_mailgun_api_key
MAILGUN_DOMAIN=your_domain.com
# OR
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=us-east-1

# SMS Service
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890

# Application URLs
APP_URL=http://localhost:5000
MARKETING_UNSUBSCRIBE_URL=http://localhost:5000/unsubscribe
```

### **Dependencies to Install**:
```bash
npm install @sendgrid/mail twilio aws-sdk mailgun.js
```

---

## 📈 SUCCESS METRICS

**Phase 5 will be considered complete when**:
- ✅ All 11 database tables created and migrated
- ✅ Email campaigns can be created, scheduled, and sent
- ✅ SMS campaigns can be created and sent
- ✅ Customer segments can be built with rule-based criteria
- ✅ Marketing workflows can be created and automated
- ✅ Lead capture forms can be built and embedded
- ✅ Campaign analytics track opens, clicks, conversions
- ✅ All API endpoints tested and functional
- ✅ Documentation complete

---

**LET'S BUILD THE MOST POWERFUL MARKETING AUTOMATION PLATFORM FOR LOCAL BUSINESSES!** 🚀📧📱
