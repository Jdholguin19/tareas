import React, { useState } from 'react';
import { Task, Project, EisenhowerQuadrant } from '../types';
import type { TaskPriority, TaskImportance } from '../types';
import { MatrixTaskItem } from './MatrixTaskItem';
import { Icon } from './Icon';

interface EisenhowerMatrixProps {
  tasks: Task[];
  projects: Project[];
  taskAssigneesRecord: Record<number, {id: number, username: string}[]>;
  onTaskClick: (task: Task) => void;
  onTaskUpdate: (task: Task) => void;
  onDelete: (taskId: number) => void;
}

interface QuadrantInfo {
  title: string;
  description: string;
  color: string;
  bgColor: string;
  icon: string;
}

const quadrantInfo: Record<EisenhowerQuadrant, QuadrantInfo> = {
  urgente_importante: {
    title: 'Hacer Ahora',
    description: 'Urgente e Importante',
    color: 'text-red-700',
    bgColor: 'bg-red-50 border-red-300',
    icon: 'alertTriangle'
  },
  no_urgente_importante: {
    title: 'Programar',
    description: 'Importante pero No Urgente',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50 border-blue-300',
    icon: 'calendar'
  },
  urgente_no_importante: {
    title: 'Delegar',
    description: 'Urgente pero No Importante',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50 border-yellow-300',
    icon: 'users'
  },
  no_urgente_no_importante: {
    title: 'Eliminar/Reducir',
    description: 'Ni Urgente ni Importante',
    color: 'text-gray-700',
    bgColor: 'bg-gray-50 border-gray-300',
    icon: 'trash'
  }
};

export const EisenhowerMatrix: React.FC<EisenhowerMatrixProps> = ({
  tasks,
  projects,
  taskAssigneesRecord,
  onTaskClick,
  onTaskUpdate,
  onDelete
}) => {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [draggedOverQuadrant, setDraggedOverQuadrant] = useState<EisenhowerQuadrant | null>(null);
  
  // Función para determinar el cuadrante de una tarea
  const getTaskQuadrant = (task: Task): EisenhowerQuadrant => {
    const prioridad = task.Prioridad || 'media';
    const importancia = task.Importancia || 'media';
    
    // Urgente e Importante
    if (prioridad === 'alta' && importancia === 'alta') {
      return EisenhowerQuadrant.URGENTE_IMPORTANTE;
    }
    // Importante pero No Urgente
    if ((prioridad === 'media' || prioridad === 'baja') && importancia === 'alta') {
      return EisenhowerQuadrant.NO_URGENTE_IMPORTANTE;
    }
    // Urgente pero No Importante
    if (prioridad === 'alta' && (importancia === 'media' || importancia === 'baja')) {
      return EisenhowerQuadrant.URGENTE_NO_IMPORTANTE;
    }
    // Ni Urgente ni Importante
    return EisenhowerQuadrant.NO_URGENTE_NO_IMPORTANTE;
  };

  // Agrupar tareas por cuadrante
  const tasksByQuadrant = React.useMemo(() => {
    const groups: Record<EisenhowerQuadrant, Task[]> = {
      [EisenhowerQuadrant.URGENTE_IMPORTANTE]: [],
      [EisenhowerQuadrant.NO_URGENTE_IMPORTANTE]: [],
      [EisenhowerQuadrant.URGENTE_NO_IMPORTANTE]: [],
      [EisenhowerQuadrant.NO_URGENTE_NO_IMPORTANTE]: []
    };

    // Filtrar SOLO tareas no completadas (sin importar si son padre o subtarea)
    const activeTasks = tasks.filter(task => {
      const progress = typeof task.Porcentaje_Avance === 'string' 
        ? parseFloat(task.Porcentaje_Avance) 
        : task.Porcentaje_Avance;
      return progress < 100;
    });

    activeTasks.forEach(task => {
      const quadrant = getTaskQuadrant(task);
      groups[quadrant].push(task);
    });

    // Ordenar tareas dentro de cada cuadrante por fecha de vencimiento
    Object.keys(groups).forEach(key => {
      groups[key as EisenhowerQuadrant].sort((a, b) => {
        if (!a.Fecha_Vencimiento) return 1;
        if (!b.Fecha_Vencimiento) return -1;
        return new Date(a.Fecha_Vencimiento).getTime() - new Date(b.Fecha_Vencimiento).getTime();
      });
    });

    return groups;
  }, [tasks]);

  // Funciones de Drag & Drop
  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent, quadrant: EisenhowerQuadrant) => {
    e.preventDefault();
    setDraggedOverQuadrant(quadrant);
  };

  const handleDragLeave = () => {
    setDraggedOverQuadrant(null);
  };

  const handleDrop = (e: React.DragEvent, targetQuadrant: EisenhowerQuadrant) => {
    e.preventDefault();
    
    if (!draggedTask) return;

    // Determinar nueva prioridad e importancia basándose en el cuadrante destino
    let newPriority: TaskPriority;
    let newImportance: TaskImportance;

    switch (targetQuadrant) {
      case EisenhowerQuadrant.URGENTE_IMPORTANTE:
        newPriority = 'alta' as TaskPriority;
        newImportance = 'alta' as TaskImportance;
        break;
      case EisenhowerQuadrant.NO_URGENTE_IMPORTANTE:
        newPriority = 'media' as TaskPriority;
        newImportance = 'alta' as TaskImportance;
        break;
      case EisenhowerQuadrant.URGENTE_NO_IMPORTANTE:
        newPriority = 'alta' as TaskPriority;
        newImportance = 'media' as TaskImportance;
        break;
      case EisenhowerQuadrant.NO_URGENTE_NO_IMPORTANTE:
        newPriority = 'baja' as TaskPriority;
        newImportance = 'baja' as TaskImportance;
        break;
    }

    // Actualizar la tarea
    const updatedTask = {
      ...draggedTask,
      Prioridad: newPriority,
      Importancia: newImportance
    };

    onTaskUpdate(updatedTask);

    // Resetear estado
    setDraggedTask(null);
    setDraggedOverQuadrant(null);
  };

  const renderQuadrant = (quadrant: EisenhowerQuadrant) => {
    const info = quadrantInfo[quadrant];
    const quadrantTasks = tasksByQuadrant[quadrant];
    const isOver = draggedOverQuadrant === quadrant;

    return (
      <div 
        key={quadrant} 
        className={`
          border-2 rounded-lg p-4 flex flex-col h-full transition-all duration-200
          ${info.bgColor}
          ${isOver ? 'ring-4 ring-blue-400 ring-opacity-50 scale-[1.02]' : ''}
        `}
        onDragOver={(e) => handleDragOver(e, quadrant)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, quadrant)}
      >
        <div className="mb-4 flex-shrink-0">
          <div className="flex items-center gap-2 mb-1">
            <Icon name={info.icon as any} className={`w-5 h-5 ${info.color}`} />
            <h3 className={`text-lg font-semibold ${info.color}`}>
              {info.title}
            </h3>
            <span className={`ml-auto px-2 py-1 text-xs font-medium ${info.color} bg-white rounded-full`}>
              {quadrantTasks.length}
            </span>
          </div>
          <p className="text-sm text-slate-600">{info.description}</p>
        </div>

        <div className="flex-1 overflow-y-auto max-h-[300px] space-y-2 pr-2">
          {quadrantTasks.length > 0 ? (
            quadrantTasks.map(task => (
              <div
                key={task.ID}
                draggable
                onDragStart={() => handleDragStart(task)}
                onDragEnd={() => setDraggedTask(null)}
              >
                <MatrixTaskItem
                  task={task}
                  projects={projects}
                  onTaskClick={onTaskClick}
                  isDragging={draggedTask?.ID === task.ID}
                />
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-slate-400">
              <p className="text-sm">No hay tareas en este cuadrante</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-purple-100 p-2 rounded-lg">
            <Icon name="grid" className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Matriz de Eisenhower</h2>
            <p className="text-sm text-slate-600">Organiza tus tareas por urgencia e importancia</p>
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-slate-600"><strong>Urgente:</strong> Prioridad Alta</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-slate-600"><strong>Importante:</strong> Importancia Alta</span>
          </div>
        </div>
      </div>

      {/* Matrix Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cuadrante 1: Urgente e Importante */}
        {renderQuadrant(EisenhowerQuadrant.URGENTE_IMPORTANTE)}

        {/* Cuadrante 2: Importante pero No Urgente */}
        {renderQuadrant(EisenhowerQuadrant.NO_URGENTE_IMPORTANTE)}

        {/* Cuadrante 3: Urgente pero No Importante */}
        {renderQuadrant(EisenhowerQuadrant.URGENTE_NO_IMPORTANTE)}

        {/* Cuadrante 4: Ni Urgente ni Importante */}
        {renderQuadrant(EisenhowerQuadrant.NO_URGENTE_NO_IMPORTANTE)}
      </div>

      {/* Legend */}
      <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
        <h4 className="font-semibold text-slate-700 mb-3">Guía de Acción:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div>
            <span className="font-medium text-red-700">• Hacer Ahora:</span>
            <span className="text-slate-600"> Tareas críticas que requieren atención inmediata</span>
          </div>
          <div>
            <span className="font-medium text-blue-700">• Programar:</span>
            <span className="text-slate-600"> Planifica tiempo para estas tareas importantes</span>
          </div>
          <div>
            <span className="font-medium text-yellow-700">• Delegar:</span>
            <span className="text-slate-600"> Asigna estas tareas a otros miembros del equipo</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">• Eliminar:</span>
            <span className="text-slate-600"> Considera si estas tareas son realmente necesarias</span>
          </div>
        </div>
      </div>
    </div>
  );
};
