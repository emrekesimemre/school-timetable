import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, RefreshCw, AlertCircle, Filter } from 'lucide-react';
import {
  assignmentsApi,
  gradesApi,
  teachersApi,
  type AssignmentRow,
  type Grade,
  type Teacher,
} from '../api/client';

export default function AssignmentsPage() {
  const [rows, setRows] = useState<AssignmentRow[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [teacherId, setTeacherId] = useState('');
  const [gradeId, setGradeId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [a, t, g] = await Promise.all([
        assignmentsApi.getAll(),
        teachersApi.getAll(),
        gradesApi.getAll(),
      ]);
      setRows(a.data.data);
      setTeachers(t.data.data);
      setGrades(g.data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Atamalar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(
    () => rows.filter((r) =>
      (!teacherId || r.teacherId === teacherId) &&
      (!gradeId || r.gradeId === gradeId)
    ),
    [rows, teacherId, gradeId]
  );

  const totalHours = filtered.reduce((s, r) => s + r.hoursPerWeek, 0);

  return (
    <div className="max-w-6xl mx-auto animate-slide-up">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-gradient">Atamalar</h1>
          <p className="text-sm text-slate-500 mt-1">Öğretmen–sınıf–ders eşleşmeleri ve haftalık saatler</p>
        </div>
        <button onClick={fetchData} disabled={loading} className="btn-ghost">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Yenile
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="stat-card">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Toplam Atama</p>
          <p className="text-2xl font-bold text-slate-100">{filtered.length}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Toplam Saat / Hafta</p>
          <p className="text-2xl font-bold text-slate-100">{totalHours}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Öğretmen</p>
          <p className="text-2xl font-bold text-slate-100">
            {new Set(filtered.map((r) => r.teacherId)).size}
          </p>
        </div>
      </div>

      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={14} className="text-slate-500" />
          <p className="text-sm font-medium text-slate-300">Filtrele</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Sınıf</label>
            <select className="input" value={gradeId} onChange={(e) => setGradeId(e.target.value)}>
              <option value="">Tüm sınıflar</option>
              {grades.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Öğretmen</label>
            <select className="input" value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
              <option value="">Tüm öğretmenler</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 mb-6">
          <AlertCircle size={18} className="text-rose-400 flex-shrink-0" />
          <p className="text-sm text-rose-300">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="card animate-pulse h-48" />
      ) : filtered.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <CalendarDays size={28} className="text-slate-600 mb-3" />
          <p className="text-sm text-slate-400">Gösterilecek atama yok</p>
          <p className="text-xs text-slate-600 mt-1">Öğretmen formundan sınıf ve ders atayabilirsiniz</p>
        </div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-sidebar-border">
                <th className="px-4 py-3 font-semibold">Öğretmen</th>
                <th className="px-4 py-3 font-semibold">Sınıf</th>
                <th className="px-4 py-3 font-semibold">Ders</th>
                <th className="px-4 py-3 font-semibold text-right">Saat / Hafta</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id} className="border-b border-sidebar-border/60 last:border-0 hover:bg-sidebar-hover/40">
                  <td className="px-4 py-3 text-slate-200">{row.teacher?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-300">{row.grade?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: row.subject?.color ?? '#6366f1' }}
                      />
                      {row.subject?.name ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-brand-300">{row.hoursPerWeek}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
