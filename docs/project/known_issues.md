# Known Issues — GitChronicle

> 문서·코드 상의 알려진 불일치나 미해결 이슈를 기록한다. 해결되면 해당 항목을 제거한다.

---

## 화면 ID와 디렉토리명 불일치

`screens/` 하위 일부 디렉토리명이 실제 화면 ID와 어긋나 있다.

| 디렉토리 | 실제 화면 ID |
|---|---|
| `screens/S04_dependency_canvas/` | S05 (의존성 캔버스) |
| `screens/S05_ai_summary_viewer/` | S04 (AI 요약 뷰어) |

다른 문서에서 화면을 참조할 때는 디렉토리명이 아니라 각 `blueprint.md` 상단의 화면 ID(`# Screen: S0X_...`)를 기준으로 삼는다.

---

## AI 모델 선택 저장 키의 제품명 불일치

`GitRewind` → `GitChronicle` 리네이밍 당시 일부 워크스페이스 저장 키가 누락되어 여전히 `gitRewind.*` 접두사를 쓴다.

`src/extension/aiProviderService.ts`:

| 상수 | 실제 키 |
|---|---|
| `REGISTERED_PROVIDERS_KEY` | `gitChronicle.registeredProviders` |
| `ACTIVE_PROVIDER_KEY` | `gitChronicle.activeAIProvider` |
| `SAVE_PATH_KEY` | `gitChronicle.savePath` |
| `SUMMARY_MODEL_KEY` | `gitRewind.summaryModelPerProvider` |
| `QA_MODEL_KEY` | `gitRewind.qaModelPerProvider` |

`docs/project/state_management.md`의 ExtensionContext Memento 표는 이 실제 코드를 그대로 반영한 것이며 문서 오류가 아니다. 키를 `gitChronicle.*`로 통일하려면 기존 사용자의 워크스페이스에 저장된 모델 선택값이 새 키로 마이그레이션되지 않고 초기화된다는 점을 감안해 별도로 처리해야 한다.

---
