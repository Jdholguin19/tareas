import React, { useEffect, useState } from 'react';
import { Icon } from './Icon';

interface ImageViewerProps {
  isOpen: boolean;
  imageUrl: string;
  imageName: string;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({
  isOpen,
  imageUrl,
  imageName,
  onClose,
  onNext,
  onPrevious,
  hasNext = false,
  hasPrevious = false
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Reset state cuando cambia la imagen
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setIsLoading(true);
    setHasError(false);
    setImageSrc(null);

    // Instead of fetching (which can fail on cross-origin downloadUrl redirects due to CORS),
    // set the <img> src directly to the API URL. The browser will follow 302->downloadUrl and
    // load the image inline. For images hosted on the same origin cookies are sent automatically.
    if (isOpen && imageUrl) {
      setImageSrc(imageUrl);
    }

    // Cleanup: nothing special to revoke when using direct src
    return () => {
      // no-op
    };
  }, [imageUrl, isOpen]);

  useEffect(() => {
    // Manejar teclas de navegación y escape
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          if (hasPrevious && onPrevious) onPrevious();
          break;
        case 'ArrowRight':
          if (hasNext && onNext) onNext();
          break;
        case '+':
        case '=':
          zoomIn();
          break;
        case '-':
        case '_':
          zoomOut();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, hasNext, hasPrevious, onNext, onPrevious, onClose]);

  if (!isOpen) return null;

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };

  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDownload = () => {
    // Force server-side proxy download when possible by adding download param
    let url = imageUrl;
    if (url.indexOf('?') === -1) url += '?download=1';
    else url += '&download=1';

    // Open in new tab to trigger download
    const win = window.open(url, '_blank');
    if (win) win.focus();
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-95 z-[300] flex flex-col"
      onClick={onClose}
    >
      {/* Header con controles */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Nombre del archivo */}
          <div className="flex-1 min-w-0 mr-4">
            <h3 className="text-white text-lg font-medium truncate">{imageName}</h3>
          </div>

          {/* Controles */}
          <div className="flex items-center gap-2">
            {/* Zoom out */}
            <button
              onClick={(e) => { e.stopPropagation(); zoomOut(); }}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors backdrop-blur-sm"
              title="Alejar (tecla -)"
            >
              <Icon name="minus" className="w-5 h-5 text-white" />
            </button>

            {/* Zoom percentage */}
            <span className="text-white text-sm font-medium min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </span>

            {/* Zoom in */}
            <button
              onClick={(e) => { e.stopPropagation(); zoomIn(); }}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors backdrop-blur-sm"
              title="Acercar (tecla +)"
            >
              <Icon name="plus" className="w-5 h-5 text-white" />
            </button>

            {/* Reset zoom */}
            <button
              onClick={(e) => { e.stopPropagation(); resetZoom(); }}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors backdrop-blur-sm"
              title="Restablecer vista"
            >
              <Icon name="refresh" className="w-5 h-5 text-white" />
            </button>

            {/* Divider */}
            <div className="w-px h-6 bg-white/30 mx-2" />

            {/* Descargar */}
            <button
              onClick={(e) => { e.stopPropagation(); handleDownload(); }}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors backdrop-blur-sm"
              title="Descargar imagen"
            >
              <Icon name="download" className="w-5 h-5 text-white" />
            </button>

            {/* Cerrar */}
            <button
              onClick={onClose}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors backdrop-blur-sm"
              title="Cerrar (Esc)"
            >
              <Icon name="close" className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Navegación izquierda */}
      {hasPrevious && onPrevious && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrevious(); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/20 hover:bg-white/30 rounded-full transition-colors backdrop-blur-sm"
          title="Imagen anterior (←)"
        >
          <Icon name="chevron-left" className="w-6 h-6 text-white" />
        </button>
      )}

      {/* Navegación derecha */}
      {hasNext && onNext && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/20 hover:bg-white/30 rounded-full transition-colors backdrop-blur-sm"
          title="Imagen siguiente (→)"
        >
          <Icon name="chevron-right" className="w-6 h-6 text-white" />
        </button>
      )}

      {/* Contenedor de la imagen */}
      <div 
        className="flex-1 flex items-center justify-center p-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
      >
        {isLoading && !hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            <p className="text-white/70">Cargando imagen...</p>
          </div>
        )}

        {hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <Icon name="alert-circle" className="w-16 h-16 text-red-400" />
            <p className="text-white text-lg">Error al cargar la imagen</p>
            <p className="text-white/70 text-sm">Verifica tu conexión o intenta más tarde</p>
          </div>
        )}

        {imageSrc && (
          <img
            src={imageSrc}
            alt={imageName}
            onLoad={() => { setIsLoading(false); setHasError(false); }}
            onError={(e) => { console.error('Image load error', e); setIsLoading(false); setHasError(true); }}
            className="max-w-full max-h-full object-contain select-none transition-transform duration-200"
            style={{
              transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
              transformOrigin: 'center'
            }}
            draggable={false}
          />
        )}
      </div>

      {/* Footer con instrucciones */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center gap-6 text-white/70 text-sm">
            <span>← → Navegar</span>
            <span className="text-white/30">|</span>
            <span>+ - Zoom</span>
            <span className="text-white/30">|</span>
            <span>Esc Cerrar</span>
            {scale > 1 && (
              <>
                <span className="text-white/30">|</span>
                <span>Arrastra para mover</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
