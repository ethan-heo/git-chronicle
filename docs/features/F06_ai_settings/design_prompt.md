# Design Prompt: F06_AISettings

> Claude Design 또는 Figma AI에 직접 입력하여 디자인을 생성하는 프롬프트

---

## Product Context

GitRewind VSCode Extension. 설정 화면(S06_SettingsScreen)의 상단 영역. AI CLI(Claude/Gemini/Codex) 등록·활성화·비활성화 UI.

---

## Design Goal

세 개의 AI CLI 버튼이 세로로 나열되는 AI 등록 섹션을 디자인한다. 각 버튼은 5가지 상태(미등록/등록중/활성/비활성/에러)를 가지며, 에러 시 설치 링크가 하단에 나타난다. 상호 배타적 활성화(라디오 버튼 패턴과 유사)임을 시각적으로 표현한다.

---

## Information Architecture

```
AIProviderSection
├─ 섹션 제목 "AI 등록"
├─ AIProviderButton [Claude]
│   └─ CLIInstallLink (에러 시)
├─ AIProviderButton [Gemini]
│   └─ CLIInstallLink (에러 시)
└─ AIProviderButton [Codex]
    └─ CLIInstallLink (에러 시)
```

---

## Component Tree

- `AIProviderSection`: 제목 + 버튼 3개 세로 배치
  - `AIProviderButton`: Claude/Gemini/Codex 각각
    - Provider 로고/이름
    - 상태 표시 (활성/비활성/로딩 스피너)
    - 에러 메시지 + `CLIInstallLink` (에러 시)

---

## Interactions

| 트리거 | 동작 |
|--------|------|
| 비활성 버튼 클릭 | CLI 버전 확인 → `registering` 상태 |
| 확인 성공 | `active` 상태, 나머지 버튼 `inactive` |
| 확인 실패 | `error` 상태 + `CLIInstallLink` 표시 |
| 활성 버튼 클릭 | `inactive` 상태로 전환 |
| `CLIInstallLink` 클릭 | 외부 브라우저에서 설치 페이지 열기 |

---

## States

### AIProviderButton
- `unregistered`: 미등록 — "등록하기" 레이블, 기본 스타일
- `registering`: CLI 확인 중 — 인라인 로딩 스피너
- `active`: 활성화 — `color.accent.primary` 배경 또는 체크마크 아이콘
- `inactive`: 등록 후 비활성 — 기본 스타일, 회색 텍스트
- `error`: 연동 실패 — 빨간 테두리 + 에러 메시지 + `CLIInstallLink`

---

## Visual Guidance

- `AIProviderButton`: 전체 너비 버튼 (패널 너비 맞춤), 높이 40px 이상
- `active` 상태: 좌측에 체크마크(✓) 또는 강조 배경으로 구분
- `unregistered`와 `inactive` 구분: `inactive`는 체크 없이 회색, `unregistered`는 "등록" 텍스트 포함
- `registering`: 버튼 우측 또는 내부에 소형 스피너
- `error`: 버튼 하단에 인라인 빨간 에러 텍스트 + 파란 링크 텍스트
- Claude 로고: 주황색 원형 아이콘. Gemini: Google 파란 아이콘. Codex: OpenAI 아이콘.
- 섹션 제목: `font.size.sm` + `font.weight.medium`, `color.text.secondary`

---

## Responsive Rules

- 버튼 3개는 항상 세로 배치
- 버튼 레이블은 좁은 너비에서 줄 바꿈 허용

---

## Naming Rules (Figma)

```
AIProviderSection
├─ AIProviderButton [Claude / unregistered]
├─ AIProviderButton [Claude / registering]
├─ AIProviderButton [Claude / active]
├─ AIProviderButton [Claude / inactive]
├─ AIProviderButton [Claude / error]
│   └─ CLIInstallLink
├─ AIProviderButton [Gemini / ...]
└─ AIProviderButton [Codex / ...]
```

---

## MCP Rules

- `AIProviderSection`은 독립 Frame (AI 등록 영역)
- `AIProviderButton`은 재사용 Component (provider × state Variant 조합)
- `CLIInstallLink`는 `AIProviderButton [error]`에 포함된 내부 Component
- Auto Layout: `AIProviderSection`은 Vertical

---

## References

- [F06 spec.md](./spec.md)
- [F06 blueprint.md](./blueprint.md)
- [S06 blueprint.md](../../screens/S06_settings/blueprint.md)
