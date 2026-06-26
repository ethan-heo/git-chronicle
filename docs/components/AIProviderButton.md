# Component: AIProviderButton

S06_SettingsScreen의 AI 설정 패널에서 Claude CLI / Gemini CLI / Codex CLI 각각의 등록·활성화·비활성화 상태를 표시하고 조작하는 버튼 컴포넌트.

---

## Props

```typescript
interface AIProviderButtonProps {
  providerName: AIProviderName;    // 'claude' | 'gemini' | 'codex'
  displayName: string;             // "Claude CLI" | "Gemini CLI" | "Codex CLI"
  isRegistered: boolean;           // CLI가 감지되어 등록된 상태
  isActive: boolean;               // 현재 활성화된 프로바이더 여부
  onRegister: () => void;          // [등록] 또는 [감지 확인] 버튼 클릭
  onActivate: () => void;          // [활성화] 버튼 클릭
  onDeactivate: () => void;        // [비활성화] 버튼 클릭
  installUrl: string;              // CLI 미감지 시 설치 링크 URL
}
```

---

## States & 렌더링 분기

| 상태 | 조건 | 표시 |
|------|------|------|
| `not-registered` | `isRegistered = false` | CLI 이름 + "감지되지 않음" + [등록 확인] 버튼 + 설치 링크 |
| `registered-inactive` | `isRegistered = true`, `isActive = false` | CLI 이름 + "등록됨" 뱃지 + [활성화] 버튼 |
| `registered-active` | `isRegistered = true`, `isActive = true` | CLI 이름 + "활성화됨" 뱃지 (강조) + [비활성화] 버튼 |

---

## 렌더링 구조

```
AIProviderButton
├── [not-registered]
│   ├── 아이콘 + displayName
│   ├── "CLI가 감지되지 않습니다" 텍스트
│   ├── [등록 확인] PrimaryButton  → {cli} --version 실행
│   └── "설치 페이지 확인" 링크 (installUrl)
├── [registered-inactive]
│   ├── 아이콘 + displayName
│   ├── "등록됨" Badge
│   └── [활성화] PrimaryButton
└── [registered-active]
    ├── 아이콘 + displayName
    ├── "활성화됨" Badge (강조색)
    └── [비활성화] Button
```

---

## Business Rules

- [등록 확인] 클릭: Extension Host에 `REGISTER_AI_PROVIDER` 메시지 전송 → `{cli} --version` 실행 → exit code 0이면 등록.
- CLI 미설치 시: "CLI가 감지되지 않습니다. 설치 페이지를 확인하세요" + 설치 링크 표시.
- [활성화] 클릭: 해당 프로바이더를 활성화. 기존 활성 프로바이더는 자동 비활성화.
- 한 번에 하나의 프로바이더만 활성화 가능.

---

## CSS

```css
.ai-provider-button {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 1px solid var(--vscode-panel-border);
  border-radius: 6px;
  background: var(--vscode-editor-background);
}
.ai-provider-button.active {
  border-color: var(--vscode-focusBorder);
  background: var(--vscode-list-activeSelectionBackground);
}
.ai-provider-install-link {
  font-size: 11px;
  color: var(--vscode-textLink-foreground);
  text-decoration: underline;
  cursor: pointer;
}
```

---

## Accessibility

- 전체 컴포넌트: `role="group"`, `aria-label="{displayName} 설정"`.
- [등록 확인] 버튼: `aria-label="{displayName} CLI 감지 확인"`.
- [활성화] 버튼: `aria-label="{displayName} 활성화"`.
- [비활성화] 버튼: `aria-label="{displayName} 비활성화"`.
- 설치 링크: `target="_blank"`, `aria-label="{displayName} 설치 페이지 열기"`.

---

## References

- [F06_AISettings spec.md](../features/F06_ai_settings/spec.md)
- [S06_SettingsScreen blueprint.md](../screens/S06_settings/blueprint.md)
- [PrimaryButton.md](./PrimaryButton.md)
