import { useState, useEffect, useCallback } from 'react';
import ControlPanel from './components/ControlPanel';
import EmailQueue from './components/EmailQueue';
import * as api from './lib/api';
import { loadState, saveState, mergeServerState, resetAll } from './lib/store';

export default function App() {
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState({ total: 0, new: 0, generated: 0, sent: 0, skipped: 0 });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generateProgress, setGenerateProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [responseFilter, setResponseFilter] = useState('all');
  const [minDays, setMinDays] = useState('');
  const [maxDays, setMaxDays] = useState('');

  // Calculate days until annual event (ignores year, uses month/day only)
  const getDaysUntilEvent = (dateOfEvent) => {
    if (!dateOfEvent) return null;

    // Parse MM/DD/YYYY or MM/DD format
    const parts = dateOfEvent.split('/');
    if (parts.length < 2) return null;

    const eventMonth = parseInt(parts[0], 10) - 1; // JS months are 0-indexed
    const eventDay = parseInt(parts[1], 10);

    if (isNaN(eventMonth) || isNaN(eventDay)) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Try this year first
    let eventDate = new Date(today.getFullYear(), eventMonth, eventDay);

    // If the date has passed this year, use next year
    if (eventDate < today) {
      eventDate = new Date(today.getFullYear() + 1, eventMonth, eventDay);
    }

    const diffTime = eventDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  };

  // Load leads on mount
  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const data = await api.getLeads();

      // Merge with local state
      const mergedLeads = mergeServerState(data.leads);
      setLeads(mergedLeads);

      // Recalculate stats based on merged state
      const newStats = {
        total: mergedLeads.length,
        new: mergedLeads.filter(l => l.status === 'new').length,
        generated: mergedLeads.filter(l => l.status === 'generated').length,
        sent: mergedLeads.filter(l => l.status === 'sent').length,
        skipped: mergedLeads.filter(l => l.status === 'skipped').length
      };
      setStats(newStats);
      setError(null);
    } catch (err) {
      setError('Failed to load leads: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Check if any filters are active
  const hasActiveFilters = () => {
    return searchQuery || categoryFilter !== 'all' || minDays !== '' || maxDays !== '';
  };

  // Get filtered "new" lead IDs for generation
  const getFilteredNewLeadIds = () => {
    return leads.filter(lead => {
      // Must be new status
      if (lead.status !== 'new') return false;

      // Apply same filters as display
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          lead.name.toLowerCase().includes(query) ||
          lead.organization.toLowerCase().includes(query) ||
          lead.email.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      if (categoryFilter !== 'all' && lead.category !== categoryFilter) {
        return false;
      }

      // Date filter
      if (minDays !== '' || maxDays !== '') {
        const daysUntil = getDaysUntilEvent(lead.dateOfEvent);
        if (daysUntil === null) return false;
        if (minDays !== '' && daysUntil < parseInt(minDays, 10)) return false;
        if (maxDays !== '' && daysUntil > parseInt(maxDays, 10)) return false;
      }

      return true;
    }).map(lead => lead.id);
  };

  const handleGenerateBatch = async (count = 10) => {
    try {
      setGenerating(true);
      setGenerateProgress({ current: 0, total: count });
      setError(null);

      // Pass filtered lead IDs if filters are active
      const leadIds = hasActiveFilters() ? getFilteredNewLeadIds() : null;
      const result = await api.generateBatch(count, leadIds);

      // Update leads with new emails
      setLeads(prevLeads => {
        const updatedLeads = [...prevLeads];
        result.generated.forEach(({ leadId, email }) => {
          const index = updatedLeads.findIndex(l => l.id === leadId);
          if (index !== -1) {
            updatedLeads[index] = {
              ...updatedLeads[index],
              status: 'generated',
              generatedEmail: email
            };
          }

          // Save to local storage
          const state = loadState();
          state.generatedEmails[leadId] = email;
          state.leadStatuses[leadId] = 'generated';
          saveState(state);
        });
        return updatedLeads;
      });

      // Update stats
      setStats(prev => ({
        ...prev,
        new: prev.new - result.generated.length,
        generated: prev.generated + result.generated.length
      }));

      showToast(result.message);
    } catch (err) {
      setError(err.message);
      showToast(err.message, 'error');
    } finally {
      setGenerating(false);
      setGenerateProgress({ current: 0, total: 0 });
    }
  };

  const handleMarkSent = async (leadId) => {
    try {
      await api.markSent([leadId]);

      setLeads(prevLeads => {
        const updatedLeads = [...prevLeads];
        const index = updatedLeads.findIndex(l => l.id === leadId);
        if (index !== -1) {
          updatedLeads[index] = { ...updatedLeads[index], status: 'sent' };
        }
        return updatedLeads;
      });

      // Update local storage
      const state = loadState();
      state.leadStatuses[leadId] = 'sent';
      saveState(state);

      setStats(prev => ({
        ...prev,
        generated: prev.generated - 1,
        sent: prev.sent + 1
      }));

      showToast('Marked as sent');
    } catch (err) {
      showToast('Failed to mark as sent', 'error');
    }
  };

  const handleSkip = async (leadId) => {
    try {
      await api.markSkipped(leadId);

      setLeads(prevLeads => {
        const updatedLeads = [...prevLeads];
        const index = updatedLeads.findIndex(l => l.id === leadId);
        if (index !== -1) {
          const prevStatus = updatedLeads[index].status;
          updatedLeads[index] = { ...updatedLeads[index], status: 'skipped' };
        }
        return updatedLeads;
      });

      // Update local storage
      const state = loadState();
      state.leadStatuses[leadId] = 'skipped';
      saveState(state);

      setStats(prev => ({
        ...prev,
        generated: prev.generated - 1,
        skipped: prev.skipped + 1
      }));

      showToast('Lead skipped');
    } catch (err) {
      showToast('Failed to skip lead', 'error');
    }
  };

  const handleRegenerate = async (leadId, operatorNotes = '') => {
    try {
      const result = await api.regenerateEmail(leadId, operatorNotes);

      setLeads(prevLeads => {
        const updatedLeads = [...prevLeads];
        const index = updatedLeads.findIndex(l => l.id === leadId);
        if (index !== -1) {
          updatedLeads[index] = {
            ...updatedLeads[index],
            status: 'generated',
            generatedEmail: result.email
          };
        }
        return updatedLeads;
      });

      // Update local storage
      const state = loadState();
      state.generatedEmails[leadId] = result.email;
      state.leadStatuses[leadId] = 'generated';
      saveState(state);

      showToast('Email regenerated');
      return result;
    } catch (err) {
      showToast('Failed to regenerate: ' + err.message, 'error');
      throw err;
    }
  };

  const handleResearchAndRegenerate = async (leadId) => {
    try {
      showToast('Researching organization...', 'info');
      const researchResult = await api.researchOrg(leadId);

      showToast('Generating personalized email...', 'info');
      const result = await api.regenerateEmail(leadId, '', researchResult.research);

      setLeads(prevLeads => {
        const updatedLeads = [...prevLeads];
        const index = updatedLeads.findIndex(l => l.id === leadId);
        if (index !== -1) {
          updatedLeads[index] = {
            ...updatedLeads[index],
            status: 'generated',
            generatedEmail: result.email
          };
        }
        return updatedLeads;
      });

      // Update local storage
      const state = loadState();
      state.generatedEmails[leadId] = result.email;
      state.leadStatuses[leadId] = 'generated';
      saveState(state);

      showToast('Email generated with research');
    } catch (err) {
      showToast('Failed: ' + err.message, 'error');
    }
  };

  const handleUpdateResponse = async (leadId, responseStatus) => {
    try {
      await api.updateResponse(leadId, responseStatus);

      setLeads(prevLeads => {
        const updatedLeads = [...prevLeads];
        const index = updatedLeads.findIndex(l => l.id === leadId);
        if (index !== -1) {
          updatedLeads[index] = { ...updatedLeads[index], responseStatus };
        }
        return updatedLeads;
      });

      // Update local storage
      const state = loadState();
      state.responseStatuses = state.responseStatuses || {};
      if (responseStatus) {
        state.responseStatuses[leadId] = responseStatus;
      } else {
        delete state.responseStatuses[leadId];
      }
      saveState(state);

      showToast(responseStatus ? `Marked as ${responseStatus.replace('_', ' ')}` : 'Response cleared');
    } catch (err) {
      showToast('Failed to update response', 'error');
    }
  };

  const handleResetAll = () => {
    if (confirm('Reset all progress? This will clear all generated emails and statuses.')) {
      resetAll();
      loadLeads();
      showToast('All progress reset');
    }
  };

  // Filter leads
  const filteredLeads = leads.filter(lead => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        lead.name.toLowerCase().includes(query) ||
        lead.organization.toLowerCase().includes(query) ||
        lead.email.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Category filter
    if (categoryFilter !== 'all' && lead.category !== categoryFilter) {
      return false;
    }

    // Status filter
    if (statusFilter !== 'all' && lead.status !== statusFilter) {
      return false;
    }

    // Response filter (only applies to sent emails)
    if (responseFilter !== 'all') {
      if (lead.status !== 'sent') {
        // If filtering by response, only show sent emails
        return false;
      }
      if (responseFilter === 'untracked') {
        if (lead.responseStatus) return false;
      } else {
        if (lead.responseStatus !== responseFilter) return false;
      }
    }

    // Date filter (days until event)
    if (minDays !== '' || maxDays !== '') {
      const daysUntil = getDaysUntilEvent(lead.dateOfEvent);

      if (daysUntil === null) {
        // If no valid date, exclude when filtering by date
        if (minDays !== '' || maxDays !== '') return false;
      } else {
        if (minDays !== '' && daysUntil < parseInt(minDays, 10)) return false;
        if (maxDays !== '' && daysUntil > parseInt(maxDays, 10)) return false;
      }
    }

    return true;
  });

  // Sort: pending review (generated) first, then sent/skipped
  const sortedLeads = [...filteredLeads].sort((a, b) => {
    const statusOrder = { generated: 0, new: 1, sent: 2, skipped: 3 };
    return (statusOrder[a.status] || 4) - (statusOrder[b.status] || 4);
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading leads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">HGA Fundraising Email Generator</h1>
            <p className="text-sm text-gray-500">Generate personalized outreach for nonprofit leads</p>
          </div>
          <button
            onClick={handleResetAll}
            className="text-sm text-gray-500 hover:text-red-600"
          >
            Reset All
          </button>
        </div>
      </header>

      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg toast-enter ${
          toast.type === 'error' ? 'bg-red-500' :
          toast.type === 'info' ? 'bg-blue-500' :
          'bg-green-500'
        } text-white`}>
          {toast.message}
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mx-6 mt-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Main content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Left panel - Controls */}
        <div className="w-72 bg-white border-r border-gray-200 p-4 overflow-y-auto">
          <ControlPanel
            stats={stats}
            filteredNewCount={hasActiveFilters() ? getFilteredNewLeadIds().length : null}
            generating={generating}
            generateProgress={generateProgress}
            onGenerate={handleGenerateBatch}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            categoryFilter={categoryFilter}
            onCategoryChange={setCategoryFilter}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            responseFilter={responseFilter}
            onResponseChange={setResponseFilter}
            minDays={minDays}
            onMinDaysChange={setMinDays}
            maxDays={maxDays}
            onMaxDaysChange={setMaxDays}
          />
        </div>

        {/* Right panel - Email Queue */}
        <div className="flex-1 overflow-y-auto p-6">
          <EmailQueue
            leads={sortedLeads}
            onMarkSent={handleMarkSent}
            onSkip={handleSkip}
            onRegenerate={handleRegenerate}
            onResearchAndRegenerate={handleResearchAndRegenerate}
            onUpdateResponse={handleUpdateResponse}
          />
        </div>
      </div>
    </div>
  );
}
