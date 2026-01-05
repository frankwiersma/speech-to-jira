'use client';

interface JiraTicket {
  id: string;
  type: 'Story' | 'Task';
  title: string;
  description: string;
  acceptanceCriteria?: string[];
  source?: {
    timestamp?: string;
    fragment?: string;
  };
}

interface TicketCardProps {
  ticket: JiraTicket;
  isExpanded: boolean;
  onToggle: () => void;
  viewMode?: 'list' | 'grid';
}

export default function TicketCard({ ticket, isExpanded, onToggle, viewMode = 'list' }: TicketCardProps) {
  const isGrid = viewMode === 'grid';

  return (
    <div className={`card card-hover ${isGrid ? 'h-full flex flex-col' : ''}`}>
      <div
        className="flex items-start gap-3 cursor-pointer"
        onClick={onToggle}
      >
        <span className={`badge ${ticket.type === 'Story' ? 'badge-story' : 'badge-task'}`}>
          {ticket.type}
        </span>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-slate-900 truncate">
            {ticket.title}
          </h4>
          {!isExpanded && (
            <p className="text-sm text-slate-500 truncate mt-1">
              {ticket.description}
            </p>
          )}
        </div>
        <button className="text-slate-400 hover:text-slate-600">
          <svg
            className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
          {/* Description */}
          <div>
            <h5 className="text-sm font-medium text-slate-700 mb-1">Beschrijving</h5>
            <p className="text-sm text-slate-600 whitespace-pre-wrap">
              {ticket.description}
            </p>
          </div>

          {/* Acceptance Criteria */}
          {ticket.acceptanceCriteria && ticket.acceptanceCriteria.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-slate-700 mb-2">Acceptance Criteria</h5>
              <ul className="space-y-1">
                {ticket.acceptanceCriteria.map((criterion, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-slate-600">
                    <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{criterion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Source */}
          {ticket.source && (ticket.source.timestamp || ticket.source.fragment) && (
            <div className="bg-slate-50 rounded-lg p-3">
              <h5 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Bron</h5>
              {ticket.source.timestamp && (
                <p className="text-xs text-slate-500 mb-1">
                  Timestamp: {ticket.source.timestamp}
                </p>
              )}
              {ticket.source.fragment && (
                <p className="text-sm text-slate-600 italic">
                  &quot;{ticket.source.fragment}&quot;
                </p>
              )}
            </div>
          )}

          {/* ID */}
          <div className="text-xs text-slate-400">
            ID: {ticket.id}
          </div>
        </div>
      )}
    </div>
  );
}
