# Screen Blueprint: S07_CodeAndAISummaryScreen

## Purpose

코드 뷰어(S03)와 AI 요약 뷰어(S04)를 하나의 화면에서 좌우 분할로 동시에 보여준다.

---

## Layout

```
S07_CodeAndAISummaryScreen
├─ TopHeader ({커밋 메시지} · 분할 보기)
│  └─ 우측 액션: 설정 버튼
└─ split-view-panels
   ├─ Left panel: DiffViewer
   └─ Right panel: TokenLimitWarning + AISummaryViewer
```

---

## Rules

- 좌우 패널은 각각 독립적으로 스크롤한다.
- 두 패널은 50:50 비율로 배치한다.
- 패널 사이에는 구분선을 표시한다.
- 뒤로가기는 진입 전 화면(S03 또는 S04)으로 복귀한다.
- S07 자체에는 분할 전환 버튼이 없다.

---

## References

- [S03_code_viewer/blueprint.md](../S03_code_viewer/blueprint.md)
- [S05_ai_summary_viewer/blueprint.md](../S05_ai_summary_viewer/blueprint.md)
