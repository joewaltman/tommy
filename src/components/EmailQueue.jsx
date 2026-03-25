import EmailCard from './EmailCard';

export default function EmailQueue({
  leads,
  onMarkSent,
  onSkip
}) {
  if (leads.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <p className="text-lg mb-2">No leads match your filters</p>
          <p className="text-sm">Try adjusting your search or filters</p>
        </div>
      </div>
    );
  }

  // Group leads by status for display
  const generatedLeads = leads.filter(l => l.status === 'generated');
  const newLeads = leads.filter(l => l.status === 'new');
  const sentLeads = leads.filter(l => l.status === 'sent');
  const skippedLeads = leads.filter(l => l.status === 'skipped');

  return (
    <div className="space-y-6">
      {/* Ready for Review */}
      {generatedLeads.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
            Ready for Review ({generatedLeads.length})
          </h2>
          <div className="space-y-3">
            {generatedLeads.map(lead => (
              <EmailCard
                key={lead.id}
                lead={lead}
                onMarkSent={onMarkSent}
                onSkip={onSkip}
                              />
            ))}
          </div>
        </div>
      )}

      {/* Pending Generation */}
      {newLeads.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
            Pending Generation ({newLeads.length})
          </h2>
          <div className="space-y-3">
            {newLeads.slice(0, 20).map(lead => (
              <EmailCard
                key={lead.id}
                lead={lead}
                onMarkSent={onMarkSent}
                onSkip={onSkip}
                                collapsed
              />
            ))}
            {newLeads.length > 20 && (
              <p className="text-sm text-gray-500 text-center py-2">
                + {newLeads.length - 20} more pending leads
              </p>
            )}
          </div>
        </div>
      )}

      {/* Sent */}
      {sentLeads.length > 0 && (
        <div className="opacity-60">
          <h2 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Sent ({sentLeads.length})
          </h2>
          <div className="space-y-3">
            {sentLeads.slice(0, 10).map(lead => (
              <EmailCard
                key={lead.id}
                lead={lead}
                onMarkSent={onMarkSent}
                onSkip={onSkip}
                                collapsed
              />
            ))}
            {sentLeads.length > 10 && (
              <p className="text-sm text-gray-500 text-center py-2">
                + {sentLeads.length - 10} more sent
              </p>
            )}
          </div>
        </div>
      )}

      {/* Skipped */}
      {skippedLeads.length > 0 && (
        <div className="opacity-40">
          <h2 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-gray-300 rounded-full"></span>
            Skipped ({skippedLeads.length})
          </h2>
          <div className="space-y-3">
            {skippedLeads.slice(0, 5).map(lead => (
              <EmailCard
                key={lead.id}
                lead={lead}
                onMarkSent={onMarkSent}
                onSkip={onSkip}
                                collapsed
              />
            ))}
            {skippedLeads.length > 5 && (
              <p className="text-sm text-gray-500 text-center py-2">
                + {skippedLeads.length - 5} more skipped
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
