# Contributing to WhisperLink

## Branch naming

- `feat/short-description` — new features
- `fix/short-description` — bug fixes
- `test/short-description` — test-only changes

## Before opening a PR

1. Run `npm run lint`
2. Run `npm run typecheck`
3. Run `npm run test`
4. Run `npm run test:e2e` if UI flows changed

## Definition of Done

- Implementation complete
- Automated tests pass
- Shared design system used
- Error states handled consistently
- No PII or message content in logs
