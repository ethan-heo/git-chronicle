# SymbolFileCodeViewer

파일 본문을 Shiki로 하이라이트해서 보여주는 코드 뷰어입니다. 코드 패널 내부에서 라인 번호와 라인 강조를 함께 렌더링합니다.

## Props

```typescript
interface SymbolFileCodeViewerProps {
  fileContent: string;
  language: string;
  highlightRange: { start: number; end: number } | null;
  scrollToRange: { start: number; end: number } | null;
  scrollRequestId: number;
}
```

## 동작

- 파일 내용을 라인 단위로 렌더링합니다.
- `highlightRange`가 있으면 해당 범위의 배경을 강조합니다.
- 클릭으로 활성화된 노드 범위를 우선 강조합니다.
- `scrollToRange`와 `scrollRequestId`가 바뀌면 해당 라인으로 스크롤합니다.
- 호버는 스크롤을 유발하지 않습니다.
- 확장자에 따라 Shiki 언어를 추론합니다.

## 사용 위치

- `SymbolCodePanel`
