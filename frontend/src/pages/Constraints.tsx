import { useEffect, useState } from 'react';
import { Sliders, RefreshCw, AlertCircle, Loader2, Check } from 'lucide-react';
import { settingsApi, type SchoolSettings } from '../api/client';

export default function ConstraintsPage() {
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await settingsApi.get();
      setSettings(res.data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kısıtlamalar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const save = async (patch: Partial<SchoolSettings>) => {
    if (!settings) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await settingsApi.update(patch);
      setSettings(res.data.data);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-slide-up">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-gradient">Kısıtlamalar</h1>
          <p className="text-sm text-slate-500 mt-1">Küresel zamanlama kurallarını açıp kapatın</p>
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

      {loading || !settings ? (
        <div className="card animate-pulse h-40" />
      ) : (
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center flex-shrink-0">
                  <Sliders size={18} className="text-violet-400" />
                </div>
                <div>
                  <p className="font-semibold text-slate-100">Aynı dersten en fazla 2 ardışık saat</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Bir sınıfın aynı dersi peş peşe {settings.maxConsecutiveHours} saatten fazla almasını engeller.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => save({ maxConsecutiveSameSubject: !settings.maxConsecutiveSameSubject })}
                disabled={saving}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  settings.maxConsecutiveSameSubject ? 'bg-brand-500' : 'bg-slate-600'
                }`}
                aria-pressed={settings.maxConsecutiveSameSubject}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.maxConsecutiveSameSubject ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </div>

            {settings.maxConsecutiveSameSubject && (
              <div className="mt-5 pt-4 border-t border-sidebar-border">
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Maksimum ardışık saat</label>
                <input
                  type="number"
                  min={1}
                  max={8}
                  className="input w-28"
                  value={settings.maxConsecutiveHours}
                  onChange={(e) =>
                    setSettings({ ...settings, maxConsecutiveHours: parseInt(e.target.value) || 1 })
                  }
                  onBlur={() => save({ maxConsecutiveHours: settings.maxConsecutiveHours })}
                />
              </div>
            )}
          </div>

          <div className="card bg-sidebar-bg/50">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Her zaman zorunlu kurallar</p>
            <ul className="text-sm text-slate-400 space-y-2 list-disc list-inside">
              <li>Bir öğretmen aynı anda iki farklı sınıfta olamaz</li>
              <li>Bir sınıf aynı anda iki farklı ders alamaz</li>
              <li>Öğretmen engelli saatlerinde asla yerleştirilmez</li>
              <li>Atamanın toplam saati haftalık gereksinimle birebir eşleşir</li>
            </ul>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            {saving && <><Loader2 size={12} className="animate-spin" /> Kaydediliyor...</>}
            {saved && !saving && <><Check size={12} className="text-emerald-400" /> <span className="text-emerald-400">Kaydedildi</span></>}
          </div>
        </div>
      )}
    </div>
  );
}
