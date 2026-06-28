# SymbolCodePanel

S08 화면 우측에 슬라이드 인되는 코드 패널입니다. 파일명과 닫기 버튼을 제공하고, 내부에 `SymbolFileCodeViewer`를 포함합니다.

## Props

```typescript
interface SymbolCodePanelProps {
  isOpen: boolean;
  filePath: string;
  fileContent: string;
  language: string;
  highlightRange: { start: number; end: number } | null;
  scrollToRange: { start: number; end: number } | null;
  scrollRequestId: number;
  onClose: () => void;
}
```

## 동작

- `isOpen === true`일 때 우측에서 표시됩니다.
- 닫기 버튼을 누르면 `onClose()`가 호출됩니다.
- `highlightRange`는 호버된 심볼의 라인 범위를 강조합니다.
- 클릭으로 활성화된 심볼의 라인 범위를 우선 강조합니다.
- `scrollToRange`와 `scrollRequestId`는 클릭한 심볼의 라인 범위로 스크롤을 트리거합니다.
- 호버는 스크롤을 유발하지 않습니다.

## 사용 위치

- `S08_IntraFileSymbolDependencyCanvasScreen`
