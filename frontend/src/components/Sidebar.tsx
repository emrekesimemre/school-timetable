import { NavLink } from 'react-router-dom';
import {
  Users,
  BookOpen,
  Layout,
  Building2,
  Settings,
  Sliders,
  CalendarDays,
  GraduationCap,
  Zap,
} from 'lucide-react';

interface NavItem {
  label: string;
  to: string;
  icon: React.ElementType;
  badge?: string;
}

const navItems: NavItem[] = [
  { label: 'Gösterge Paneli', to: '/',             icon: Layout },
  { label: 'Öğretmenler',    to: '/teachers',     icon: Users },
  { label: 'Sınıflar',       to: '/grades',       icon: GraduationCap },
  { label: 'Dersler',        to: '/subjects',     icon: BookOpen },
  { label: 'Derslikler',     to: '/classrooms',   icon: Building2 },
  { label: 'Atamalar',       to: '/assignments',  icon: CalendarDays },
  { label: 'Kısıtlamalar',   to: '/constraints',  icon: Sliders },
];

const bottomNavItems: NavItem[] = [
  { label: 'Ders Programı Oluştur', to: '/generate', icon: Zap },
  { label: 'Ayarlar',               to: '/settings', icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 w-60 flex flex-col bg-sidebar-bg border-r border-sidebar-border z-50">
      {/* ── Logo ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 
                        flex items-center justify-center shadow-lg shadow-brand-500/30 flex-shrink-0">
          <CalendarDays size={16} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-none">EduScheduler</p>
          <p className="text-[10px] text-slate-500 mt-0.5 leading-none">Ders Programı Yöneticisi</p>
        </div>
      </div>

      {/* ── Primary Nav ───────────────────────────────────────── */}
      <nav className="flex-1 py-3 overflow-y-auto">
        <p className="px-5 py-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
          Yönetim
        </p>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'nav-active' : ''}`
            }
          >
            <item.icon size={17} className="flex-shrink-0" />
            <span className="flex-1">{item.label}</span>
            {item.badge && (
              <span className="badge-indigo text-[10px] px-1.5 py-0.5">{item.badge}</span>
            )}
          </NavLink>
        ))}

        <div className="mx-4 my-3 border-t border-sidebar-border" />

        <p className="px-5 py-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
          Sistem
        </p>
        {bottomNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'nav-active' : ''}`
            }
          >
            <item.icon size={17} className="flex-shrink-0" />
            <span className="flex-1">{item.label}</span>
            {item.badge && (
              <span className="badge-indigo text-[10px] px-1.5 py-0.5">{item.badge}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Footer ────────────────────────────────────────────── */}
      <div className="px-4 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-sidebar-hover">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-400 to-purple-500 
                          flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            A
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-200 truncate">Yönetici</p>
            <p className="text-[10px] text-slate-500 truncate">yonetici@okul.edu.tr</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
