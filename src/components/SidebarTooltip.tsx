import type { ReactNode } from 'react';
import './SidebarTooltip.css';

interface Props {
  label: string;
  children: ReactNode;
  badge?: number;
}

export function SidebarTooltip({ label, children, badge }: Props) {
  return (
    <div className="sidebar-tooltip-wrap">
      {children}
      {badge !== undefined && badge > 0 && (
        <span className="sidebar-tooltip-badge" aria-hidden>
          {badge > 99 ? '99+' : badge}
        </span>
      )}
      <span className="sidebar-tooltip" role="tooltip">
        {label}
      </span>
    </div>
  );
}
