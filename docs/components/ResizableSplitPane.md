# Component: ResizableSplitPane

`ResizableSplitPane`는 좌우 두 패널 사이에 드래그 가능한 Divider를 제공하는 공용 레이아웃 컨테이너다.

## 역할

- F03 코드 뷰어, F05 AI 요약 뷰어, F10 파일 내부 심볼 캔버스에서 공통으로 사용한다.
- 좌측 패널의 너비를 퍼센트 기반으로 관리한다.
- 드래그 중에는 텍스트 선택을 막고 커서를 `col-resize`로 바꾼다.

## Props

```ts
interface ResizableSplitPaneProps {
  isOpen: boolean;
  defaultLeftPercent?: number;
  minLeftPx?: number;
  minRightPx?: number;
  left: React.ReactNode;
  right: React.ReactNode;
  className?: string;
}
```

## 동작

- `isOpen`이 `false`면 Divider와 우측 패널을 렌더링하지 않는다.
- `isOpen`이 `true`가 되면 좌측 너비를 `defaultLeftPercent`로 초기화한다.
- Divider 드래그는 `mousemove` / `mouseup` 이벤트로 처리한다.
- 좌우 패널 최소 너비는 `minLeftPx`, `minRightPx`로 제한한다.

## 관련 파일

- [`src/webview/shared/components/ResizableSplitPane.tsx`](/Users/ethanheo/Desktop/2026/projects/git-author-explorer/src/webview/shared/components/ResizableSplitPane.tsx)
- [`src/webview/styles.css`](/Users/ethanheo/Desktop/2026/projects/git-author-explorer/src/webview/styles.css)
