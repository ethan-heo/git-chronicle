# Component: SplitViewButton

코드 뷰어(S03)와 AI 요약 뷰어(S04)의 우측 상단에서 인라인 분할 패널을 열고 닫는 아이콘 버튼.

---

## Props

```typescript
interface SplitViewButtonProps {
  label: string;
  disabled?: boolean;
  onClick: () => void;
}
```

---

## Behavior

- `TopHeader`의 우측 액션 슬롯(`endSlot`) 안에 배치한다.
- `selectedFile`이 없거나 커밋 전체 요약 모드처럼 진입 조건이 맞지 않으면 비활성화한다.
- 열려 있을 때는 동일 버튼으로 패널을 닫는 토글 동작을 수행한다.
- 아이콘은 좌우 2분할 레이아웃을 표현하는 SVG를 사용한다.
- `title`과 `aria-label`은 동일한 설명 텍스트를 사용한다.

---

## Usage

- S03: `AI 요약 함께 보기` / `패널 닫기`
- S04: `코드 함께 보기` / `패널 닫기`

---

## References

- [TopHeader.md](./TopHeader.md)
- [F03_code_viewer](../features/F03_code_viewer/spec.md)
- [F05_ai_summary_file](../features/F05_ai_summary_file/spec.md)
