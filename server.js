import express from 'express';
import cors from 'cors';
import { parse } from 'csv-parse/sync';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import pLimit from 'p-limit';

import { classifyOrganization, getCategoryDescription, CATEGORIES } from './src/lib/classifier.js';
import { getRecommendedTrips, getProductRecommendations } from './src/lib/tripMatcher.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// In-memory storage for leads
let leads = [];
let emailCache = {}; // Store generated emails by lead ID

// Rate limiting state
let lastBatchTime = 0;
const BATCH_COOLDOWN = 10000; // 10 seconds between batches
const limit = pLimit(2); // Max 2 concurrent API calls to avoid overloading

// Load and parse CSV on startup
function loadLeads() {
  const csvPath = join(__dirname, 'public', 'AI_leads_for_JoeW.csv');

  if (!existsSync(csvPath)) {
    console.error('CSV file not found:', csvPath);
    return [];
  }

  const csvContent = readFileSync(csvPath, 'utf-8');
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  // Process and deduplicate leads
  const seenEmails = new Set();
  const processedLeads = [];

  records.forEach((record, index) => {
    const name = record.Name?.trim() || '';
    const email = record.Email?.trim().toLowerCase() || '';

    // Filter out test data
    if (name.toLowerCase() === 'test t' || name.toLowerCase().includes('test')) {
      return;
    }

    // Deduplicate by email
    if (email && seenEmails.has(email)) {
      return;
    }
    if (email) {
      seenEmails.add(email);
    }

    const lead = {
      id: processedLeads.length,
      name: name,
      email: email,
      phone: record.Phone?.trim() || '',
      organization: record.ORGANIZATION?.trim() || record['ORGANIZATION']?.trim() || '',
      dateOfEvent: record['Date of Event']?.trim() || '',
      status: 'new' // new, generated, sent, skipped
    };

    // Add classification
    const classification = classifyOrganization(lead);
    lead.category = classification.category;
    lead.categoryName = classification.name;
    lead.categoryColor = classification.color;

    processedLeads.push(lead);
  });

  console.log(`Loaded ${processedLeads.length} leads (filtered from ${records.length} records)`);
  return processedLeads;
}

// System prompt for email generation
const SYSTEM_PROMPT = `You are Tommy Summa, a consultative sales representative for HGA (High-value Gift Auctions), a company that provides consignment travel packages and raffle items to nonprofits for their fundraising events.

Your tone is helpful, warm, and consultative - NOT salesy. You're reaching out to help nonprofits raise more money at their events.

RULES FOR EMAIL WRITING:
1. Keep emails to 150-200 words MAX
2. NEVER start with "I hope this email finds you well" or "I wanted to reach out"
3. NEVER lead with HGA or product descriptions - lead with THEIR mission
4. Reference specific details about their organization and mission
5. Suggest 1-2 HGA products with a brief explanation of WHY it fits them
6. Name 2-3 specific trip destinations that match their audience
7. Include ONE concrete data point from REAL TESTIMONIALS below
8. End with a soft CTA - offer a call, free resource, or webinar invite
9. Sign off as "Tommy Summa" with title "Nonprofit Partnerships, HGA"

PRODUCT OVERVIEW:
- Trips & Experiences: Consignment travel packages (no risk - nonprofit pays nothing upfront)
  - Budget-friendly: Las Vegas ($1,295), Nashville ($1,995), Punta Cana ($1,795)
  - Mid-range: Tuscany ($2,495), Costa Rica ($2,495), Kentucky Bourbon ($2,495)
  - Premium: Paris ($4,595), Swiss Summer ($4,995), Mykonos Villa for 6 ($10,995)
  - Ultra-luxury: US Masters ($18,950), Monaco Grand Prix ($29,950)
- Golden Ticket: Raffle-style travel drawing ($100 tickets, drives engagement)
- Golf Prizes: Premium golf experiences for tournament silent auctions

REAL SUCCESS STORIES (use these specific data points):
- "We raised $30,000 at our inaugural event" - Elizabeth, Bourbon With Friends Charity
- "One HGA auction item raised over $13,000" - Terri Bailey
- "We raised over $13,000 with only two items" - Molly, Avila University
- "Travel packages accounted for over 44% of our auction profits" - MDA Bangor
- "We auctioned off a package and sold 12 that night!" - La Vernia Education Foundation
- "Raised almost $10,000 on the Golden Ticket alone" - St. Martin's Episcopal School
- "We were able to raise over $11K for new soccer goals" - Sandpoint Soccer Association
- "Month-long campaign raised just over $14,000" - Ele's Place Capital Region

DONOR FEEDBACK (proves the trips deliver):
- "Every aspect of our visit has been well OVER THE TOP!" - Brent & Holly C., Nashville
- "The trip was FLAWLESS!! Every detail was taken care of." - Joe V., Costa Rica
- "Our trip exceeded our expectations and was perfect." - Robert S., Bordeaux
- "People who take your trips ALWAYS come back saying how amazing it was" - Susan Norris, Rescuing Hope

OUTPUT FORMAT - Return ONLY valid JSON:
{
  "subjectLine": "Short, intriguing subject (no org name, max 50 chars)",
  "emailBody": "The email body with proper paragraphs",
  "suggestedAttachments": ["List of recommended attachments to include"],
  "internalNotes": "Notes for the operator about this lead/approach"
}`;

// Helper function to delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Generate email for a single lead with retry logic
async function generateEmail(lead, operatorNotes = '', researchResults = '', retries = 3) {
  const classification = classifyOrganization(lead);
  const categoryDescription = getCategoryDescription(classification.category);
  const recommendedTrips = getRecommendedTrips(lead, classification);
  const products = getProductRecommendations(classification);

  // Special handling for auctioneers
  const isAuctioneer = classification.category === 'auctioneer_vendor';

  const userMessage = JSON.stringify({
    lead: {
      name: lead.name,
      organization: lead.organization,
      email: lead.email,
      phone: lead.phone,
      dateOfEvent: lead.dateOfEvent
    },
    category: classification.category,
    categoryDescription: categoryDescription,
    recommendedProducts: products.map(p => p.name),
    productDescriptions: products,
    suggestedTrips: recommendedTrips.map(t => `${t.name} (${t.price})`),
    isAuctioneer: isAuctioneer,
    auctioneerInstructions: isAuctioneer ?
      "This is an auctioneer/event vendor. Write a PARTNERSHIP pitch: 'Your nonprofit clients would love these consignment travel packages. You can offer them as a value-add to your services.'" : null,
    operatorNotes: operatorNotes || null,
    orgResearch: researchResults || null
  }, null, 2);

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [
          { role: 'user', content: userMessage }
        ]
      });

      const content = response.content[0].text;

      // Parse the JSON response - handle newlines in strings
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        // Fix unescaped newlines inside JSON string values
        let jsonStr = jsonMatch[0];
        // Replace actual newlines inside strings with \n escape sequence
        jsonStr = jsonStr.replace(/"([^"]*?)"/g, (match, str) => {
          return '"' + str.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t') + '"';
        });
        return JSON.parse(jsonStr);
      }

      throw new Error('Failed to parse email response');
    } catch (error) {
      const isOverloaded = error.message?.includes('overloaded') || error.status === 529;
      const isRateLimited = error.status === 429;

      if ((isOverloaded || isRateLimited) && attempt < retries) {
        const backoffMs = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 1000, 30000);
        console.log(`Lead ${lead.id}: API ${isOverloaded ? 'overloaded' : 'rate limited'}, retrying in ${Math.round(backoffMs/1000)}s (attempt ${attempt}/${retries})`);
        await delay(backoffMs);
        continue;
      }

      console.error('Error generating email for lead:', lead.id, error.message);
      throw error;
    }
  }
}

// API Routes

// Get all leads with stats
app.get('/api/leads', (req, res) => {
  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    generated: leads.filter(l => l.status === 'generated').length,
    sent: leads.filter(l => l.status === 'sent').length,
    skipped: leads.filter(l => l.status === 'skipped').length
  };

  // Include cached emails with leads
  const leadsWithEmails = leads.map(lead => ({
    ...lead,
    generatedEmail: emailCache[lead.id] || null
  }));

  res.json({ leads: leadsWithEmails, stats });
});

// Get stats only
app.get('/api/stats', (req, res) => {
  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    generated: leads.filter(l => l.status === 'generated').length,
    sent: leads.filter(l => l.status === 'sent').length,
    skipped: leads.filter(l => l.status === 'skipped').length,
    byCategory: {}
  };

  // Count by category
  for (const category of Object.keys(CATEGORIES)) {
    stats.byCategory[category] = leads.filter(l => l.category === category).length;
  }

  res.json(stats);
});

// Generate batch of emails
app.post('/api/generate-batch', async (req, res) => {
  const { count = 10 } = req.body;

  // Check cooldown
  const now = Date.now();
  if (now - lastBatchTime < BATCH_COOLDOWN) {
    const waitTime = Math.ceil((BATCH_COOLDOWN - (now - lastBatchTime)) / 1000);
    return res.status(429).json({
      error: `Please wait ${waitTime} seconds before generating another batch`
    });
  }

  // Get next unprocessed leads
  const newLeads = leads.filter(l => l.status === 'new').slice(0, count);

  if (newLeads.length === 0) {
    return res.json({
      generated: [],
      message: 'No new leads to process'
    });
  }

  lastBatchTime = now;

  try {
    // Generate emails in parallel with concurrency limit
    const results = await Promise.all(
      newLeads.map(lead =>
        limit(async () => {
          try {
            const email = await generateEmail(lead);

            // Update lead status and cache email
            const leadIndex = leads.findIndex(l => l.id === lead.id);
            if (leadIndex !== -1) {
              leads[leadIndex].status = 'generated';
            }
            emailCache[lead.id] = email;

            return {
              leadId: lead.id,
              success: true,
              email
            };
          } catch (error) {
            return {
              leadId: lead.id,
              success: false,
              error: error.message
            };
          }
        })
      )
    );

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    res.json({
      generated: successful,
      failed: failed,
      message: `Generated ${successful.length} emails${failed.length > 0 ? `, ${failed.length} failed` : ''}`
    });
  } catch (error) {
    console.error('Batch generation error:', error);
    res.status(500).json({ error: 'Failed to generate emails' });
  }
});

// Regenerate single email
app.post('/api/regenerate-email', async (req, res) => {
  const { leadId, operatorNotes, researchResults } = req.body;

  const lead = leads.find(l => l.id === leadId);
  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  try {
    const email = await generateEmail(lead, operatorNotes, researchResults);

    // Update cache and status
    emailCache[lead.id] = email;
    lead.status = 'generated';

    res.json({
      leadId: lead.id,
      success: true,
      email
    });
  } catch (error) {
    console.error('Regenerate error:', error);
    res.status(500).json({ error: 'Failed to regenerate email' });
  }
});

// Research organization (uses web search)
app.post('/api/research-org', async (req, res) => {
  const { leadId } = req.body;

  const lead = leads.find(l => l.id === leadId);
  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      tools: [{
        type: 'web_search_20250305',
        name: 'web_search',
        max_uses: 3
      }],
      messages: [{
        role: 'user',
        content: `Research this nonprofit organization and provide insights for a sales outreach:

Organization: ${lead.organization}
Contact: ${lead.name}
Email: ${lead.email}

Find and summarize:
1. Their mission statement
2. Types of fundraising events they run (galas, auctions, golf tournaments, etc.)
3. Estimated organization size (staff, budget if available)
4. Any recent events or news
5. Their typical donor demographic

Return a brief summary (200 words max) with actionable insights for crafting a personalized outreach email about luxury travel packages for fundraising auctions.`
      }]
    });

    // Extract text from response
    const textContent = response.content.find(c => c.type === 'text');
    const research = textContent ? textContent.text : 'No research results found';

    res.json({
      leadId: lead.id,
      research
    });
  } catch (error) {
    console.error('Research error:', error);
    res.status(500).json({ error: 'Failed to research organization' });
  }
});

// Mark lead(s) as sent
app.post('/api/mark-sent', (req, res) => {
  const { leadIds } = req.body;

  if (!Array.isArray(leadIds)) {
    return res.status(400).json({ error: 'leadIds must be an array' });
  }

  let updated = 0;
  leadIds.forEach(id => {
    const lead = leads.find(l => l.id === id);
    if (lead) {
      lead.status = 'sent';
      updated++;
    }
  });

  res.json({ updated, message: `Marked ${updated} leads as sent` });
});

// Mark lead as skipped
app.post('/api/mark-skipped', (req, res) => {
  const { leadId } = req.body;

  const lead = leads.find(l => l.id === leadId);
  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  lead.status = 'skipped';
  res.json({ success: true, message: 'Lead marked as skipped' });
});

// Update response status for sent emails
app.post('/api/update-response', (req, res) => {
  const { leadId, responseStatus } = req.body;

  if (!['positive', 'negative', 'no_response', null].includes(responseStatus)) {
    return res.status(400).json({ error: 'Invalid response status' });
  }

  const lead = leads.find(l => l.id === leadId);
  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  if (lead.status !== 'sent') {
    return res.status(400).json({ error: 'Can only update response for sent emails' });
  }

  lead.responseStatus = responseStatus;
  res.json({ success: true, message: `Response marked as ${responseStatus || 'cleared'}` });
});

// Reset lead status
app.post('/api/reset-lead', (req, res) => {
  const { leadId } = req.body;

  const lead = leads.find(l => l.id === leadId);
  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  lead.status = 'new';
  delete emailCache[lead.id];
  res.json({ success: true, message: 'Lead reset to new' });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, 'dist')));

  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'dist', 'index.html'));
  });
}

// Initialize and start server
leads = loadLeads();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Loaded ${leads.length} leads`);
});
