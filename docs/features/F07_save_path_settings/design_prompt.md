# Design Prompt: F07_SavePathSettings

> Claude Design 또는 Figma AI에 직접 입력하여 디자인을 생성하는 프롬프트

---

## Product Context

GitRewind VSCode Extension. 설정 화면(S06_SettingsScreen)의 하단 영역. AI 정리 결과물의 저장 경로를 선택·표시·삭제하는 UI.

---

## Design Goal

디렉토리 선택 클릭 영역과 선택된 경로 표시, 경로 삭제 버튼으로 구성된 저장 경로 설정 섹션을 디자인한다. 미설정 시 플레이스홀더, 설정 후 실제 경로 + 삭제 버튼이 표시된다.

---

## Information Architecture

```
SavePathSection
├─ 섹션 제목 "저장 경로"
├─ SavePathSelector [unset] → "경로를 선택하세요" 플레이스홀더
  OR
├─ SavePathSelector [set]
│   └─ SavePathDisplay (경로 텍스트)
└─ SavePathDeleteButton (경로 설정 시만 표시)
```

---

## Component Tree

- `SavePathSection`: 제목 + 선택 영역 + 삭제 버튼
  - `SavePathSelector`: 클릭 가능 영역 (다이얼로그 트리거)
    - `[unset]`: "경로를 선택하세요" 플레이스홀더 텍스트
    - `[set]`: `SavePathDisplay` (경로 텍스트 + 말줄임표)
  - `SavePathDeleteButton`: 경로 삭제 버튼 (경로 설정 시만 표시)

---

## Interactions

| 트리거 | 동작 |
|--------|------|
| `SavePathSelector` 클릭 | VSCode 디렉토리 선택 다이얼로그 열기 |
| 경로 선택 | `SavePathDisplay`에 경로 표시, `SavePathDeleteButton` 표시 |
| `SavePathDeleteButton` 클릭 | 경로 초기화, `unset` 상태 복귀 |

---

## States

### SavePathSection
- `unset`: 플레이스홀더 표시, 삭제 버튼 숨김
- `set`: 경로 표시 + 삭제 버튼

### SavePathSelector
- `unset`: `color.text.disabled` 플레이스홀더, 클릭 가능 영역 점선 테두리
- `set`: 경로 텍스트 표시, `color.text.primary`

---

## Visual Guidance

- `SavePathSelector`: 전체 너비 클릭 영역, 테두리 `var(--vscode-panel-border)`, 라운드 `border.radius.sm` (3px), 패딩 `spacing.sm` (8px)
- `unset` 상태: 점선 테두리 또는 회색 배경, "경로를 선택하세요" + 폴더 아이콘
- `SavePathDisplay`: 긴 경로는 앞부분 생략(`/.../{마지막 폴더명}`) + 호버 시 전체 경로 tooltip
- `SavePathDeleteButton`: 소형 ×(닫기) 버튼 또는 "삭제" 텍스트 버튼 우측 배치
- 섹션 제목: `font.size.sm` + `font.weight.medium`, `color.text.secondary`
- `SavePathSection`은 `AIProviderSection`과 `spacing.xl` (24px) 간격

---

## Responsive Rules

- `SavePathDisplay`는 말줄임표(`...`) 처리, 전체 너비 사용
- `SavePathDeleteButton`은 항상 `SavePathSelector` 옆 또는 하단

---

## Naming Rules (Figma)

```
SavePathSection [unset]
└─ SavePathSelector [unset]

SavePathSection [set]
├─ SavePathSelector [set]
│   └─ SavePathDisplay
└─ SavePathDeleteButton
```

---

## MCP Rules

- `SavePathSection`은 독립 Frame (저장 경로 영역) — Variant Component (unset/set)
- `SavePathSelector`는 재사용 Component (unset/set Variant)
- `SavePathDisplay`는 독립 Component
- Auto Layout: `SavePathSection`은 Vertical

---

## References

- [F07 spec.md](./spec.md)
- [F07 blueprint.md](./blueprint.md)
- [S06 blueprint.md](../../screens/S06_settings/blueprint.md)
