import React, { useState } from 'react';
import type { Task, Project } from '../types';
import { TaskPriority } from '../types';
import { TaskItem } from './TaskItem';

interface TaskListProps {
  tasks: Task[];
  projects: Project[];
  taskAssigneesRecord: Record<number, {id: number, username: string}[]>;
  onTaskClick: (task: Task) => void;
  onTaskUpdate: (task: Task) => void;
  onDelete: (taskId: number) => void;
  sectionType?: 'urgent' | 'today' | 'scheduled' | 'completed';
}

export const TaskList: React.FC<TaskListProps> = ({ tasks, projects, taskAssigneesRecord, onTaskClick, onTaskUpdate, onDelete, sectionType }) => {
  const [focusedTaskId, setFocusedTaskId] = useState<number | null>(null);

  const handleFocusTask = (taskId: number) => {
    setFocusedTaskId(taskId);
    // Clear focus after 3 seconds
    window.setTimeout(() => setFocusedTaskId(null), 3000);
  };
  if (tasks.length === 0) {
    return (
      <div className="text-center py-10 bg-white rounded-lg shadow-sm">
        <h3 className="text-lg font-medium text-slate-700">¡Todo listo por hoy!</h3>
        <p className="text-slate-500 mt-2">No tienes tareas pendientes. Añade una nueva para empezar.</p>
      </div>
    );
  }

  // Special logic for urgent section: important tasks don't follow hierarchy
  if (sectionType === 'urgent') {
    // Separate important tasks from other tasks
    const importantTasks = tasks.filter(task => task.Prioridad === TaskPriority.ALTA);
    const otherTasks = tasks.filter(task => task.Prioridad !== TaskPriority.ALTA);
    
    // For important tasks: render them flat (no hierarchy)
    const importantTasksFlat = importantTasks.map(task => (
      <TaskItem
        key={task.ID}
        task={task}
        allTasks={tasks}
        projects={projects}
        taskAssigneesRecord={taskAssigneesRecord}
        onTaskClick={onTaskClick}
        onUpdate={onTaskUpdate}
        onDelete={onDelete}
        level={0} // Always level 0 for important tasks
        focusedTaskId={focusedTaskId}
        onFocusTask={handleFocusTask}
        sectionType={sectionType}
        hideChildren={true} // Don't show children for important tasks in urgent section
      />
    ));
    
    // For other urgent tasks: follow normal hierarchy
    const taskIds = new Set(otherTasks.map(t => t.ID));
    const topLevelOtherTasks = otherTasks
      .filter(task => {
        // Root tasks
        if (task.Parent_ID === 0 || task.Parent_ID === null) return true;
        // Tasks whose parent is not in this filtered list (orphaned branches)
        return task.Parent_ID && !taskIds.has(task.Parent_ID);
      })
      .sort((a, b) => new Date(b.Fecha_Creacion).getTime() - new Date(a.Fecha_Creacion).getTime());
    
    const otherTasksHierarchical = topLevelOtherTasks.map(task => (
      <TaskItem
        key={task.ID}
        task={task}
        allTasks={otherTasks}
        projects={projects}
        taskAssigneesRecord={taskAssigneesRecord}
        onTaskClick={onTaskClick}
        onUpdate={onTaskUpdate}
        onDelete={onDelete}
        level={0}
        focusedTaskId={focusedTaskId}
        onFocusTask={handleFocusTask}
        sectionType={sectionType}
      />
    ));
    
    return (
      <ul className="space-y-2">
        {/* Important tasks first (flat) */}
        {importantTasksFlat}
        {/* Other urgent tasks (hierarchical) */}
        {otherTasksHierarchical}
      </ul>
    );
  }

  // Normal logic for other sections
  // Filter for top-level tasks to start the recursive rendering
  // Include tasks that are root (Parent_ID = 0/null) OR whose parent is not in the list
  const taskIds = new Set(tasks.map(t => t.ID));
  const topLevelTasks = tasks
    .filter(task => {
      // Root tasks
      if (task.Parent_ID === 0 || task.Parent_ID === null) return true;
      // Tasks whose parent is not in this filtered list (orphaned branches)
      return task.Parent_ID && !taskIds.has(task.Parent_ID);
    })
    .sort((a, b) => new Date(b.Fecha_Creacion).getTime() - new Date(a.Fecha_Creacion).getTime());

  return (
    <ul className="space-y-2">
      {topLevelTasks.map(task => (
        <TaskItem
          key={task.ID}
          task={task}
          allTasks={tasks}
          projects={projects}
          taskAssigneesRecord={taskAssigneesRecord}
          onTaskClick={onTaskClick}
          onUpdate={onTaskUpdate}
          onDelete={onDelete}
          level={0}
          focusedTaskId={focusedTaskId}
          onFocusTask={handleFocusTask}
          sectionType={sectionType}
        />
      ))}
    </ul>
  );
};