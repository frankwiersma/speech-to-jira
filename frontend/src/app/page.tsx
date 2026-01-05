'use client';

import { useState } from 'react';
import AudioUploader from '@/components/AudioUploader';
import AudioRecorder from '@/components/AudioRecorder';
import TicketList from '@/components/TicketList';
import ExportButtons from '@/components/ExportButtons';

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

interface ProcessResult {
  transcript: string;
  tickets: JiraTicket[];
  summary: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'record'>('upload');
  const [showTranscript, setShowTranscript] = useState(false);

  const processAudio = async (audioBlob: Blob, filename?: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, filename || 'recording.webm');

      const response = await fetch(`${API_URL}/api/process`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Processing failed');
      }

      setResult({
        transcript: data.transcript,
        tickets: data.tickets,
        summary: data.summary,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = async (file: File) => {
    await processAudio(file, file.name);
  };

  const handleRecordingComplete = async (blob: Blob) => {
    await processAudio(blob);
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setShowTranscript(false);
  };

  const handleLoadDemo = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // Fetch the pre-generated demo audio file
      const response = await fetch('/demo-refinement.mp3');
      if (!response.ok) {
        throw new Error('Demo bestand niet gevonden');
      }

      const blob = await response.blob();
      await processAudio(blob, 'demo-refinement.mp3');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kon demo niet laden');
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Side Panel - Upload/Record */}
      <aside className="w-full lg:w-80 lg:flex-shrink-0">
        <div className="card lg:sticky lg:top-8">
          <div className="flex gap-1 mb-4 bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                activeTab === 'upload' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Upload
            </button>
            <button
              onClick={() => setActiveTab('record')}
              className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                activeTab === 'record' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Opnemen
            </button>
          </div>

          {activeTab === 'upload' ? (
            <AudioUploader onFileSelect={handleFileSelect} disabled={isProcessing} />
          ) : (
            <AudioRecorder onRecordingComplete={handleRecordingComplete} disabled={isProcessing} />
          )}

          {/* Processing Indicator */}
          {isProcessing && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg text-center">
              <div className="inline-flex items-center gap-3">
                <svg className="animate-spin h-5 w-5 text-blue-600" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-blue-700 text-sm">Verwerken...</span>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Reset Button */}
          {result && (
            <>
              <button
                onClick={handleReset}
                className="mt-4 w-full btn btn-secondary text-sm"
              >
                Nieuwe sessie
              </button>

              {/* Summary in sidebar */}
              <div className="mt-4 pt-4 border-t border-slate-200">
                <h3 className="text-sm font-medium text-slate-700 mb-2">Samenvatting</h3>
                <p className="text-sm text-slate-600">{result.summary}</p>
              </div>
            </>
          )}

          {/* Demo Section */}
          {!result && !isProcessing && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <p className="text-xs text-slate-500 mb-3">Probeer een voorbeeld</p>

              {/* Audio Preview */}
              <audio
                controls
                src="/demo-refinement.mp3"
                className="w-full mb-3"
                style={{ height: '40px' }}
              />

              <button
                onClick={handleLoadDemo}
                className="w-full btn btn-primary text-sm"
              >
                Demo verwerken
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content - Results */}
      <main className="flex-1 min-w-0">
        {!result && !isProcessing && (
          <div className="card">
            <h2 className="text-xl font-semibold text-slate-900 mb-6">Hoe werkt het?</h2>

            <div className="space-y-6">
              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-semibold text-sm">
                  1
                </div>
                <div>
                  <h3 className="font-medium text-slate-900">Audio uploaden of opnemen</h3>
                  <p className="text-slate-500 text-sm mt-1">
                    Upload een opname van je refinement sessie (MP3, WAV, M4A) of gebruik de microfoon om direct op te nemen.
                    De audio wordt verwerkt via EU-hosted servers voor privacy compliance.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-semibold text-sm">
                  2
                </div>
                <div>
                  <h3 className="font-medium text-slate-900">Automatische transcriptie</h3>
                  <p className="text-slate-500 text-sm mt-1">
                    De audio wordt omgezet naar tekst met behulp van spraakherkenning.
                    Het systeem herkent Nederlandse taal en meerdere sprekers.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-semibold text-sm">
                  3
                </div>
                <div>
                  <h3 className="font-medium text-slate-900">Ticket generatie</h3>
                  <p className="text-slate-500 text-sm mt-1">
                    AI analyseert het transcript en identificeert user stories en taken.
                    Voor elke ticket wordt een titel, beschrijving en acceptance criteria gegenereerd.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-semibold text-sm">
                  4
                </div>
                <div>
                  <h3 className="font-medium text-slate-900">Controleren en exporteren</h3>
                  <p className="text-slate-500 text-sm mt-1">
                    Bekijk de gegenereerde tickets, vouw ze uit voor details en exporteer naar JSON, CSV of Markdown
                    voor import in Jira of verdere verwerking.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <h3 className="font-medium text-slate-900 mb-2">Ondersteunde formaten</h3>
              <div className="flex gap-2">
                <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded">MP3</span>
                <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded">WAV</span>
                <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded">M4A</span>
                <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded">WebM</span>
              </div>
              <p className="text-slate-400 text-xs mt-2">Maximale bestandsgrootte: 100MB</p>
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-6">
            {/* Transcript (Collapsible) - at top */}
            <section className="card">
              <button
                onClick={() => setShowTranscript(!showTranscript)}
                className="flex items-center justify-between w-full text-left"
              >
                <h2 className="text-lg font-semibold text-slate-900">Transcript</h2>
                <svg
                  className={`w-5 h-5 text-slate-400 transform transition-transform ${showTranscript ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showTranscript && (
                <p className="text-slate-600 whitespace-pre-wrap text-sm mt-3 pt-3 border-t border-slate-100 max-h-64 overflow-y-auto">
                  {result.transcript}
                </p>
              )}
            </section>

            {/* Generated Tickets */}
            <section>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <h2 className="text-lg font-semibold text-slate-900">
                  Gegenereerde Tickets ({result.tickets.length})
                </h2>
                <ExportButtons tickets={result.tickets} />
              </div>
              <TicketList tickets={result.tickets} />
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
