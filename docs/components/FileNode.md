# Component: FileNode

React Flow 캔버스(S05_DependencyCanvasScreen)에서 변경 파일 하나를 나타내는 커스텀 노드 컴포넌트.

---

## Props

```typescript
// React Flow 커스텀 노드이므로 NodeProps<FileNodeData>를 사용
import { NodeProps } from '@xyflow/react';

interface FileNodeData {
  file: ChangedFile;
  label: string;               // 파일명만 (경로 제외)
  directory: string;            // 상위 경로
  canAnalyze: boolean;          // false이면 "분석 불가" 표시
  hasSavedSummary: boolean;
  onCodeView: (file: ChangedFile) => void;
  onAISummary: (file: ChangedFile) => void;
}

type FileNodeProps = NodeProps<FileNodeData>;
```

---

## 렌더링 구조

```
FileNode (React Flow NodeWrapper)
├── Handle × 4 (target - top/right/bottom/left)
├── FileStatusBadge  (A/M/D/R)
├── 파일명 텍스트
├── SavedBadge (hasSavedSummary = true 시)
├── [분석 불가] 툴팁 (지원 언어 외 파일 시)
└── FileActionButtons (호버 시만 표시)
    ├── [코드 보기]
    └── [AI 정리 보기]
└── Handle × 4 (source - top/right/bottom/left)
```

---

## States

| 상태 | 조건 | 시각 표현 |
|------|------|---------|
| `default` | 기본 | 일반 노드 배경 |
| `hover` | 마우스 오버 | `FileActionButtons` 표시, 배경 밝아짐 |
| `selected` | 노드 클릭 | `hover`와 같은 강조 유지, 액션 버튼 항상 표시 |
| `no-analysis` | `canAnalyze = false` | 점선 테두리, 툴팁 "의존 관계 분석 불가" |
| `deleted` | `file.status = "D"` | 파일명 취소선 |

---

## CSS

```css
.dependency-file-node {
  box-sizing: border-box;
  width: 100%;
  min-height: 62px;
  position: relative;
}
.dependency-file-node-name {
  font-size: 12px;
  line-height: 1.35;
  overflow-wrap: anywhere;
  white-space: normal;
}
.dependency-file-node-actions {
  z-index: 10;
}
```

## Interaction

- 노드 본문은 React Flow `nodesDraggable`에 의해 드래그 이동 가능하다.
- `FileActionButtons` 영역은 `nodrag nopan`으로 지정해 버튼 클릭이 노드 드래그와 충돌하지 않도록 한다.
- 상/하/좌/우 source/target 핸들은 엣지 연결 계산용이며 화면에서는 투명하게 처리한다.
- 클릭으로 선택된 노드는 마우스가 벗어나도 강조 상태를 유지하며, 다른 노드 호버 시에는 호버 노드 기준 엣지 강조가 추가로 반영된다.

---

## Accessibility

- `aria-label="{파일명} 노드. 상태: {status 레이블}"`.
- `canAnalyze = false` 시 `title="의존 관계 분석 불가 (지원 언어 외 파일)"` 툴팁.
- `[코드 보기]` 버튼: `aria-label="{파일명} 코드 보기"`.
- `[AI 정리 보기]` 버튼: `aria-label="{파일명} AI 정리 보기"`.

---

## References

- [DependencyGraph.md](./DependencyGraph.md)
- [F04_DependencyCanvas spec.md](../features/F04_dependency_canvas/spec.md)
- [FileStatusBadge.md](./FileStatusBadge.md)
- [SavedBadge.md](./SavedBadge.md)
- [FileActionButtons.md](./FileActionButtons.md)
