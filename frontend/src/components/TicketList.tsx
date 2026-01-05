'use client';

import { useState } from 'react';
import TicketCard from './TicketCard';

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

interface TicketListProps {
  tickets: JiraTicket[];
}

export default function TicketList({ tickets }: TicketListProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');

  const stories = tickets.filter(t => t.type === 'Story');
  const tasks = tickets.filter(t => t.type === 'Task');

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedIds(new Set(tickets.map(t => t.id)));
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  const allExpanded = expandedIds.size === tickets.length;
  const noneExpanded = expandedIds.size === 0;

  if (tickets.length === 0) {
    return (
      <div className="card text-center py-8">
        <p className="text-slate-500">Geen tickets gegenereerd</p>
      </div>
    );
  }

  const containerClass = viewMode === 'grid'
    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
    : 'space-y-3';

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        {/* Expand/Collapse All */}
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            disabled={allExpanded}
            className="btn btn-secondary text-sm disabled:opacity-50"
          >
            Alles uitklappen
          </button>
          <button
            onClick={collapseAll}
            disabled={noneExpanded}
            className="btn btn-secondary text-sm disabled:opacity-50"
          >
            Alles inklappen
          </button>
        </div>

        {/* View Toggle */}
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-slate-200'}`}
            title="Lijst weergave"
          >
            <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-slate-200'}`}
            title="Grid weergave"
          >
            <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            </svg>
          </button>
        </div>
      </div>

      {stories.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-3">
            Stories ({stories.length})
          </h3>
          <div className={containerClass}>
            {stories.map(ticket => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                isExpanded={expandedIds.has(ticket.id)}
                onToggle={() => toggleExpand(ticket.id)}
                viewMode={viewMode}
              />
            ))}
          </div>
        </div>
      )}

      {tasks.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-3">
            Tasks ({tasks.length})
          </h3>
          <div className={containerClass}>
            {tasks.map(ticket => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                isExpanded={expandedIds.has(ticket.id)}
                onToggle={() => toggleExpand(ticket.id)}
                viewMode={viewMode}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
