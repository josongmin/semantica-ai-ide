/**
 * Action registration barrel — side-effect imports trigger registerMenuAction calls.
 *
 * 이 파일을 import하면 모든 액션 핸들러가 레지스트리에 등록된다.
 */
import "./sessionActions";
import "./editActions";
import "./viewActions";
import "./agentActions";
import "./navActions";
import "./appActions";
import "./helpActions";
