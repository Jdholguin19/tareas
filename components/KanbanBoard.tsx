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

  const grouped = useMemo(() => ({
    [TaskState.PENDIENTE]: tasks.filter(t => t.Estado === TaskState.PENDIENTE),
    [TaskState.EN_PROGRESO]: tasks.filter(t => t.Estado === TaskState.EN_PROGRESO),
    [TaskState.COMPLETADA]: tasks.filter(t => t.Estado === TaskState.COMPLETADA)
  }), [tasks]);

  const handleDropOnColumn = (state: TaskState) => (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const idStr = e.dataTransfer.getData('text/plain');
    const id = Number(idStr);
    if (!id || !onTaskUpdate) return;
    const task = tasks.find(t => t.ID === id);
    if (!task || task.Estado === state) return;
    const updates: Partial<Task> = { Estado: state };
    if (state === TaskState.COMPLETADA) {
      updates.Porcentaje_Avance = 100;
    } else if (state === TaskState.EN_PROGRESO) {
      updates.Porcentaje_Avance = 20;
    }
    onTaskUpdate(id, updates);
    setDraggingTaskId(null);
  };

  const onDragStart = (taskId: number) => (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('text/plain', String(taskId));
    e.dataTransfer.effectAllowed = 'move';
    setDraggingTaskId(taskId);
  };

  const onDragEnd = () => setDraggingTaskId(null);

  const renderCard = (task: Task) => (
    <div
      key={task.ID}
      draggable
      onDragStart={onDragStart(task.ID)}
      onDragEnd={onDragEnd}
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
          <div className="text-xs text-slate-500">Mostrando: {projects.find(p => p.id === selectedProjectId)?.nombre || 'Proyecto'}</div>
        )}
      </div>

      {/* Columnas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[TaskState.PENDIENTE, TaskState.EN_PROGRESO, TaskState.COMPLETADA].map(state => (
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
  );
};

export default KanbanBoard;