# semantica-code-agent-plugin

Agent UX 웹 프론트엔드. React + TanStack Virtual + Jotai. [rfc/README.md](rfc/README.md)

## 실행

```bash
npm run dev
```

## 빌드 아티팩트 (레포 외부)

레포 용량 절감을 위해 빌드 캐시는 프로젝트 밖에 저장됩니다.

| 아티팩트 | 경로 |
|----------|------|
| Cargo (Rust) | `$HOME/.cache/cargo-build/semantica-desktop` |
| Turbo | `../.turbo-cache` (레포 상위 폴더) |

기존 `apps/desktop/src-tauri/target/` 폴더는 삭제해도 됩니다.

## 구조

- `src/` - FSD (app → pages → widgets → features → entities → shared)
- `schemas/agent-ux/` - Gate, contracts SSOT
- `rfc/` - 설계 문서

[rfc/REPO-STRUCTURE.md](rfc/REPO-STRUCTURE.md)
