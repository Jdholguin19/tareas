import React from 'react';
import { Icon } from './Icon';
import type { Attachment } from '../services/apiService';

interface AttachmentPreviewProps {
  attachments: Attachment[];
  onAttachmentClick: (attachment: Attachment, index: number) => void;
  onAttachmentDelete?: (attachmentId: number) => void;
  canDelete?: boolean;
  showAddButton?: boolean;
  onAddClick?: () => void;
}

const getFileIcon = (extension: string, tipoArchivo: string): { icon: string; bgColor: string; textColor: string } => {
  const ext = extension.toLowerCase();

  // Imágenes
  if (tipoArchivo === 'imagen' || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext)) {
    return { icon: 'image', bgColor: 'bg-blue-100', textColor: 'text-blue-600' };
  }

  // PDF
  if (ext === 'pdf') {
    return { icon: 'pdf', bgColor: 'bg-red-100', textColor: 'text-red-600' };
  }

  // Word
  if (['doc', 'docx'].includes(ext)) {
    return { icon: 'W', bgColor: 'bg-blue-600', textColor: 'text-white' };
  }

  // Excel
  if (['xls', 'xlsx'].includes(ext)) {
    return { icon: 'X', bgColor: 'bg-green-600', textColor: 'text-white' };
  }

  // PowerPoint
  if (['ppt', 'pptx'].includes(ext)) {
    return { icon: 'P', bgColor: 'bg-orange-600', textColor: 'text-white' };
  }

  // Texto
  if (['txt', 'csv'].includes(ext)) {
    return { icon: 'file-text', bgColor: 'bg-slate-100', textColor: 'text-slate-600' };
  }

  // Archivos comprimidos
  if (['zip', 'rar'].includes(ext)) {
    return { icon: 'archive', bgColor: 'bg-purple-100', textColor: 'text-purple-600' };
  }

  // Por defecto
  return { icon: 'file', bgColor: 'bg-slate-100', textColor: 'text-slate-600' };
};

export const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({
  attachments,
  onAttachmentClick,
  onAttachmentDelete,
  canDelete = false,
  showAddButton = true,
  onAddClick
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Botón para agregar */}
      {showAddButton && onAddClick && (
        <button
          onClick={onAddClick}
          className="group relative w-12 h-12 rounded-lg border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50 transition-all flex items-center justify-center"
          title="Agregar adjunto"
        >
          <Icon name="plus" className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
        </button>
      )}

      {/* Iconos de adjuntos */}
      {attachments.map((attachment, index) => {
        const { icon, bgColor, textColor } = getFileIcon(attachment.extension, attachment.tipo_archivo);
        const isImage = attachment.tipo_archivo === 'imagen';

        return (
          <div
            key={attachment.id}
            className="group relative"
          >
            <button
              onClick={() => onAttachmentClick(attachment, index)}
              className={`w-12 h-12 rounded-lg ${bgColor} ${textColor} flex items-center justify-center font-bold text-sm transition-all hover:scale-110 hover:shadow-lg relative overflow-hidden`}
              title={attachment.nombre_archivo}
            >
              {/* Si es imagen y tiene URL, mostrar miniatura */}
              {isImage && attachment.url_descarga ? (
                <div className="absolute inset-0">
                  <img
                    src={attachment.url_descarga}
                    alt={attachment.nombre_archivo}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                </div>
              ) : (
                // Para documentos, mostrar icono o letra
                <>
                  {icon.length === 1 ? (
                    // Letra (W, X, P)
                    <span className="relative z-10">{icon}</span>
                  ) : (
                    // Icono
                    <Icon name={icon} className="w-6 h-6 relative z-10" />
                  )}
                </>
              )}
            </button>

            {/* Tooltip con nombre de archivo */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
              <div className="bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap max-w-xs truncate">
                {attachment.nombre_archivo}
                <div className="text-slate-400 text-[10px]">
                  {attachment.tamano_formateado}
                </div>
              </div>
              <div className="w-2 h-2 bg-slate-900 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2" />
            </div>

            {/* Botón de eliminar */}
            {canDelete && onAttachmentDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`¿Eliminar ${attachment.nombre_archivo}?`)) {
                    onAttachmentDelete(attachment.id);
                  }
                }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
                title="Eliminar adjunto"
              >
                <Icon name="close" className="w-3 h-3" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};
