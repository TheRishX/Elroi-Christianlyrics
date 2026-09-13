import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBible,
  faChurch,
  faCross,
  faDove,
} from "@fortawesome/free-solid-svg-icons";

export function HeroFaithMark() {
  return (
    <div className="hero-faith-stage" aria-hidden="true">
      <span className="faith-side faith-side-left">
        <FontAwesomeIcon icon={faBible} />
      </span>
      <div className="hero-faith-mark">
        <span className="faith-orbit faith-orbit-one" />
        <span className="faith-orbit faith-orbit-two" />
        <span className="faith-icon faith-church">
          <FontAwesomeIcon icon={faChurch} />
        </span>
        <span className="faith-icon faith-cross">
          <FontAwesomeIcon icon={faCross} />
        </span>
      </div>
      <span className="faith-side faith-side-right">
        <FontAwesomeIcon icon={faDove} />
      </span>
    </div>
  );
}
