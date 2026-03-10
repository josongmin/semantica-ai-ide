import type {
  GitCommit,
  GitCommitId,
  ReviewComment,
  ReviewCommentId,
} from "../../../shared/protocol";
import { postServerEvent } from "../devUtils";

/**
 * Seeds git commits, auto-commit state, and AI code review comments.
 */
export function seedGit() {
  const now = Date.now();

  // ── Git commits ─────────────────────────────────────────
  postServerEvent({ t: "SET_AUTO_COMMIT_ENABLED", enabled: true });
  const commits: GitCommit[] = [
    { id: "gc-1" as GitCommitId, sha: "abc1234", message: "feat: add JWT authentication endpoint", timestamp_ms: now - 12000, auto: true, branch: "main" },
    { id: "gc-2" as GitCommitId, sha: "def5678", message: "chore: update route index", timestamp_ms: now - 11500, auto: true, branch: "main" },
  ];
  for (const c of commits) postServerEvent({ t: "PUSH_GIT_COMMIT", commit: c });

  // ── AI code review ──────────────────────────────────────
  const reviews: ReviewComment[] = [
    { id: "rc-1" as ReviewCommentId, file_path: "src/routes/auth.ts", line: 42, line_start: 42, line_end: 42, text: "이메일 input validation 추가 필요", message: "이메일 input validation 추가 필요", severity: "warning", status: "open", suggestion: "zod schema로 request body를 validate" },
    { id: "rc-2" as ReviewCommentId, file_path: "src/middleware/jwt.ts", line: 15, line_start: 15, line_end: 18, text: "secret을 하드코딩하지 말고 환경변수 사용", message: "secret을 하드코딩하지 말고 환경변수 사용", severity: "error", status: "open", suggested_fix: "const secret = process.env.JWT_SECRET" },
    { id: "rc-3" as ReviewCommentId, file_path: "src/types/auth.ts", line: 8, line_start: 8, line_end: 8, text: "readonly 사용 권장", message: "readonly 사용 권장", severity: "suggestion", status: "accepted" },
  ];
  for (const r of reviews) postServerEvent({ t: "UPSERT_REVIEW_COMMENT", comment: r });
}
