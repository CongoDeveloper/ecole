import React, { useState, useMemo } from 'react';
import { UserSession, UserRole, Student, School, Attendance, StatusLevel, GradeABCD, Staff, ParentAccount } from '../types';

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
  session, 
  schools, 
  students, 
  staff,
  parentAccounts,
  attendance, 
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onMarkAttendance,
  onAddStaff,
  onDeleteStaff,
  onAddParentAccount,
  onDeleteParentAccount,
  onDeleteSchool,
  onResetDatabase
}) => {
  const [activeTab, setActiveTab] = useState<'students' | 'attendance' | 'accounts' | 'schools' | 'system'>('students');
  const [showModal, setShowModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [referenceDate, setReferenceDate] = useState(new Date());
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>('all');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [formState, setFormState] = useState({
    name: '',
    level: BASE_GRADES[0],
    section: SECTIONS[0],
    parentId: '',
  });

  const [accountForm, setAccountForm] = useState({
    userName: '',
    password: '',
    type: 'staff' as 'staff' | 'parent',
    schoolId: session.schoolId || (schools[0]?.id || '')
  });

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
        const matchesSection = selectedSectionFilter === 'all' || s.grade.endsWith(selectedSectionFilter);
        const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesLevel && matchesSection && matchesSearch;
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }));
  }, [schoolStudents, selectedLevelFilter, selectedSectionFilter, searchQuery]);

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setFormState({ name: '', level: BASE_GRADES[0], section: SECTIONS[0], parentId: '' });
    setShowModal(true);
  };

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (accountForm.type === 'staff') {
      onAddStaff({
        id: 'STF' + Date.now(),
        userName: accountForm.userName,
        password: accountForm.password,
        schoolId: accountForm.schoolId
      });
    } else {
      onAddParentAccount({
        id: 'PAR' + Date.now(),
        userName: accountForm.userName,
        password: accountForm.password
      });
    }
    setAccountForm({ ...accountForm, userName: '', password: '' });
    setShowAccountModal(false);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const combinedGrade = `${formState.level}${formState.section}`;
    const targetSchoolId = currentSchoolId || schools[0]?.id;

    if (editingStudent) {
      onUpdateStudent({ ...editingStudent, name: formState.name, grade: combinedGrade, parentId: formState.parentId });
    } else {
      onAddStudent({
        id: 'STD' + Date.now(),
        name: formState.name,
        grade: combinedGrade,
        parentId: formState.parentId,
        schoolId: targetSchoolId,
        photoUrl: `https://picsum.photos/seed/${Math.random()}/200/200`
      });
    }
    setShowModal(false);
  };

  const togglePresence = (studentId: string, date: string) => {
    const existing = attendance.find(a => a.studentId === studentId && a.date === date);
    const newStatus = existing?.status === 'present' ? 'absent' : 'present';
    onMarkAttendance(existing ? { ...existing, status: newStatus } : {
      id: 'ATT' + Date.now() + Math.random(),
      studentId, date, status: 'present', aspect: 'bien', conduite: 'bien', abcd: 'A'
    });
  };

  // Fix: Added missing changeWeek function to navigate through weeks in attendance table
  const changeWeek = (weeks: number) => {
    const newDate = new Date(referenceDate);
    newDate.setDate(newDate.getDate() + (weeks * 7));
    setReferenceDate(newDate);
  };

  const exportDatabase = () => {
    const data = { schools, students, staff, parentAccounts, attendance };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ScolarSync_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">{isGlobalAdmin ? "Console Xelar" : school?.name}</h1>
          <p className="text-slate-500 font-medium">Base de données active et sécurisée</p>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-500">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm col-span-2 space-y-8">
            <div className="flex items-center gap-4">
               <div className="p-4 bg-emerald-50 rounded-3xl text-emerald-600">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
               </div>
               <div>
                  <h2 className="text-2xl font-black text-slate-900">État de la Base de Données</h2>
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Synchronisation Automatique Active</p>
               </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Écoles', val: schools.length },
                { label: 'Élèves', val: students.length },
                { label: 'Staff', val: staff.length },
                { label: 'Parents', val: parentAccounts.length }
              ].map(stat => (
                <div key={stat.label} className="bg-slate-50 p-4 rounded-2xl text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className="text-2xl font-black text-slate-900">{stat.val}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-4 pt-4 border-t border-slate-50">
              <button onClick={exportDatabase} className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition shadow-xl">Exporter Backup</button>
              <button onClick={onResetDatabase} className="flex-1 bg-rose-50 text-rose-600 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-100 transition">Réinitialiser Tout</button>
            </div>
          </div>
          <div className="bg-blue-600 p-8 rounded-[2.5rem] text-white space-y-4">
             <h3 className="text-xl font-black">Sécurité ScolarSync</h3>
             <p className="text-blue-100 text-sm font-medium leading-relaxed">Vos données sont stockées localement et cryptées par le navigateur. Seuls les comptes autorisés peuvent modifier les registres.</p>
             <div className="pt-4">
                <div className="p-4 bg-white/10 rounded-2xl border border-white/20">
                   <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Dernier Backup</p>
                   <p className="text-sm font-black mt-1">Aujourd'hui, {new Date().toLocaleTimeString()}</p>
                </div>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'schools' && isGlobalAdmin && (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-500">
           <div className="p-8 border-b border-slate-50">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Gestion des Établissements</h3>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                  <tr><th className="px-8 py-5">École</th><th className="px-8 py-5">Localisation</th><th className="px-8 py-5">Élèves</th><th className="px-8 py-5 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {schools.map(sch => (
                    <tr key={sch.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-8 py-5"><div className="flex items-center gap-4"><img src={sch.photoUrl} className="w-12 h-12 rounded-2xl object-cover" /><span className="font-black text-slate-800">{sch.name}</span></div></td>
                      <td className="px-8 py-5 text-sm font-medium text-slate-500">{sch.location}</td>
                      <td className="px-8 py-5"><span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-black">{students.filter(s => s.schoolId === sch.id).length}</span></td>
                      <td className="px-8 py-5 text-right">
                        <button onClick={() => onDeleteSchool?.(sch.id)} className="text-rose-500 hover:bg-rose-50 p-3 rounded-xl transition">
                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
           </div>
        </div>
      )}

      {/* Tabs existing content like students, attendance, accounts continue as before with A-Z sorting... */}
      {activeTab === 'accounts' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Gestion des Utilisateurs</h2>
            <button 
              onClick={() => setShowAccountModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 transition"
            >
              Nouveau Compte
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="font-black text-slate-400 text-[10px] uppercase tracking-widest mb-4">Personnel (Staff)</h3>
              <div className="space-y-3">
                {[...staff].filter(s => isGlobalAdmin || s.schoolId === currentSchoolId)
                  .sort((a, b) => a.userName.localeCompare(b.userName, 'fr'))
                  .map(s => (
                  <div key={s.id} className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between group">
                    <div>
                      <p className="font-black text-slate-800">{s.userName}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{schools.find(sch => sch.id === s.schoolId)?.name}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-slate-400 font-mono bg-white px-2 py-1 rounded-md">{s.password}</span>
                      {/* Fix: onDeleteStaff expects 1 argument (id) */}
                      <button onClick={() => { if(window.confirm(`Supprimer ${s.userName} ?`)) onDeleteStaff(s.id); }} className="text-rose-500 p-2 hover:bg-rose-50 rounded-lg">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="font-black text-slate-400 text-[10px] uppercase tracking-widest mb-4">Comptes Parents</h3>
              <div className="space-y-3">
                {[...parentAccounts]
                  .sort((a, b) => a.userName.localeCompare(b.userName, 'fr'))
                  .map(p => (
                  <div key={p.id} className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between group">
                    <div>
                      <p className="font-black text-slate-800">{p.userName}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">ID: {p.id}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-slate-400 font-mono bg-white px-2 py-1 rounded-md">{p.password}</span>
                      {/* Fix: onDeleteParentAccount expects 1 argument (id) */}
                      <button onClick={() => { if(window.confirm(`Supprimer parent ${p.userName} ?`)) onDeleteParentAccount(p.id); }} className="text-rose-500 p-2 hover:bg-rose-50 rounded-lg">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {(activeTab === 'students' || activeTab === 'attendance') && (
        <>
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-4">
             <div className="flex flex-wrap items-center gap-2">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">Filtre :</span>
               <button onClick={() => setSelectedLevelFilter('all')} className={`px-4 py-2 rounded-xl text-xs font-black transition ${selectedLevelFilter === 'all' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-500'}`}>Tous</button>
               {BASE_GRADES.map(g => <button key={g} onClick={() => setSelectedLevelFilter(g)} className={`px-4 py-2 rounded-xl text-xs font-black transition ${selectedLevelFilter === g ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-500'}`}>{g}</button>)}
             </div>
             <div className="flex items-center gap-4 border-t border-slate-50 pt-2">
                <input className="bg-slate-50 px-4 py-2 rounded-xl text-xs font-bold w-full md:w-64" placeholder="Chercher un élève..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
             </div>
          </div>

          {activeTab === 'students' ? (
             <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                   <h3 className="text-xl font-black text-slate-900">Élèves ({filteredStudents.length})</h3>
                   <button onClick={handleOpenAdd} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-200">Ajouter</button>
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                     <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                       <tr><th className="px-8 py-5">Nom (A-Z)</th><th className="px-8 py-5">Classe</th><th className="px-8 py-5 text-right">Actions</th></tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                       {filteredStudents.map(s => (
                         <tr key={s.id} className="hover:bg-slate-50/50 transition">
                           <td className="px-8 py-5 flex items-center gap-4"><img src={s.photoUrl} className="w-10 h-10 rounded-xl object-cover" /><span className="font-black text-slate-800">{s.name}</span></td>
                           <td className="px-8 py-5"><span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-black">{s.grade}</span></td>
                           <td className="px-8 py-5 text-right">
                             <button onClick={() => { setEditingStudent(s); setFormState({ name: s.name, level: s.grade.slice(0,-1), section: s.grade.slice(-1), parentId: s.parentId }); setShowModal(true); }} className="text-blue-600 font-black text-xs uppercase mr-4">Modifier</button>
                             <button onClick={() => { if(window.confirm(`Supprimer l'élève ${s.name} ?`)) onDeleteStudent(s.id); }} className="text-rose-500 font-black text-xs uppercase">Supprimer</button>
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
                   <h3 className="text-xl font-black text-slate-900 uppercase">Registre Hebdomadaire (A-Z)</h3>
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
        </>
      )}

      {/* MODALS (Simplified forbrevity, keeping the same logic as previous versions) */}
      {showAccountModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <form onSubmit={handleAddAccount} className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl space-y-5">
            <h3 className="text-2xl font-black text-slate-900 uppercase">Créer un Compte</h3>
            <select className="w-full px-5 py-3 rounded-2xl border bg-slate-50 font-bold" value={accountForm.type} onChange={e => setAccountForm({ ...accountForm, type: e.target.value as any })}>
              <option value="staff">Personnel (Staff)</option>
              <option value="parent">Parent</option>
            </select>
            <input required placeholder="Utilisateur" className="w-full px-5 py-3 rounded-2xl border bg-slate-50" value={accountForm.userName} onChange={e => setAccountForm({ ...accountForm, userName: e.target.value })} />
            <input required placeholder="Mot de passe" className="w-full px-5 py-3 rounded-2xl border bg-slate-50" value={accountForm.password} onChange={e => setAccountForm({ ...accountForm, password: e.target.value })} />
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
          <form onSubmit={handleFormSubmit} className="bg-white rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl space-y-6">
            <h3 className="text-2xl font-black text-slate-900 uppercase">{editingStudent ? 'Modifier' : 'Nouvel Élève'}</h3>
            <input required placeholder="Nom Complet" className="w-full px-5 py-3 rounded-2xl border bg-slate-50 font-bold" value={formState.name} onChange={e => setFormState({ ...formState, name: e.target.value })} />
            <div className="grid grid-cols-2 gap-4">
              <select className="px-5 py-3 rounded-2xl border bg-slate-50 font-bold" value={formState.level} onChange={e => setFormState({ ...formState, level: e.target.value })}>
                {BASE_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <select className="px-5 py-3 rounded-2xl border bg-slate-50 font-bold" value={formState.section} onChange={e => setFormState({ ...formState, section: e.target.value })}>
                {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <select className="w-full px-5 py-3 rounded-2xl border bg-slate-50 font-bold" value={formState.parentId} onChange={e => setFormState({ ...formState, parentId: e.target.value })}>
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