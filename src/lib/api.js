// Frontend API client for all backend endpoints

const API_BASE = '/api';

async function fetchJson(url, options = {}) {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function getLeads() {
  return fetchJson('/leads');
}

export async function getStats() {
  return fetchJson('/stats');
}

export async function generateBatch(count = 10) {
  return fetchJson('/generate-batch', {
    method: 'POST',
    body: JSON.stringify({ count })
  });
}

export async function regenerateEmail(leadId, operatorNotes = '', researchResults = '') {
  return fetchJson('/regenerate-email', {
    method: 'POST',
    body: JSON.stringify({ leadId, operatorNotes, researchResults })
  });
}

export async function researchOrg(leadId) {
  return fetchJson('/research-org', {
    method: 'POST',
    body: JSON.stringify({ leadId })
  });
}

export async function markSent(leadIds) {
  return fetchJson('/mark-sent', {
    method: 'POST',
    body: JSON.stringify({ leadIds: Array.isArray(leadIds) ? leadIds : [leadIds] })
  });
}

export async function markSkipped(leadId) {
  return fetchJson('/mark-skipped', {
    method: 'POST',
    body: JSON.stringify({ leadId })
  });
}

export async function resetLead(leadId) {
  return fetchJson('/reset-lead', {
    method: 'POST',
    body: JSON.stringify({ leadId })
  });
}

export async function updateResponse(leadId, responseStatus) {
  return fetchJson('/update-response', {
    method: 'POST',
    body: JSON.stringify({ leadId, responseStatus })
  });
}
