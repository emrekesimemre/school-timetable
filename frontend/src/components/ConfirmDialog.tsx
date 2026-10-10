import { AlertTriangle, Loader2 } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  itemName?: string;
  loading?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Silme Onayı',
  description,
  itemName,
  loading = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={!loading ? onClose : undefined} />

      <div className="relative w-full max-w-sm bg-sidebar-surface border border-sidebar-border
                      rounded-2xl shadow-2xl animate-slide-up">
        <div className="p-6">
          {/* İkon */}
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20
                          flex items-center justify-center mb-4">
            <AlertTriangle size={22} className="text-rose-400" />
          </div>

          {/* Başlık & açıklama */}
          <h3 className="text-base font-semibold text-slate-100 mb-1">{title}</h3>
          <p className="text-sm text-slate-400">
            {description ?? (
              <>
                <span className="text-slate-200 font-medium">"{itemName}"</span>{' '}
                kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
              </>
            )}
          </p>
        </div>

        {/* Aksiyon butonları */}
        <div className="flex items-center justify-end gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="btn-ghost"
          >
            İptal
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg
                       bg-rose-600 hover:bg-rose-500 active:bg-rose-700
                       text-white font-medium text-sm transition-all duration-150
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <><Loader2 size={14} className="animate-spin" /> Siliniyor...</>
            ) : (
              'Evet, Sil'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
