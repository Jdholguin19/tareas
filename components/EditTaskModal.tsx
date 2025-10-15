import React, { useState, useEffect } from 'react';
import type { Task, Project } from '../types';
import { TaskState } from '../types';
import { Icon } from './Icon';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';

interface EditTaskModalProps {
  task: Task;
  allTasks: Task[];
  projects: Project[];
  onClose: () => void;
  onSave: (updatedTask: Task) => Promise<void>;
  onCreateSubtask: (parentTaskId: number, title: string) => Promise<void>;
  onDelete: (taskId: number) => void;
}

export const EditTaskModal: React.FC<EditTaskModalProps> = ({ task, allTasks, projects, onClose, onSave, onCreateSubtask, onDelete }) => {
  const [formData, setFormData] = useState<Task>({ ...task });
  const [isSaving, setIsSaving] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setFormData({...task});
  }, [task]);
  
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0));
    let newStatus = TaskState.PENDIENTE;
    if (value === 100) {
      newStatus = TaskState.COMPLETADA;
    } else if (value > 0) {
      newStatus = TaskState.EN_PROGRESO;
    }
    
    setFormData(prev => ({ 
      ...prev, 
      Porcentaje_Avance: value,
      Estado: newStatus
    }));
  };

  const handleCompletedToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
      const isChecked = e.target.checked;
      if (isChecked) {
          setFormData(prev => ({
              ...prev,
              Porcentaje_Avance: 100,
              Estado: TaskState.COMPLETADA
          }));
      } else {
          setFormData(prev => ({
              ...prev,
              Porcentaje_Avance: 0,
              Estado: TaskState.PENDIENTE
          }));
      }
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(formData);
    // isSaving will be false when the modal closes after a successful save
  };
  
  const handleAddNewSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;
    setIsAddingSubtask(true);
    await onCreateSubtask(task.ID, newSubtaskTitle);
    setNewSubtaskTitle('');
    setIsAddingSubtask(false);
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await onDelete(task.ID);
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error deleting task:', error);
      // Keep modal open on error so user can try again or cancel
      alert('Error al eliminar la tarea. Por favor, inténtalo de nuevo.');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDateForInput = (dateString: string | null) => {
    if (!dateString) return '';
    return dateString.split('T')[0];
  };

  const isCompleted = formData.Porcentaje_Avance === 100;
  const subtasks = allTasks.filter(t => t.Parent_ID === task.ID);

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-center p-2 sm:p-4" 
        onClick={onClose} 
        aria-modal="true" 
        role="dialog"
    >
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-3xl p-4 sm:p-6 lg:p-6 xl:p-8 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start pb-3 sm:pb-4 border-b border-slate-200">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-slate-800 truncate">Editar Tarea</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">Modifica los detalles de tu tarea.</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleDeleteClick}
              className="p-1.5 sm:p-2 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
              title="Eliminar tarea"
              aria-label="Eliminar tarea"
            >
              <Icon name="trash" className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button onClick={onClose} className="p-1.5 sm:p-2 rounded-full hover:bg-slate-100" aria-label="Cerrar modal">
               <Icon name="close" className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" />
            </button>
          </div>
        </div>
        
        <div className="mt-4 sm:mt-6 lg:mt-6 xl:mt-8 space-y-4 sm:space-y-6 lg:space-y-6 xl:space-y-8 max-h-[60vh] sm:max-h-[65vh] lg:max-h-[70vh] xl:max-h-[75vh] overflow-y-auto">
          {/* Main Form Fields */}
          <div>
            <label htmlFor="Titulo" className="block text-sm font-medium text-slate-700 mb-1">Título</label>
            <textarea
              id="Titulo"
              name="Titulo"
              value={formData.Titulo}
              onChange={handleChange}
              rows={2}
              className="w-full p-2 sm:p-2.5 border border-slate-300 bg-slate-50 text-slate-900 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
            />
          </div>
          
          <div>
            <label htmlFor="Descripcion" className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
            <textarea
              id="Descripcion"
              name="Descripcion"
              value={formData.Descripcion || ''}
              onChange={handleChange}
              rows={3}
              className="w-full p-2 sm:p-2.5 border border-slate-300 bg-slate-50 text-slate-900 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label htmlFor="Estado" className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
              <select id="Estado" name="Estado" value={formData.Estado} onChange={handleChange} className="w-full p-2 sm:p-2.5 border border-slate-300 bg-slate-50 text-slate-900 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors text-sm sm:text-base">
                {Object.values(TaskState).map(state => (<option key={state} value={state}>{state}</option>))}
              </select>
            </div>
            {task.Parent_ID === 0 && (
              <div>
                <label htmlFor="Proyecto" className="block text-sm font-medium text-slate-700 mb-1">Proyecto</label>
                <select id="Proyecto" name="Proyecto" value={formData.Proyecto} onChange={handleChange} className="w-full p-2 sm:p-2.5 border border-slate-300 bg-slate-50 text-slate-900 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors text-sm sm:text-base">
                  {projects.map(project => (<option key={project.id} value={project.id}>{project.nombre}</option>))}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label htmlFor="Fecha_Vencimiento" className="block text-sm font-medium text-slate-700 mb-1">Fecha de Vencimiento</label>
              <input type="date" id="Fecha_Vencimiento" name="Fecha_Vencimiento" value={formatDateForInput(formData.Fecha_Vencimiento)} onChange={handleChange} className="w-full p-2 sm:p-2.5 border border-slate-300 bg-slate-50 text-slate-900 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors text-sm sm:text-base" />
            </div>
          </div>
          
          <div className="flex items-center p-2 sm:p-3 bg-slate-50 rounded-lg">
            <input type="checkbox" id="isCompletedCheckbox" checked={isCompleted} onChange={handleCompletedToggle} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <label htmlFor="isCompletedCheckbox" className="ml-2 sm:ml-3 block text-sm font-medium text-slate-700">Marcar como completada</label>
          </div>

          <div>
            <label htmlFor="Porcentaje_Avance" className="block text-sm font-medium text-slate-700 mb-2">
              Progreso: 
              <input 
                type="number" 
                min="0" 
                max="100" 
                value={formData.Porcentaje_Avance} 
                onChange={handleProgressChange} 
                className="inline-block w-16 ml-2 px-2 py-1 text-sm font-bold text-blue-600 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500"
              />%
            </label>
            <div className="relative">
              <input 
                type="range" 
                id="Porcentaje_Avance" 
                name="Porcentaje_Avance" 
                min="0" 
                max="100" 
                step="5" 
                value={formData.Porcentaje_Avance} 
                onChange={handleProgressChange} 
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer range-thumb-blue disabled:opacity-50" 
                disabled={isCompleted} 
              />
            </div>
          </div>

          {/* Sub-tasks Section */}
          <div className="pt-4 sm:pt-6 mt-4 sm:mt-6 border-t border-slate-200">
              <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-slate-700 mb-2 sm:mb-3">Sub-tareas</h3>
              {subtasks.length > 0 && (
                  <ul className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                      {subtasks.map(st => (
                          <li key={st.ID} className={`flex items-center justify-between bg-slate-50 p-2 sm:p-2.5 rounded-md text-xs sm:text-sm ${st.Estado === TaskState.COMPLETADA ? 'text-slate-500' : 'text-slate-800'}`}>
                              <span className={`truncate mr-2 ${st.Estado === TaskState.COMPLETADA ? 'line-through' : ''}`}>{st.Titulo}</span>
                              <div className="w-12 sm:w-16 bg-slate-200 rounded-full h-1 sm:h-1.5 flex-shrink-0">
                                <div className="bg-blue-600 h-1 sm:h-1.5 rounded-full" style={{ width: `${st.Porcentaje_Avance}%` }}></div>
                              </div>
                          </li>
                      ))}
                  </ul>
              )}
              <div className="flex gap-2">
                  <input 
                      type="text"
                      value={newSubtaskTitle}
                      onChange={e => setNewSubtaskTitle(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddNewSubtask()}
                      placeholder="Añadir nueva sub-tarea..."
                      className="flex-grow p-2 sm:p-2.5 border border-slate-300 bg-slate-50 text-slate-900 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
                      disabled={isAddingSubtask}
                  />
                  <button
                      onClick={handleAddNewSubtask}
                      disabled={!newSubtaskTitle.trim() || isAddingSubtask}
                      className="px-3 sm:px-4 py-2 bg-slate-800 text-white font-semibold rounded-lg hover:bg-slate-900 disabled:bg-slate-300 flex items-center transition-colors text-sm sm:text-base"
                  >
                      {isAddingSubtask ? <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Icon name="plus" className="w-4 h-4 sm:w-5 sm:h-5"/>}
                  </button>
              </div>
          </div>
        </div>
        
        <div className="flex flex-col-reverse sm:flex-row justify-end items-center pt-4 sm:pt-6 lg:pt-6 xl:pt-8 mt-4 sm:mt-6 lg:mt-6 xl:mt-8 border-t border-slate-200 space-y-2 sm:space-y-3 space-y-reverse sm:space-y-0 sm:space-x-3">
          <button onClick={onClose} className="w-full sm:w-auto px-4 sm:px-5 py-2 bg-white text-slate-700 rounded-lg border border-slate-300 hover:bg-slate-100 font-semibold transition-all text-sm sm:text-base">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-slate-300 flex items-center justify-center shadow-sm hover:shadow-md transition-all text-sm sm:text-base">
             {isSaving ? <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div> : <Icon name="save" className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />}
            Guardar Cambios
          </button>
        </div>
      </div>
      <style>{`
        .animate-fade-in-up { animation: fade-in-up 0.3s ease-out forwards; }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .range-thumb-blue::-webkit-slider-thumb { background-color: #2563eb; cursor: pointer; }
        .range-thumb-blue::-moz-range-thumb { background-color: #2563eb; cursor: pointer; }
      `}</style>

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        taskTitle={task.Titulo}
        isDeleting={isDeleting}
      />
    </div>
  );
};