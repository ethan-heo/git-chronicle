# Implementation Prompt: F06_AISettings

> Claude Code 또는 Cursor에 직접 입력하여 구현을 생성하는 프롬프트

---

## Technical Context

- **CLI 확인**: Extension Host에서 `child_process.execFile` 또는 `which`로 CLI 버전 확인
- **상호 배타적 활성화**: 한 번에 하나의 `activeAIProvider`만 활성

---

## Files to Create / Modify

| 파일 | 역할 |
|------|------|
| `src/extension/aiProviderService.ts` | CLI 확인 및 등록 로직 |
| `src/webview/features/F06/AIProviderSection.tsx` | AI 등록 섹션 컨테이너 |
| `src/webview/features/F06/AIProviderButton.tsx` | 개별 AI 제공자 버튼 |
| `src/webview/features/F06/CLIInstallLink.tsx` | 설치 링크 컴포넌트 |
| `src/webview/features/F06/providers.ts` | Webview 표시용 AI provider 메타데이터 |
| `src/webview/features/F06/SavePathSection.tsx` | S06 저장 경로 섹션 (F07 UI 포함) |
| `src/webview/features/F06/S06_SettingsScreen.tsx` | S06 화면 조합 컴포넌트 |

---

## TypeScript Interfaces

```typescript
type AIProviderName = 'claude' | 'gemini' | 'codex';
type AIProviderButtonState = 'unregistered' | 'registering' | 'active' | 'inactive' | 'error';

interface AIProviderDefinition {
  name: AIProviderName;
  label: string;
  installUrl: string;
  checkCommand: string;
}

interface WebviewAIProvider {
  name: AIProviderName;
  label: string;
  cli: string;
  installUrl: string;
  brandColor: string;
}

interface AIProviderButtonProps {
  provider: WebviewAIProvider;
  state: AIProviderButtonState;
  errorMessage?: string;
  onToggle: () => void;
  onOpenInstall: (url: string) => void;
}

interface CLIInstallLinkProps {
  url: string;
  label: string;
  ariaLabel: string;
  onOpen: (url: string) => void;
}
```

---

## AI 제공자 설정

```typescript
// src/extension/aiProviderService.ts

const AI_PROVIDERS: AIProviderDefinition[] = [
  {
    name: 'claude',
    label: 'Claude',
    installUrl: 'https://docs.anthropic.com/claude-code',
    checkCommand: 'claude --version',
  },
  {
    name: 'gemini',
    label: 'Gemini',
    installUrl: 'https://github.com/google-gemini/gemini-cli',
    checkCommand: 'gemini --version',
  },
  {
    name: 'codex',
    label: 'Codex',
    installUrl: 'https://github.com/openai/codex',
    checkCommand: 'codex --version',
  },
];
```

---

## Extension Host Implementation

### CLI 확인 함수

```typescript
import { execFile } from 'child_process';
import { promisify } from 'util';
const execFileAsync = promisify(execFile);

export async function checkCLIInstalled(
  providerName: AIProviderName
): Promise<{ installed: boolean; version?: string; error?: string }> {
  const provider = AI_PROVIDERS.find(p => p.name === providerName);
  if (!provider) return { installed: false, error: '알 수 없는 제공자' };

  const [cmd, ...args] = provider.checkCommand.split(' ');
  try {
    const { stdout } = await execFileAsync(cmd, args, { timeout: 5000 });
    return { installed: true, version: stdout.trim() };
  } catch (err: any) {
    return { installed: false, error: err.message };
  }
}
```

### 상태 영속성

```typescript
export function persistProviderState(
  context: vscode.ExtensionContext,
  registeredProviders: AIProviderName[],
  activeAIProvider: AIProviderName | null
): void {
  context.globalState.update('gitRewind.registeredProviders', registeredProviders);
  context.globalState.update('gitRewind.activeAIProvider', activeAIProvider ?? undefined);
}

export function loadProviderState(context: vscode.ExtensionContext): {
  registeredProviders: AIProviderName[];
  activeAIProvider: AIProviderName | null;
} {
  return {
    registeredProviders: context.globalState.get('gitRewind.registeredProviders', []),
    activeAIProvider: context.globalState.get('gitRewind.activeAIProvider', null),
  };
}
```

### 메시지 핸들러

```typescript
case 'REGISTER_AI_PROVIDER': {
  const { name } = message.payload;
  const result = await registerAIProvider(context, name);
  panel.webview.postMessage({ type: 'AI_PROVIDER_REGISTERED', payload: { ...result, providerName: name } });
  break;
}

case 'ACTIVATE_AI_PROVIDER': {
  const { name } = message.payload;
  const result = await setActiveAIProvider(context, name);
  panel.webview.postMessage({ type: 'AI_PROVIDER_STATE_UPDATED', payload: { ...result, providerName: name } });
  break;
}
```

---

## Webview Implementation

### `AIProviderButton.tsx`

```tsx
const STATE_LABELS: Record<AIProviderButtonState, string> = {
  unregistered: '등록하기',
  registering: '확인 중...',
  active: '활성 ✓',
  inactive: '비활성',
  error: '연동 실패',
};

export const AIProviderButton: React.FC<AIProviderButtonProps> = ({
  provider, state, errorMessage, onClick
}) => (
  <div className={`ai-provider-button ai-provider-button--${state}`}>
    <button
      className="provider-main-btn"
      onClick={onClick}
      disabled={state === 'registering'}
      aria-label={`${provider.label} ${STATE_LABELS[state]}`}
    >
      <span className="provider-label">{provider.label}</span>
      <span className="provider-state-label">
        {state === 'registering'
          ? <span className="loading-spinner" aria-hidden="true" />
          : STATE_LABELS[state]
        }
      </span>
    </button>
    {state === 'error' && (
      <div className="provider-error">
        <span className="error-message">{errorMessage}</span>
        <CLIInstallLink url={provider.installUrl} label="설치 방법 보기" />
      </div>
    )}
  </div>
);
```

### `AIProviderSection.tsx`

```tsx
export const AIProviderSection: React.FC<AIProviderSectionProps> = ({
  registeredProviders, activeAIProvider, registeringProvider, providerErrors, onProviderClick
}) => (
  <section className="ai-provider-section">
    <h3 className="section-title">AI 등록</h3>
    {AI_PROVIDERS.map(provider => (
      <AIProviderButton
        key={provider.name}
        provider={provider}
        state={getProviderState(provider.name, registeredProviders, activeAIProvider, registeringProvider, providerErrors)}
        onToggle={() => onProviderClick(provider.name)}
      />
    ))}
  </section>
);
```

### 버튼 클릭 로직 (Webview 상태 관리)

```typescript
const handleProviderClick = (providerName: AIProviderName) => {
  const currentState = providerStates[providerName];

  if (currentState === 'unregistered' || currentState === 'error') {
    // CLI 확인 요청
    setProviderStates(prev => ({ ...prev, [providerName]: 'registering' }));
    postMessage('REGISTER_AI_PROVIDER', { name: providerName });
  } else if (currentState === 'active') {
    // 비활성화
    postMessage('ACTIVATE_AI_PROVIDER', { name: providerName });
  } else if (currentState === 'inactive') {
    // 활성화
    postMessage('ACTIVATE_AI_PROVIDER', { name: providerName });
  }
};

// Extension Host 응답 처리
case 'AI_PROVIDER_REGISTERED': {
  setAISummarySettings({
    savePath: data.payload.savePath,
    registeredProviders: data.payload.registeredProviders,
    activeAIProvider: data.payload.activeAIProvider,
  });
  break;
}

case 'AI_PROVIDER_REGISTRATION_FAILED': {
  setProviderErrors(prev => ({ ...prev, [data.payload.providerName]: data.payload.message }));
  break;
}
```

---

## Business Rules

1. 한 번에 하나의 `activeAIProvider`만 활성 (라디오 패턴)
2. 미등록 → [등록하기] 클릭 → CLI 확인 → 성공 시 `active` (나머지 `inactive`)
3. 실패 시 `error` + `CLIInstallLink` 표시
4. `active` 클릭 → `inactive` 전환 (`activeAIProvider = null`)
5. `inactive` 클릭 → `active` 전환 (기존 active는 `inactive`)
6. 모든 상태 변경은 `ExtensionContext.globalState`에 영속

---

## CSS Variables to Use

```css
.ai-provider-button--active .provider-main-btn {
  border-color: var(--vscode-focusBorder);
  background: var(--vscode-button-background);
  color: var(--vscode-button-foreground);
}
.ai-provider-button--error .provider-main-btn {
  border-color: var(--vscode-inputValidation-errorBorder);
}
.provider-error { color: var(--vscode-inputValidation-errorForeground); }
.ai-provider-button { width: 100%; margin-bottom: 8px; }
```

---

## References

- [F06 spec.md](./spec.md)
- [F06 blueprint.md](./blueprint.md)
- [F07 implementation_prompt.md](../F07_save_path_settings/implementation_prompt.md)
- [project/architecture.md](../../project/architecture.md)
- [project/state_management.md](../../project/state_management.md)
- [core/state_model.md](../../core/state_model.md)
