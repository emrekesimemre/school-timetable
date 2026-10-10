import { useEffect, useState } from 'react';
import { Plus, Trash2, Loader2, GraduationCap, BookOpen, Clock } from 'lucide-react';
import Modal from './Modal';
import AvailabilityGrid from './AvailabilityGrid';
import {
  teachersApi,
  gradesApi,
  subjectsApi,
  type Teacher,
  type Grade,
  type Subject,
  type AssignmentInput,
} from '../api/client';

// ─── Tipler ───────────────────────────────────────────────────

interface AssignmentRow extends AssignmentInput {
  _rowId: string; // React key için geçici ID
}

interface FormData {
  name: string;
  email: string;
  unavailable_slots: string[];
  assignments: AssignmentRow[];
}

interface TeacherFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  teacher?: Teacher | null; // null = oluştur, Teacher = düzenle
}

type Tab = 'assignments' | 'availability';

// ─── Yardımcı ─────────────────────────────────────────────────

const newRow = (): AssignmentRow => ({
  _rowId: crypto.randomUUID(),
  gradeId: '',
  subjectId: '',
  hoursPerWeek: 2,
});

const emptyForm = (): FormData => ({
  name: '',
  email: '',
  unavailable_slots: [],
  assignments: [],
});

const teacherToForm = (t: Teacher): FormData => ({
  name: t.name,
  email: t.email ?? '',
  unavailable_slots: t.unavailable_slots ?? [],
  assignments: (t.assignments ?? []).map((a) => ({
    _rowId: a.id,
    gradeId: a.gradeId,
    subjectId: a.subjectId,
    hoursPerWeek: a.hoursPerWeek,
  })),
});

// ─── Bileşen ─────────────────────────────────────────────────

export default function TeacherFormModal({
  isOpen,
  onClose,
  onSaved,
  teacher,
}: TeacherFormModalProps) {
  const [tab, setTab] = useState<Tab>('assignments');
  const [form, setForm] = useState<FormData>(emptyForm());
  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Modal açıldığında veri yükle
  useEffect(() => {
    if (!isOpen) return;
    setTab('assignments');
    setErrors({});
    setForm(teacher ? teacherToForm(teacher) : emptyForm());

    // Sınıf ve Ders listelerini getir
    Promise.all([gradesApi.getAll(), subjectsApi.getAll()])
      .then(([g, s]) => {
        setGrades(g.data.data);
        setSubjects(s.data.data);
      })
      .catch(() => {/* sessizce devam */});
  }, [isOpen, teacher]);

  // ─── Temel Alan Değişikliği ───────────────────────────────
  const setField = <K extends keyof FormData>(key: K, val: FormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  // ─── Atama Satır İşlemleri ────────────────────────────────
  const addRow = () =>
    setField('assignments', [...form.assignments, newRow()]);

  const removeRow = (rowId: string) =>
    setField('assignments', form.assignments.filter((r) => r._rowId !== rowId));

  const updateRow = (rowId: string, patch: Partial<AssignmentRow>) =>
    setField(
      'assignments',
      form.assignments.map((r) => (r._rowId === rowId ? { ...r, ...patch } : r))
    );

  // ─── Validasyon ───────────────────────────────────────────
  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Öğretmen adı zorunludur';
    if (form.email && !/\S+@\S+\.\S+/.test(form.email))
      errs.email = 'Geçersiz e-posta formatı';
    form.assignments.forEach((r, i) => {
      if (!r.gradeId) errs[`row_grade_${i}`] = 'Sınıf seçin';
      if (!r.subjectId) errs[`row_subject_${i}`] = 'Ders seçin';
      if (!r.hoursPerWeek || r.hoursPerWeek < 1)
        errs[`row_hours_${i}`] = 'Min 1';
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ─── Kaydet ───────────────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim() || undefined,
        unavailable_slots: form.unavailable_slots,
        assignments: form.assignments.map(({ gradeId, subjectId, hoursPerWeek }) => ({
          gradeId,
          subjectId,
          hoursPerWeek,
        })),
      };

      if (teacher) {
        await teachersApi.update(teacher.id, payload);
      } else {
        await teachersApi.create(payload);
      }

      onSaved();
      onClose();
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : 'Kayıt başarısız' });
    } finally {
      setSaving(false);
    }
  };

  const totalSlots = form.unavailable_slots.length;
  const availableHours = Math.max(0, 40 - totalSlots);
  const isEdit = !!teacher;

  // ─── Render ───────────────────────────────────────────────
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Öğretmeni Düzenle — ${teacher.name}` : 'Yeni Öğretmen Ekle'}
      size="xl"
    >
      {/* ── Sekme çubuğu ─────────────────────────────────────── */}
      <div className="flex border-b border-sidebar-border -mt-2 mb-6">
        {(
          [
            { id: 'assignments', label: '📋 Atamalar', hint: `${form.assignments.length} satır` },
            { id: 'availability', label: '🗓 Müsaitlik Takvimi', hint: `${availableHours} saat/hafta müsait` },
          ] as { id: Tab; label: string; hint: string }[]
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            {t.label}
            <span className="text-[10px] bg-sidebar-hover px-1.5 py-0.5 rounded text-slate-500">
              {t.hint}
            </span>
          </button>
        ))}
      </div>

      {/* ── Genel Form Hatası ──────────────────────────────────── */}
      {errors.form && (
        <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-sm text-rose-300">
          {errors.form}
        </div>
      )}

      {/* ══ SEKME 1: Atamalar ══════════════════════════════════ */}
      {tab === 'assignments' && (
        <div className="space-y-5">
          {/* Temel Bilgiler */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Ad Soyad <span className="text-rose-400">*</span>
              </label>
              <input
                className={`input ${errors.name ? 'border-rose-500/60 focus:ring-rose-500/30' : ''}`}
                placeholder="örn. Ayşe Kaya"
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
              />
              {errors.name && <p className="text-xs text-rose-400 mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">E-posta</label>
              <input
                className={`input ${errors.email ? 'border-rose-500/60' : ''}`}
                type="email"
                placeholder="ornek@okul.edu.tr"
                value={form.email}
                onChange={(e) => setField('email', e.target.value)}
              />
              {errors.email && <p className="text-xs text-rose-400 mt-1">{errors.email}</p>}
            </div>
          </div>

          {/* Atama Satırları */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-slate-200">Ders Atamaları</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Bu öğretmenin hangi sınıflara, hangi dersi, kaç saat okutacağını belirleyin
                </p>
              </div>
              <button type="button" onClick={addRow} className="btn-primary py-1.5 text-xs">
                <Plus size={13} /> Satır Ekle
              </button>
            </div>

            {form.assignments.length === 0 ? (
              <div className="text-center py-8 rounded-xl border border-dashed border-sidebar-border">
                <GraduationCap size={28} className="mx-auto text-slate-600 mb-2" />
                <p className="text-sm text-slate-500">Henüz atama yok</p>
                <p className="text-xs text-slate-600 mt-1">Yukarıdaki "Satır Ekle" butonuna tıklayın</p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Başlık satırı */}
                <div className="grid grid-cols-[1fr_1fr_80px_36px] gap-2 px-3">
                  {['Sınıf', 'Ders', 'Saat/Hafta', ''].map((h) => (
                    <p key={h} className="text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                      {h}
                    </p>
                  ))}
                </div>

                {/* Satırlar */}
                {form.assignments.map((row, i) => (
                  <div
                    key={row._rowId}
                    className="grid grid-cols-[1fr_1fr_80px_36px] gap-2 p-3 rounded-xl
                               bg-sidebar-bg border border-sidebar-border hover:border-sidebar-hover
                               transition-colors group"
                  >
                    {/* Sınıf */}
                    <div>
                      <select
                        className={`input text-sm py-2 ${errors[`row_grade_${i}`] ? 'border-rose-500/60' : ''}`}
                        value={row.gradeId}
                        onChange={(e) => updateRow(row._rowId, { gradeId: e.target.value })}
                      >
                        <option value="">Sınıf seçin</option>
                        {grades.map((g) => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </select>
                      {errors[`row_grade_${i}`] && (
                        <p className="text-[10px] text-rose-400 mt-0.5">{errors[`row_grade_${i}`]}</p>
                      )}
                    </div>

                    {/* Ders */}
                    <div>
                      <select
                        className={`input text-sm py-2 ${errors[`row_subject_${i}`] ? 'border-rose-500/60' : ''}`}
                        value={row.subjectId}
                        onChange={(e) => updateRow(row._rowId, { subjectId: e.target.value })}
                      >
                        <option value="">Ders seçin</option>
                        {subjects.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                      {errors[`row_subject_${i}`] && (
                        <p className="text-[10px] text-rose-400 mt-0.5">{errors[`row_subject_${i}`]}</p>
                      )}
                    </div>

                    {/* Saat */}
                    <div className="flex items-center gap-1">
                      <Clock size={12} className="text-slate-500 flex-shrink-0" />
                      <input
                        type="number"
                        min={1}
                        max={40}
                        className={`input text-sm py-2 w-full ${errors[`row_hours_${i}`] ? 'border-rose-500/60' : ''}`}
                        value={row.hoursPerWeek}
                        onChange={(e) => updateRow(row._rowId, { hoursPerWeek: parseInt(e.target.value) || 1 })}
                      />
                    </div>

                    {/* Sil */}
                    <button
                      type="button"
                      onClick={() => removeRow(row._rowId)}
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-600
                                 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Özet */}
            {form.assignments.length > 0 && (
              <div className="mt-2 flex items-center justify-end gap-1 text-xs text-slate-500">
                <BookOpen size={11} />
                <span>
                  Toplam{' '}
                  <strong className="text-slate-300">
                    {form.assignments.reduce((s, r) => s + (r.hoursPerWeek || 0), 0)}
                  </strong>{' '}
                  saat/hafta
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ SEKME 2: Müsaitlik Takvimi ══════════════════════════ */}
      {tab === 'availability' && (
        <AvailabilityGrid
          value={form.unavailable_slots}
          onChange={(slots) => setField('unavailable_slots', slots)}
        />
      )}

      {/* ── Alt çubuk: Kaydet / İptal ─────────────────────────── */}
      <div className="flex items-center justify-between mt-8 pt-5 border-t border-sidebar-border">
        <p className="text-xs text-slate-600">
          {isEdit ? 'Değişiklikler mevcut atamalar dahil güncellenir' : 'Öğretmen ve atamalar birlikte oluşturulur'}
        </p>
        <div className="flex items-center gap-3">
          <button type="button" onClick={onClose} disabled={saving} className="btn-ghost">
            İptal
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn-primary min-w-[100px] justify-center"
          >
            {saving ? (
              <><Loader2 size={14} className="animate-spin" /> Kaydediliyor...</>
            ) : isEdit ? (
              'Güncelle'
            ) : (
              'Öğretmen Ekle'
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
