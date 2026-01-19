
import React, { useState } from 'react';
import { UserRole, UserSession, Staff, ParentAccount, School } from '../types';

interface LoginProps {
  staff: Staff[];
  parentAccounts: ParentAccount[];
  schools: School[];
  onLogin: (session: UserSession) => void;
  onImportDB: (key: string) => boolean;
}

const Login: React.FC<LoginProps> = ({ staff, parentAccounts, schools, onLogin, onImportDB }) => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [loginType, setLoginType] = useState<'admin_parent' | 'staff'>('admin_parent');
  const [error, setError] = useState('');
  const [showSync, setShowSync] = useState(false);
  const [syncKey, setSyncKey] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (name === 'Xelar' && password === 'Xelar137$kN') {
      onLogin({ role: UserRole.ADMIN, userName: 'Administrateur Xelar' });
      return;
    }

    if (loginType === 'staff') {
      const targetSchool = schools.find(s => s.name.toLowerCase() === schoolName.toLowerCase());
      if (!targetSchool) {
        setError("L'école spécifiée n'existe pas. Synchronisez votre appareil d'abord ?");
        return;
      }
      const sAccount = staff.find(s => s.userName === name && s.password === password && s.schoolId === targetSchool.id);
      if (sAccount) {
        onLogin({ role: UserRole.STAFF, userName: sAccount.userName, schoolId: targetSchool.id });
        return;
      }
    }

    if (loginType === 'admin_parent') {
      const pAccount = parentAccounts.find(p => p.userName === name && p.password === password);
      if (pAccount) {
        onLogin({ role: UserRole.PARENT, userName: pAccount.userName, parentId: pAccount.id });
        return;
      }
    }

    setError('Identifiants incorrects.');
  };

  const handleSync = (e: React.FormEvent) => {
    e.preventDefault();
    if (onImportDB(syncKey)) {
      setShowSync(false);
      setSyncKey('');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 p-8 md:p-12">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white text-3xl font-black mx-auto mb-6 shadow-xl shadow-blue-200">S</div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">ScolarSync</h1>
          
          <div className="flex bg-slate-100 p-1 rounded-xl mt-6">
            <button onClick={() => setLoginType('admin_parent')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${loginType === 'admin_parent' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}>Admin/Parent</button>
            <button onClick={() => setLoginType('staff')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${loginType === 'staff' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}>Staff</button>
          </div>
        </div>

        {!showSync ? (
          <form onSubmit={handleLogin} className="space-y-5">
            <input required className="w-full px-5 py-4 rounded-2xl border border-slate-200 font-bold outline-none focus:border-blue-500 transition" placeholder="Utilisateur" value={name} onChange={e => setName(e.target.value)} />
            <input required type="password" className="w-full px-5 py-4 rounded-2xl border border-slate-200 font-bold outline-none focus:border-blue-500 transition" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} />
            {loginType === 'staff' && (
              <input required className="w-full px-5 py-4 rounded-2xl border border-slate-200 font-bold outline-none focus:border-blue-500 transition" placeholder="Nom de l'école" value={schoolName} onChange={e => setSchoolName(e.target.value)} />
            )}
            {error && <p className="text-rose-500 text-[10px] font-black uppercase text-center">{error}</p>}
            <button type="submit" className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-200 transition active:scale-95">Connexion</button>
            
            <div className="pt-4 border-t border-slate-50 text-center">
               <button type="button" onClick={() => setShowSync(true)} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition">Synchroniser mon Appareil</button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSync} className="space-y-5 animate-in slide-in-from-right duration-300">
            <h2 className="text-xl font-black text-slate-900 text-center">Synchronisation</h2>
            <p className="text-slate-500 text-[10px] font-bold text-center leading-relaxed">Collez la clé de synchronisation générée par l'Administrateur principal.</p>
            <textarea required className="w-full px-5 py-4 rounded-2xl border border-slate-200 font-mono text-[8px] h-32 outline-none focus:border-blue-500 transition bg-slate-50" placeholder="Collez la clé ici..." value={syncKey} onChange={e => setSyncKey(e.target.value)} />
            <button type="submit" className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl transition active:scale-95">Importer les données</button>
            <button type="button" onClick={() => setShowSync(false)} className="w-full text-[10px] font-black text-slate-400 uppercase">Retour</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
