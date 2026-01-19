import React, { useState, useMemo } from 'react';
import { UserSession, UserRole, Student, School, Attendance, Staff, ParentAccount } from '../types';

interface AdminDashboardProps {
  session: UserSession;
  schools: School[];
  students: Student[];
  staff: Staff[];
  parentAccounts: ParentAccount[];
  attendance: Attendance[];
  onAddStudent: (s: Student) => void;
  onUpdateStudent: (s: Student) => void;
  onDeleteStudent: (id: string) => void;
  onMarkAttendance: (a: Attendance) => void;
  onAddStaff: (s: Staff) => void;
  onDeleteStaff: (id: string) => void;
  onAddParentAccount: (p: ParentAccount) => void;
  onDeleteParentAccount: (id: string) => void;
  onDeleteSchool?: (id: string) => void;
  onResetDatabase?: () => void;
}

const BASE_GRADES = ['1', '2', '3', '4', '5', '6', '7', '8', '1s', '2s', '3s', '4s'];
const SECTIONS = ['A', 'B', 'C', 'D'];
const WEEK_DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  session, schools, students, staff, parentAccounts, attendance, 
  onAddStudent, onUpdateStudent, onDeleteStudent, onMarkAttendance, 
  onAddStaff, onDeleteStaff, onAddParentAccount, onDeleteParentAccount, 
  onDeleteSchool, onResetDatabase 
}) => {
  const [activeTab, setActiveTab] = useState<'students' | 'attendance' | 'accounts' | 'schools' | 'system'>('students');
  const [showModal, setShowModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [referenceDate, setReferenceDate] = useState(new Date());
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [syncKey, setSyncKey] = useState('');

  const [formState, setFormState] = useState({ name: '', level: BASE_GRADES[0], section: SECTIONS[0], parentId: '' });
  const [accountForm, setAccountForm] = useState({ userName: '', password: '', type: 'staff' as 'staff' | 'parent', schoolId: session.schoolId || (schools[0]?.id || '') });

  const isGlobalAdmin = session.role === UserRole.ADMIN;
  const currentSchoolId = session.schoolId;

  const weekDates = useMemo(() => {
    const dates = [];
    const day = referenceDate.getDay();
    const diff = referenceDate.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(referenceDate);
    monday.setDate(diff);
    for (let i = 0; i < 6; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  }, [referenceDate]);

  const school = schools.find(s => s.id === currentSchoolId) || schools[0];
  
  const schoolStudents = useMemo(() => 
    isGlobalAdmin ? students : students.filter(s => s.schoolId === currentSchoolId),
    [students, currentSchoolId, isGlobalAdmin]
  );

  const filteredStudents = useMemo(() => {
    return schoolStudents
      .filter(s => {
        const matchesLevel = selectedLevelFilter === 'all' || s.grade.startsWith(selectedLevelFilter);
        const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesLevel && matchesSearch;
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }));
  }, [schoolStudents, selectedLevelFilter, searchQuery]);

  const generateSyncKey = () => {
    const data = { schools, students, staff, parentAccounts, attendance };
    const encoded = btoa(JSON.stringify(data));
    setSyncKey(encoded);
    navigator.clipboard.writeText(encoded);
    alert("Clé de synchronisation générée et copiée ! Envoyez-la à votre personnel.");
  };

  const changeWeek = (weeks: number) => {
    const newDate = new Date(referenceDate);
    newDate.setDate(newDate.getDate() + (weeks * 7));
    setReferenceDate(newDate);
  };

  // Helper to toggle presence status for a student on a specific date
  const togglePresence = (studentId: string, date: string) => {
    const existing = attendance.find(a => a.studentId === studentId && a.date === date);
    onMarkAttendance({
      id: existing?.id || `ATT${Date.now()}-${studentId}-${date}`,
      studentId,
      date,
      status: existing?.status === 'present' ? 'absent' : 'present',
      aspect: existing?.aspect || 'bien',
      conduite: existing?.conduite || 'bien',
      abcd: existing?.abcd || 'A'
    });
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">{isGlobalAdmin ? "Console Xelar" : school?.name}</h1>
          <p className="text-slate-500 font-medium">Administration de la base de données</p>
        </div>
        <div className="flex flex-wrap gap-2 bg-slate-100 p-1.5 rounded-2xl overflow-x-auto">
          {['students', 'attendance', 'accounts', isGlobalAdmin && 'schools', isGlobalAdmin && 'system'].filter(Boolean).map((t) => (
            <button 
              key={t as string}
              onClick={() => setActiveTab(t as any)}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition whitespace-nowrap ${activeTab === t ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {t === 'students' ? 'Élèves' : t === 'attendance' ? 'Registre' : t === 'accounts' ? 'Comptes' : t === 'schools' ? 'Écoles' : 'Système'}
            </button>
          ))}
        </div>
      </header>

      {activeTab === 'system' && isGlobalAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-500">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
            <h2 className="text-2xl font-black text-slate-900">Synchronisation Maître</h2>
            <p className="text-slate-500 text-sm font-medium">Générez une clé pour synchroniser les données avec le personnel sur d'autres téléphones ou ordinateurs.</p>
            <div className="space-y-4">
              <button onClick={generateSyncKey} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-200">
                Générer Clé de Sync
              </button>
              {syncKey && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                   <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Clé Actuelle (Copiée)</p>
                   <p className="text-[8px] font-mono break-all opacity-50 line-clamp-3">{syncKey}</p>
                </div>
              )}
            </div>
            <div className="pt-6 border-t border-slate-50">
               <button onClick={onResetDatabase} className="text-rose-600 text-xs font-black uppercase tracking-widest hover:underline">Réinitialiser la Base de Données</button>
            </div>
          </div>
          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white flex flex-col justify-center">
             <div className="text-center space-y-2">
                <p className="text-blue-400 text-4xl font-black">{students.length}</p>
                <p className="text-xs font-black uppercase tracking-[0.2em] opacity-50">Élèves Enregistrés</p>
             </div>
             <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-center">
                   <p className="text-xl font-bold">{schools.length}</p>
                   <p className="text-[8px] font-black uppercase opacity-40">Écoles</p>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-center">
                   <p className="text-xl font-bold">{staff.length}</p>
                   <p className="text-[8px] font-black uppercase opacity-40">Staff</p>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Tabs existing content logic sorted A-Z */}
      {(activeTab === 'students' || activeTab === 'attendance') && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-wrap gap-4 items-center">
            <input className="bg-slate-50 px-5 py-3 rounded-2xl text-xs font-bold w-full md:w-64" placeholder="Rechercher..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            <select className="bg-slate-50 px-5 py-3 rounded-2xl text-xs font-bold" value={selectedLevelFilter} onChange={e => setSelectedLevelFilter(e.target.value)}>
              <option value="all">Tous les niveaux</option>
              {BASE_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          {activeTab === 'students' ? (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
               <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                  <h3 className="text-xl font-black text-slate-900">Liste des Élèves (A-Z)</h3>
                  <button onClick={() => { setEditingStudent(null); setShowModal(true); }} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-200">Ajouter Élève</button>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                      <tr><th className="px-8 py-5">Élève</th><th className="px-8 py-5">Classe</th><th className="px-8 py-5 text-right">Actions</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredStudents.map(s => (
                        <tr key={s.id} className="hover:bg-slate-50/50 transition">
                          <td className="px-8 py-5 flex items-center gap-4"><img src={s.photoUrl} className="w-10 h-10 rounded-xl object-cover" /><span className="font-black text-slate-800">{s.name}</span></td>
                          <td className="px-8 py-5"><span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-black">{s.grade}</span></td>
                          <td className="px-8 py-5 text-right">
                            <button onClick={() => { setEditingStudent(s); setFormState({ name: s.name, level: s.grade.slice(0,-1), section: s.grade.slice(-1), parentId: s.parentId }); setShowModal(true); }} className="text-blue-600 font-black text-xs uppercase mr-4">Modifier</button>
                            <button onClick={() => { if(window.confirm(`Supprimer ${s.name} ?`)) onDeleteStudent(s.id); }} className="text-rose-500 font-black text-xs uppercase">Supprimer</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
            </div>
          ) : (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
               <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                  <h3 className="text-xl font-black text-slate-900 uppercase">Registre (A-Z)</h3>
                  <div className="flex gap-2">
                     <button onClick={() => changeWeek(-1)} className="p-2 bg-slate-100 rounded-xl">◀</button>
                     <button onClick={() => setReferenceDate(new Date())} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase">Aujourd'hui</button>
                     <button onClick={() => changeWeek(1)} className="p-2 bg-slate-100 rounded-xl">▶</button>
                  </div>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                      <tr><th className="px-8 py-5">Élève</th>{WEEK_DAYS.map(d => <th key={d} className="px-4 py-5 text-center">{d}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredStudents.map(s => (
                        <tr key={s.id}>
                          <td className="px-8 py-4 font-bold text-slate-700">{s.name}</td>
                          {weekDates.map(date => {
                            const isPresent = attendance.find(a => a.studentId === s.id && a.date === date)?.status === 'present';
                            return (
                              <td key={date} className="px-4 py-4 text-center">
                                <button onClick={() => togglePresence(s.id, date)} className={`w-8 h-8 rounded-xl border-2 transition ${isPresent ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-transparent'}`}>✓</button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
            </div>
          )}
        </div>
      )}

      {/* Tabs accounts and schools continue... */}
      {activeTab === 'accounts' && (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black text-slate-900">Personnel</h3>
                  <button onClick={() => setShowAccountModal(true)} className="text-blue-600 font-black text-xs uppercase">+ Créer</button>
               </div>
               <div className="space-y-3">
                  {staff.filter(s => isGlobalAdmin || s.schoolId === currentSchoolId).map(s => (
                    <div key={s.id} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center">
                       <div>
                          <p className="font-black text-slate-800">{s.userName}</p>
                          <p className="text-[8px] font-black uppercase opacity-40">{schools.find(sch => sch.id === s.schoolId)?.name}</p>
                       </div>
                       <div className="flex items-center gap-3">
                          <span className="text-[10px] font-mono bg-white px-2 py-1 rounded-lg border border-slate-100">{s.password}</span>
                          <button onClick={() => onDeleteStaff(s.id)} className="text-rose-500 hover:bg-rose-50 p-2 rounded-xl transition">
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black text-slate-900">Comptes Parents</h3>
                  <button onClick={() => setShowAccountModal(true)} className="text-blue-600 font-black text-xs uppercase">+ Créer</button>
               </div>
               <div className="space-y-3">
                  {parentAccounts.map(p => (
                    <div key={p.id} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center">
                       <div>
                          <p className="font-black text-slate-800">{p.userName}</p>
                          <p className="text-[8px] font-black uppercase opacity-40">ID: {p.id}</p>
                       </div>
                       <div className="flex items-center gap-3">
                          <span className="text-[10px] font-mono bg-white px-2 py-1 rounded-lg border border-slate-100">{p.password}</span>
                          <button onClick={() => onDeleteParentAccount(p.id)} className="text-rose-500 hover:bg-rose-50 p-2 rounded-xl transition">
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
         </div>
      )}

      {/* MODALS */}
      {showAccountModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <form onSubmit={(e) => { e.preventDefault(); if (accountForm.type === 'staff') onAddStaff({ id: 'STF' + Date.now(), ...accountForm }); else onAddParentAccount({ id: 'PAR' + Date.now(), ...accountForm }); setShowAccountModal(false); }} className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl space-y-5">
            <h3 className="text-2xl font-black text-slate-900 uppercase">Nouveau Compte</h3>
            <select className="w-full px-5 py-3 rounded-2xl border bg-slate-50 font-bold" value={accountForm.type} onChange={e => setAccountForm({ ...accountForm, type: e.target.value as any })}>
              <option value="staff">Personnel Scolaire</option>
              <option value="parent">Parent d'Élève</option>
            </select>
            <input required placeholder="Nom Utilisateur" className="w-full px-5 py-3 rounded-2xl border bg-slate-50 font-bold" value={accountForm.userName} onChange={e => setAccountForm({ ...accountForm, userName: e.target.value })} />
            <input required placeholder="Mot de Passe" className="w-full px-5 py-3 rounded-2xl border bg-slate-50 font-bold" value={accountForm.password} onChange={e => setAccountForm({ ...accountForm, password: e.target.value })} />
            {accountForm.type === 'staff' && (
              <select className="w-full px-5 py-3 rounded-2xl border bg-slate-50 font-bold" value={accountForm.schoolId} onChange={e => setAccountForm({ ...accountForm, schoolId: e.target.value })}>
                {schools.map(sch => <option key={sch.id} value={sch.id}>{sch.name}</option>)}
              </select>
            )}
            <div className="flex gap-4 pt-4">
              <button type="button" onClick={() => setShowAccountModal(false)} className="flex-1 font-black text-slate-400">Annuler</button>
              <button type="submit" className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black">Enregistrer</button>
            </div>
          </form>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <form onSubmit={(e) => { e.preventDefault(); const grade = `${formState.level}${formState.section}`; if (editingStudent) onUpdateStudent({ ...editingStudent, name: formState.name, grade, parentId: formState.parentId }); else onAddStudent({ id: 'STD' + Date.now(), name: formState.name, grade, parentId: formState.parentId, schoolId: currentSchoolId || schools[0]?.id, photoUrl: `https://picsum.photos/seed/${Math.random()}/200/200` }); setShowModal(false); }} className="bg-white rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl space-y-6">
            <h3 className="text-2xl font-black text-slate-900 uppercase">{editingStudent ? 'Modifier Élève' : 'Nouvel Élève'}</h3>
            <input required placeholder="Nom Complet" className="w-full px-5 py-4 rounded-2xl border bg-slate-50 font-black" value={formState.name} onChange={e => setFormState({ ...formState, name: e.target.value })} />
            <div className="grid grid-cols-2 gap-4">
              <select className="px-5 py-4 rounded-2xl border bg-slate-50 font-bold" value={formState.level} onChange={e => setFormState({ ...formState, level: e.target.value })}>
                {BASE_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <select className="px-5 py-4 rounded-2xl border bg-slate-50 font-bold" value={formState.section} onChange={e => setFormState({ ...formState, section: e.target.value })}>
                {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <select className="w-full px-5 py-4 rounded-2xl border bg-slate-50 font-bold" value={formState.parentId} onChange={e => setFormState({ ...formState, parentId: e.target.value })}>
              <option value="">Lier à un Parent</option>
              {parentAccounts.map(p => <option key={p.id} value={p.id}>{p.userName} ({p.id})</option>)}
            </select>
            <div className="flex gap-4 pt-4">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 font-black text-slate-400">Annuler</button>
              <button type="submit" className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-blue-200">Enregistrer</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;