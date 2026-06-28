# Component: SymbolLegendPanel

심볼 종류(노드 색상 배지)와 엣지 관계 종류의 의미를 설명하는 범례 패널. S08 우측 하단에 오버레이로 고정 배치된다. F10 전용.

---

## Props

```typescript
interface SymbolLegendPanelProps {
  isMinimized?: boolean;  // 기본값: false
}
```

---

## Usage

- `S08_IntraFileSymbolDependencyCanvasScreen` 우측 하단 오버레이에서만 사용

---

## Content

### 노드 종류 (SymbolKindBadge 참조)

| 배지 | 의미 |
|------|------|
| `fn` | 함수 (function) |
| `cls` | 클래스 (class) |
| `ifc` | 인터페이스 (interface) |
| `typ` | 타입 (type alias) |
| `cst` | 상수 (constant) |
| `var` | 변수 (variable) |
| `enm` | 열거형 (enum) |

### 엣지 종류

| 선 스타일 | 의미 |
|-----------|------|
| 실선 화살표 (파란색) | calls — 함수 호출 |
| 점선 화살표 (회색) | uses — 참조 |
| 굵은 실선 (초록색) | extends — 상속 |
| 굵은 점선 (보라색) | implements — 구현 |

---

## States

| 상태 | 조건 | UI |
|------|------|----|
| `visible` | 기본 | 노드·엣지 범례 전체 표시 |
| `minimized` | 너비 < 350px 또는 `isMinimized` | 아이콘만 표시 |

---

## Accessibility

- `aria-label="심볼 그래프 범례"`
- `role="complementary"`

---

## References

- [F10 blueprint.md](../features/F10_intra_file_symbol_dependency_canvas/blueprint.md)
- [DependencyGraph.md](DependencyGraph.md) (LegendPanel 구조 참고)
