# Design Prompt: F04_DependencyCanvas

> Claude Design 또는 Figma AI에 직접 입력하여 디자인을 생성하는 프롬프트

---

## Product Context

GitRewind VSCode Extension. 이력 조회 화면(S02)에서 [캔버스 보기]를 클릭하면 진입하는 S05_DependencyCanvasScreen. React Flow 기반 노드-엣지 인터랙티브 그래프.

---

## Design Goal

커밋에서 변경된 파일들을 노드로, 파일 간 의존 관계를 엣지(화살표)로 시각화하는 캔버스 화면을 디자인한다. JS/TS/CJS/ESM은 dependency-cruiser, Python/Go는 텍스트 파싱 기반으로 분석된다. 노드에 호버 시 [코드 보기]/[AI 정리 보기] 버튼이 나타난다. 전체 화면을 캔버스가 채우며, 범례 패널과 줌 컨트롤은 오버레이로 고정 배치된다.

---

## Information Architecture

```
S05_DependencyCanvasScreen
├─ TopHeader ({커밋 메시지} + BackButton + ⚙)
├─ DependencyGraph (전체 캔버스 영역)
│   ├─ FileNode × N (확장자 그룹 기반 배치)
│   │   ├─ FileStatusBadge
│   │   ├─ SavedBadge (조건부)
│   │   └─ FileActionButtons (호버 시)
│   └─ DependencyEdge × M (화살표)
├─ LegendPanel (우측 하단 오버레이)
└─ CanvasControls (우측 상단 오버레이)
```

---

## Component Tree

- `DependencyGraph`: React Flow 캔버스 전체 영역. 줌·패닝·노드 드래그 내장.
  - `FileNode`: 파일 하나를 나타내는 카드형 노드
    - `FileStatusBadge`: A/M/D/R 상태 표시
    - `SavedBadge`: AI 정리 저장본 있을 때
    - `FileActionButtons`: 호버 시 노출 ([코드 보기] [AI 정리 보기])
  - `DependencyEdge`: 방향성 화살표 엣지
- `LegendPanel`: 노드/엣지 의미 설명 패널
- `CanvasControls`: [+] [-] [맞춤] 버튼

---

## Interactions

| 트리거 | 동작 |
|--------|------|
| `FileNode` 호버 | `FileActionButtons` 노출 |
| `FileNode` 드래그 | 노드 위치 이동, 엣지는 현재 위치에서 가장 가까운 면으로 재연결 |
| [코드 보기] 클릭 | S03 코드 뷰어로 전환 |
| [AI 정리 보기] 클릭 | S04 AI 정리 뷰어로 전환 |
| 마우스 휠 (캔버스 위) | 줌 인/아웃 (최소 0.3x, 최대 2.0x) |
| 빈 영역 드래그 | 캔버스 패닝 |
| [맞춤] 버튼 클릭 | 전체 노드 뷰포트 맞춤 |
| BackButton 클릭 | S02로 복귀 |

---

## States

### FileNode
- `default`: 기본 카드 노드 (파일명 + FileStatusBadge)
- `hover`: `FileActionButtons` 노출 + 테두리 강조
- `noAnalysis`: 지원 언어 외 파일 (툴팁 "의존 관계 분석 불가", 엣지 없음)
- `saved`: `SavedBadge` 추가 표시

### DependencyEdge
- `default`: 기본 방향 화살표
- `highlighted`: 연결된 노드 호버 시 색상 강조

### DependencyGraph
- `loading`: `LoadingState` (분석 중)
- `populated`: 노드·엣지 표시
- `empty`: `EmptyState`
- `error`: `ErrorState`

### LegendPanel
- `visible`: 전체 표시
- `minimized`: 좁은 패널에서 최소화

---

## Visual Guidance

- 캔버스 배경: `var(--vscode-editor-background)` + 미세한 점 패턴 (선택적)
- `FileNode` 카드: 테두리 `var(--vscode-panel-border)`, 배경 `var(--vscode-editorWidget-background)`, 모서리 radius `border.radius.md` (6px)
- `FileNode` 크기: 최소 220px × 62px, 최대 520px 폭까지 파일명 길이에 따라 가변
- 긴 파일명은 말줄임 대신 줄바꿈하여 전체 표시
- 같은 확장자 노드는 같은 수직 컬럼에 배치하고 왼쪽 면을 맞춘다
- 다른 확장자 그룹은 수평 방향으로 분리한다
- `DependencyEdge`: 회색 실선 화살표, 연결된 노드 호버 시 `color.accent.primary`
- `DependencyEdge`: source/target 노드의 상/하/좌/우 중 가장 가까운 면에서 시작/종료
- 지원 언어 외 파일 노드: 점선 테두리 또는 회색 스타일로 구분
- `LegendPanel`은 반투명 배경 (`backdrop-filter: blur`)
- `CanvasControls`는 세로 배치 소형 버튼 그룹

---

## Responsive Rules

- 패널 크기 변경 시 React Flow `fitView()` 자동 호출
- `LegendPanel`은 너비 < 350px에서 최소화 상태로 전환

---

## Naming Rules (Figma)

```
S05_DependencyCanvasScreen
├─ TopHeader
├─ DependencyGraph
│   ├─ FileNode [default]
│   ├─ FileNode [hover]
│   ├─ FileNode [noAnalysis]
│   ├─ FileNode [saved]
│   ├─ DependencyEdge [default]
│   └─ DependencyEdge [highlighted]
├─ LegendPanel [visible]
├─ LegendPanel [minimized]
└─ CanvasControls
```

---

## MCP Rules

- `DependencyGraph`는 독립 Frame (전체 캔버스 영역)
- `FileNode`는 재사용 Component (4가지 Variant)
- `LegendPanel`과 `CanvasControls`는 오버레이 Frame (absolute position)
- `FileActionButtons`, `SavedBadge`, `FileStatusBadge`는 전역 Component 참조
- Auto Layout: `FileNode` 내부는 Vertical Auto Layout

---

## References

- [F04 spec.md](./spec.md)
- [F04 blueprint.md](./blueprint.md)
- [design_tokens.md](../../core/design_tokens.md)
- [global_components.md](../../core/global_components.md)
