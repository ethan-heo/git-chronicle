# Release Workflow — GitChronicle

> **버전** v1.0 | **작성일** 2026-06-29 | **상태** 확정

---

## 목적

이 문서는 GitChronicle의 로컬 릴리스 워크플로우를 설명한다.

- `CHANGELOG.md`를 Conventional Commits 히스토리 기반으로 자동 생성한다.
- `pnpm release [patch|minor|major]` 한 명령으로 버전 bump, git commit, tag 생성 후 CHANGELOG 갱신과 커밋까지 완료한다.
- GitHub Actions나 외부 CI 없이 로컬 환경에서 릴리스를 마무리한다.

---

## 사용 도구

| 도구 | 역할 | 선택 이유 |
|------|------|-----------|
| `bumpp` | Semver 버전 bump, commit, tag 생성 | zero-config에 가깝고 인터랙티브 UI를 제공한다. 릴리스 커밋과 태그 생성만 담당한다. |
| `conventional-changelog-cli` | `CHANGELOG.md` 생성 | Conventional Commits 형식을 그대로 파싱해 릴리스 노트를 자동 작성한다. |

> `standard-version`은 사용하지 않는다. 공식적으로 deprecated 상태이기 때문이다.

---

## 반영된 파일

현재 저장소에는 아래 파일들이 릴리스 워크플로우용으로 추가되었다.

```
프로젝트 루트
├── .bumpp.config.mjs
├── CHANGELOG.md
└── package.json
```

---

## 설치 결과

`package.json`에는 다음 devDependencies가 추가되어야 한다.

- `bumpp`
- `conventional-changelog-cli`

설치 후에는 `pnpm-lock.yaml`도 함께 갱신한다.

---

## 설정 파일

### `.bumpp.config.mjs`

프로젝트 루트에 다음 설정을 둔다.

```js
export default {
  commit: 'chore(release): v%s',
  tag: 'v%s',
  push: false,
};
```

#### 옵션 설명

| 옵션 | 값 | 설명 |
|------|----|------|
| `commit` | `chore(release): v%s` | 릴리스 커밋 메시지를 Conventional Commits 형식으로 통일한다. |
| `tag` | `v%s` | `v0.6.0` 같은 형식의 git 태그를 만든다. |
| `push` | `false` | 커밋과 태그를 원격 저장소로 자동 push하지 않는다. |

---

## package.json 스크립트

다음 스크립트를 추가한다.

```json
{
  "scripts": {
    "changelog": "conventional-changelog -p conventionalcommits -n scripts/changelog.config.cjs -u -r 0 > CHANGELOG.md",
    "changelog:release": "conventional-changelog -p conventionalcommits -n scripts/changelog.config.cjs -r 0 > CHANGELOG.md",
    "release": "bumpp && pnpm changelog:release && git add CHANGELOG.md && git diff --cached --quiet || git commit -m \"docs: update CHANGELOG\"",
    "release:patch": "bumpp patch && pnpm changelog:release && git add CHANGELOG.md && git diff --cached --quiet || git commit -m \"docs: update CHANGELOG\"",
    "release:minor": "bumpp minor && pnpm changelog:release && git add CHANGELOG.md && git diff --cached --quiet || git commit -m \"docs: update CHANGELOG\"",
    "release:major": "bumpp major && pnpm changelog:release && git add CHANGELOG.md && git diff --cached --quiet || git commit -m \"docs: update CHANGELOG\""
  }
}
```

#### 스크립트 설명

| 스크립트 | 설명 |
|----------|------|
| `changelog` | 태그되지 않은 최신 커밋까지 포함해 `CHANGELOG.md`를 다시 작성하고, 커밋은 날짜 내림차순으로 정렬한다. 단독 실행 시 최상단은 `Unreleased`가 된다. |
| `changelog:release` | 태그가 생성된 뒤 전체 `CHANGELOG.md`를 다시 생성해 최신 릴리스 섹션을 반영한다. |
| `release` | 인터랙티브 UI로 버전 타입을 선택한 뒤 릴리스를 수행하고, 끝난 뒤 CHANGELOG를 커밋한다. |
| `release:patch` | `0.5.1 → 0.5.2` 같은 patch 릴리스를 수행하고 CHANGELOG 커밋까지 만든다. |
| `release:minor` | `0.5.1 → 0.6.0` 같은 minor 릴리스를 수행하고 CHANGELOG 커밋까지 만든다. |
| `release:major` | `0.5.1 → 1.0.0` 같은 major 릴리스를 수행하고 CHANGELOG 커밋까지 만든다. |

---

## CHANGELOG 초기화

처음 한 번은 전체 커밋 히스토리를 기반으로 `CHANGELOG.md`를 생성해야 한다.

```bash
pnpm conventional-changelog -p conventionalcommits -u -r 0 > CHANGELOG.md
git add CHANGELOG.md
git commit -m "docs: add CHANGELOG"
```

`-u -r 0` 옵션은 마지막 태그 이후의 릴리스 히스토리와 태그되지 않은 최신 커밋을 함께 반영한다. `scripts/changelog.config.cjs`는 커밋 정렬을 날짜 내림차순으로 고정한다.

릴리즈가 끝난 뒤 새 태그를 기준으로 `pnpm changelog:release`를 실행하면 전체 `CHANGELOG.md`가 다시 생성되고 최신 릴리스 섹션이 반영된다. `git diff --cached --quiet` 검사를 함께 두어 변경이 없으면 체인지로그 커밋을 생략한다. 그래서 `pnpm changelog`는 미리보기용, `pnpm release`는 릴리스 후 체인지로그 반영까지 포함하는 명령으로 역할이 나뉜다.

이후부터는 `pnpm release` 명령이 CHANGELOG를 자동으로 증분 갱신한다.

---

## 릴리스 절차

### 기본 흐름

```bash
pnpm release:patch
# 또는
pnpm release
```

릴리스는 아래 순서로 진행된다.

1. `package.json` 버전을 새 버전으로 변경한다.
2. `git commit -m "chore(release): v0.5.2"`로 릴리스 커밋을 만든다.
3. `git tag v0.5.2`를 생성한다.
4. `pnpm changelog:release`를 실행해 전체 `CHANGELOG.md`를 다시 생성한다.
5. `git add CHANGELOG.md` 후 변경이 있을 때만 `git commit -m "docs: update CHANGELOG"`로 체인지로그 커밋을 만든다.

### 릴리스 후 원격 반영

`push: false`이므로 원격 반영은 수동으로 수행한다.

```bash
git push && git push --tags
```

---

## CHANGELOG 생성 규칙

`conventionalcommits` 프리셋 기준으로 섹션이 자동 생성된다.

| 커밋 타입 | CHANGELOG 섹션 |
|-----------|---------------|
| `feat` | `### Features` |
| `fix` | `### Bug Fixes` |
| `refactor` | `### Code Refactoring` |
| `docs` | `### Documentation` |
| `BREAKING CHANGE` | `### ⚠ BREAKING CHANGES` |
| `chore`, `test` | 섹션 없음 |

---

## 검증

실제 버전 변경 없이 bumpp 동작을 미리 확인할 수 있다.

```bash
pnpm bumpp --dry-run patch
```

예상 출력의 핵심은 다음과 같다.

- 현재 버전
- 새 버전
- 생성될 commit 메시지
- 생성될 tag

---

## 주의사항

- 첫 태그가 필요하다.
  - `conventional-changelog`는 마지막 태그 이후 커밋을 기준으로 changelog를 만든다.
  - 태그가 없으면 전체 히스토리가 하나의 덩어리로 잡힌다.
  - 초기 설정 시 현재 버전에 맞는 태그를 먼저 두는 것이 좋다.
  - 예: `git tag v0.5.1 <이전 커밋 해시>`
- 릴리스 커밋은 `chore(release):` 형식을 사용한다.
  - 다음 CHANGELOG 생성 시 숨겨지는 타입이므로 릴리스 커밋이 다음 릴리스 노트에 섞이지 않는다.
- 자동 push는 하지 않는다.
  - 릴리스 내용을 검토한 뒤 수동으로 push한다.

---

## 기존 수동 방식과 비교

### Before

```bash
# package.json 버전을 직접 수정
# CHANGELOG 없음
git add package.json
git commit -m "chore: bump version to 0.5.2"
git tag v0.5.2
```

### After

```bash
pnpm release:patch
# 또는
pnpm release
```

---

## 관련 문서

- [development_environment.md](./development_environment.md)
- [coding_standards.md](./coding_standards.md)
- [Conventional Commits 1.0.0](https://www.conventionalcommits.org/ko/v1.0.0/)
