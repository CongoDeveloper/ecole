
import React, { useState } from 'react';
import { UserRole, UserSession, Staff, ParentAccount, School } from '../types';

interface LoginProps {
  staff: Staff[];
  parentAccounts: ParentAccount[];
  schools: School[];
  onLogin: (session: UserSession) => void;
}

const Login: React.FC<LoginProps> = ({ staff, parentAccounts, schools, onLogin }) => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [loginType, setLoginType] = useState<'admin_parent' | 'staff'>('admin_parent');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 1. Global Admin (Xelar)
    if (name === 'Xelar' && password === 'Xelar137$kN') {
      onLogin({ 
        role: UserRole.ADMIN, 
        userName: 'Administrateur Xelar' 
      });
      return;
    }

    // 2. Staff Account: Name + Password + School Name
    if (loginType === 'staff') {
      const targetSchool = schools.find(s => s.name.toLowerCase() === schoolName.toLowerCase());
      if (!targetSchool) {
        setError("L'école spécifiée n'existe pas.");
        return;
      }
      const sAccount = staff.find(s => 
        s.userName === name && 
        s.password === password && 
        s.schoolId === targetSchool.id
      );
      if (sAccount) {
        onLogin({
          role: UserRole.STAFF,
          userName: sAccount.userName,
          schoolId: targetSchool.id
        });
        return;
      }
    }

    // 3. Parent Account: Name + Password
    if (loginType === 'admin_parent') {
      const pAccount = parentAccounts.find(p => p.userName === name && p.password === password);
      if (pAccount) {
        onLogin({
          role: UserRole.PARENT,
          userName: pAccount.userName,
          parentId: pAccount.id
        });
        return;
      }
    }

    setError('Identifiants incorrects. Veuillez vérifier vos informations.');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 p-8 md:p-12 animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white text-3xl font-black mx-auto mb-6 shadow-xl shadow-blue-200">S</div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">ScolarSync</h1>
          
          <div className="flex bg-slate-100 p-1 rounded-xl mt-6">
            <button 
              onClick={() => {setLoginType('admin_parent'); setError('');}}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${loginType === 'admin_parent' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
            >
              Admin/Parent
            </button>
            <button 
              onClick={() => {setLoginType('staff'); setError('');}}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${loginType === 'staff' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
            >
              Personnel (Staff)
            </button>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Nom d'utilisateur</label>
            <input 
              required
              className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition font-medium"
              placeholder="Votre nom..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Mot de passe</label>
            <input 
              required
              type="password"
              className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition font-medium"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {loginType === 'staff' && (
            <div className="animate-in slide-in-from-top-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Nom de l'école</label>
              <input 
                required
                className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition font-medium"
                placeholder="Ex: École Excellence"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
              />
            </div>
          )}

          {error && (
            <div className="bg-rose-50 text-rose-600 p-4 rounded-xl text-xs font-bold border border-rose-100">
              {error}
            </div>
          )}

          <button type="submit" className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-200 text-lg transition active:scale-[0.98]">
            Se Connecter
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
