# Component: DependencyEdge

React Flow 캔버스(S05_DependencyCanvasScreen)에서 변경 파일 간 import/require 의존 관계를 나타내는 커스텀 엣지 컴포넌트.

---

## Props

```typescript
import { EdgeProps } from '@xyflow/react';

interface DependencyEdgeData {
  kind: 'import' | 'require';
  highlighted: boolean;
  dimmed: boolean;
}

type DependencyEdgeProps = EdgeProps<DependencyEdgeData>;
```

---

## 렌더링

- 방향: source(의존하는 파일) → target(의존 대상 파일). 화살표 끝에 arrowhead 표시.
- 스타일: SmoothStep 엣지. `require` 관계는 dashed stroke로 표시.
- 연결점: source/target 노드의 상/하/좌/우 핸들 중 현재 위치에서 가장 가까운 면을 선택.
- 색상: 기본은 보조 텍스트 색상, 활성 노드가 의존하는 대상 엣지만 링크 색상으로 강조.
- 레이어링: 하이라이트된 엣지는 비하이라이트 엣지보다 뒤쪽으로 렌더링되어 SVG 상단에 표시된다.
- 감쇠: 노드 호버 중 연결되지 않은 엣지는 낮은 opacity로 뒤로 물러난다.

```tsx
export const DependencyEdge: React.FC<DependencyEdgeProps> = ({
  id, sourceX, sourceY, targetX, targetY,
  markerEnd, data,
}) => {
  const [edgePath] = getSmoothStepPath({ sourceX, sourceY, targetX, targetY, borderRadius: 8 });
  const highlighted = Boolean(data.highlighted);
  const dimmed = Boolean(data.dimmed);

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        className={`dependency-edge dependency-edge-${data.kind}${highlighted ? ' dependency-edge-highlighted' : ''}${dimmed ? ' dependency-edge-dimmed' : ''}`}
      />
      <EdgeLabelRenderer>
        <span className="dependency-edge-label">{data.kind}</span>
      </EdgeLabelRenderer>
    </>
  );
};
```

---

## Business Rules

- 엣지는 **변경 파일 간 의존 관계만** 표시한다. 미변경 파일과의 관계는 엣지 생성 안 함.
- 지원 언어 외 파일(분석 불가)은 엣지의 source 또는 target이 될 수 없다.
- 동일한 source-target 쌍의 중복 엣지는 하나로 합친다.
- 노드를 드래그하면 `DependencyGraph`가 현재 노드 위치를 기준으로 `sourceHandle`/`targetHandle`을 다시 계산한다.

---

## States

| 상태 | 조건 | 시각 표현 |
|------|------|---------|
| `default` | 기본 | 회색 선, 얇은 두께 |
| `highlighted` | 활성 노드의 outgoing dependency | 파란색 강조, 두꺼운 두께, 상단 렌더링 |
| `dimmed` | 연결되지 않은 엣지 + 호버 중 | 낮은 opacity |

---

## Accessibility

- 엣지 자체는 `aria-hidden="true"` (스크린 리더에서 그래픽 요소 제외).
- 의존 관계 정보는 노드의 `aria-label`에 별도로 서술 (미래 개선 사항).

---

## References

- [DependencyGraph.md](./DependencyGraph.md)
- [FileNode.md](./FileNode.md)
- [F04_DependencyCanvas spec.md](../features/F04_dependency_canvas/spec.md)
