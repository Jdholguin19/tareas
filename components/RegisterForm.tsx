import React, { useState } from 'react';
import { apiRegister } from '../services/apiService';

export const RegisterForm: React.FC<{ onRegistered: () => void }> = ({ onRegistered }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await apiRegister(username, password, confirm);
      setSuccess('Registrado correctamente. Redirigiendo...');
      setTimeout(() => onRegistered(), 800);
    } catch (err: any) {
      setError(err.message || 'Error al registrar');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center">Registro</h2>
        {error && <div className="text-red-600 mb-3">{error}</div>}
        {success && <div className="text-green-600 mb-3">{success}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Usuario</label>
            <input value={username} onChange={e => setUsername(e.target.value)} required className="mt-1 block w-full px-3 py-2 border rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Contraseña</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 border rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Confirmar Contraseña</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required className="mt-1 block w-full px-3 py-2 border rounded" />
          </div>
          <div>
            <button type="submit" className="w-full bg-green-600 text-white py-2 rounded">Registrarse</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;
