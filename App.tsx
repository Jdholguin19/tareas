import React, { useState, useEffect, useCallback } from 'react';
import { CreateQuickTask } from './components/CreateQuickTask';
import { TaskList } from './components/TaskList';
import { Icon } from './components/Icon';
import type { Task } from './types';
import { getTasks, updateTask, createSubTask } from './services/apiService';
import { EditTaskModal } from './components/EditTaskModal';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
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

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

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
      setTasks(currentTasks => 
        currentTasks.map(t => (t.ID === savedTask.ID ? savedTask : t))
      );
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
            <h1 className="text-2xl font-bold text-slate-900">Mis Tareas</h1>
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-2 bg-white text-slate-600 px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
            disabled={tasks.length === 0}
            aria-label="Exportar tareas a CSV"
          >
            <Icon name="download" className="w-5 h-5"/>
            <span className="font-medium">Exportar</span>
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
                <TaskList tasks={tasks} onTaskClick={handleSelectTask} onTaskUpdate={handleUpdateTask} />
            )}
        </section>
      </main>

      {editingTask && (
        <EditTaskModal 
          task={editingTask} 
          allTasks={tasks}
          onClose={handleCloseModal}
          onSave={async (task) => {
            await handleUpdateTask(task);
            handleCloseModal();
          }}
          onCreateSubtask={handleCreateSubTask}
        />
      )}

      <footer className="text-center py-6 text-sm text-slate-500">
        <p>&copy; {new Date().getFullYear()} Minimalist Task Manager. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default App;