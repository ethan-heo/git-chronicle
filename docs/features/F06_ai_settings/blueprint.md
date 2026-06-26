# Feature Blueprint: F06_AISettings

## Related Spec

- [Spec (기능 요구사항)](./spec.md)

---

## Purpose

Claude/Gemini/Codex CLI의 등록·활성화·비활성화를 관리하는 UI를 제공한다.

---

## Inputs

- `registeredProviders: AIProvider[]` — 전역 상태
- `activeAIProvider: AIProviderName | null` — 전역 상태

---

## Outputs

- `registeredProviders` 업데이트
- `activeAIProvider` 업데이트

---

## Components

- `AIProviderSection`
- `AIProviderButton`
- `CLIInstallLink`

---

## Component Definitions

### Component: AIProviderSection

#### Purpose
AI 등록 영역 전체를 묶는 섹션. 제목과 세 개의 `AIProviderButton`을 포함한다.

#### Data
- `registeredProviders: AIProvider[]`
- `activeAIProvider: AIProviderName | null`

#### Props
```typescript
interface AIProviderSectionProps {
  registeredProviders: AIProvider[];
  activeAIProvider: AIProviderName | null;
  onToggle: (provider: AIProviderName) => void;
}
```

#### Interaction
없음 (하위 컴포넌트가 처리)

#### States
없음

#### Accessibility
- `role="group"`, `aria-label="AI 등록"`

#### Reusability
F06_AISettings 전용. S06_SettingsScreen에서만 사용.

---

### Component: AIProviderButton

#### Purpose
개별 AI CLI(Claude, Gemini, Codex)의 등록·활성화·비활성화 버튼.

#### Data
- `provider: AIProvider`

#### Props
```typescript
interface AIProviderButtonProps {
  provider: AIProvider;
  onToggle: (name: AIProviderName) => void;
}
```

#### Interaction
- **비활성화 상태에서 클릭**: `{cli} --version` 실행 → 성공 시 활성화, 실패 시 인라인 에러 표시
- **활성화 상태에서 클릭**: 비활성화
- 하나가 활성화되면 나머지 버튼은 자동으로 비활성화

#### States
- `unregistered`: 미등록 (등록 시도 가능)
- `registering`: CLI 버전 확인 중 (로딩 스피너)
- `active`: 활성화 상태 (선택된 AI)
- `inactive`: 등록되었으나 비활성화
- `error`: CLI 연동 실패

#### Accessibility
- `aria-label="{provider명} 활성화"` / `"{provider명} 비활성화"`
- `aria-pressed` — 토글 상태 표현

#### Reusability
F06_AISettings 전용. AIProviderSection 내에서만 사용 (Claude/Gemini/Codex 3개 인스턴스). → 상세 문서: [components/AIProviderButton.md](../../components/AIProviderButton.md)

---

### Component: CLIInstallLink

#### Purpose
CLI가 설치되어 있지 않을 때 설치 페이지로 이동하는 링크를 표시한다.

#### Data
- `provider: AIProviderName`
- `installUrl: string`

#### Props
```typescript
interface CLIInstallLinkProps {
  provider: AIProviderName;
  installUrl: string;
}
```

#### Interaction
- 클릭 시 외부 브라우저에서 설치 페이지 열기

#### States
- `visible` (CLI 미설치 에러 시만 표시)

#### Accessibility
- `role="link"`, `aria-label="{provider명} 설치 페이지 열기"`, `target="_blank"` + `rel="noopener"`

#### Reusability
F06_AISettings 전용. AIProviderButton의 error 상태에서만 조건부 표시.

---

## Component Tree

```
F06_AISettings
└─ AIProviderSection
    ├─ AIProviderButton [Claude]
    │   └─ CLIInstallLink (에러 시)
    ├─ AIProviderButton [Gemini]
    │   └─ CLIInstallLink (에러 시)
    └─ AIProviderButton [Codex]
        └─ CLIInstallLink (에러 시)
```

---

## Variants

### AIProviderButton
- `unregistered`: 미등록 상태
- `registering`: CLI 확인 중 (로딩 스피너)
- `active`: 활성화 (선택된 AI)
- `inactive`: 등록 후 비활성화
- `error`: CLI 연동 실패 + `CLIInstallLink` 표시

---

## Layout Rules

```
S06_SettingsScreen
├─ TopHeader
├─ AIProviderSection (AI 등록 영역)
│   ├─ AIProviderButton [Claude] — active/inactive/unregistered/error
│   │   └─ CLIInstallLink (조건부)
│   ├─ AIProviderButton [Gemini]
│   │   └─ CLIInstallLink (조건부)
│   └─ AIProviderButton [Codex]
│       └─ CLIInstallLink (조건부)
└─ SavePathSection (F07 담당)
```

---

## Interaction Model

| 인터랙션 | 트리거 | 결과 |
|---------|--------|------|
| CLI 등록 시도 | 비활성 버튼 클릭 | `registering` 상태 → CLI 버전 확인 |
| 등록 성공 | exit code 0 | `active` 상태 전환, 나머지 버튼 `inactive` |
| 등록 실패 | exit code 비정상 | `error` 상태 + `CLIInstallLink` 표시 |
| 비활성화 | 활성 버튼 클릭 | `inactive` 상태 전환 |

---

## State Model

| 상태 | 조건 | UI |
|------|------|-----|
| `unregistered` | `!provider.isRegistered` | 기본 등록 버튼 |
| `registering` | CLI 버전 확인 중 | 로딩 스피너 |
| `active` | `provider.isActive === true` | 활성화 스타일 |
| `inactive` | `provider.isRegistered && !provider.isActive` | 비활성 스타일 |
| `error` | 연동 실패 | 에러 메시지 + `CLIInstallLink` |

---

## Empty States

없음

---

## Error States

- **CLI 미설치:** 버튼 하단 인라인 에러 메시지 + `CLIInstallLink`
- **연동 실패:** 버튼 하단 인라인 에러 메시지

---

## Loading States

| 상태 | 컴포넌트 | 위치 |
|------|---------|------|
| CLI 버전 확인 중 | `AIProviderButton [registering]` 내 인라인 스피너 | 버튼 내부 |

---

## Responsive Rules

- `AIProviderButton` 세 개는 세로 방향으로 쌓아 표시 (좁은 패널 대응)

---

## Reusable Components

- [`TopHeader`](../../core/global_components.md#topheader)
- [`BackButton`](../../core/global_components.md#backbutton)

---

## MCP Optimization Rules

- `AIProviderSection`은 독립 Frame으로 분리 (AI 등록 영역)
- `AIProviderButton`은 재사용 Component로 등록 (5가지 Variant: unregistered/registering/active/inactive/error)
- `CLIInstallLink`는 조건부 Component — error Variant에 포함
- Auto Layout: `AIProviderSection`은 Vertical (버튼 3개 세로 배치)
- 버튼 3개는 동일 Component의 인스턴스 (provider prop만 다름)

---

## Figma Naming Rules

```
AIProviderSection
├─ AIProviderButton [unregistered]
├─ AIProviderButton [registering]
├─ AIProviderButton [active]
├─ AIProviderButton [inactive]
├─ AIProviderButton [error]
│   └─ CLIInstallLink
```
