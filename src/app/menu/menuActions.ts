/**
 * Menu action router — ActionId -> Jotai store dispatch.
 *
 * 모든 메뉴 클릭 이벤트가 여기로 라우팅된다.
 * 플랫폼 무관 — Bridge가 이 함수를 호출한다.
 *
 * Action Registry 패턴: 각 액션 그룹이 side-effect import를 통해
 * 자신의 핸들러를 레지스트리에 등록한다 (OCP 준수).
 */

// Import action registrations (side-effect imports trigger registerMenuAction calls)
import "./actions";

// Re-export dispatcher from registry
export { dispatchMenuAction } from "./actionRegistry";
