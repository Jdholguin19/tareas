import React, { useState, useEffect } from 'react';
import type { Task } from '../types';
import { TaskState } from '../types';
import { Icon } from './Icon';
import { PROJECT_OPTIONS } from '../constants';

interface EditTaskModalProps {
  task: Task;
  allTasks: Task[];
  onClose: () => void;
  onSave: (updatedTask: Task) => Promise<void>;
  onCreateSubtask: (parentTaskId: number, title: string) => Promise<void>;
}

export const EditTaskModal: React.FC<EditTaskModalProps> = ({ task, allTasks, onClose, onSave, onCreateSubtask }) => {
  const [formData, setFormData] = useState<Task>({ ...task });
  const [isSaving, setIsSaving] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);

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
    const value = parseInt(e.target.value, 10);
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

  const formatDateForInput = (dateString: string | null) => {
    if (!dateString) return '';
    return dateString.split('T')[0];
  };

  const formElementClasses = "w-full p-2.5 border border-slate-300 bg-slate-50 text-slate-900 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors";
  const isCompleted = formData.Porcentaje_Avance === 100;
  const subtasks = allTasks.filter(t => t.Parent_ID === task.ID);

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-center p-4" 
        onClick={onClose} 
        aria-modal="true" 
        role="dialog"
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 sm:p-8 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Editar Tarea</h2>
            <p className="text-sm text-slate-500 mt-1">Modifica los detalles de tu tarea.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100" aria-label="Cerrar modal">
             <Icon name="close" className="w-6 h-6 text-slate-600" />
          </button>
        </div>
        
        <div className="mt-6 space-y-6 max-h-[80vh] overflow-y-auto pr-3 -mr-3">
          {/* Main Form Fields */}
          <div>
            <label htmlFor="Titulo" className="block text-sm font-medium text-slate-700 mb-1">Título</label>
            <textarea
              id="Titulo"
              name="Titulo"
              value={formData.Titulo}
              onChange={handleChange}
              rows={2}
              className={formElementClasses}
            />
          </div>
          
          <div>
            <label htmlFor="Descripcion" className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
            <textarea
              id="Descripcion"
              name="Descripcion"
              value={formData.Descripcion || ''}
              onChange={handleChange}
              rows={4}
              className={formElementClasses}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="Estado" className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
              <select id="Estado" name="Estado" value={formData.Estado} onChange={handleChange} className={formElementClasses} disabled>
                {Object.values(TaskState).map(state => (<option key={state} value={state}>{state}</option>))}
              </select>
            </div>
            <div>
              <label htmlFor="Proyecto" className="block text-sm font-medium text-slate-700 mb-1">Proyecto</label>
              <select id="Proyecto" name="Proyecto" value={formData.Proyecto} onChange={handleChange} className={formElementClasses}>
                {PROJECT_OPTIONS.map(project => (<option key={project} value={project}>{project}</option>))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="Fecha_Vencimiento" className="block text-sm font-medium text-slate-700 mb-1">Fecha de Vencimiento</label>
              <input type="date" id="Fecha_Vencimiento" name="Fecha_Vencimiento" value={formatDateForInput(formData.Fecha_Vencimiento)} onChange={handleChange} className={formElementClasses} />
            </div>
          </div>
          
          <div className="flex items-center p-3 bg-slate-50 rounded-lg">
            <input type="checkbox" id="isCompletedCheckbox" checked={isCompleted} onChange={handleCompletedToggle} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <label htmlFor="isCompletedCheckbox" className="ml-3 block text-sm font-medium text-slate-700">Marcar como completada</label>
          </div>

          <div>
            <label htmlFor="Porcentaje_Avance" className="block text-sm font-medium text-slate-700 mb-1">Progreso: <span className="font-bold text-blue-600">{formData.Porcentaje_Avance}%</span></label>
            <input type="range" id="Porcentaje_Avance" name="Porcentaje_Avance" min="0" max="100" step="5" value={formData.Porcentaje_Avance} onChange={handleProgressChange} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer range-thumb-blue disabled:opacity-50" disabled={isCompleted} />
          </div>

          {/* Sub-tasks Section */}
          <div className="pt-6 mt-6 border-t border-slate-200">
              <h3 className="text-lg font-semibold text-slate-700 mb-3">Sub-tareas</h3>
              {subtasks.length > 0 && (
                  <ul className="space-y-2 mb-4">
                      {subtasks.map(st => (
                          <li key={st.ID} className={`flex items-center justify-between bg-slate-50 p-2.5 rounded-md text-sm ${st.Estado === TaskState.COMPLETADA ? 'text-slate-500' : 'text-slate-800'}`}>
                              <span className={st.Estado === TaskState.COMPLETADA ? 'line-through' : ''}>{st.Titulo}</span>
                              <div className="w-16 bg-slate-200 rounded-full h-1.5">
                                <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${st.Porcentaje_Avance}%` }}></div>
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
                      className={`${formElementClasses} flex-grow`}
                      disabled={isAddingSubtask}
                  />
                  <button
                      onClick={handleAddNewSubtask}
                      disabled={!newSubtaskTitle.trim() || isAddingSubtask}
                      className="px-4 py-2 bg-slate-800 text-white font-semibold rounded-lg hover:bg-slate-900 disabled:bg-slate-300 flex items-center transition-colors"
                  >
                      {isAddingSubtask ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Icon name="plus" className="w-5 h-5"/>}
                  </button>
              </div>
          </div>
        </div>
        
        <div className="flex flex-col-reverse sm:flex-row justify-end items-center pt-6 mt-6 border-t border-slate-200 space-y-3 space-y-reverse sm:space-y-0 sm:space-x-3">
          <button onClick={onClose} className="w-full sm:w-auto px-5 py-2 bg-white text-slate-700 rounded-lg border border-slate-300 hover:bg-slate-100 font-semibold transition-all">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-slate-300 flex items-center justify-center shadow-sm hover:shadow-md transition-all">
             {isSaving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div> : <Icon name="save" className="w-5 h-5 mr-2" />}
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
    </div>
  );
};