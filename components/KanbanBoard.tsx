import React, { useMemo, useState, useRef, useEffect } from 'react';
import type { Task, Project } from '../types';
import { TaskState } from '../types';

interface KanbanBoardProps {
  tasks: Task[];
  projects: Project[];
  selectedProjectId: number | null;
  onProjectFilterChange: (id: number | null) => void;
  onTaskUpdate?: (taskId: number, updates: Partial<Task>) => void;
  onTaskClick?: (task: Task) => void;
}

const columnTitle: Record<TaskState, string> = {
  [TaskState.PENDIENTE]: 'Pendiente',
  [TaskState.EN_PROGRESO]: 'En progreso',
  [TaskState.COMPLETADA]: 'Completada'
};

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  projects,
  selectedProjectId,
  onProjectFilterChange,
  onTaskUpdate,
  onTaskClick
}) => {
  const [draggingTaskId, setDraggingTaskId] = useState<number | null>(null);
  const [currentColumnIndex, setCurrentColumnIndex] = useState(0);
  const [isDraggingToEdge, setIsDraggingToEdge] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const carouselRef = useRef<HTMLDivElement>(null);
  const dragTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const columns = [TaskState.PENDIENTE, TaskState.EN_PROGRESO, TaskState.COMPLETADA];

  // Función para normalizar estados de tareas
  const normalizeTaskState = (estado: string): TaskState | null => {
    const estadoLower = estado.toLowerCase().trim();
    switch (estadoLower) {
      case 'pendiente':
      case 'pending':
        return TaskState.PENDIENTE;
      case 'en progreso':
      case 'en_progreso':
      case 'in_progress':
        return TaskState.EN_PROGRESO;
      case 'completada':
      case 'completado':
      case 'completed':
        return TaskState.COMPLETADA;
      default:
        return null;
    }
  };

  const grouped = useMemo(() => {
    const result = {
      [TaskState.PENDIENTE]: tasks.filter(t => normalizeTaskState(t.Estado) === TaskState.PENDIENTE),
      [TaskState.EN_PROGRESO]: tasks.filter(t => normalizeTaskState(t.Estado) === TaskState.EN_PROGRESO),
      [TaskState.COMPLETADA]: tasks.filter(t => normalizeTaskState(t.Estado) === TaskState.COMPLETADA)
    };
    
    return result;
  }, [tasks]);

  const handleDropOnColumn = (state: TaskState) => (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const idStr = e.dataTransfer.getData('text/plain');
    const id = parseInt(idStr);
    if (!id || !onTaskUpdate) return;
    const task = tasks.find(t => parseInt(String(t.ID)) === id);
    if (!task || task.Estado === state) return;
    const updates: Partial<Task> = { Estado: state };
    if (state === TaskState.COMPLETADA) {
      updates.Porcentaje_Avance = 100;
      updates.Fecha_Completada = new Date().toISOString();
      const todayStr = new Date().toISOString().slice(0,10);
      updates.Fecha_Vencimiento = task.Fecha_Vencimiento || todayStr;
    } else if (state === TaskState.EN_PROGRESO) {
      updates.Porcentaje_Avance = 20;
      if (task.Fecha_Completada) {
        updates.Fecha_Completada = '';
      }
    } else if (state === TaskState.PENDIENTE) {
      updates.Porcentaje_Avance = 0;
      if (task.Fecha_Completada) {
        updates.Fecha_Completada = '';
      }
    }
    onTaskUpdate(id, updates);
    setDraggingTaskId(null);
  };

  const onDragStart = (taskId: number) => (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('text/plain', String(taskId));
    e.dataTransfer.effectAllowed = 'move';
    setDraggingTaskId(taskId);
  };

  const onDragEnd = () => {
    setDraggingTaskId(null);
    setIsDraggingToEdge(false);
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current);
      dragTimeoutRef.current = null;
    }
  };

  // Función para detectar arrastre al borde y cambiar columna
  const handleDragMove = (e: React.DragEvent<HTMLDivElement>) => {
    if (!draggingTaskId) return;
    
    const rect = carouselRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const screenWidth = rect.width;
    const edgeThreshold = 50; // 50px del borde
    
    setDragPosition({ x: e.clientX, y: e.clientY });
    
    // Detectar si está cerca del borde derecho
    if (x > screenWidth - edgeThreshold && currentColumnIndex < columns.length - 1) {
      if (!isDraggingToEdge) {
        setIsDraggingToEdge(true);
        dragTimeoutRef.current = setTimeout(() => {
          setCurrentColumnIndex(prev => Math.min(prev + 1, columns.length - 1));
          setIsDraggingToEdge(false);
        }, 800); // 800ms de delay para cambiar
      }
    }
    // Detectar si está cerca del borde izquierdo
    else if (x < edgeThreshold && currentColumnIndex > 0) {
      if (!isDraggingToEdge) {
        setIsDraggingToEdge(true);
        dragTimeoutRef.current = setTimeout(() => {
          setCurrentColumnIndex(prev => Math.max(prev - 1, 0));
          setIsDraggingToEdge(false);
        }, 800);
      }
    }
    // Si no está en el borde, cancelar el timeout
    else if (isDraggingToEdge && dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current);
      dragTimeoutRef.current = null;
      setIsDraggingToEdge(false);
    }
  };

  // Función para navegar manualmente entre columnas
  const navigateToColumn = (index: number) => {
    setCurrentColumnIndex(Math.max(0, Math.min(index, columns.length - 1)));
  };

  const renderCard = (task: Task) => (
    <div
      key={task.ID}
      draggable
      onDragStart={onDragStart(task.ID)}
      onDragEnd={onDragEnd}
      onDrag={handleDragMove}
      onClick={() => onTaskClick && onTaskClick(task)}
      className={`bg-white rounded-md shadow-sm border border-slate-200 p-3 mb-3 cursor-grab active:cursor-grabbing transition-transform ${draggingTaskId === task.ID ? 'scale-[1.02] shadow-md' : 'hover:shadow-md'} overflow-hidden`}
      title={task.Descripcion || ''}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div
            className="font-medium text-slate-800 break-words"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {task.Titulo}
          </div>
          <div className="text-xs text-slate-500 overflow-hidden text-ellipsis whitespace-nowrap">
            {task.proyecto_nombre || 'Sin proyecto'}
          </div>
        </div>
        <div className="text-xs text-slate-500 shrink-0 whitespace-nowrap text-right">
          {Number(task.Porcentaje_Avance || 0).toFixed(2)}%
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
        <span>{task.Fecha_Vencimiento ? new Date(task.Fecha_Vencimiento).toLocaleDateString() : 'Sin vencimiento'}</span>
        <span className="capitalize">{task.Estado.replace('_', ' ')}</span>
      </div>
    </div>
  );

  const columnClasses = 'bg-slate-50 rounded-lg border border-slate-200 p-3 min-h-[200px]';

  return (
    <div className="flex flex-col gap-4">
      {/* Filtro de proyecto */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <label className="text-sm text-slate-600">Proyecto:</label>
          <select
            value={selectedProjectId || ''}
            onChange={(e) => onProjectFilterChange(e.target.value ? Number(e.target.value) : null)}
            className="text-sm border rounded-md px-2 py-1"
          >
            <option value="">Todos los proyectos</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </div>
        {(selectedProjectId !== null) && (
          <div className="text-xs text-slate-500">Mostrando: {projects.find(p => parseInt(String(p.id)) === parseInt(String(selectedProjectId)))?.nombre || 'Proyecto'}</div>
        )}
      </div>

      {/* Vista Desktop - Grid de 3 columnas */}
      <div className="hidden sm:block">
        <div className="grid grid-cols-3 gap-4">
          {columns.map(state => (
            <div key={state}
                 className={columnClasses}
                 onDragOver={(e) => e.preventDefault()}
                 onDrop={handleDropOnColumn(state)}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-slate-700">{columnTitle[state]}</h4>
                <span className="text-xs text-slate-500">{grouped[state].length}</span>
              </div>
              {grouped[state].length === 0 ? (
                <div className="text-sm text-slate-500 py-6 text-center">No hay tareas</div>
              ) : (
                grouped[state].map(renderCard)
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Vista Mobile - Carrusel con drag-to-edge */}
      <div className="sm:hidden">
        {/* Indicadores de columna */}
        <div className="flex justify-center mb-4 gap-2">
          {columns.map((state, index) => (
            <button
              key={state}
              onClick={() => navigateToColumn(index)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                index === currentColumnIndex 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
              }`}
            >
              {columnTitle[state]} ({grouped[state].length})
            </button>
          ))}
        </div>

        {/* Carrusel de columnas */}
        <div 
          ref={carouselRef}
          className="relative overflow-hidden rounded-lg"
          style={{ height: 'calc(100vh - 300px)', minHeight: '400px' }}
        >
          <div 
            className="flex transition-transform duration-300 ease-out h-full"
            style={{ 
              transform: `translateX(-${currentColumnIndex * 100}%)`,
              width: `${columns.length * 100}%`
            }}
          >
            {columns.map((state, index) => (
              <div 
                key={state}
                className="h-full flex-shrink-0 px-2"
                style={{ width: `100%` }}
              >
                <div
                  className={`${columnClasses} h-full relative`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDropOnColumn(state)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-slate-700 text-lg">{columnTitle[state]}</h4>
                    <span className="text-sm text-slate-500 bg-white px-2 py-1 rounded-full">
                      {grouped[state].length}
                    </span>
                  </div>
                  
                  <div className="overflow-y-auto h-full pb-16">
                    {grouped[state].length === 0 ? (
                      <div className="text-sm text-slate-500 py-8 text-center">
                        No hay tareas
                      </div>
                    ) : (
                      grouped[state].map(renderCard)
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Indicador visual de drag-to-edge */}
          {isDraggingToEdge && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-blue-500 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium animate-pulse">
                ← Cambiando columna...
              </div>
              <div className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-blue-500 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium animate-pulse">
                Cambiando columna... →
              </div>
            </div>
          )}

          {/* Instrucciones de uso */}
          {draggingTaskId && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white px-4 py-2 rounded-lg text-sm text-center">
              Arrastra al borde para cambiar de columna
            </div>
          )}
        </div>

        {/* Navegación manual */}
        <div className="flex justify-between mt-4">
          <button
            onClick={() => navigateToColumn(currentColumnIndex - 1)}
            disabled={currentColumnIndex === 0}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 transition-colors"
          >
            <span>←</span>
            <span className="text-sm">Anterior</span>
          </button>
          
          <button
            onClick={() => navigateToColumn(currentColumnIndex + 1)}
            disabled={currentColumnIndex === columns.length - 1}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 transition-colors"
          >
            <span className="text-sm">Siguiente</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default KanbanBoard;