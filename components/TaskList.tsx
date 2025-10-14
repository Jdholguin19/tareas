import React from 'react';
import type { Task, Project } from '../types';
import { TaskItem } from './TaskItem';

interface TaskListProps {
  tasks: Task[];
  projects: Project[];
  onTaskClick: (task: Task) => void;
  onTaskUpdate: (task: Task) => void;
  onDelete: (taskId: number) => void;
}

export const TaskList: React.FC<TaskListProps> = ({ tasks, projects, onTaskClick, onTaskUpdate, onDelete }) => {
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
    .filter(task => task.Parent_ID === 0 || task.Parent_ID === null)
    .sort((a, b) => new Date(b.Fecha_Creacion).getTime() - new Date(a.Fecha_Creacion).getTime());

  return (
    <ul className="space-y-2">
      {topLevelTasks.map(task => (
        <TaskItem
          key={task.ID}
          task={task}
          allTasks={tasks}
          projects={projects}
          onTaskClick={onTaskClick}
          onUpdate={onTaskUpdate}
          onDelete={onDelete}
          level={0}
        />
      ))}
    </ul>
  );
};