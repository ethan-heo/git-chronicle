import type { CSSProperties, FC, ReactElement, ReactNode } from 'react';
import { DIVIDER_WIDTH_PX, ResizableSplitPane } from './ResizableSplitPane';

export interface SidebarSectionGroupItem {
  key: string;
  minHeightPx: number;
  heightPx: number;
  isExpanded: boolean;
  onHeightChange: (heightPx: number) => void;
  node: ReactNode;
}

interface SidebarSectionGroupProps {
  sections: SidebarSectionGroupItem[];
  className?: string;
}

type Run =
  | { type: 'collapsed'; section: SidebarSectionGroupItem }
  | { type: 'cluster'; sections: SidebarSectionGroupItem[] };

function buildRuns(sections: SidebarSectionGroupItem[]): Run[] {
  const runs: Run[] = [];
  let cluster: SidebarSectionGroupItem[] = [];

  const flushCluster = (): void => {
    if (cluster.length > 0) {
      runs.push({ type: 'cluster', sections: cluster });
      cluster = [];
    }
  };

  for (const section of sections) {
    if (section.isExpanded) {
      cluster.push(section);
    } else {
      flushCluster();
      runs.push({ type: 'collapsed', section });
    }
  }
  flushCluster();

  return runs;
}

function clusterMinHeightPx(sections: SidebarSectionGroupItem[]): number {
  return sections.reduce((sum, section) => sum + section.minHeightPx, 0) + (sections.length - 1) * DIVIDER_WIDTH_PX;
}

// Renders one maximal run of contiguous expanded sections. The last section in the run
// always absorbs the remaining space (flex-1); every section before it keeps a fixed,
// user-resizable height. Each split reserves enough room for everything after it so a
// squeeze never collapses a downstream section to 0 (see ResizableSplitPane's clamp).
function renderCluster(sections: SidebarSectionGroupItem[]): ReactElement {
  if (sections.length === 1) {
    const [only] = sections;
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden" style={{ minHeight: only.minHeightPx }}>
        {only.node}
      </div>
    );
  }

  const [first, ...rest] = sections;

  return (
    <ResizableSplitPane
      isOpen
      orientation="vertical"
      minLeftPx={first.minHeightPx}
      minRightPx={clusterMinHeightPx(rest)}
      controlledLeftPx={first.heightPx}
      onLeftPxChange={(leftPx) => first.onHeightChange(leftPx)}
      className="h-full min-h-0"
      left={first.node}
      right={renderCluster(rest)}
    />
  );
}

export const SidebarSectionGroup: FC<SidebarSectionGroupProps> = ({ sections, className }) => {
  const runs = buildRuns(sections);

  return (
    <div className={['flex min-h-0 flex-1 flex-col', className].filter(Boolean).join(' ')}>
      {runs.map((run) => {
        if (run.type === 'collapsed') {
          return (
            <div key={run.section.key} className="shrink-0">
              {run.section.node}
            </div>
          );
        }

        const style: CSSProperties = { minHeight: clusterMinHeightPx(run.sections) };
        return (
          <div key={run.sections[0].key} className="flex min-h-0 flex-1 flex-col overflow-hidden" style={style}>
            {renderCluster(run.sections)}
          </div>
        );
      })}
    </div>
  );
};
