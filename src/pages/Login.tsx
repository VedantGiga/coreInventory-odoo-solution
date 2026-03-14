import { useState } from 'react';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { Package, Lock, Mail } from 'lucide-react';
import './Login.css';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useStore();
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      login(email);
      navigate('/');
    }
  };

  return (
    <div className="login-container flex items-center justify-center">
      <div className="login-card card flex-col animate-fade-in">
        <div className="flex-col items-center gap-2 brand-header">
          <div className="brand-logo glass flex justify-center items-center">
            <Package size={28} className="text-primary" />
          </div>
          <h1 className="text-2xl font-semibold">CoreInventory</h1>
          <p className="text-muted text-sm">Sign in to manage your inventory</p>
        </div>

        <form onSubmit={handleLogin} className="flex-col gap-4 login-form">
          <div className="form-group flex-col">
            <label className="label">Email Address</label>
            <div className="input-wrapper relative">
              <Mail className="input-icon text-muted" size={18} />
              <input
                type="email"
                placeholder="admin@coreinventory.com"
                className="input-field with-icon"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group flex-col">
            <label className="label">Password</label>
            <div className="input-wrapper relative">
              <Lock className="input-icon text-muted" size={18} />
              <input
                type="password"
                placeholder="••••••••"
                className="input-field with-icon"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs text-muted"></span>
              <a href="#" className="text-xs">Forgot password? (OTP)</a>
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full mt-2">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
