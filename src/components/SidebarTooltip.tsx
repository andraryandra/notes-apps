import { useRef, type ReactNode } from 'react';
import type { JSAnimation } from 'animejs';
import { motionEnter, motionExit } from '../utils/motion';
import './SidebarTooltip.css';

interface Props {
  label: string;
  children: ReactNode;
  badge?: number;
}

export function SidebarTooltip({ label, children, badge }: Props) {
  const tooltipRef = useRef<HTMLSpanElement>(null);
  const anim = useRef<JSAnimation | null>(null);

  const show = () => {
    const el = tooltipRef.current;
    if (!el) return;
    anim.current?.pause();
    el.style.visibility = 'visible';
    anim.current = motionEnter('tooltip', el);
  };

  const hide = () => {
    const el = tooltipRef.current;
    if (!el) return;
    anim.current?.pause();
    anim.current = motionExit('tooltip', el, () => {
      el.style.visibility = 'hidden';
    });
  };

  return (
    <div
      className="sidebar-tooltip-wrap"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {badge !== undefined && badge > 0 && (
        <span className="sidebar-tooltip-badge" aria-hidden>
          {badge > 99 ? '99+' : badge}
        </span>
      )}
      <span ref={tooltipRef} className="sidebar-tooltip motion-from-hidden" role="tooltip">
        {label}
      </span>
    </div>
  );
}
