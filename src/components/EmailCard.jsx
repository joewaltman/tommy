import { useState, useEffect } from 'react';
import CategoryBadge from './CategoryBadge';
import CopyButton from './CopyButton';

export default function EmailCard({
  lead,
  onMarkSent,
  onSkip,
  collapsed: initialCollapsed = false
}) {
  const [expanded, setExpanded] = useState(!initialCollapsed && lead.status === 'generated');

  const email = lead.generatedEmail;
  const hasEmail = email && email.emailBody;

  // Keyboard shortcuts when card is focused
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!expanded) return;

      if (e.key === 'c' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        copyFullEmail();
      } else if (e.key === 's' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        onMarkSent(lead.id);
      }
    };

    if (expanded) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [expanded, lead.id, email]);

  const copyFullEmail = async () => {
    if (!hasEmail) return;
    const fullEmail = `Subject: ${email.subjectLine}\n\n${email.emailBody}`;
    await navigator.clipboard.writeText(fullEmail);
  };

  const statusColors = {
    new: 'bg-gray-100',
    generated: 'bg-yellow-50 border-yellow-200',
    sent: 'bg-green-50 border-green-200',
    skipped: 'bg-gray-50 border-gray-200'
  };

  return (
    <div className={`email-card rounded-lg border ${statusColors[lead.status]} overflow-hidden`}>
      {/* Collapsed Header */}
      <div
        onClick={() => setExpanded(!expanded)}
        className="px-4 py-3 cursor-pointer hover:bg-white/50 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0">
              {lead.status === 'generated' && (
                <span className="w-2 h-2 bg-yellow-500 rounded-full inline-block"></span>
              )}
              {lead.status === 'sent' && (
                <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span>
              )}
              {lead.status === 'new' && (
                <span className="w-2 h-2 bg-gray-400 rounded-full inline-block"></span>
              )}
              {lead.status === 'skipped' && (
                <span className="w-2 h-2 bg-gray-300 rounded-full inline-block"></span>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900 truncate">{lead.name}</span>
                <CategoryBadge category={lead.category} name={lead.categoryName} color={lead.categoryColor} />
              </div>
              <p className="text-sm text-gray-500 truncate">{lead.organization}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {hasEmail && (
              <span className="text-sm text-gray-500 truncate max-w-[200px]">
                "{email.subjectLine}"
              </span>
            )}
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-200 bg-white">
          {/* Lead Details */}
          <div className="py-3 grid grid-cols-2 gap-4 text-sm border-b border-gray-100">
            <div>
              <span className="text-gray-500">Email:</span>{' '}
              <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline">
                {lead.email}
              </a>
            </div>
            <div>
              <span className="text-gray-500">Phone:</span>{' '}
              <span className="text-gray-900">{lead.phone || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-500">Event Date:</span>{' '}
              <span className="text-gray-900">{lead.dateOfEvent || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-500">Category:</span>{' '}
              <span className="text-gray-900">{lead.categoryName}</span>
            </div>
          </div>

          {hasEmail ? (
            <>
              {/* Subject Line */}
              <div className="py-3 border-b border-gray-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Subject Line</span>
                  <CopyButton text={email.subjectLine} label="Copy" />
                </div>
                <p className="text-gray-900">{email.subjectLine}</p>
              </div>

              {/* Email Body */}
              <div className="py-3 border-b border-gray-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Email Body</span>
                  <CopyButton text={email.emailBody} label="Copy" />
                </div>
                <div className="email-body text-gray-900 bg-gray-50 rounded-lg p-4 text-sm">
                  {email.emailBody}
                </div>
              </div>

              {/* Copy Full Email - Primary Action */}
              <div className="py-3 border-b border-gray-100">
                <button
                  onClick={copyFullEmail}
                  className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Copy Full Email (Subject + Body)
                </button>
              </div>

              {/* Suggested Attachments */}
              {email.suggestedAttachments && email.suggestedAttachments.length > 0 && (
                <div className="py-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-700">Suggested Attachments</span>
                  <ul className="mt-1 space-y-1">
                    {email.suggestedAttachments.map((attachment, i) => (
                      <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        {attachment}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Internal Notes */}
              {email.internalNotes && (
                <div className="py-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-500">Internal Notes</span>
                  <p className="mt-1 text-sm text-gray-500 italic">{email.internalNotes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="pt-3 flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => onMarkSent(lead.id)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  Mark as Sent
                </button>
                <button
                  onClick={() => onSkip(lead.id)}
                  className="px-4 py-2 text-gray-500 hover:text-gray-700 text-sm"
                >
                  Skip
                </button>
              </div>
            </>
          ) : (
            /* No email generated yet */
            <div className="py-6 text-center">
              <p className="text-gray-500">No email generated yet - click "Generate 10 Emails" to generate</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
