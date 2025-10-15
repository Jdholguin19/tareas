import React from 'react';

export const TaskSkeleton: React.FC = () => {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 bg-slate-200 rounded"></div>
            <div className="flex-1">
              <div className="h-5 bg-slate-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-slate-200 rounded w-1/2"></div>
            </div>
          </div>
          <div className="mt-3">
            <div className="h-2 bg-slate-200 rounded-full w-full"></div>
          </div>
        </div>
      ))}
    </div>
  );
};
