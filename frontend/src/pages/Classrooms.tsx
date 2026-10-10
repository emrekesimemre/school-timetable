import { useEffect, useState } from 'react';
import {
  Building2, Plus, Pencil, Trash2, RefreshCw, AlertCircle, Loader2, Users, Layers,
} from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { classroomsApi, type Classroom, type ClassroomType, type CreateClassroomDto } from '../api/client';

// ─── Derslik Tipi Konfigürasyonu ─────────────────────────────

const CLASSROOM_TYPES: { value: ClassroomType; label: string; icon: string; color: string }[] = [
  { value: 'STANDARD',   label: 'Standart',           icon: '🏫', color: 'from-blue-500 to-cyan-600' },
  { value: 'LAB',        label: 'Laboratuvar',         icon: '🔬', color: 'from-emerald-500 to-teal-600' },
  { value: 'GYM',        label: 'Spor Salonu',         icon: '🏋️', color: 'from-orange-500 to-amber-600' },
  { value: 'AUDITORIUM', label: 'Konferans/Amfi',      icon: '🎭', color: 'from-purple-500 to-violet-600' },
  { value: 'WORKSHOP',   label: 'Atölye',              icon: '🔧', color: 'from-rose-500 to-pink-600' },
];

const typeInfo = (type: ClassroomType) =>
  CLASSROOM_TYPES.find((t) => t.value === type) ?? CLASSROOM_TYPES[0];

// ─── Form Bileşeni ────────────────────────────────────────────

interface ClassroomFormProps {
  initial?: Classroom;
  onSave: (data: CreateClassroomDto) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
  error?: string;
}

function ClassroomForm({ initial, onSave, onCancel, saving, error }: ClassroomFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [capacity, setCapacity] = useState(initial?.capacity?.toString() ?? '');
  const [type, setType] = useState<ClassroomType>(initial?.type ?? 'STANDARD');
  const [building, setBuilding] = useState(initial?.building ?? '');
  const [nameErr, setNameErr] = useState('');
  const [capErr, setCapErr] = useState('');

  const handleSubmit = async () => {
    let valid = true;
    if (!name.trim()) { setNameErr('Derslik adı zorunludur'); valid = false; } else setNameErr('');
    if (!capacity || parseInt(capacity) < 1) { setCapErr('Kapasite en az 1 olmalıdır'); valid = false; } else setCapErr('');
    if (!valid) return;
    await onSave({
      name: name.trim(),
      capacity: parseInt(capacity),
      type,
      building: building.trim() || undefined,
    });
  };

  return (
    <div className="space-y-5">
      {error && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-sm text-rose-300">{error}</div>
      )}

      {/* Ad + Bina */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Derslik Adı <span className="text-rose-400">*</span>
          </label>
          <input className={`input ${nameErr ? 'border-rose-500/60' : ''}`} placeholder="örn. Derslik 101, Kimya Lab A" value={name} onChange={(e) => setName(e.target.value)} />
          {nameErr && <p className="text-xs text-rose-400 mt-1">{nameErr}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Bina (opsiyonel)</label>
          <input className="input" placeholder="örn. A Blok, Fen Binası" value={building} onChange={(e) => setBuilding(e.target.value)} />
        </div>
      </div>

      {/* Kapasite */}
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">
          Kapasite (kişi) <span className="text-rose-400">*</span>
        </label>
        <input
          className={`input ${capErr ? 'border-rose-500/60' : ''}`}
          type="number"
          min={1}
          max={500}
          placeholder="örn. 30"
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
        />
        {capErr && <p className="text-xs text-rose-400 mt-1">{capErr}</p>}
      </div>

      {/* Tip Seçici */}
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-2">Derslik Tipi</label>
        <div className="grid grid-cols-2 gap-2">
          {CLASSROOM_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setType(t.value)}
              className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all duration-150 ${
                type === t.value
                  ? 'border-brand-500 bg-brand-500/10'
                  : 'border-sidebar-border hover:border-sidebar-hover'
              }`}
            >
              <span className="text-xl">{t.icon}</span>
              <div>
                <p className={`text-xs font-semibold ${type === t.value ? 'text-brand-300' : 'text-slate-300'}`}>{t.label}</p>
                <p className="text-[10px] text-slate-600">{t.value}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button onClick={onCancel} disabled={saving} className="btn-ghost">İptal</button>
        <button onClick={handleSubmit} disabled={saving} className="btn-primary min-w-[100px] justify-center">
          {saving ? <><Loader2 size={14} className="animate-spin" /> Kaydediliyor...</> : initial ? 'Güncelle' : 'Derslik Ekle'}
        </button>
      </div>
    </div>
  );
}

// ─── Derslik Kartı ────────────────────────────────────────────

function ClassroomCard({ classroom, onEdit, onDelete }: { classroom: Classroom; onEdit: () => void; onDelete: () => void }) {
  const info = typeInfo(classroom.type);
  return (
    <div className="card group hover:scale-[1.01] active:scale-[0.99]">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${info.color} flex items-center justify-center text-xl shadow-lg flex-shrink-0`}>
            {info.icon}
          </div>
          <div>
            <h3 className="font-semibold text-slate-100">{classroom.name}</h3>
            <div className="flex flex-wrap gap-2 mt-1">
              <span className="badge-indigo"><Layers size={9} /> {info.label}</span>
              <span className="badge-green"><Users size={9} /> {classroom.capacity} kişi</span>
              {classroom.building && (
                <span className="badge-amber"><Building2 size={9} /> {classroom.building}</span>
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

export default function ClassroomsPage() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<{ open: boolean; classroom: Classroom | null }>({ open: false, classroom: null });
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; classroom: Classroom | null; loading: boolean }>({
    open: false, classroom: null, loading: false,
  });

  const fetchClassrooms = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await classroomsApi.getAll();
      setClassrooms(res.data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Derslikler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClassrooms(); }, []);

  const openCreate = () => { setFormError(undefined); setModal({ open: true, classroom: null }); };
  const openEdit = (c: Classroom) => { setFormError(undefined); setModal({ open: true, classroom: c }); };
  const closeModal = () => { if (!formSaving) setModal({ open: false, classroom: null }); };

  const handleSave = async (data: CreateClassroomDto) => {
    setFormSaving(true);
    setFormError(undefined);
    try {
      if (modal.classroom) { await classroomsApi.update(modal.classroom.id, data); }
      else { await classroomsApi.create(data); }
      closeModal();
      fetchClassrooms();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Kayıt başarısız');
    } finally {
      setFormSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.classroom) return;
    setDeleteDialog((d) => ({ ...d, loading: true }));
    try {
      await classroomsApi.remove(deleteDialog.classroom.id);
      setDeleteDialog({ open: false, classroom: null, loading: false });
      fetchClassrooms();
    } catch { setDeleteDialog((d) => ({ ...d, loading: false })); }
  };

  const totalCapacity = classrooms.reduce((s, c) => s + c.capacity, 0);

  return (
    <div className="max-w-5xl mx-auto animate-slide-up">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-gradient">Derslikler</h1>
          <p className="text-sm text-slate-500 mt-1">Sınıfları, laboratuvarları ve diğer mekanları yönetin</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchClassrooms} disabled={loading} className="btn-ghost">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Yenile
          </button>
          <button onClick={openCreate} className="btn-primary"><Plus size={16} /> Derslik Ekle</button>
        </div>
      </div>

      {!loading && !error && classrooms.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Toplam Derslik', value: classrooms.length },
            { label: 'Toplam Kapasite', value: `${totalCapacity} kişi` },
            { label: 'Laboratuvar', value: classrooms.filter((c) => c.type === 'LAB').length },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{s.label}</p>
              <p className="text-2xl font-bold text-slate-100">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 mb-6">
          <AlertCircle size={18} className="text-rose-400 flex-shrink-0" />
          <p className="text-sm text-rose-300">{error}</p>
          <button onClick={fetchClassrooms} className="ml-auto btn-ghost text-rose-400">Tekrar Dene</button>
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
      ) : classrooms.length === 0 && !error ? (
        <div className="flex flex-col items-center justify-center py-24 text-center animate-slide-up">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
            <Building2 size={28} className="text-amber-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-200">Henüz derslik yok</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-xs">Ders programı oluşturmak için en az bir derslik ekleyin.</p>
          <button onClick={openCreate} className="btn-primary mt-6"><Plus size={16} /> İlk Dersliği Ekle</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {classrooms.map((c) => (
            <ClassroomCard key={c.id} classroom={c} onEdit={() => openEdit(c)} onDelete={() => setDeleteDialog({ open: true, classroom: c, loading: false })} />
          ))}
        </div>
      )}

      <Modal isOpen={modal.open} onClose={closeModal} title={modal.classroom ? `Derslik Düzenle — ${modal.classroom.name}` : 'Yeni Derslik Ekle'} size="md">
        <ClassroomForm initial={modal.classroom ?? undefined} onSave={handleSave} onCancel={closeModal} saving={formSaving} error={formError} />
      </Modal>

      <ConfirmDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, classroom: null, loading: false })}
        onConfirm={handleDeleteConfirm}
        itemName={deleteDialog.classroom?.name}
        loading={deleteDialog.loading}
      />
    </div>
  );
}
