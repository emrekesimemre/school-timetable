import { useEffect, useState } from 'react';
import { Settings, RefreshCw, AlertCircle, Loader2, Check } from 'lucide-react';
import { settingsApi, type SchoolSettings } from '../api/client';

export default function SettingsPage() {
  const [daysPerWeek, setDaysPerWeek] = useState(5);
  const [hoursPerDay, setHoursPerDay] = useState(8);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await settingsApi.get();
      const s: SchoolSettings = res.data.data;
      setDaysPerWeek(s.daysPerWeek);
      setHoursPerDay(s.hoursPerDay);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ayarlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await settingsApi.update({ daysPerWeek, hoursPerDay });
      setDaysPerWeek(res.data.data.daysPerWeek);
      setHoursPerDay(res.data.data.hoursPerDay);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  const total = daysPerWeek * hoursPerDay;

  return (
    <div className="max-w-3xl mx-auto animate-slide-up">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-gradient">Ayarlar</h1>
          <p className="text-sm text-slate-500 mt-1">Okul haftalık ızgara yapısını yapılandırın</p>
        </div>
        <button onClick={load} disabled={loading} className="btn-ghost">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Yenile
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 mb-6">
          <AlertCircle size={18} className="text-rose-400 flex-shrink-0" />
          <p className="text-sm text-rose-300">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="card animate-pulse h-56" />
      ) : (
        <div className="card space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/15 flex items-center justify-center">
              <Settings size={18} className="text-brand-400" />
            </div>
            <div>
              <p className="font-semibold text-slate-100">Okul yapısı</p>
              <p className="text-xs text-slate-500">Varsayılan: 5 gün × 8 saat = 40 saat/hafta</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Haftalık gün sayısı</label>
              <input
                type="number"
                min={1}
                max={7}
                className="input"
                value={daysPerWeek}
                onChange={(e) => setDaysPerWeek(Math.min(7, Math.max(1, parseInt(e.target.value) || 1)))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Günlük ders saati</label>
              <input
                type="number"
                min={1}
                max={12}
                className="input"
                value={hoursPerDay}
                onChange={(e) => setHoursPerDay(Math.min(12, Math.max(1, parseInt(e.target.value) || 1)))}
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-brand-500/5 border border-brand-500/20">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Toplam haftalık kapasite</p>
            <p className="text-2xl font-bold text-slate-100 mt-1">{total} saat</p>
            <p className="text-xs text-slate-500 mt-1">
              Öğretmen müsaitliği = {total} − engellenen slot sayısı
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            {saved && !saving && (
              <span className="text-xs text-emerald-400 inline-flex items-center gap-1">
                <Check size={12} /> Kaydedildi
              </span>
            )}
            <button type="button" onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? <><Loader2 size={14} className="animate-spin" /> Kaydediliyor...</> : 'Kaydet'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
