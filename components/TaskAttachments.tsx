import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';
import { getTaskAttachments, deleteAttachment, type Attachment } from '../services/apiService';
import { ImageViewer } from './ImageViewer';

interface TaskAttachmentsProps {
  tareaId: number;
  refreshKey: number;
  onUploadClick: () => void;
}

export const TaskAttachments: React.FC<TaskAttachmentsProps> = ({ tareaId, refreshKey, onUploadClick }) => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<Attachment | null>(null);

  useEffect(() => {
    loadAttachments();
  }, [tareaId, refreshKey]);

  const loadAttachments = async () => {
    setIsLoading(true);
    try {
      const data = await getTaskAttachments(tareaId);
      setAttachments(data);
    } catch (error) {
      console.error('Error loading attachments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (attachmentId: number) => {
    if (!confirm('¿Estás seguro de eliminar este adjunto?')) return;
    
    try {
      await deleteAttachment(attachmentId);
      setAttachments(prev => prev.filter(a => a.id !== attachmentId));
    } catch (error) {
      console.error('Error deleting attachment:', error);
      alert('Error al eliminar el adjunto');
    }
  };

  const handleAttachmentClick = (attachment: Attachment) => {
    if (attachment.tipo_archivo === 'imagen') {
      setSelectedImage(attachment);
    } else {
      // Preferir la URL de descarga temporal generada por el backend
      const downloadUrl = (attachment as any).url_descarga || attachment.sharepoint_url;

      // Si no tenemos una url_descarga, usar el proxy para forzar descarga
      let openUrl = downloadUrl;
      if (!downloadUrl) {
        openUrl = `/api/getAttachmentFile.php?id=${attachment.id}&download=1`;
      } else {
        // Si la URL proviene de Graph (downloadUrl), abrirla directamente.
        // Para asegurar descarga en caso de que el navegador intente previsualizar,
        // podemos preferir forzar a través del proxy si el usuario necesita descarga.
      }

      const win = window.open(openUrl, '_blank');
      if (win) win.focus();
    }
  };

  const getFileIcon = (extension: string) => {
    const ext = extension.toLowerCase();
    
    // Documentos Word
    if (ext === 'doc' || ext === 'docx') {
      return { icon: 'file-text', color: 'text-blue-600', bg: 'bg-blue-100' };
    }
    
    // PDFs
    if (ext === 'pdf') {
      return { icon: 'file', color: 'text-red-600', bg: 'bg-red-100' };
    }
    
    // Excel
    if (ext === 'xls' || ext === 'xlsx' || ext === 'csv') {
      return { icon: 'file', color: 'text-green-600', bg: 'bg-green-100' };
    }
    
    // PowerPoint
    if (ext === 'ppt' || ext === 'pptx') {
      return { icon: 'file', color: 'text-orange-600', bg: 'bg-orange-100' };
    }
    
    // Comprimidos
    if (ext === 'zip' || ext === 'rar' || ext === '7z') {
      return { icon: 'archive', color: 'text-purple-600', bg: 'bg-purple-100' };
    }
    
    // Default
    return { icon: 'file', color: 'text-slate-600', bg: 'bg-slate-100' };
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (isLoading) {
    return (
      <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
        <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin"></div>
        Cargando adjuntos...
      </div>
    );
  }

  return (
    <>
      <div className="mt-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Botón para agregar adjuntos */}
          <button
            onClick={onUploadClick}
            className="flex items-center justify-center w-10 h-10 rounded-lg border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50 transition-colors group"
            title="Agregar adjunto"
          >
            <Icon name="plus" className="w-5 h-5 text-slate-400 group-hover:text-blue-500" />
          </button>

          {/* Iconos de imágenes */}
          {attachments.filter(a => a.tipo_archivo === 'imagen').map(attachment => (
            <button
              key={attachment.id}
              onClick={() => handleAttachmentClick(attachment)}
              className="relative group w-10 h-10 rounded-lg overflow-hidden border-2 border-slate-200 hover:border-blue-500 transition-all hover:scale-105"
              title={attachment.nombre_archivo}
            >
              <Icon name="image" className="w-full h-full p-2 text-blue-500 bg-blue-50" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(attachment.id);
                }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <Icon name="x" className="w-3 h-3" />
              </button>
            </button>
          ))}

          {/* Iconos de documentos */}
          {attachments.filter(a => a.tipo_archivo === 'documento').map(attachment => {
            const fileStyle = getFileIcon(attachment.extension);
            return (
              <button
                key={attachment.id}
                onClick={() => handleAttachmentClick(attachment)}
                className="relative group w-10 h-10 rounded-lg border-2 border-slate-200 hover:border-blue-500 transition-all hover:scale-105 flex items-center justify-center"
                title={`${attachment.nombre_archivo} (${formatFileSize(attachment.tamano_bytes)})`}
              >
                <div className={`w-full h-full ${fileStyle.bg} flex items-center justify-center rounded-md`}>
                  <Icon name={fileStyle.icon as any} className={`w-5 h-5 ${fileStyle.color}`} />
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(attachment.id);
                  }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <Icon name="x" className="w-3 h-3" />
                </button>
              </button>
            );
          })}
        </div>
        
        {attachments.length > 0 && (
          <div className="mt-2 text-xs text-slate-500">
            {attachments.length} adjunto{attachments.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Visor de imágenes */}
      {selectedImage && (
        <ImageViewer
          isOpen={true}
          imageUrl={`/api/getAttachmentFile.php?id=${selectedImage.id}`}
          imageName={selectedImage.nombre_archivo}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </>
  );
};
