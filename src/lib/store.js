// localStorage persistence for lead statuses and generated emails

const STORAGE_KEY = 'hga_email_generator';

export function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load state from localStorage:', e);
  }
  return {
    leadStatuses: {}, // { leadId: status }
    generatedEmails: {}, // { leadId: emailData }
    operatorNotes: {}, // { leadId: notes }
    responseStatuses: {} // { leadId: 'positive' | 'negative' | 'no_response' }
  };
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state to localStorage:', e);
  }
}

export function updateLeadStatus(leadId, status) {
  const state = loadState();
  state.leadStatuses[leadId] = status;
  saveState(state);
}

export function saveGeneratedEmail(leadId, emailData) {
  const state = loadState();
  state.generatedEmails[leadId] = emailData;
  state.leadStatuses[leadId] = 'generated';
  saveState(state);
}

export function saveOperatorNotes(leadId, notes) {
  const state = loadState();
  state.operatorNotes[leadId] = notes;
  saveState(state);
}

export function getOperatorNotes(leadId) {
  const state = loadState();
  return state.operatorNotes[leadId] || '';
}

export function resetAll() {
  localStorage.removeItem(STORAGE_KEY);
}

export function mergeServerState(leads, serverEmails) {
  const state = loadState();

  // Merge server emails into local state
  if (serverEmails) {
    Object.assign(state.generatedEmails, serverEmails);
    saveState(state);
  }

  // Apply local state to leads
  return leads.map(lead => ({
    ...lead,
    status: state.leadStatuses[lead.id] || lead.status,
    generatedEmail: state.generatedEmails[lead.id] || lead.generatedEmail,
    responseStatus: state.responseStatuses?.[lead.id] || lead.responseStatus || null
  }));
}
