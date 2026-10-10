import { useEffect, useState } from 'react';
import {
  GraduationCap, Plus, Pencil, Trash2, Users, BookOpen,
  RefreshCw, AlertCircle, Loader2, Hash,
} from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { gradesApi, type Grade, type CreateGradeDto } from '../api/client';

// ─── Form Bileşeni ────────────────────────────────────────────

interface GradeFormProps {
  initial?: Grade;
  onSave: (data: CreateGradeDto) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
  error?: string;
}

function GradeForm({ initial, onSave, onCancel, saving, error }: GradeFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [year, setYear] = useState(initial?.year?.toString() ?? '');
  const [studentCount, setStudentCount] = useState(initial?.studentCount?.toString() ?? '');
  const [nameErr, setNameErr] = useState('');

  const handleSubmit = async () => {
    if (!name.trim()) { setNameErr('Sınıf adı zorunludur'); return; }
    setNameErr('');
    await onSave({
      name: name.trim(),
      year: year ? parseInt(year) : undefined,
      studentCount: studentCount ? parseInt(studentCount) : undefined,
    });
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-sm text-rose-300">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">
          Sınıf Adı <span className="text-rose-400">*</span>
        </label>
        <input
          className={`input ${nameErr ? 'border-rose-500/60' : ''}`}
          placeholder="örn. 9-A, 10-B, 11-C"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {nameErr && <p className="text-xs text-rose-400 mt-1">{nameErr}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Yıl (Sınıf Düzeyi)</label>
          <input
            className="input"
            type="number"
            min={1}
            max={12}
            placeholder="örn. 9"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Öğrenci Sayısı</label>
          <input
            className="input"
            type="number"
            min={1}
            max={60}
            placeholder="örn. 30"
            value={studentCount}
            onChange={(e) => setStudentCount(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button onClick={onCancel} disabled={saving} className="btn-ghost">İptal</button>
        <button onClick={handleSubmit} disabled={saving} className="btn-primary min-w-[100px] justify-center">
          {saving ? <><Loader2 size={14} className="animate-spin" /> Kaydediliyor...</> : initial ? 'Güncelle' : 'Sınıf Ekle'}
        </button>
      </div>
    </div>
  );
}

// ─── Sınıf Kartı ──────────────────────────────────────────────

function GradeCard({
  grade,
  onEdit,
  onDelete,
}: {
  grade: Grade;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="card group hover:scale-[1.01] active:scale-[0.99]">
      <div className="flex items-start justify-between">
        {/* Sol: avatar + bilgiler */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600
                          flex items-center justify-center shadow-lg shadow-cyan-500/20 flex-shrink-0">
            <span className="text-white font-bold text-sm leading-tight text-center px-1">
              {grade.name}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-slate-100">{grade.name}</h3>
            <div className="flex flex-wrap gap-2 mt-1">
              {grade.year && (
                <span className="badge-indigo">
                  <Hash size={9} /> {grade.year}. Sınıf
                </span>
              )}
              {grade.studentCount && (
                <span className="badge-green">
                  <Users size={9} /> {grade.studentCount} öğrenci
                </span>
              )}
              {grade._count && (
                <span className="badge-amber">
                  <BookOpen size={9} /> {grade._count.assignments} atama
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Sağ: işlem butonları */}
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400
                       hover:text-brand-400 hover:bg-brand-500/10 transition-colors"
            title="Düzenle"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={onDelete}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400
                       hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Sil"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Ana Sayfa ────────────────────────────────────────────────

export default function GradesPage() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<{ open: boolean; grade: Grade | null }>({ open: false, grade: null });
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; grade: Grade | null; loading: boolean }>({
    open: false, grade: null, loading: false,
  });

  const fetchGrades = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await gradesApi.getAll();
      setGrades(res.data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sınıflar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGrades(); }, []);

  const openCreate = () => { setFormError(undefined); setModal({ open: true, grade: null }); };
  const openEdit = (grade: Grade) => { setFormError(undefined); setModal({ open: true, grade }); };
  const closeModal = () => { if (!formSaving) setModal({ open: false, grade: null }); };

  const handleSave = async (data: CreateGradeDto) => {
    setFormSaving(true);
    setFormError(undefined);
    try {
      if (modal.grade) {
        await gradesApi.update(modal.grade.id, data);
      } else {
        await gradesApi.create(data);
      }
      closeModal();
      fetchGrades();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Kayıt başarısız');
    } finally {
      setFormSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.grade) return;
    setDeleteDialog((d) => ({ ...d, loading: true }));
    try {
      await gradesApi.remove(deleteDialog.grade.id);
      setDeleteDialog({ open: false, grade: null, loading: false });
      fetchGrades();
    } catch {
      setDeleteDialog((d) => ({ ...d, loading: false }));
    }
  };

  return (
    <div className="max-w-5xl mx-auto animate-slide-up">
      {/* Başlık */}
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-gradient">Sınıflar</h1>
          <p className="text-sm text-slate-500 mt-1">Okul şubelerini ve sınıf bilgilerini yönetin</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchGrades} disabled={loading} className="btn-ghost">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Yenile
          </button>
          <button onClick={openCreate} className="btn-primary">
            <Plus size={16} /> Sınıf Ekle
          </button>
        </div>
      </div>

      {/* İstatistik Bar */}
      {!loading && !error && grades.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Toplam Sınıf', value: grades.length },
            { label: 'Toplam Öğrenci', value: grades.reduce((s, g) => s + (g.studentCount ?? 0), 0) },
            { label: 'Toplam Atama', value: grades.reduce((s, g) => s + (g._count?.assignments ?? 0), 0) },
          ].map((stat) => (
            <div key={stat.label} className="stat-card">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-100">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Hata */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 mb-6">
          <AlertCircle size={18} className="text-rose-400 flex-shrink-0" />
          <p className="text-sm text-rose-300">{error}</p>
          <button onClick={fetchGrades} className="ml-auto btn-ghost text-rose-400">Tekrar Dene</button>
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl skeleton" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-20 skeleton rounded" />
                  <div className="h-3 w-32 skeleton rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : grades.length === 0 && !error ? (
        <div className="flex flex-col items-center justify-center py-24 text-center animate-slide-up">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4">
            <GraduationCap size={28} className="text-cyan-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-200">Henüz sınıf yok</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-xs">İlk sınıfı ekleyerek ders programı oluşturmaya başlayın.</p>
          <button onClick={openCreate} className="btn-primary mt-6"><Plus size={16} /> İlk Sınıfı Ekle</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {grades.map((g) => (
            <GradeCard
              key={g.id}
              grade={g}
              onEdit={() => openEdit(g)}
              onDelete={() => setDeleteDialog({ open: true, grade: g, loading: false })}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={modal.open}
        onClose={closeModal}
        title={modal.grade ? `Sınıf Düzenle — ${modal.grade.name}` : 'Yeni Sınıf Ekle'}
        size="sm"
      >
        <GradeForm
          initial={modal.grade ?? undefined}
          onSave={handleSave}
          onCancel={closeModal}
          saving={formSaving}
          error={formError}
        />
      </Modal>

      {/* Silme Onayı */}
      <ConfirmDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, grade: null, loading: false })}
        onConfirm={handleDeleteConfirm}
        itemName={deleteDialog.grade?.name}
        loading={deleteDialog.loading}
      />
    </div>
  );
}
