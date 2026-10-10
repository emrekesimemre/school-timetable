import { useEffect, useState } from 'react';
import {
  Users, Plus, Mail, Clock, BookOpen, RefreshCw,
  AlertCircle, Pencil, Trash2,
} from 'lucide-react';
import { teachersApi, type Teacher } from '../api/client';
import TeacherFormModal from '../components/TeacherFormModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { DEFAULT_WEEKLY_HOURS, weeklyAvailableHours } from '../lib/availability';

// ─── Skeleton ─────────────────────────────────────────────────

function TeacherCardSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-xl skeleton" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-36 skeleton rounded" />
          <div className="h-3 w-48 skeleton rounded" />
        </div>
        <div className="h-6 w-16 skeleton rounded-md" />
      </div>
      <div className="mt-4 flex gap-3">
        <div className="h-7 w-24 skeleton rounded-md" />
        <div className="h-7 w-20 skeleton rounded-md" />
      </div>
    </div>
  );
}

// ─── Müsaitlik Rozetleri ──────────────────────────────────────

const DAY_META = [
  { key: 'MON', label: 'Pzt' },
  { key: 'TUE', label: 'Sal' },
  { key: 'WED', label: 'Çar' },
  { key: 'THU', label: 'Per' },
  { key: 'FRI', label: 'Cum' },
];

function AvailabilityBadges({
  unavailable,
  hoursPerDay = 8,
}: {
  unavailable: string[];
  hoursPerDay?: number;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {DAY_META.map((d) => {
        const blocked = unavailable.filter((s) => s.startsWith(`${d.key}_`)).length;
        const free = Math.max(0, hoursPerDay - blocked);
        return (
          <span key={d.key} className={free === 0 ? 'badge-amber' : 'badge-indigo'}>
            {d.label} · {free}s
          </span>
        );
      })}
    </div>
  );
}

// ─── Öğretmen Kartı ───────────────────────────────────────────

const GRADIENTS = [
  'from-brand-500 to-purple-600', 'from-cyan-500 to-blue-600',
  'from-emerald-500 to-teal-600', 'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600', 'from-violet-500 to-indigo-600',
];

function TeacherCard({
  teacher,
  onEdit,
  onDelete,
}: {
  teacher: Teacher;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const initials = teacher.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
  const blockedCount = teacher.unavailable_slots?.length ?? 0;
  const totalHours = weeklyAvailableHours(teacher.unavailable_slots, DEFAULT_WEEKLY_HOURS);
  const gradient = GRADIENTS[teacher.name.charCodeAt(0) % GRADIENTS.length];

  return (
    <div className="card group hover:scale-[1.01] active:scale-[0.99]">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-sm font-bold text-white flex-shrink-0 shadow-lg`}>
          {initials}
        </div>

        {/* Bilgiler */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-100 truncate">{teacher.name}</h3>
          {teacher.email ? (
            <div className="flex items-center gap-1.5 mt-0.5">
              <Mail size={12} className="text-slate-500 flex-shrink-0" />
              <span className="text-xs text-slate-400 truncate">{teacher.email}</span>
            </div>
          ) : (
            <span className="text-xs text-slate-600 italic">E-posta girilmemiş</span>
          )}
        </div>

        {/* Atama adedi rozeti */}
        {teacher._count && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-brand-500/10 border border-brand-500/20 flex-shrink-0">
            <BookOpen size={11} className="text-brand-400" />
            <span className="text-xs font-semibold text-brand-400">{teacher._count.assignments} atama</span>
          </div>
        )}
      </div>

      {/* Müsaitlik */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <Clock size={12} />
            <span>{totalHours} saat/hafta müsait</span>
          </div>
          {blockedCount > 0 && (
            <span className="text-rose-400/80">· {blockedCount} ders engellendi</span>
          )}
        </div>
        <AvailabilityBadges unavailable={teacher.unavailable_slots ?? []} />
      </div>

      {/* İşlem Butonları */}
      <div className="mt-4 pt-4 border-t border-sidebar-border flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                     text-slate-400 hover:text-brand-400 hover:bg-brand-500/10 transition-colors"
        >
          <Pencil size={13} /> Düzenle
        </button>
        <button
          onClick={onDelete}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                     text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
        >
          <Trash2 size={13} /> Sil
        </button>
      </div>
    </div>
  );
}

// ─── Boş Durum ────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center animate-slide-up">
      <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mb-4">
        <Users size={28} className="text-brand-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-200">Henüz öğretmen yok</h3>
      <p className="text-sm text-slate-500 mt-1 max-w-xs">
        Ders programı atamalarını oluşturmaya başlamak için ilk öğretmeni ekleyin.
      </p>
      <button onClick={onAdd} className="btn-primary mt-6">
        <Plus size={16} /> İlk Öğretmeni Ekle
      </button>
    </div>
  );
}

// ─── Ana Sayfa ────────────────────────────────────────────────

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal: oluştur / düzenle
  const [formModal, setFormModal] = useState<{ open: boolean; teacher: Teacher | null }>({
    open: false, teacher: null,
  });

  // Silme onayı
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; teacher: Teacher | null; loading: boolean }>({
    open: false, teacher: null, loading: false,
  });

  const fetchTeachers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await teachersApi.getAll();
      setTeachers(res.data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Öğretmenler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTeachers(); }, []);

  const openCreate = () => setFormModal({ open: true, teacher: null });

  const openEdit = async (teacher: Teacher) => {
    // Mevcut atamalar dahil tam veriyi çek
    try {
      const res = await teachersApi.getById(teacher.id);
      setFormModal({ open: true, teacher: res.data.data });
    } catch {
      setFormModal({ open: true, teacher });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.teacher) return;
    setDeleteDialog((d) => ({ ...d, loading: true }));
    try {
      await teachersApi.remove(deleteDialog.teacher.id);
      setDeleteDialog({ open: false, teacher: null, loading: false });
      fetchTeachers();
    } catch {
      setDeleteDialog((d) => ({ ...d, loading: false }));
    }
  };

  return (
    <div className="max-w-5xl mx-auto animate-slide-up">
      {/* ── Başlık ─────────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-gradient">Öğretmenler</h1>
          <p className="text-sm text-slate-500 mt-1">Öğretim personelini ve haftalık müsaitliklerini yönetin</p>
        </div>
        <div className="flex items-center gap-2">
          <button id="refresh-teachers" onClick={fetchTeachers} disabled={loading} className="btn-ghost" title="Yenile">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Yenile
          </button>
          <button id="add-teacher-btn" onClick={openCreate} className="btn-primary">
            <Plus size={16} /> Öğretmen Ekle
          </button>
        </div>
      </div>

      {/* ── İstatistik Bar ─────────────────────────────────────── */}
      {!loading && !error && teachers.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="stat-card">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Toplam Öğretmen</p>
            <p className="text-2xl font-bold text-slate-100">{teachers.length}</p>
          </div>
          <div className="stat-card">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Toplam Atama</p>
            <p className="text-2xl font-bold text-slate-100">
              {teachers.reduce((s, t) => s + (t._count?.assignments ?? 0), 0)}
            </p>
          </div>
          <div className="stat-card">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Ort. Saat / Hafta</p>
            <p className="text-2xl font-bold text-slate-100">
              {teachers.length > 0
                ? Math.round(
                    teachers.reduce(
                      (s, t) => s + weeklyAvailableHours(t.unavailable_slots, DEFAULT_WEEKLY_HOURS),
                      0
                    ) / teachers.length
                  )
                : 0}
            </p>
          </div>
        </div>
      )}

      {/* ── Hata ───────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 mb-6">
          <AlertCircle size={18} className="text-rose-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-rose-300">Öğretmenler yüklenemedi</p>
            <p className="text-xs text-rose-400/70 mt-0.5">{error}</p>
          </div>
          <button onClick={fetchTeachers} className="ml-auto btn-ghost text-rose-400 hover:text-rose-300">
            Tekrar Dene
          </button>
        </div>
      )}

      {/* ── Grid ───────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <TeacherCardSkeleton key={i} />)}
        </div>
      ) : teachers.length === 0 && !error ? (
        <EmptyState onAdd={openCreate} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {teachers.map((teacher) => (
            <TeacherCard
              key={teacher.id}
              teacher={teacher}
              onEdit={() => openEdit(teacher)}
              onDelete={() => setDeleteDialog({ open: true, teacher, loading: false })}
            />
          ))}
        </div>
      )}

      {/* ── Öğretmen Form Modali ────────────────────────────────── */}
      <TeacherFormModal
        isOpen={formModal.open}
        onClose={() => setFormModal({ open: false, teacher: null })}
        onSaved={fetchTeachers}
        teacher={formModal.teacher}
      />

      {/* ── Silme Onayı ────────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, teacher: null, loading: false })}
        onConfirm={handleDeleteConfirm}
        itemName={deleteDialog.teacher?.name}
        loading={deleteDialog.loading}
      />
    </div>
  );
}
