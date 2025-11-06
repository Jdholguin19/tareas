import React from 'react';
import { Task, Project } from '../types';
import { Icon } from './Icon';

interface MatrixTaskItemProps {
  task: Task;
  projects: Project[];
  onTaskClick: (task: Task) => void;
  isDragging?: boolean;
}

export const MatrixTaskItem: React.FC<MatrixTaskItemProps> = ({
  task,
  projects,
  onTaskClick,
  isDragging = false
}) => {
  const project = projects.find(p => p.id === task.Proyecto);
  const isOverdue = task.Fecha_Vencimiento && new Date(task.Fecha_Vencimiento) < new Date();

  return (
    <div
      onClick={() => onTaskClick(task)}
      className={`
        bg-white rounded-lg border-2 border-slate-200 p-3 cursor-pointer
        transition-all duration-200 hover:shadow-md hover:border-blue-400
        ${isDragging ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}
      `}
    >
      <div className="flex items-start gap-2">
        {/* Checkbox visual */}
        <div className="flex-shrink-0 mt-0.5">
          <div className="w-4 h-4 rounded border-2 border-slate-300 hover:border-blue-500"></div>
        </div>

        {/* Task info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {/* Task title */}
            <span className="text-sm font-medium text-slate-800 truncate">
              {task.Titulo}
            </span>
          </div>

          {/* Project
          {project && (
            <div className="flex items-center gap-1 mt-1">
              <Icon name="folder" className="w-3 h-3 text-slate-400" />
              <span className="text-xs text-slate-500 truncate">
                {project.nombre}
              </span>
            </div>
          )}

          */}

          {/* Due date indicator (only if overdue) */}
          {isOverdue && (
            <div className="flex items-center gap-1 mt-1">
              <Icon name="calendar" className="w-3 h-3 text-red-500" />
              <span className="text-xs text-red-500">
                Vencida
              </span>
            </div>
          )}
        </div>

        {/* Progress indicator */}
        {task.Porcentaje_Avance > 0 && (
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
              <span className="text-xs font-medium text-slate-600">
                {Math.round(task.Porcentaje_Avance)}%
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
