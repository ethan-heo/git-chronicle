import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { CSSProperties, FC, ReactNode } from 'react';
import { SymbolKindBadge } from './SymbolKindBadge';
import type { SymbolNodeType } from './symbolGraphUtils';
import './SymbolNode.css';

const handlePositions = [
  { face: 'top', position: Position.Top },
  { face: 'right', position: Position.Right },
  { face: 'bottom', position: Position.Bottom },
  { face: 'left', position: Position.Left },
] as const;

export const SymbolNode: FC<NodeProps<SymbolNodeType>> = ({ data, selected }) => {
  const isImportNode = data.symbolNode.nodeCategory === 'import';
  const importKind = data.symbolNode.importKind ?? 'named';
  const modulePath = data.symbolNode.modulePath ?? '';
  const attributes = data.symbolNode.members?.filter((member) => member.memberKind === 'attribute') ?? [];
  const operations = data.symbolNode.members?.filter((member) => member.memberKind === 'operation') ?? [];
  const enumValues = data.symbolNode.enumValues ?? [];

  return (
    <div
      className={[
        'symbol-node relative rounded-[16px] border border-line bg-[color-mix(in_srgb,var(--gae-color-surface-elevated)_94%,transparent)] px-4 pt-[14px] pb-3 shadow-[0_4px_18px_rgba(0,0,0,0.22)] backdrop-blur-[2px]',
        isImportNode ? 'symbol-node-import min-w-[208px] border-dashed px-[14px] pt-3 pb-[10px]' : 'min-w-[232px]',
        selected ? 'symbol-node-selected' : '',
      ].filter(Boolean).join(' ')}
      role="button"
      aria-label={`${data.label} (${isImportNode ? `${importKind} import` : data.symbolNode.kind}) symbol node`}
      tabIndex={0}
      title={isImportNode && modulePath ? modulePath : undefined}
      style={{ '--symbol-node-accent': data.accentColor, width: `${data.width}px` } as CSSProperties}
    >
      <span className="symbol-node-accent" aria-hidden="true" />
      {handlePositions.map(({ face, position }) => (
        <Handle key={`${data.symbolNode.id}-${face}-target`} id={`target-${face}`} type="target" position={position} className="symbol-node-handle h-0 w-0 border-0 bg-transparent opacity-0 shadow-none" />
      ))}
      <div className="flex items-center gap-2">
        <SymbolKindBadge kind={isImportNode ? 'import' : data.symbolNode.kind} />
        {data.symbolNode.isExported ? <span className="ml-auto text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--symbol-node-accent)]">export</span> : null}
      </div>
      {isImportNode ? <div className="mt-2 text-[11px] text-muted break-all">{modulePath}</div> : null}
      <div className={isImportNode ? 'mt-2 text-[14px] font-bold text-text break-words' : 'mt-[10px] text-[14px] font-bold text-text break-words'}>{data.label}</div>
      {data.symbolNode.signature ? <div className="mt-1 font-mono text-[11px] leading-5 text-muted whitespace-normal break-words">{data.symbolNode.signature}</div> : null}
      {data.symbolNode.typeAnnotation ? <div className="mt-1 font-mono text-[11px] text-muted">{data.symbolNode.typeAnnotation}</div> : null}
      {isImportNode ? <div className="mt-1.5 text-[11px] font-semibold lowercase text-[var(--gae-color-symbol-imp)]">{importKind}</div> : null}
      <div className="mt-1 text-[12px] text-muted">{data.lineRange}</div>
      {attributes.length > 0 ? (
        <section className="symbol-node-section mt-2 border-t border-line pt-2">
          {attributes.map((member) => (
            <div key={`${member.memberKind}-${member.name}`} className="symbol-node-member font-mono text-[10px] text-muted">
              {renderMember(member, false)}
            </div>
          ))}
        </section>
      ) : null}
      {operations.length > 0 ? (
        <section className="symbol-node-section mt-2 border-t border-line pt-2">
          {operations.map((member) => (
            <div
              key={`${member.memberKind}-${member.name}`}
              className={['symbol-node-member font-mono text-[10px] text-muted', member.isAbstract ? 'italic' : ''].join(' ')}
            >
              {renderMember(member, true)}
            </div>
          ))}
        </section>
      ) : null}
      {enumValues.length > 0 ? (
        <section className="symbol-node-section mt-2 border-t border-line pt-2">
          {enumValues.map((value) => (
            <div key={value} className="symbol-node-member font-mono text-[10px] text-muted">{value}</div>
          ))}
        </section>
      ) : null}
      {handlePositions.map(({ face, position }) => (
        <Handle key={`${data.symbolNode.id}-${face}-source`} id={`source-${face}`} type="source" position={position} className="symbol-node-handle h-0 w-0 border-0 bg-transparent opacity-0 shadow-none" />
      ))}
    </div>
  );
};

function renderMember(
  member: NonNullable<SymbolNodeType['data']['symbolNode']['members']>[number],
  isOperation: boolean,
): ReactNode {
  const name = (
    <span className={member.isStatic ? 'symbol-node-member-static' : undefined}>
      {member.name}
      {member.isOptional ? '?' : ''}
    </span>
  );
  if (isOperation) {
    return <>{member.visibility} {name}({member.params ?? ''}){member.type ? `: ${member.type}` : ''}</>;
  }

  return <>{member.visibility} {name}{member.type ? `: ${member.type}` : ''}</>;
}
