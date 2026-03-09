import React, { useState, useRef } from 'react';
import { Icon } from './Icon';

interface AttachmentUploadModalProps {
  isOpen: boolean;
  tareaId: number;
  onClose: () => void;
  onUploadSuccess: () => void;
}

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB en bytes

const ALLOWED_EXTENSIONS = [
  'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg',
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  'txt', 'csv', 'zip', 'rar',
  'mp4', 'mov', 'avi', 'mkv', 'webm', 'wmv', 'flv', 'm4v'
];

export const AttachmentUploadModal: React.FC<AttachmentUploadModalProps> = ({
  isOpen,
  tareaId,
  onClose,
  onUploadSuccess
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timeoutRef = useRef<number | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    stopCamera();
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    setShowCamera(false);
    onClose();
  };

  const validateFile = (file: File): string | null => {
    // Validar tamaño
    if (file.size > MAX_FILE_SIZE) {
      return `El archivo excede el tamaño máximo de ${MAX_FILE_SIZE / 1024 / 1024} MB`;
    }

    // Validar extensión
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
      return `Tipo de archivo no permitido. Extensiones válidas: ${ALLOWED_EXTENSIONS.join(', ')}`;
    }

    return null;
  };

  const handleFileSelect = (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSelectedFile(file);
    setError(null);

    // Crear preview si es imagen
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handlePaste = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            const blob = await item.getType(type);
            const file = new File([blob], `pasted-image-${Date.now()}.png`, { type: 'image/png' });
            handleFileSelect(file);
            return;
          }
        }
      }
      setError('No se encontró ninguna imagen en el portapapeles');
    } catch (err) {
      setError('Error al acceder al portapapeles. Por favor, usa el botón "Subir archivo" en su lugar.');
    }
  };

  const startCamera = async () => {
    try {
      setVideoReady(false);
      setError(null);
      // show the camera area immediately (loading overlay will be visible)
      setShowCamera(true);

      // update device list (try to get labels if possible)
      const updateDeviceList = async () => {
        try {
          let all = await navigator.mediaDevices.enumerateDevices();
          let videoDevices = all.filter(d => d.kind === 'videoinput');
          // if labels are empty, request a short permission to get labels
          const needsLabels = videoDevices.every(d => !d.label);
          if (needsLabels) {
            try {
              const tmp = await navigator.mediaDevices.getUserMedia({ video: true });
              tmp.getTracks().forEach(t => t.stop());
              all = await navigator.mediaDevices.enumerateDevices();
              videoDevices = all.filter(d => d.kind === 'videoinput');
            } catch (_) {
              // ignore
            }
          }
          setDevices(videoDevices);
          if (videoDevices.length && !selectedDeviceId) setSelectedDeviceId(videoDevices[0].deviceId);
        } catch (e) {
          // ignore
        }
      };

      await updateDeviceList();

      // Try a couple of constraints: prefer selected deviceId, then facingMode, then default
      let stream: MediaStream | null = null;
      try {
        if (selectedDeviceId) {
          stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: selectedDeviceId } } });
        } else {
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        }
      } catch (err) {
        // Fallback to any available camera
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        const markReady = () => {
          if (timeoutRef.current) {
            window.clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          setVideoReady(true);
        };

        videoRef.current.onloadedmetadata = () => {
          try { videoRef.current?.play(); } catch (_) {}
          markReady();
        };
        videoRef.current.onloadeddata = () => markReady();
        videoRef.current.onplaying = () => markReady();

        // Safety: fallback to mark camera ready after 2.5s in case events don't fire
        if (timeoutRef.current) {
          window.clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = window.setTimeout(() => {
          markReady();
        }, 2500) as unknown as number;

        // Some platforms need the attribute explicitly
        videoRef.current.setAttribute('playsinline', '');
        // keep muted so autoplay is allowed
        videoRef.current.muted = true;
        // apply a consistent objectFit
        videoRef.current.style.objectFit = 'cover';
      }
      setShowCamera(true);
      setError(null);
    } catch (err) {
      setError('No se pudo acceder a la cámara. Verifica los permisos del navegador.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
    setVideoReady(false);
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Configurar el tamaño del canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Dibujar el frame actual del video en el canvas
    context.drawImage(video, 0, 0);

    // Convertir a blob
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
      handleFileSelect(file);
      stopCamera();
    }, 'image/jpeg', 0.95);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('tarea_id', tareaId.toString());
      formData.append('file', selectedFile);

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentage = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(percentage);
        }
      });

      xhr.addEventListener('load', () => {
        setIsUploading(false);
        
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.success) {
              console.log('Archivo subido exitosamente:', response);
              onUploadSuccess();
              handleClose();
            } else {
              console.error('Error en respuesta:', response);
              setError(response.error || 'Error al subir el archivo');
            }
          } catch (parseError) {
            console.error('Error al parsear respuesta JSON:', xhr.responseText);
            setError('Error al procesar la respuesta del servidor');
          }
        } else {
          console.error('Error HTTP:', xhr.status, xhr.responseText);
          setError(`Error al subir el archivo (código ${xhr.status})`);
        }
      });

      xhr.addEventListener('error', () => {
        console.error('Error de red en XHR');
        setError('Error de red al subir el archivo');
        setIsUploading(false);
      });

      xhr.addEventListener('timeout', () => {
        console.error('Timeout en XHR');
        setError('Tiempo de espera agotado');
        setIsUploading(false);
      });

      xhr.open('POST', '/api/uploadToSharePoint.php');
      xhr.timeout = 120000; // 2 minutos de timeout
      xhr.send(formData);

    } catch (err) {
      setError('Error al subir el archivo');
      setIsUploading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-[200] flex justify-center items-center p-4"
      onClick={handleClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-slate-800">Adjuntar archivo</h3>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            disabled={isUploading}
          >
            <Icon name="close" className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {!selectedFile && !showCamera && (
            <>
              {/* Opciones */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Tomar foto */}
                <button
                  onClick={startCamera}
                  className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-xl border-2 border-blue-200 transition-all group"
                >
                  <Icon name="camera" className="w-6 h-6 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-medium text-blue-800">Tomar foto</span>
                </button>

                {/* Subir archivo */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-xl border-2 border-green-200 transition-all group"
                >
                  <Icon name="upload" className="w-6 h-6 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-medium text-green-800">Subir archivo</span>
                </button>

                {/* Pegar imagen */}
                <button
                  onClick={handlePaste}
                  className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-xl border-2 border-purple-200 transition-all group"
                >
                  <Icon name="clipboard" className="w-6 h-6 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-medium text-purple-800">Pegar imagen</span>
                </button>
              </div>

              {/* Input oculto */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.gif,.bmp,.webp,.svg,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar"
                onChange={handleFileInputChange}
                className="hidden"
              />

              {/* Información */}
              <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-600 mb-2">
                  <strong>Tipos de archivo permitidos:</strong>
                </p>
                <p className="text-xs text-slate-500 mb-2">
                  Imágenes: JPG, PNG, GIF, BMP, WebP, SVG
                </p>
                <p className="text-xs text-slate-500 mb-2">
                  Documentos: PDF, Word, Excel, PowerPoint, TXT, CSV, ZIP, RAR
                </p>
                <p className="text-xs text-slate-600 mt-2">
                  <strong>Tamaño máximo:</strong> 100 MB
                </p>
              </div>
            </>
          )}

          {/* Cámara */}
          {showCamera && (
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {!videoReady && (
                  <div className="absolute inset-0 flex items-center justify-center text-white bg-black/60">
                    <div className="text-sm">Cargando cámara…</div>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (!videoReady) {
                      setError('La cámara aún no está lista. Espera un momento.');
                      return;
                    }
                    capturePhoto();
                  }}
                  className="px-3 py-2 min-w-[120px] bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm flex items-center justify-center"
                >
                  <Icon name="camera" className="w-4 h-4 inline mr-2" />
                  Capturar foto
                </button>
                <button
                  onClick={stopCamera}
                  className="px-3 py-2 h-9 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors text-sm"
                >
                  Cancelar
                </button>
              </div>
              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}

          {/* Preview y upload */}
          {selectedFile && !showCamera && (
            <div className="space-y-4">
              {/* Preview */}
              {previewUrl ? (
                <div className="relative bg-slate-100 rounded-lg overflow-hidden">
                  <img src={previewUrl} alt="Preview" className="w-full h-auto max-h-96 object-contain" />
                </div>
              ) : (
                <div className="p-6 bg-slate-100 rounded-lg text-center">
                  <Icon name="file" className="w-16 h-16 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-600 font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              )}

              {/* Progress bar */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-blue-600 h-full transition-all duration-300 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-slate-600 text-center">
                    Subiendo... {uploadProgress}%
                  </p>
                </div>
              )}

              {/* Botones */}
              {!isUploading && (
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                    }}
                    className="px-3 py-1.5 h-9 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors text-sm"
                  >
                    Cambiar archivo
                  </button>
                  <button
                    onClick={handleUpload}
                    className="px-3 py-1.5 h-9 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm min-w-[120px] flex items-center justify-center"
                  >
                    <Icon name="upload" className="w-4 h-4 inline mr-1" />
                    Subir archivo
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
