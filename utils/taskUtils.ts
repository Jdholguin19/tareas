import type { Task } from '../types';

/**
 * Calculate the automatic progress of a task based on its subtasks
 * @param task The task to calculate progress for
 * @param allTasks All tasks to find subtasks
 * @returns The calculated progress percentage (0-100)
 */
export const calculateTaskProgress = (task: Task, allTasks: Task[]): number => {
  const subtasks = allTasks.filter(t => t.Parent_ID === task.ID);

  if (subtasks.length === 0) {
    // No subtasks, return current progress (manual)
    return task.Porcentaje_Avance;
  }

  // Calculate weighted average of subtasks progress
  const totalProgress = subtasks.reduce((sum, subtask) => {
    return sum + calculateTaskProgress(subtask, allTasks);
  }, 0);

  return Math.round(totalProgress / subtasks.length);
};

/**
 * Check if a task has subtasks
 * @param task The task to check
 * @param allTasks All tasks to search for subtasks
 * @returns True if the task has subtasks
 */
export const hasSubtasks = (task: Task, allTasks: Task[]): boolean => {
  return allTasks.some(t => t.Parent_ID === task.ID);
};