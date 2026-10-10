import { Layout as LayoutIcon, Users, BookOpen, Building2, CalendarDays, Sliders } from 'lucide-react';
import { Link } from 'react-router-dom';

interface QuickLinkProps {
  to: string;
  icon: React.ElementType;
  label: string;
  description: string;
  color: string;
}

function QuickLink({ to, icon: Icon, label, description, color }: QuickLinkProps) {
  return (
    <Link to={to} className="card group cursor-pointer hover:scale-[1.02] active:scale-[0.98] block">
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
          <Icon size={18} className="text-white" />
        </div>
        <div>
          <p className="font-semibold text-slate-200 group-hover:text-white transition-colors">{label}</p>
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        </div>
      </div>
    </Link>
  );
}

export default function Dashboard() {
  return (
    <div className="max-w-4xl mx-auto animate-slide-up">
      {/* Hero */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 
                          flex items-center justify-center shadow-lg shadow-brand-500/30">
            <LayoutIcon size={18} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gradient">Gösterge Paneli</h1>
        </div>
        <p className="text-slate-400 text-sm ml-14">
          EduScheduler'a hoş geldiniz. Ders programı oluşturmadan önce okul verilerini tamamlayın.
        </p>
      </div>

      {/* Setup Checklist */}
      <div className="mb-8 p-5 rounded-xl border border-brand-500/20 bg-brand-500/5">
        <p className="text-sm font-semibold text-brand-300 mb-3">🚀 Başlangıç Rehberi</p>
        <ol className="text-sm text-slate-400 space-y-1.5 list-decimal list-inside">
          <li><span className="text-slate-200">Öğretmenler</span>'i ve müsait saatlerini ekleyin</li>
          <li><span className="text-slate-200">Sınıflar</span> oluşturun (örn. 9-A, 10-B)</li>
          <li><span className="text-slate-200">Dersler</span>'i tanımlayın ve renk atayın</li>
          <li><span className="text-slate-200">Derslikler</span>'i ve türlerini kayıt edin</li>
          <li><span className="text-slate-200">Atamalar</span>'ı yapın (kim, neyi, kime okutacak)</li>
          <li><span className="text-slate-200">Kısıtlamalar</span>'ı düzenleyin (zamanlama kuralları)</li>
          <li><span className="text-brand-400 font-semibold">Ders Programı Oluştur</span>'a tıklayın ✨</li>
        </ol>
      </div>

      {/* Quick Links */}
      <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500 mb-4">Hızlı Erişim</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <QuickLink to="/teachers"    icon={Users}        label="Öğretmenler"  description="Personel ve müsaitlikleri yönetin"     color="bg-gradient-to-br from-brand-500 to-purple-600" />
        <QuickLink to="/grades"      icon={BookOpen}     label="Sınıflar"     description="9-A, 10-B gibi sınıflar"            color="bg-gradient-to-br from-cyan-500 to-blue-600" />
        <QuickLink to="/subjects"    icon={BookOpen}     label="Dersler"      description="Matematik, Tarih, Beden Eğitimi..."   color="bg-gradient-to-br from-emerald-500 to-teal-600" />
        <QuickLink to="/classrooms"  icon={Building2}    label="Derslikler"   description="Sınıflar, lab ve spor salonları"       color="bg-gradient-to-br from-amber-500 to-orange-600" />
        <QuickLink to="/assignments" icon={CalendarDays} label="Atamalar"     description="Öğretmenleri sınıflara atayın"          color="bg-gradient-to-br from-rose-500 to-pink-600" />
        <QuickLink to="/constraints" icon={Sliders}      label="Kısıtlamalar" description="Zamanlama kuralları ve limitler"       color="bg-gradient-to-br from-violet-500 to-indigo-600" />
      </div>
    </div>
  );
}
