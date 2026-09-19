import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { useAppStore, AppSection } from '../../store/useAppStore';

interface BreadcrumbProps {
  items: { label: string; section?: AppSection }[];
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  const { setActiveSection, setActivePortal } = useAppStore();

  return (
    <nav className="flex items-center space-x-1.5 text-[11px] text-slate-500 mb-2.5 select-none">
      <button
        onClick={() => {
          setActivePortal('admin');
          setActiveSection('dashboard');
        }}
        className="flex items-center gap-1 hover:text-[#8B1E2D] transition-colors text-slate-600"
      >
        <Home className="w-3.5 h-3.5 text-slate-400" />
        <span>Operations Root</span>
      </button>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={item.label}>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            {isLast || !item.section ? (
              <span className="font-semibold text-slate-800">{item.label}</span>
            ) : (
              <button
                onClick={() => {
                  setActivePortal('admin');
                  if (item.section) setActiveSection(item.section);
                }}
                className="hover:text-[#8B1E2D] transition-colors"
              >
                {item.label}
              </button>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
