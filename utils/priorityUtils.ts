import type { Task, TaskPriority, TaskImportance } from '../types';

/**
 * Calcula la prioridad e importancia automática de una tarea basándose en su fecha de vencimiento
 * 
 * Reglas:
 * - Por defecto: baja en ambas
 * - Si falta ≤7 días para vencer: media en ambas
 * - Si no tiene fecha de vencimiento: media en ambas
 * 
 * @param task - La tarea a evaluar
 * @returns Objeto con prioridad e importancia calculadas
 */
export function calculateAutoPriorityAndImportance(task: Task): {
  prioridad: TaskPriority;
  importancia: TaskImportance;
} {
  // Si no tiene fecha de vencimiento, ambos son media
  if (!task.Fecha_Vencimiento) {
    return {
      prioridad: 'media' as TaskPriority,
      importancia: 'media' as TaskImportance
    };
  }

  // Calcular días restantes hasta el vencimiento
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to start of day
  
  const dueDate = new Date(task.Fecha_Vencimiento);
  dueDate.setHours(0, 0, 0, 0);
  
  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Si faltan 7 días o menos, ambos son media
  if (diffDays <= 7) {
    return {
      prioridad: 'media' as TaskPriority,
      importancia: 'media' as TaskImportance
    };
  }

  // En cualquier otro caso, ambos son baja
  return {
    prioridad: 'baja' as TaskPriority,
    importancia: 'baja' as TaskImportance
  };
}

/**
 * Aplica el cálculo automático de prioridad e importancia a una tarea
 * Solo actualiza si los valores actuales son 'baja' (para no sobrescribir cambios manuales)
 * 
 * @param task - La tarea a actualizar
 * @returns La tarea con prioridad e importancia actualizadas
 */
export function applyAutoPriorityAndImportance(task: Task): Task {
  const auto = calculateAutoPriorityAndImportance(task);
  
  return {
    ...task,
    // Solo actualizar si está en 'baja' (no sobrescribir cambios manuales)
    Prioridad: task.Prioridad === 'baja' ? auto.prioridad : task.Prioridad,
    Importancia: task.Importancia === 'baja' ? auto.importancia : task.Importancia
  };
}
