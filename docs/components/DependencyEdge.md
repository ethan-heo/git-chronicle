# Component: DependencyEdge

React Flow 캔버스(S05_DependencyCanvasScreen)에서 변경 파일 간 import/require 의존 관계를 나타내는 커스텀 엣지 컴포넌트.

---

## Props

```typescript
import { EdgeProps } from '@xyflow/react';

interface DependencyEdgeData {
  // 의존 관계 타입 (미래 확장용)
  dependencyType?: 'import' | 'require' | 'dynamic';
}

type DependencyEdgeProps = EdgeProps<DependencyEdgeData>;
```

---

## 렌더링

- 방향: source(의존하는 파일) → target(의존 대상 파일). 화살표 끝에 arrowhead 표시.
- 스타일: 직선 또는 베지어 곡선 (`smoothstep` 타입).
- 색상: `var(--vscode-charts-lines)` 기본. 선택 시 `var(--vscode-focusBorder)`.

```tsx
export const DependencyEdge: React.FC<DependencyEdgeProps> = ({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition, selected,
}) => {
  const [edgePath] = getSmoothStepPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });

  return (
    <g>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: selected ? 'var(--vscode-focusBorder)' : 'var(--vscode-charts-lines)',
          strokeWidth: selected ? 2 : 1,
        }}
      />
      <EdgeLabelRenderer>
        {/* 레이블 없음 (현재 설계) */}
      </EdgeLabelRenderer>
    </g>
  );
};
```

---

## Business Rules

- 엣지는 **변경 파일 간 의존 관계만** 표시한다. 미변경 파일과의 관계는 엣지 생성 안 함.
- JS/TS 외 파일(분석 불가)은 엣지의 source 또는 target이 될 수 없다.
- 동일한 source-target 쌍의 중복 엣지는 하나로 합친다.

---

## States

| 상태 | 조건 | 시각 표현 |
|------|------|---------|
| `default` | 기본 | 회색 선, 얇은 두께 |
| `selected` | 연결된 노드 선택 또는 엣지 클릭 | 파란색 강조, 두꺼운 두께 |

---

## Accessibility

- 엣지 자체는 `aria-hidden="true"` (스크린 리더에서 그래픽 요소 제외).
- 의존 관계 정보는 노드의 `aria-label`에 별도로 서술 (미래 개선 사항).

---

## References

- [DependencyGraph.md](./DependencyGraph.md)
- [FileNode.md](./FileNode.md)
- [F04_DependencyCanvas spec.md](../features/F04_dependency_canvas/spec.md)
