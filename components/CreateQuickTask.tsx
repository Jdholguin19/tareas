import React, { useState, useRef, useEffect } from 'react';
import type { Task } from '../types';
import { createQuickTask, transcribeAudio, searchUsers, assignUserToTask, updateTask } from '../services/apiService';
import { Icon } from './Icon';
import { AttachmentUploadModal } from './AttachmentUploadModal';

interface CreateQuickTaskProps {
  onTaskCreated: (task: Task) => void;
}

interface FilePreview {
  file: File;
  previewUrl: string;
  type: 'image' | 'video' | 'document';
}

export const CreateQuickTask: React.FC<CreateQuickTaskProps> = ({ onTaskCreated }) => {
  const [title, setTitle] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [pendingTaskId, setPendingTaskId] = useState<number | null>(null);
  
  // New state for file preview system
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<FilePreview[]>([]);
  
  // Advanced mode state
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [description, setDescription] = useState('');
  const [assignedUsers, setAssignedUsers] = useState<{id: number, username: string, email: string}[]>([]);
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<{id: number, username: string, email: string}[]>([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const userSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      filePreviews.forEach(preview => {
        if (preview.type === 'video' && preview.previewUrl) {
          URL.revokeObjectURL(preview.previewUrl);
        }
      });
    };
  }, [filePreviews]);

  // Handle paste event for images
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const blob = item.getAsFile();
          if (!blob) continue;

          // Create file from blob
          const file = new File([blob], `pasted-image-${Date.now()}.png`, { type: blob.type });
          
          // Add to pending files
          setPendingFiles(prev => [...prev, file]);
          
          // Generate preview
          const reader = new FileReader();
          reader.onload = (e) => {
            setFilePreviews(prev => [...prev, {
              file,
              previewUrl: e.target?.result as string || '',
              type: 'image'
            }]);
          };
          reader.readAsDataURL(file);
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, []);

  const resetForm = () => {
    setTitle('');
    setAttachments([]);
    setPendingTaskId(null);
    setPendingFiles([]);
    setDescription('');
    setAssignedUsers([]);
    setStartDate('');
    setDueDate('');
    setUserSearchQuery('');
    setUserSearchResults([]);
    setShowUserDropdown(false);
    // Cleanup preview URLs
    filePreviews.forEach(preview => {
      if (preview.type === 'video' && preview.previewUrl) {
        URL.revokeObjectURL(preview.previewUrl);
      }
    });
    setFilePreviews([]);
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setIsSaving(true);
    try {
      let newTask = await createQuickTask(title, attachments);
      
      // If advanced mode is active, update task with additional fields
      if (isAdvancedMode) {
        // Build minimal update payload and only include dates if user explicitly set them
        const updatePayload: any = { ID: newTask.ID };
        if (description && description.trim() !== '') updatePayload.Descripcion = description;
        if (startDate && startDate.trim() !== '') updatePayload.Fecha_Inicio = startDate;
        if (dueDate && dueDate.trim() !== '') updatePayload.Fecha_Vencimiento = dueDate;

        try {
          // Only call updateTask if there's something to update
          if (Object.keys(updatePayload).length > 1) {
            newTask = await updateTask(updatePayload as Task);
          }
        } catch (error) {
          console.error("Error updating task with advanced fields:", error);
        }
        
        // Assign users if any
        if (assignedUsers.length > 0) {
          for (const user of assignedUsers) {
            try {
              await assignUserToTask(newTask.ID, user.id);
            } catch (error) {
              console.error(`Error assigning user ${user.username}:`, error);
            }
          }
        }
      }
      
      onTaskCreated(newTask);
      
      // Upload all pending files
      if (pendingFiles.length > 0) {
        for (const file of pendingFiles) {
          const formData = new FormData();
          formData.append('tarea_id', newTask.ID.toString());
          formData.append('file', file);
          
          try {
            await fetch('/api/uploadToSharePoint.php', {
              method: 'POST',
              credentials: 'include',
              body: formData
            });
          } catch (error) {
            console.error("Error uploading file:", error);
          }
        }
      }
      
      // Reset everything
      resetForm();
    } catch (error) {
      console.error("Error creating task:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenAttachmentModal = () => {
    // Open attachment upload modal
    setShowAttachmentModal(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    files.forEach(file => {
      // Add to pending files
      setPendingFiles(prev => [...prev, file]);
      
      // Generate preview based on file type
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFilePreviews(prev => [...prev, {
            file,
            previewUrl: e.target?.result as string || '',
            type: 'image'
          }]);
        };
        reader.readAsDataURL(file);
      } else if (file.type.startsWith('video/')) {
        const url = URL.createObjectURL(file);
        setFilePreviews(prev => [...prev, {
          file,
          previewUrl: url,
          type: 'video'
        }]);
      } else {
        setFilePreviews(prev => [...prev, {
          file,
          previewUrl: '',
          type: 'document'
        }]);
      }
    });
    
    // Clear input so same file can be selected again
    e.target.value = '';
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    files.forEach(file => {
      // Add to pending files
      setPendingFiles(prev => [...prev, file]);
      
      // Generate preview for captured photo
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreviews(prev => [...prev, {
          file,
          previewUrl: e.target?.result as string || '',
          type: 'image'
        }]);
      };
      reader.readAsDataURL(file);
    });
    
    // Clear input so camera can be used again
    e.target.value = '';
  };

  const removePreview = (index: number) => {
    const preview = filePreviews[index];
    
    // Cleanup video URL if needed
    if (preview.type === 'video' && preview.previewUrl) {
      URL.revokeObjectURL(preview.previewUrl);
    }
    
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
    setFilePreviews(prev => prev.filter((_, i) => i !== index));
  };
  
  // User search functionality
  const handleUserSearch = async (query: string) => {
    setUserSearchQuery(query);
    
    if (userSearchTimeoutRef.current) {
      clearTimeout(userSearchTimeoutRef.current);
    }
    
    if (!query.trim()) {
      setUserSearchResults([]);
      setShowUserDropdown(false);
      return;
    }
    
    userSearchTimeoutRef.current = setTimeout(async () => {
      setIsSearchingUsers(true);
      try {
        const users = await searchUsers(query);
        setUserSearchResults(users);
        setShowUserDropdown(true);
      } catch (error) {
        console.error('Error searching users:', error);
      } finally {
        setIsSearchingUsers(false);
      }
    }, 300);
  };
  
  const handleUserSelect = (user: {id: number, username: string, email: string}) => {
    if (!assignedUsers.find(u => u.id === user.id)) {
      setAssignedUsers(prev => [...prev, user]);
    }
    setUserSearchQuery('');
    setUserSearchResults([]);
    setShowUserDropdown(false);
  };
  
  const handleRemoveAssignee = (userId: number) => {
    setAssignedUsers(prev => prev.filter(u => u.id !== userId));
  };
  
  const handleUserSearchBlur = () => {
    setTimeout(() => {
      setShowUserDropdown(false);
    }, 200);
  };

  const handleAttachmentUploadSuccess = () => {
    // Refrescar la lista de tareas o hacer algo después de subir
    setShowAttachmentModal(false);
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

  const isLoading = isSaving || isTranscribing;

  return (
    <>
      <div className="bg-white p-4 rounded-2xl shadow-lg transition-all duration-300 focus-within:ring-2 focus-within:ring-blue-500">
        {/* Contenedor relativo para posicionar el micrófono dentro del textarea en móviles */}
        <div className="relative">
          <textarea
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ingresa tu tarea escribe o usa el micrófono..."
            aria-label="Descripción de la tarea"
            className="w-full h-20 sm:h-24 p-3 pr-14 sm:pr-3 text-base sm:text-lg border-0 resize-none focus:ring-0 placeholder-slate-400 bg-transparent"
            disabled={isLoading}
          />
          
          {/* Botón de micrófono dentro del textarea solo en móviles */}
          <button 
            onClick={handleMicClick} 
            className={`absolute right-2 top-2 p-2.5 rounded-full border-2 transition-colors sm:hidden ${isRecording ? 'bg-red-100 text-red-600 border-red-300 animate-pulse' : 'hover:bg-slate-100 text-slate-500 border-slate-300'}`} 
            aria-label={isRecording ? 'Detener grabación' : 'Iniciar grabación'}
          >
            <Icon name="mic" className="w-7 h-7"/>
          </button>
        </div>
        
        {/* File Preview Grid */}
        {filePreviews.length > 0 && (
          <div className="mt-3 px-3 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-500 mb-2">Vista previa de archivos:</h4>
            <div className="flex flex-wrap gap-2">
              {filePreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  {/* Image Preview */}
                  {preview.type === 'image' && (
                    <img 
                      src={preview.previewUrl} 
                      alt={preview.file.name}
                      className="w-20 h-20 object-cover rounded-lg border border-slate-200"
                    />
                  )}
                  
                  {/* Video Preview */}
                  {preview.type === 'video' && (
                    <video 
                      src={preview.previewUrl} 
                      className="w-20 h-20 object-cover rounded-lg border border-slate-200"
                    />
                  )}
                  
                  {/* Document Preview */}
                  {preview.type === 'document' && (
                    <div className="w-20 h-20 bg-slate-100 rounded-lg border border-slate-200 flex flex-col items-center justify-center">
                      <Icon name="file" className="w-8 h-8 text-slate-400" />
                      <span className="text-[8px] text-slate-500 mt-1">
                        {preview.file.name.split('.').pop()?.toUpperCase()}
                      </span>
                    </div>
                  )}
                  
                  {/* Remove Button */}
                  <button
                    onClick={() => removePreview(index)}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600"
                    aria-label="Eliminar archivo"
                  >
                    <Icon name="x" className="w-3 h-3" />
                  </button>
                  
                  {/* File Name Tooltip */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-[8px] px-1 py-0.5 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity truncate">
                    {preview.file.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Divider with central toggle for Advanced Mode (muted gray) */}
        <div className="relative my-4">
          <div className="h-0.5 bg-slate-200"></div>
          <button
            onClick={() => setIsAdvancedMode(v => !v)}
            aria-pressed={isAdvancedMode}
            className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-2 border-2 border-slate-300 text-slate-500 shadow-sm hover:bg-slate-50"
            title={isAdvancedMode ? 'Ocultar campos avanzados' : 'Mostrar campos avanzados'}
          >
            <Icon name={isAdvancedMode ? 'minus' : 'plus'} className="w-4 h-4" />
          </button>
        </div>

        {/* Advanced Mode Fields */}
        {isAdvancedMode && (
          <div className="mt-3 px-3 pt-3 border-t border-slate-100 space-y-4">
            {/* Observaciones */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">Observaciones</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Detalles adicionales de la tarea..."
                className="w-full p-2 sm:p-2.5 border border-slate-300 bg-slate-50 text-slate-900 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400 text-sm sm:text-base"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="w-full sm:w-1/2">
                <label htmlFor="assignedUser" className="block text-sm font-medium text-slate-700 mb-1">Asignar usuarios</label>

                {/* Mostrar usuarios asignados */}
                {assignedUsers.length > 0 && (
                  <div className="mb-2">
                    <div className="flex flex-wrap gap-2">
                      {assignedUsers.map((user) => (
                        <div key={user.id} className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                          <span>{user.username}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveAssignee(user.id)}
                            className="ml-2 text-blue-600 hover:text-blue-800"
                            title="Quitar asignación"
                          >
                            <Icon name="close" className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Campo de búsqueda */}
                <div className="relative">
                  <input
                    type="text"
                    id="assignedUser"
                    value={userSearchQuery}
                    onChange={(e) => handleUserSearch(e.target.value)}
                    onBlur={handleUserSearchBlur}
                    placeholder="Buscar usuario para asignar..."
                    className="w-full p-2 sm:p-2.5 border border-slate-300 bg-slate-50 text-slate-900 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400 text-sm sm:text-base"
                  />
                  {isSearchingUsers && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin"></div>
                    </div>
                  )}
                  {showUserDropdown && userSearchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {userSearchResults.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => handleUserSelect(user)}
                          className="w-full text-left px-3 py-2 hover:bg-slate-50 focus:bg-slate-50 focus:outline-none border-b border-slate-100 last:border-b-0"
                        >
                          <div className="font-medium text-slate-900">{user.username}</div>
                          <div className="text-sm text-slate-500">{user.email}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full sm:w-1/2">
                <label htmlFor="dueDate" className="block text-sm font-medium text-slate-700 mb-1">Fecha de Vencimiento</label>
                <input
                  type="date"
                  id="dueDate"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  min={undefined}
                  className="w-full p-2 sm:p-2.5 border border-slate-300 bg-slate-50 text-slate-900 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                />
              </div>
            </div>
          </div>
        )}
        
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
            {/* Botón de micrófono para desktop (oculto en móviles) */}
            <button 
              onClick={handleMicClick} 
              className={`hidden sm:block p-2 rounded-full border-2 transition-colors ${isRecording ? 'bg-red-100 text-red-600 border-red-300 animate-pulse' : 'hover:bg-slate-100 text-slate-500 border-slate-300'}`} 
              aria-label={isRecording ? 'Detener grabación' : 'Iniciar grabación'}
            >
              <Icon name="mic" className="w-6 h-6"/>
            </button>
            
            {/* Botón de adjuntos con modal de opciones */}
            <button
              onClick={handleOpenAttachmentModal}
              className="hidden sm:block p-2 rounded-full border-2 transition-colors hover:bg-slate-100 text-slate-500 border-slate-300"
              aria-label="Adjuntar archivo"
              title="Adjuntar archivo"
            >
              <Icon name="paperclip" className="w-6 h-6"/>
            </button>
            
            {/* Botón de opciones adicionales (+) */}
            {/* antiguamente abría modal de opciones; desactivado porque se usa el toggle central */}
            <button
              disabled
              className="hidden"
              aria-hidden={true}
            />
            
            {isTranscribing && (
              <div className="flex items-center space-x-2 text-sm text-slate-500">
                  <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin"></div>
                  <span>Transcribiendo...</span>
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

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {/* Hidden camera input */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCameraCapture}
        className="hidden"
      />

      {/* Modal simple de adjuntos con opciones */}
      {showAttachmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[200] flex justify-center items-center p-4" onClick={() => setShowAttachmentModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Adjuntar archivo</h3>
            
            <div className="space-y-3">
              {/* Tomar foto */}
              <button
                onClick={() => {
                  cameraInputRef.current?.click();
                  setShowAttachmentModal(false);
                }}
                className="w-full flex items-center justify-start space-x-3 p-4 border-2 border-slate-200 rounded-lg hover:bg-slate-50 hover:border-green-300 transition-colors"
              >
                <div className="p-2 bg-green-100 rounded-lg">
                  <Icon name="camera" className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-slate-800">Tomar foto</div>
                  <div className="text-sm text-slate-500">Usar la cámara de tu dispositivo</div>
                </div>
              </button>
              
              {/* Subir archivo */}
              <button
                onClick={() => {
                  fileInputRef.current?.click();
                  setShowAttachmentModal(false);
                }}
                className="w-full flex items-center justify-start space-x-3 p-4 border-2 border-slate-200 rounded-lg hover:bg-slate-50 hover:border-blue-300 transition-colors"
              >
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Icon name="upload" className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-slate-800">Subir archivo</div>
                  <div className="text-sm text-slate-500">Seleccionar desde tu dispositivo</div>
                </div>
              </button>
              
              {/* Pegar imagen */}
              <button
                onClick={async () => {
                  try {
                    const clipboardItems = await navigator.clipboard.read();
                    for (const clipboardItem of clipboardItems) {
                      for (const type of clipboardItem.types) {
                        if (type.startsWith('image/')) {
                          const blob = await clipboardItem.getType(type);
                          const file = new File([blob], `pasted-image-${Date.now()}.png`, { type: blob.type });
                          
                          setPendingFiles(prev => [...prev, file]);
                          
                          const reader = new FileReader();
                          reader.onload = (e) => {
                            setFilePreviews(prev => [...prev, {
                              file,
                              previewUrl: e.target?.result as string || '',
                              type: 'image'
                            }]);
                          };
                          reader.readAsDataURL(file);
                          
                          setShowAttachmentModal(false);
                          return;
                        }
                      }
                    }
                    alert('No hay ninguna imagen en el portapapeles');
                  } catch (error) {
                    console.error('Error al pegar imagen:', error);
                    alert('No se pudo acceder al portapapeles. Usa Ctrl+V para pegar.');
                  }
                }}
                className="w-full flex items-center justify-start space-x-3 p-4 border-2 border-slate-200 rounded-lg hover:bg-slate-50 hover:border-purple-300 transition-colors"
              >
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Icon name="clipboard" className="w-6 h-6 text-purple-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-slate-800">Pegar imagen</div>
                  <div className="text-sm text-slate-500">Desde el portapapeles (Ctrl+V)</div>
                </div>
              </button>
              
              {/* Tipos de archivo permitidos */}
              <div className="text-xs text-slate-500 px-2">
                <span className="font-medium">Tipos permitidos:</span> Imágenes, Videos, PDFs, Documentos, Archivos comprimidos
              </div>
            </div>
            
            <button
              onClick={() => setShowAttachmentModal(false)}
              className="w-full mt-4 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
      
      {/* Modal de configuración / opciones adicionales */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[200] flex justify-center items-center p-4" onClick={() => setShowConfigModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Opciones Adicionales</h3>
            
            <div className="space-y-4">
              {/* Switch de tareas avanzadas */}
              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                <div>
                  <div className="font-medium text-slate-800">Tareas Avanzadas</div>
                  <div className="text-sm text-slate-500">Activar campos adicionales</div>
                </div>
                <button
                  onClick={() => setIsAdvancedMode(!isAdvancedMode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isAdvancedMode ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isAdvancedMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

            </div>
            
            <button
              onClick={() => setShowConfigModal(false)}
              className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Aceptar
            </button>
          </div>
        </div>
      )}
    </>
  );
};