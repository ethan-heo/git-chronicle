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
| `src/webview/screens/S06_SettingsScreen.tsx` | S06 화면 조합 컴포넌트 |

---

## TypeScript Interfaces

```typescript
type AIProviderName = 'claude' | 'gemini' | 'codex';
type AIProviderButtonState = 'unregistered' | 'registering' | 'active' | 'inactive' | 'error';

interface AIProvider {
  name: AIProviderName;
  label: string;
  installUrl: string;
  checkCommand: string;   // 버전 확인 명령 (예: 'claude --version')
}

interface AIProviderButtonProps {
  provider: AIProvider;
  state: AIProviderButtonState;
  errorMessage?: string;
  onClick: () => void;
}

interface CLIInstallLinkProps {
  url: string;
  label: string;
}
```

---

## AI 제공자 설정

```typescript
// src/extension/aiProviderService.ts

const AI_PROVIDERS: AIProvider[] = [
  {
    name: 'claude',
    label: 'Claude (Anthropic)',
    installUrl: 'https://docs.anthropic.com/claude-code',
    checkCommand: 'claude --version',
  },
  {
    name: 'gemini',
    label: 'Gemini (Google)',
    installUrl: 'https://ai.google.dev/gemini-api/docs',
    checkCommand: 'gemini --version',
  },
  {
    name: 'codex',
    label: 'Codex (OpenAI)',
    installUrl: 'https://platform.openai.com/docs/guides/code',
    checkCommand: 'openai --version',
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
  context.globalState.update('registeredProviders', registeredProviders);
  context.globalState.update('activeAIProvider', activeAIProvider);
}

export function loadProviderState(context: vscode.ExtensionContext): {
  registeredProviders: AIProviderName[];
  activeAIProvider: AIProviderName | null;
} {
  return {
    registeredProviders: context.globalState.get('registeredProviders', []),
    activeAIProvider: context.globalState.get('activeAIProvider', null),
  };
}
```

### 메시지 핸들러

```typescript
case 'checkAIProvider': {
  const { providerName } = message;
  const result = await checkCLIInstalled(providerName);
  panel.webview.postMessage({ command: 'aiProviderChecked', providerName, ...result });
  break;
}

case 'setActiveAIProvider': {
  const { providerName } = message;
  const state = loadProviderState(context);
  // 이미 활성이면 비활성화, 아니면 활성화
  const newActive = state.activeAIProvider === providerName ? null : providerName;
  persistProviderState(context, state.registeredProviders, newActive);
  panel.webview.postMessage({ command: 'activeProviderUpdated', activeAIProvider: newActive });
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
  registeredProviders, activeAIProvider, providerStates, onProviderClick
}) => (
  <section className="ai-provider-section">
    <h3 className="section-title">AI 등록</h3>
    {AI_PROVIDERS.map(provider => (
      <AIProviderButton
        key={provider.name}
        provider={provider}
        state={providerStates[provider.name] ?? 'unregistered'}
        onClick={() => onProviderClick(provider.name)}
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
    window.vscode.postMessage({ command: 'checkAIProvider', providerName });
  } else if (currentState === 'active') {
    // 비활성화
    window.vscode.postMessage({ command: 'setActiveAIProvider', providerName });
  } else if (currentState === 'inactive') {
    // 활성화
    window.vscode.postMessage({ command: 'setActiveAIProvider', providerName });
  }
};

// Extension Host 응답 처리
case 'aiProviderChecked': {
  const { providerName, installed, error } = data;
  if (installed) {
    // 등록 성공 + 자동 활성화
    setProviderStates(prev => ({
      ...prev,
      [providerName]: 'active',
      // 나머지는 inactive로
      ...Object.fromEntries(
        AI_PROVIDERS
          .filter(p => p.name !== providerName)
          .map(p => [p.name, prev[p.name] === 'unregistered' ? 'unregistered' : 'inactive'])
      ),
    }));
  } else {
    setProviderStates(prev => ({ ...prev, [providerName]: 'error' }));
    setProviderErrors(prev => ({ ...prev, [providerName]: error }));
  }
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
