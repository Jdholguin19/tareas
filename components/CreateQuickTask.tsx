import React, { useState, useRef } from 'react';
import type { Task } from '../types';
import { createQuickTask, transcribeAudio, uploadFile } from '../services/apiService';
import { Icon } from './Icon';

interface CreateQuickTaskProps {
  onTaskCreated: (task: Task) => void;
}

export const CreateQuickTask: React.FC<CreateQuickTaskProps> = ({ onTaskCreated }) => {
  const [title, setTitle] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const resetForm = () => {
    setTitle('');
    setAttachments([]);
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setIsSaving(true);
    try {
      const newTask = await createQuickTask(title, attachments);
      onTaskCreated(newTask);
      resetForm();
    } catch (error) {
      console.error("Error creating task:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleMicClick = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];
        mediaRecorderRef.current.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };
        mediaRecorderRef.current.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const audioFile = new File([audioBlob], "recording.webm", { type: "audio/webm" });
          setIsTranscribing(true);
          try {
            const { transcription } = await transcribeAudio(audioFile);
            setTitle(prev => prev ? `${prev}\n${transcription}`: transcription);
          } catch (error) {
            console.error("Error transcribing audio:", error);
          } finally {
            setIsTranscribing(false);
          }
          stream.getTracks().forEach(track => track.stop()); // Stop mic access
        };
        mediaRecorderRef.current.start();
        setIsRecording(true);
      } catch (error) {
        console.error("Error accessing microphone:", error);
        alert("No se pudo acceder al micrófono. Por favor, revisa los permisos.");
      }
    }
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
        const { url } = await uploadFile(file);
        setAttachments(prev => [...prev, url]);
    } catch(error) {
        console.error("Error uploading file:", error);
    } finally {
        setIsUploading(false);
        if(fileInputRef.current) fileInputRef.current.value = ""; // Reset file input
    }
  };

  const isLoading = isSaving || isTranscribing || isUploading;

  return (
    <div className="bg-white p-4 rounded-2xl shadow-lg transition-all duration-300 focus-within:ring-2 focus-within:ring-blue-500">
      <textarea
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="¿Qué necesitas hacer? Escribe o usa el micrófono..."
        aria-label="Descripción de la tarea"
        className="w-full h-20 sm:h-24 p-3 text-base sm:text-lg border-0 resize-none focus:ring-0 placeholder-slate-400 bg-transparent"
        disabled={isLoading}
      />
      
      {attachments.length > 0 && (
          <div className="px-3 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-500 mb-2">Adjuntos:</h4>
              <ul className="flex flex-wrap gap-2">
                  {attachments.map((url, index) => (
                      <li key={index} className="flex items-center bg-slate-100 rounded-full px-3 py-1 text-sm text-slate-700">
                          <Icon name="clip" className="w-4 h-4 mr-2"/>
                          <span>{url.split('/').pop()}</span>
                      </li>
                  ))}
              </ul>
          </div>
      )}

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pt-3 mt-2 border-t border-slate-100 space-y-2 sm:space-y-0">
        <div className="flex items-center space-x-2">
          <button onClick={handleMicClick} className={`p-2 rounded-full transition-colors ${isRecording ? 'bg-red-100 text-red-600 animate-pulse' : 'hover:bg-slate-100 text-slate-500'}`} aria-label={isRecording ? 'Detener grabación' : 'Iniciar grabación'}>
            <Icon name="mic" className="w-6 h-6"/>
          </button>
          <button onClick={handleAttachmentClick} className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors" aria-label="Adjuntar archivo">
            <Icon name="clip" className="w-6 h-6"/>
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" aria-label="Adjuntar archivo" />
          
          {(isTranscribing || isUploading) && (
            <div className="flex items-center space-x-2 text-sm text-slate-500">
                <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin"></div>
                <span>{isTranscribing ? 'Transcribiendo...' : 'Subiendo...'}</span>
            </div>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={!title.trim() || isLoading}
          className="bg-blue-600 text-white font-semibold px-4 py-2 sm:px-6 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center shadow-sm hover:shadow-md"
        >
          {isSaving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div> : <Icon name="plus" className="w-5 h-5 mr-2" />}
          Guardar
        </button>
      </div>
      <div className="text-center mt-3">
          <p className="text-xs text-slate-400">Transcripción por OpenAI Whisper</p>
      </div>
    </div>
  );
};