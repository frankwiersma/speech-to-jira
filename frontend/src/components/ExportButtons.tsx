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

interface ExportButtonsProps {
  tickets: JiraTicket[];
}

export default function ExportButtons({ tickets }: ExportButtonsProps) {
  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    const content = JSON.stringify(tickets, null, 2);
    downloadFile(content, 'jira-tickets.json', 'application/json');
  };

  const exportCSV = () => {
    const headers = ['ID', 'Type', 'Title', 'Description', 'Acceptance Criteria'];
    const rows = tickets.map(ticket => [
      ticket.id,
      ticket.type,
      `"${ticket.title.replace(/"/g, '""')}"`,
      `"${ticket.description.replace(/"/g, '""')}"`,
      `"${(ticket.acceptanceCriteria || []).join('; ').replace(/"/g, '""')}"`,
    ]);

    const content = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    downloadFile(content, 'jira-tickets.csv', 'text/csv');
  };

  const exportMarkdown = () => {
    const lines: string[] = ['# Generated Jira Tickets\n'];

    const stories = tickets.filter(t => t.type === 'Story');
    const tasks = tickets.filter(t => t.type === 'Task');

    if (stories.length > 0) {
      lines.push('## Stories\n');
      stories.forEach(ticket => {
        lines.push(`### ${ticket.title}`);
        lines.push(`**ID:** ${ticket.id}\n`);
        lines.push(`**Description:**`);
        lines.push(`${ticket.description}\n`);
        if (ticket.acceptanceCriteria && ticket.acceptanceCriteria.length > 0) {
          lines.push('**Acceptance Criteria:**');
          ticket.acceptanceCriteria.forEach(ac => {
            lines.push(`- [ ] ${ac}`);
          });
          lines.push('');
        }
        lines.push('---\n');
      });
    }

    if (tasks.length > 0) {
      lines.push('## Tasks\n');
      tasks.forEach(ticket => {
        lines.push(`### ${ticket.title}`);
        lines.push(`**ID:** ${ticket.id}\n`);
        lines.push(`**Description:**`);
        lines.push(`${ticket.description}\n`);
        lines.push('---\n');
      });
    }

    const content = lines.join('\n');
    downloadFile(content, 'jira-tickets.md', 'text/markdown');
  };

  if (tickets.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={exportJSON}
        className="btn btn-secondary text-xs sm:text-sm flex items-center gap-1"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        JSON
      </button>
      <button
        onClick={exportCSV}
        className="btn btn-secondary text-xs sm:text-sm flex items-center gap-1"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        CSV
      </button>
      <button
        onClick={exportMarkdown}
        className="btn btn-secondary text-xs sm:text-sm flex items-center gap-1"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        MD
      </button>
    </div>
  );
}
