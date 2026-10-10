import { useEffect, useState } from 'react';
import { Zap, Loader2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { timetableApi, type GenerateResult } from '../api/client';

const STEPS = [
  'Atamalar ve müsaitlikler yükleniyor',
  'Sert kısıtlamalar uygulanıyor',
  'Slotlar yerleştiriliyor',
];

export default function GeneratePage() {
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    timetableApi.latest()
      .then((res) => setResult(res.data.data))
      .catch(() => {/* henüz program yok */});
  }, []);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      setStep((s) => (s + 1) % STEPS.length);
      setProgress((p) => (p >= 90 ? 35 : p + 8));
    }, 700);
    return () => clearInterval(timer);
  }, [running]);

  const generate = async () => {
    setRunning(true);
    setError(null);
    setProgress(12);
    setStep(0);
    try {
      const res = await timetableApi.generate();
      setResult(res.data.data);
      setProgress(100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Program üretilemedi');
      setResult(null);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-slide-up">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-gradient">Ders Programı Oluştur</h1>
          <p className="text-sm text-slate-500 mt-1">
            Atamalar, müsaitlikler ve kısıtlamalar ile ızgarayı otomatik doldurun
          </p>
        </div>
      </div>

      <div className="card text-center py-12">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-lg shadow-brand-500/30 mb-5">
          <Zap size={28} className="text-white" />
        </div>
        <h2 className="text-lg font-semibold text-slate-100">Kısıt çözücü</h2>
        <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
          Motor öğretmen çakışması, sınıf çakışması ve engelli saatleri sert kısıt olarak uygular.
        </p>

        <button
          type="button"
          onClick={generate}
          disabled={running}
          className="btn-primary mt-8 min-w-[220px] justify-center text-base py-3"
        >
          {running ? (
            <><Loader2 size={18} className="animate-spin" /> Üretiliyor...</>
          ) : (
            <><Zap size={18} /> Ders Programı Oluştur</>
          )}
        </button>

        {running && (
          <div className="mt-8 max-w-md mx-auto text-left">
            <div className="h-2 rounded-full bg-sidebar-hover overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-500 to-purple-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-3 flex items-center gap-2">
              <Loader2 size={12} className="animate-spin" />
              {STEPS[step]}
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-rose-300">Program üretilemedi</p>
              <p className="text-sm text-rose-200/80 mt-1 leading-relaxed">{error}</p>
            </div>
          </div>
        </div>
      )}

      {result && !error && (
        <div className="mt-6 p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <div className="flex items-start gap-3">
            <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-emerald-300">Program başarıyla üretildi</p>
              <p className="text-xs text-slate-400 mt-1">
                {new Date(result.generatedAt).toLocaleString('tr-TR')} · {result.daysPerWeek}×{result.hoursPerDay} ızgara
              </p>
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="rounded-lg bg-sidebar-bg/60 px-3 py-2">
                  <p className="text-[10px] uppercase text-slate-500">Yerleşen ders</p>
                  <p className="text-lg font-bold text-slate-100">{result.stats.placedLessons}</p>
                </div>
                <div className="rounded-lg bg-sidebar-bg/60 px-3 py-2">
                  <p className="text-[10px] uppercase text-slate-500">Sınıf</p>
                  <p className="text-lg font-bold text-slate-100">{result.stats.classes}</p>
                </div>
                <div className="rounded-lg bg-sidebar-bg/60 px-3 py-2">
                  <p className="text-[10px] uppercase text-slate-500">Öğretmen</p>
                  <p className="text-lg font-bold text-slate-100">{result.stats.teachers}</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-4">
                Sınıf ve öğretmen ızgara görünümleri Aşama 4’te eklenecek.
              </p>
            </div>
          </div>
        </div>
      )}

      {result && (
        <button onClick={generate} disabled={running} className="btn-ghost mt-4">
          <RefreshCw size={14} /> Yeniden üret
        </button>
      )}
    </div>
  );
}
