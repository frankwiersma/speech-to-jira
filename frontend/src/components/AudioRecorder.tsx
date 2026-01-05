'use client';

import { useState, useRef, useEffect } from 'react';

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  disabled?: boolean;
}

export default function AudioRecorder({ onRecordingComplete, disabled }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
    } catch (err) {
      setError('Kon geen toegang krijgen tot de microfoon. Controleer de browser permissies.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleSubmit = () => {
    if (audioBlob) {
      onRecordingComplete(audioBlob);
      setAudioBlob(null);
      setDuration(0);
    }
  };

  const handleDiscard = () => {
    setAudioBlob(null);
    setDuration(0);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {!audioBlob ? (
        <div className="text-center py-8">
          <div className="mb-6">
            <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${isRecording ? 'bg-red-100 animate-pulse' : 'bg-slate-100'}`}>
              <svg className={`w-12 h-12 ${isRecording ? 'text-red-600' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
          </div>

          {isRecording && (
            <p className="text-2xl font-mono text-slate-900 mb-4">
              {formatDuration(duration)}
            </p>
          )}

          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={disabled}
            className={`btn ${isRecording ? 'bg-red-600 hover:bg-red-700 text-white' : 'btn-primary'} px-8`}
          >
            {isRecording ? 'Stop Opname' : 'Start Opname'}
          </button>

          {!isRecording && (
            <p className="text-sm text-slate-400 mt-4">
              Klik om de microfoon te activeren en te starten met opnemen
            </p>
          )}
        </div>
      ) : (
        <div className="bg-slate-50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-slate-900">Opname voltooid</p>
                <p className="text-sm text-slate-500">Duur: {formatDuration(duration)}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDiscard}
                className="btn btn-secondary text-sm"
                disabled={disabled}
              >
                Verwijder
              </button>
              <button
                onClick={handleSubmit}
                className="btn btn-primary text-sm"
                disabled={disabled}
              >
                Verwerk Opname
              </button>
            </div>
          </div>

          {/* Audio Preview */}
          <audio
            controls
            src={URL.createObjectURL(audioBlob)}
            className="w-full mt-4"
          />
        </div>
      )}
    </div>
  );
}
