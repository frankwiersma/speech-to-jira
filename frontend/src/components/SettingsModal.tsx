'use client';

import { useState, useEffect } from 'react';
import { getKeys, saveKeys, type ApiKeys } from '@/lib/apiKeys';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SettingsModal({ open, onClose }: Props) {
  const [values, setValues] = useState<ApiKeys>({
    deepgramKey: '',
    azureKey: '',
    azureEndpoint: '',
    azureDeployment: 'gpt-4o',
  });
  const [show, setShow] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (open) {
      setValues(getKeys());
      setSaved(false);
    }
  }, [open]);

  if (!open) return null;

  const handleSave = () => {
    saveKeys(values);
    setSaved(true);
    setTimeout(onClose, 500);
  };

  const canSave = !!(
    values.deepgramKey.trim() &&
    values.azureKey.trim() &&
    values.azureEndpoint.trim()
  );

  const Field = ({
    id,
    label,
    hint,
    link,
    linkLabel,
    placeholder,
    required,
  }: {
    id: keyof ApiKeys;
    label: string;
    hint: string;
    link?: string;
    linkLabel?: string;
    placeholder: string;
    required?: boolean;
  }) => (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-medium text-slate-700">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
        {link && (
          <a href={link} target="_blank" rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:text-blue-800">
            {linkLabel}
          </a>
        )}
      </div>
      <div className="relative">
        <input
          type={show[id] ? 'text' : 'password'}
          value={values[id]}
          onChange={(e) => setValues((v) => ({ ...v, [id]: e.target.value }))}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 pr-10 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow((s) => ({ ...s, [id]: !s[id] }))}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          {show[id] ? (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">🔑 API Keys</h2>
            <p className="text-xs text-slate-500 mt-0.5">Stored only in your browser — never sent to a server.</p>
          </div>
          <button onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Fields */}
        <div className="px-6 py-5 space-y-5">
          <Field
            id="deepgramKey"
            label="Deepgram API Key"
            placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            hint="Required for speech-to-text transcription (EU endpoint, GDPR-compliant)."
            link="https://console.deepgram.com/"
            linkLabel="console.deepgram.com →"
            required
          />
          <Field
            id="azureEndpoint"
            label="Azure OpenAI Endpoint"
            placeholder="https://your-resource.cognitiveservices.azure.com"
            hint="Required for AI ticket generation from transcripts."
            link="https://portal.azure.com"
            linkLabel="Azure Portal →"
            required
          />
          <Field
            id="azureKey"
            label="Azure OpenAI API Key"
            placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            hint="Your Azure OpenAI resource key."
            required
          />
          <Field
            id="azureDeployment"
            label="Azure OpenAI Deployment"
            placeholder="gpt-4o"
            hint="Name of your GPT-4o deployment. Default: gpt-4o"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
          <p className="text-xs text-slate-400">* All fields required except deployment name</p>
          <div className="flex gap-2">
            <button onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-slate-500 hover:text-slate-700">
              Cancel
            </button>
            <button onClick={handleSave} disabled={!canSave}
              className={`rounded-lg px-5 py-2 text-sm font-semibold transition ${
                saved ? 'bg-green-600 text-white' :
                canSave ? 'bg-blue-600 text-white hover:bg-blue-700' :
                'cursor-not-allowed bg-slate-200 text-slate-400'
              }`}>
              {saved ? '✓ Saved!' : 'Save Keys'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
