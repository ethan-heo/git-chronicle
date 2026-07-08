#!/usr/bin/env node
// docs/가 소스 코드와 어긋나지 않았는지 기계적으로 검증한다.
// 실패 시 exit code 1 → pre-commit 훅에서 커밋을 차단한다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let hasError = false;

function fail(message) {
  console.error(`✖ ${message}`);
  hasError = true;
}

function walkMarkdownFiles(dir, list = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkMarkdownFiles(full, list);
    else if (entry.name.endsWith('.md')) list.push(full);
  }
  return list;
}

function extractAll(content, pattern) {
  const set = new Set();
  const re = new RegExp(pattern, 'g');
  let match;
  while ((match = re.exec(content))) set.add(match[1]);
  return set;
}

// 1) docs/ 내부 상대 링크가 실제 파일을 가리키는지 확인
function checkDocLinks() {
  const files = walkMarkdownFiles(path.join(ROOT, 'docs'));
  const linkPattern = /\]\(([^)]+)\)/g;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    let match;
    while ((match = linkPattern.exec(content))) {
      const target = match[1];
      if (/^https?:\/\//.test(target) || target.startsWith('#')) continue;
      if (!target.includes('.md')) continue;

      const [relPath] = target.split('#');
      const resolved = path.resolve(path.dirname(file), relPath);
      if (!fs.existsSync(resolved)) {
        fail(`${path.relative(ROOT, file)}: 존재하지 않는 링크 대상 "${target}"`);
      }
    }
  }
}

// 2) Extension ↔ Webview 메시지 타입이 architecture.md와 어긋나지 않는지 확인
function checkMessageTypes() {
  const handlerPath = path.join(ROOT, 'src/extension/messageHandler.ts');
  const handlerDir = path.join(ROOT, 'src/extension/messageHandler');
  const archPath = path.join(ROOT, 'docs/project/architecture.md');
  const handlerFiles = [
    handlerPath,
    ...fs
      .readdirSync(handlerDir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.ts'))
      .map((entry) => path.join(handlerDir, entry.name)),
  ];
  const handlerContent = handlerFiles.map((file) => fs.readFileSync(file, 'utf8')).join('\n');
  const archContent = fs.readFileSync(archPath, 'utf8');

  // `type:`에 즉시 이어지지 않는 3항 연산자 형태(`type: cond ? 'A' : 'B'`)도 잡기 위해
  // ALL_CAPS_SNAKE 패턴의 문자열 리터럴을 파일 전체에서 넓게 추출한다.
  const codeTypes = extractAll(handlerContent, "'([A-Z][A-Z0-9_]*)'");

  const protocolBlockMatch = archContent.match(
    /Extension ↔ Webview 메시지 프로토콜[\s\S]*?```typescript([\s\S]*?)```/,
  );
  if (!protocolBlockMatch) {
    fail('architecture.md에서 "Extension ↔ Webview 메시지 프로토콜" 코드 블록을 찾을 수 없습니다.');
    return;
  }
  const docTypes = extractAll(protocolBlockMatch[1], "'([A-Z][A-Z0-9_]*)'");

  for (const type of codeTypes) {
    if (!docTypes.has(type)) {
      fail(`architecture.md 메시지 프로토콜에 "${type}"가 없습니다 (src/extension/messageHandler.ts + messageHandler/ 기준).`);
    }
  }
  for (const type of docTypes) {
    if (!codeTypes.has(type)) {
      fail(`architecture.md가 "${type}"를 문서화하고 있지만 src/extension/messageHandler.ts + messageHandler/에는 없습니다 (stale 가능성).`);
    }
  }
}

// 3) Feature ID가 naming_rules.md에 등록돼 있는지 확인
function checkFeatureIds() {
  const featuresDir = path.join(ROOT, 'src/webview/features');
  const namingPath = path.join(ROOT, 'docs/core/naming_rules.md');
  const namingContent = fs.readFileSync(namingPath, 'utf8');

  const codeFeatureIds = fs
    .readdirSync(featuresDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^F\d+/.test(entry.name))
    .map((entry) => entry.name);

  const docFeatureIds = extractAll(namingContent, '\\| (F\\d+\\w*) \\|');

  for (const id of codeFeatureIds) {
    if (!docFeatureIds.has(id)) {
      fail(`naming_rules.md Feature Naming 표에 "${id}"가 없습니다 (src/webview/features/ 기준).`);
    }
  }
}

checkDocLinks();
checkMessageTypes();
checkFeatureIds();

if (hasError) {
  console.error('\ndocs 검증 실패: 위 항목을 수정한 뒤 다시 커밋하세요.');
  process.exit(1);
}

console.log('docs 검증 통과: 문서-코드 불일치가 발견되지 않았습니다.');
