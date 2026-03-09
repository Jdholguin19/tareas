import React, { useMemo, useState } from 'react';
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
  [TaskState.EN_ESPERA]: 'En espera',
  [TaskState.COMPLETADA]: 'Completada'
};

const statusColors: Record<TaskState, string> = {
  [TaskState.PENDIENTE]: 'bg-slate-100 text-slate-700 border-slate-200',
  [TaskState.EN_PROGRESO]: 'bg-blue-50 text-blue-700 border-blue-200',
  [TaskState.EN_ESPERA]: 'bg-amber-50 text-amber-700 border-amber-200',
  [TaskState.COMPLETADA]: 'bg-emerald-50 text-emerald-700 border-emerald-200'
};

const statusHeaderColors: Record<TaskState, string> = {
  [TaskState.PENDIENTE]: 'bg-slate-200 text-slate-800',
  [TaskState.EN_PROGRESO]: 'bg-blue-100 text-blue-800',
  [TaskState.EN_ESPERA]: 'bg-amber-100 text-amber-800',
  [TaskState.COMPLETADA]: 'bg-emerald-100 text-emerald-800'
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
  
  const columns = [TaskState.PENDIENTE, TaskState.EN_PROGRESO, TaskState.EN_ESPERA, TaskState.COMPLETADA];

  // Función para normalizar estados (manejar variaciones de mayúsculas/minúsculas)
  const normalizeTaskState = (status: string): TaskState => {
    const normalized = status.toLowerCase();
    if (normalized === 'pendiente') return TaskState.PENDIENTE;
    if (normalized === 'en_progreso' || normalized === 'en progreso') return TaskState.EN_PROGRESO;
    if (normalized === 'en_espera' || normalized === 'en espera') return TaskState.EN_ESPERA;
    if (normalized === 'completada' || normalized === 'completado') return TaskState.COMPLETADA;
    return TaskState.PENDIENTE; // Default
  };

  const grouped = useMemo(() => {
    const result = {
      [TaskState.PENDIENTE]: tasks.filter(t => normalizeTaskState(t.Estado) === TaskState.PENDIENTE),
      [TaskState.EN_PROGRESO]: tasks.filter(t => normalizeTaskState(t.Estado) === TaskState.EN_PROGRESO),
      [TaskState.EN_ESPERA]: tasks.filter(t => normalizeTaskState(t.Estado) === TaskState.EN_ESPERA),
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
      // Do NOT auto-set Fecha_Vencimiento when marking completed
    } else if (state === TaskState.EN_PROGRESO) {
      updates.Porcentaje_Avance = 20;
      if (task.Fecha_Completada) {
        updates.Fecha_Completada = '';
      }
    } else if (state === TaskState.EN_ESPERA) {
      // En Espera: mantener el mismo porcentaje, solo cambiar estado
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
      onClick={() => onTaskClick && onTaskClick(task)}
      className={`bg-white rounded-md shadow-sm border border-slate-200 p-3 mb-3 cursor-pointer sm:cursor-grab active:cursor-grabbing transition-transform ${
        draggingTaskId === task.ID ? 'scale-[1.02] shadow-md' : 'hover:shadow-md'
      }`}
      title={task.Descripcion || ''}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div
            className="font-medium text-slate-800 text-sm mb-1"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              wordBreak: 'break-word',
              overflowWrap: 'break-word'
            }}
          >
            {task.Titulo}
          </div>
          <div 
            className="text-xs text-slate-500 mb-1"
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {task.proyecto_nombre || 'Sin proyecto'}
          </div>
        </div>
        <div className="text-xs text-slate-500 flex-shrink-0 ml-2">
          {Number(task.Porcentaje_Avance || 0).toFixed(0)}%
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-slate-500 gap-2">
        <span className="truncate">{task.Fecha_Vencimiento ? new Date(task.Fecha_Vencimiento).toLocaleDateString() : 'Sin vencimiento'}</span>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide ${statusColors[normalizeTaskState(task.Estado)] || 'bg-slate-100'}`}>
          {columnTitle[normalizeTaskState(task.Estado)]}
        </span>
      </div>
    </div>
  );

  const columnClasses = 'rounded-xl border p-3 min-h-[200px] flex flex-col h-full transition-colors duration-200';

  return (
    <div className="flex flex-col gap-4">
      {/* Filtro de proyecto */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="text-sm text-slate-600 whitespace-nowrap">Proyecto:</label>
          <select
            value={selectedProjectId || ''}
            onChange={(e) => onProjectFilterChange(e.target.value ? Number(e.target.value) : null)}
            className="text-sm border border-slate-300 rounded-lg px-3 py-2 w-full sm:w-64 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
          >
            <option value="">Todos los proyectos</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Vista Desktop - Grid de 4 columnas */}
      <div className="hidden sm:block">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {columns.map(state => (
            <div key={state}
                 className={`${columnClasses} ${statusColors[state]}`}
                 onDragOver={(e) => e.preventDefault()}
                 onDrop={handleDropOnColumn(state)}
            >
              <div className={`flex items-center justify-between mb-3 p-2 rounded-lg ${statusHeaderColors[state]}`}>
                <h4 className="font-semibold text-sm">{columnTitle[state]}</h4>
                <span className="text-xs font-bold bg-white/50 px-2 py-0.5 rounded-full">{grouped[state].length}</span>
              </div>
              
              <div className="flex-1 overflow-y-auto max-h-[calc(100vh-280px)] pr-1 custom-scrollbar">
                {grouped[state].length === 0 ? (
                  <div className="text-sm opacity-60 py-6 text-center italic">No hay tareas</div>
                ) : (
                  grouped[state].map(renderCard)
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Vista Mobile - Tabs Simples */}
      <div className="sm:hidden flex flex-col h-[calc(100vh-220px)]">
        {/* Selector de Columnas (Tabs) */}
        <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-hide mb-2">
          {columns.map((state, index) => (
            <button
              key={state}
              onClick={() => navigateToColumn(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDropOnColumn(state)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                index === currentColumnIndex 
                  ? statusHeaderColors[state] + ' shadow-sm ring-1 ring-black/5'
                  : 'bg-white border border-slate-200 text-slate-600'
              }`}
            >
              {columnTitle[state]} 
              <span className={`ml-2 text-xs py-0.5 px-1.5 rounded-full ${index === currentColumnIndex ? 'bg-white/60' : 'bg-slate-100'}`}>
                {grouped[state].length}
              </span>
            </button>
          ))}
        </div>

        {/* Columna Activa */}
        <div className="flex-1 min-h-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
           {/* Header de la columna activa */}
           <div className={`p-3 border-b border-slate-100 flex justify-between items-center ${statusColors[columns[currentColumnIndex]].split(' ')[0]}`}>
              <h3 className={`font-bold ${statusColors[columns[currentColumnIndex]].split(' ')[1]}`}>
                {columnTitle[columns[currentColumnIndex]]}
              </h3>
              <span className="text-xs text-slate-500">
                {grouped[columns[currentColumnIndex]].length} tareas
              </span>
           </div>

           {/* Lista de tareas scrollable */}
           <div className="flex-1 overflow-y-auto p-3 bg-slate-50/50">
              {grouped[columns[currentColumnIndex]].length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <p>No hay tareas en esta columna</p>
                </div>
              ) : (
                grouped[columns[currentColumnIndex]].map(renderCard)
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default KanbanBoard;