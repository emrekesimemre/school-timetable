import { useEffect, useState } from 'react';
import {
  BookOpen, Plus, Pencil, Trash2, RefreshCw, AlertCircle, Loader2, Tag,
} from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { subjectsApi, type Subject, type CreateSubjectDto } from '../api/client';

// ─── Renk Paleti ─────────────────────────────────────────────

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#ec4899',
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#14b8a6', '#06b6d4', '#3b82f6', '#64748b',
];

// ─── Form Bileşeni ────────────────────────────────────────────

interface SubjectFormProps {
  initial?: Subject;
  onSave: (data: CreateSubjectDto) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
  error?: string;
}

function SubjectForm({ initial, onSave, onCancel, saving, error }: SubjectFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [code, setCode] = useState(initial?.code ?? '');
  const [color, setColor] = useState(initial?.color ?? PRESET_COLORS[0]);
  const [nameErr, setNameErr] = useState('');

  const handleSubmit = async () => {
    if (!name.trim()) { setNameErr('Ders adı zorunludur'); return; }
    setNameErr('');
    await onSave({ name: name.trim(), code: code.trim().toUpperCase() || undefined, color: color || undefined });
  };

  return (
    <div className="space-y-5">
      {error && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-sm text-rose-300">{error}</div>
      )}

      {/* Ders Adı */}
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">
          Ders Adı <span className="text-rose-400">*</span>
        </label>
        <input
          className={`input ${nameErr ? 'border-rose-500/60' : ''}`}
          placeholder="örn. Matematik, Tarih, Beden Eğitimi"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {nameErr && <p className="text-xs text-rose-400 mt-1">{nameErr}</p>}
      </div>

      {/* Kısa Kod */}
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">Kısa Kod (opsiyonel)</label>
        <input
          className="input uppercase"
          placeholder="örn. MAT, TRH, BED"
          maxLength={10}
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
        />
        <p className="text-[10px] text-slate-600 mt-1">Program tablosunda kısa gösterim için kullanılır</p>
      </div>

      {/* Renk Seçici */}
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-2">Renk</label>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              style={{ backgroundColor: c }}
              className={`w-8 h-8 rounded-lg transition-all duration-150 hover:scale-110 active:scale-95 ${
                color === c
                  ? 'ring-2 ring-offset-2 ring-offset-sidebar-surface ring-white scale-110 shadow-lg'
                  : 'opacity-70 hover:opacity-100'
              }`}
            />
          ))}
        </div>
        {/* Seçili renk önizleme */}
        <div className="flex items-center gap-2 mt-3">
          <div className="w-6 h-6 rounded-md" style={{ backgroundColor: color }} />
          <span className="text-xs text-slate-400 font-mono">{color}</span>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button onClick={onCancel} disabled={saving} className="btn-ghost">İptal</button>
        <button onClick={handleSubmit} disabled={saving} className="btn-primary min-w-[100px] justify-center">
          {saving ? <><Loader2 size={14} className="animate-spin" /> Kaydediliyor...</> : initial ? 'Güncelle' : 'Ders Ekle'}
        </button>
      </div>
    </div>
  );
}

// ─── Ders Kartı ───────────────────────────────────────────────

function SubjectCard({ subject, onEdit, onDelete }: { subject: Subject; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="card group hover:scale-[1.01] active:scale-[0.99]">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          {/* Renk nokta avatarı */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg"
            style={{ backgroundColor: subject.color ? `${subject.color}22` : '#6366f122', border: `2px solid ${subject.color ?? '#6366f1'}40` }}
          >
            <BookOpen size={20} style={{ color: subject.color ?? '#6366f1' }} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100">{subject.name}</h3>
            <div className="flex flex-wrap gap-2 mt-1">
              {subject.code && (
                <span className="badge-indigo"><Tag size={9} /> {subject.code}</span>
              )}
              {subject._count && (
                <span className="badge-green"><BookOpen size={9} /> {subject._count.assignments} atama</span>
              )}
              {subject.color && (
                <span className="flex items-center gap-1 text-[10px] text-slate-500">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: subject.color }} />
                  {subject.color}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-brand-400 hover:bg-brand-500/10 transition-colors" title="Düzenle">
            <Pencil size={14} />
          </button>
          <button onClick={onDelete} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors" title="Sil">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Ana Sayfa ────────────────────────────────────────────────

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<{ open: boolean; subject: Subject | null }>({ open: false, subject: null });
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; subject: Subject | null; loading: boolean }>({
    open: false, subject: null, loading: false,
  });

  const fetchSubjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await subjectsApi.getAll();
      setSubjects(res.data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Dersler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSubjects(); }, []);

  const openCreate = () => { setFormError(undefined); setModal({ open: true, subject: null }); };
  const openEdit = (s: Subject) => { setFormError(undefined); setModal({ open: true, subject: s }); };
  const closeModal = () => { if (!formSaving) setModal({ open: false, subject: null }); };

  const handleSave = async (data: CreateSubjectDto) => {
    setFormSaving(true);
    setFormError(undefined);
    try {
      if (modal.subject) {
        await subjectsApi.update(modal.subject.id, data);
      } else {
        await subjectsApi.create(data);
      }
      closeModal();
      fetchSubjects();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Kayıt başarısız');
    } finally {
      setFormSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.subject) return;
    setDeleteDialog((d) => ({ ...d, loading: true }));
    try {
      await subjectsApi.remove(deleteDialog.subject.id);
      setDeleteDialog({ open: false, subject: null, loading: false });
      fetchSubjects();
    } catch {
      setDeleteDialog((d) => ({ ...d, loading: false }));
    }
  };

  return (
    <div className="max-w-5xl mx-auto animate-slide-up">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-gradient">Dersler</h1>
          <p className="text-sm text-slate-500 mt-1">Müfredat derslerini, kodlarını ve renklerini yönetin</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchSubjects} disabled={loading} className="btn-ghost">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Yenile
          </button>
          <button onClick={openCreate} className="btn-primary"><Plus size={16} /> Ders Ekle</button>
        </div>
      </div>

      {!loading && !error && subjects.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="stat-card">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Toplam Ders</p>
            <p className="text-2xl font-bold text-slate-100">{subjects.length}</p>
          </div>
          <div className="stat-card">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Toplam Atama</p>
            <p className="text-2xl font-bold text-slate-100">{subjects.reduce((s, d) => s + (d._count?.assignments ?? 0), 0)}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 mb-6">
          <AlertCircle size={18} className="text-rose-400 flex-shrink-0" />
          <p className="text-sm text-rose-300">{error}</p>
          <button onClick={fetchSubjects} className="ml-auto btn-ghost text-rose-400">Tekrar Dene</button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card animate-pulse h-20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl skeleton" />
                <div className="flex-1 space-y-2"><div className="h-4 w-28 skeleton rounded" /><div className="h-3 w-20 skeleton rounded" /></div>
              </div>
            </div>
          ))}
        </div>
      ) : subjects.length === 0 && !error ? (
        <div className="flex flex-col items-center justify-center py-24 text-center animate-slide-up">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
            <BookOpen size={28} className="text-emerald-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-200">Henüz ders yok</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-xs">Matematik, Türkçe, Fen gibi dersler ekleyerek başlayın.</p>
          <button onClick={openCreate} className="btn-primary mt-6"><Plus size={16} /> İlk Dersi Ekle</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {subjects.map((s) => (
            <SubjectCard key={s.id} subject={s} onEdit={() => openEdit(s)} onDelete={() => setDeleteDialog({ open: true, subject: s, loading: false })} />
          ))}
        </div>
      )}

      <Modal isOpen={modal.open} onClose={closeModal} title={modal.subject ? `Ders Düzenle — ${modal.subject.name}` : 'Yeni Ders Ekle'} size="sm">
        <SubjectForm initial={modal.subject ?? undefined} onSave={handleSave} onCancel={closeModal} saving={formSaving} error={formError} />
      </Modal>

      <ConfirmDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, subject: null, loading: false })}
        onConfirm={handleDeleteConfirm}
        itemName={deleteDialog.subject?.name}
        loading={deleteDialog.loading}
      />
    </div>
  );
}
