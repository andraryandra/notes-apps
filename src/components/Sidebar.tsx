import type { SidebarMode } from '../config/appearance';
import { SidebarExpanded } from './SidebarExpanded';
import { SidebarRail } from './SidebarRail';
import type { SidebarProps } from './sidebarTypes';

interface Props extends SidebarProps {
  mode: SidebarMode;
  onModeChange: (mode: SidebarMode) => void;
}

export function Sidebar({ mode, onModeChange, ...props }: Props) {
  if (mode === 'rail') {
    return <SidebarRail {...props} onExpand={() => onModeChange('expanded')} />;
  }
  return <SidebarExpanded {...props} onCollapse={() => onModeChange('rail')} />;
}
