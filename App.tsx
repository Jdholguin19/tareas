import React, { useState, useEffect, useCallback } from 'react';
import { CreateQuickTask } from './components/CreateQuickTask';
import { TaskList } from './components/TaskList';
import { Icon } from './components/Icon';
import type { Task, Project } from './types';
import { getTasks, updateTask, createSubTask, getProjects, deleteTask } from './services/apiService';
import { calculateTaskProgress, hasSubtasks } from './utils/taskUtils';
import { EditTaskModal } from './components/EditTaskModal';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const initialTasks = await getTasks();
      setTasks(initialTasks);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
      // Here you could set an error state and display a message to the user
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchProjects = useCallback(async () => {
    try {
      const initialProjects = await getProjects();
      setProjects(initialProjects);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchProjects();
  }, [fetchTasks, fetchProjects]);

  const handleAddTask = (newTask: Task) => {
    setTasks(prevTasks => [newTask, ...prevTasks]);
  };

  const handleSelectTask = (task: Task) => {
    setEditingTask(task);
  };

  const handleCloseModal = () => {
    setEditingTask(null);
  };

  const handleUpdateTask = async (taskToUpdate: Task) => {
    try {
      const savedTask = await updateTask(taskToUpdate);
      setTasks(currentTasks => {
        let updatedTasks = currentTasks.map(t => (t.ID === savedTask.ID ? savedTask : t));
        
        // If this task has a parent, recalculate parent's progress
        if (savedTask.Parent_ID && savedTask.Parent_ID > 0) {
          const parentTask = updatedTasks.find(t => t.ID === savedTask.Parent_ID);
          if (parentTask && hasSubtasks(parentTask, updatedTasks)) {
            const newParentProgress = calculateTaskProgress(parentTask, updatedTasks);
            if (newParentProgress !== parentTask.Porcentaje_Avance) {
              // Update parent progress automatically
              const updatedParent = { ...parentTask, Porcentaje_Avance: newParentProgress };
              updatedTasks = updatedTasks.map(t => (t.ID === parentTask.ID ? updatedParent : t));
              
              // Also update parent in backend (fire and forget, don't wait)
              updateTask(updatedParent).catch(err => console.warn('Failed to update parent progress:', err));
            }
          }
        }
        
        return updatedTasks;
      });
      
      // Keep modal open if it's open, so user can see changes reflected.
      if (editingTask && editingTask.ID === savedTask.ID) {
        setEditingTask(savedTask);
      }
    } catch (error) {
      console.error("Failed to update task:", error);
      // You could show an error toast here
    }
  };

  const handleCreateSubTask = async (parentTaskId: number, title: string) => {
    try {
      const newSubTask = await createSubTask(parentTaskId, title);
      setTasks(currentTasks => [...currentTasks, newSubTask]);
    } catch (error) {
      console.error("Failed to create sub-task:", error);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await deleteTask(taskId);
      setTasks(currentTasks => {
        const updatedTasks = currentTasks.filter(task => task.ID !== taskId);
        // Recalculate progress for parent tasks
        return updatedTasks.map(task => {
          if (task.Parent_ID === 0) return task; // Skip root tasks
          const parent = updatedTasks.find(t => t.ID === task.Parent_ID);
          if (parent && hasSubtasks(parent, updatedTasks)) {
            return {
              ...task,
              Porcentaje_Avance: calculateTaskProgress(parent, updatedTasks)
            };
          }
          return task;
        });
      });
      // Close modal if the deleted task was being edited
      if (editingTask?.ID === taskId) {
        setEditingTask(null);
      }
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "ID", "Titulo", "Descripcion", "Estado", "Porcentaje_Avance", 
      "Fecha_Creacion", "Fecha_Vencimiento", "Usuario_Creador_ID", 
      "Usuario_Asignado_ID", "Proyecto", "Parent_ID", "Adjuntos_URL"
    ];

    const rows = tasks.map(task => [
      task.ID,
      `"${task.Titulo.replace(/"/g, '""')}"`,
      `"${task.Descripcion?.replace(/"/g, '""') || ''}"`,
      task.Estado,
      task.Porcentaje_Avance,
      task.Fecha_Creacion,
      task.Fecha_Vencimiento || '',
      task.Usuario_Creador_ID,
      task.Usuario_Asignado_ID || '',
      task.Proyecto,
      task.Parent_ID,
      `"${JSON.stringify(task.Adjuntos_URL).replace(/"/g, '""')}"`
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'tareas.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="min-h-screen font-sans">
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-slate-900 p-2 rounded-lg">
                <Icon name="check" className="w-6 h-6 text-white"/>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Mis Tareas</h1>
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-2 bg-white text-slate-600 px-3 py-2 sm:px-4 rounded-lg border border-slate-300 hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-sm sm:text-base"
            disabled={tasks.length === 0}
            aria-label="Exportar tareas a CSV"
          >
            <Icon name="download" className="w-4 h-4 sm:w-5 sm:h-5"/>
            <span className="font-medium hidden sm:inline">Exportar</span>
          </button>
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section aria-labelledby="create-task-heading" className="mb-12">
           <h2 id="create-task-heading" className="sr-only">Crear nueva tarea</h2>
           <CreateQuickTask onTaskCreated={handleAddTask} />
        </section>
        
        <section aria-labelledby="task-list-heading">
            <h2 id="task-list-heading" className="text-xl font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-200">Tus Tareas</h2>
            {isLoading ? (
                <div className="text-center py-10">
                    <p className="text-slate-500">Cargando tareas...</p>
                </div>
            ) : (
                <TaskList tasks={tasks} projects={projects} onTaskClick={handleSelectTask} onTaskUpdate={handleUpdateTask} onDelete={handleDeleteTask} />
            )}
        </section>
      </main>

      {editingTask && (
        <EditTaskModal 
          task={editingTask} 
          allTasks={tasks}
          projects={projects}
          onClose={handleCloseModal}
          onSave={async (task) => {
            await handleUpdateTask(task);
            handleCloseModal();
          }}
          onCreateSubtask={handleCreateSubTask}
          onDelete={handleDeleteTask}
        />
      )}

      <footer className="text-center py-6 text-sm text-slate-500">
        <p>&copy; {new Date().getFullYear()} Minimalist Task Manager. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default App;