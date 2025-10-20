import React, { useState } from 'react';
import { apiRegister } from '../services/apiService';

export const RegisterForm: React.FC<{ onRegistered: () => void; onSwitchToLogin: () => void }> = ({ onRegistered, onSwitchToLogin }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Basic username validation
    if (username.trim().length < 3) {
      setError('El nombre de usuario debe tener al menos 3 caracteres');
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Por favor ingresa un correo electrónico válido');
      return;
    }
    
    try {
      await apiRegister(username, email, password, confirm);
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
            <label className="block text-sm font-medium text-gray-700">Nombre de usuario</label>
            <input 
              type="text"
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              required 
              placeholder="usuario123"
              minLength={3}
              className="mt-1 block w-full px-3 py-2 border rounded" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Correo electrónico</label>
            <input 
              type="email"
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
              placeholder="tu@email.com"
              className="mt-1 block w-full px-3 py-2 border rounded" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Contraseña</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              placeholder="Mínimo 6 caracteres"
              className="mt-1 block w-full px-3 py-2 border rounded" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Confirmar Contraseña</label>
            <input 
              type="password" 
              value={confirm} 
              onChange={e => setConfirm(e.target.value)} 
              required 
              placeholder="Repite tu contraseña"
              className="mt-1 block w-full px-3 py-2 border rounded" 
            />
          </div>
          <div>
            <button type="submit" className="w-full bg-green-600 text-white py-2 rounded">Registrarse</button>
          </div>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          ¿Ya tienes cuenta?{' '}
          <button
            onClick={onSwitchToLogin}
            className="text-blue-600 hover:text-blue-500 font-medium"
          >
            Inicia sesión
          </button>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm;
