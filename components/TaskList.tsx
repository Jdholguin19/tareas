import React from 'react';
import type { Task } from '../types';
import { TaskItem } from './TaskItem';

interface TaskListProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onTaskUpdate: (task: Task) => void;
}

export const TaskList: React.FC<TaskListProps> = ({ tasks, onTaskClick, onTaskUpdate }) => {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-10 bg-white rounded-lg shadow-sm">
        <h3 className="text-lg font-medium text-slate-700">¡Todo listo por hoy!</h3>
        <p className="text-slate-500 mt-2">No tienes tareas pendientes. Añade una nueva para empezar.</p>
      </div>
    );
  }

  // Filter for top-level tasks to start the recursive rendering
  const topLevelTasks = tasks
    .filter(task => task.Parent_ID === 0)
    .sort((a, b) => new Date(b.Fecha_Creacion).getTime() - new Date(a.Fecha_Creacion).getTime());

  return (
    <ul className="space-y-2">
      {topLevelTasks.map(task => (
        <TaskItem
          key={task.ID}
          task={task}
          allTasks={tasks}
          onTaskClick={onTaskClick}
          onUpdate={onTaskUpdate}
          level={0}
        />
      ))}
    </ul>
  );
};