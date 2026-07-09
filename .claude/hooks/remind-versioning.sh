#!/usr/bin/env bash
# PreToolUse hook (Bash matcher): reminds about the semantic versioning routine
# whenever a `git push` to origin/main is about to run and HEAD has no exact tag yet.
set -euo pipefail

input="$(cat)"
cmd="$(printf '%s' "$input" | node -e "
let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{
  try { process.stdout.write(JSON.parse(d).tool_input?.command || ''); } catch(e) {}
});
")"

# Only care about pushes to main (not a tag-only push, not other branches).
if ! printf '%s' "$cmd" | grep -qE 'git[[:space:]]+push'; then
  echo '{}'
  exit 0
fi
if printf '%s' "$cmd" | grep -qE '\-\-tags|refs/tags|v[0-9]+\.[0-9]+\.[0-9]+'; then
  echo '{}'
  exit 0
fi
if ! printf '%s' "$cmd" | grep -qE 'git[[:space:]]+push([[:space:]]+[^|;&]*)?\b(main|HEAD)\b|git[[:space:]]+push[[:space:]]*(origin)?[[:space:]]*$'; then
  echo '{}'
  exit 0
fi

if git describe --tags --exact-match HEAD >/dev/null 2>&1; then
  echo '{}'
  exit 0
fi

context='LEMBRETE - rotina de versionamento (Caixa Gerencial), mesma que usamos no release v1.0.0: '
context+='1) revisao de codigo do diff (angulos de correcao + limpeza); '
context+='2) npm audit fix (sem breaking changes); '
context+='3) decidir o bump semver (major.minor.patch) com base nas mudancas; '
context+='4) atualizar TECHNICAL_REFERENCE.md (secao Historico de Alteracoes) e o campo version do package.json; '
context+='5) criar commit(s) com escopo claro; '
context+='6) criar tag git anotada vX.Y.Z; '
context+='7) git push origin main && git push origin vX.Y.Z. '
context+='O HEAD atual ainda nao esta tagueado.'

CTX="$context" node -e "
process.stdout.write(JSON.stringify({
  hookSpecificOutput: { hookEventName: 'PreToolUse', additionalContext: process.env.CTX }
}));
"
