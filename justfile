# semantica-code-agent-plugin — just recipes
# 목서버(mock) 앱 각각 실행

# Webview dev (mock backend 포함, localhost:5173)
dev:
    npm run dev

# Webview dev without mock (/?no-mock로 열기)
dev-no-mock:
    npx vite --open '/?no-mock'

# Build 후 preview (localhost:4173)
preview:
    npm run build && npm run preview

# Build만
build:
    npm run build

# 테스트
test:
    npm run test

test-watch:
    npm run test:watch

# 검증 (typecheck + lint + format + test)
validate:
    npm run validate

# Tauri 데스크톱 앱 dev
tauri:
    cd apps/desktop && CARGO_BUILD_INCREMENTAL=true cargo tauri dev

# 기본: dev 실행
default:
    just dev
