import { className } from "../../../utils/classname";
import { GoogleIcon } from "../Icons";
import styles from "./RegisterButton.module.scss";

interface RegisterButtonProps {
  icon: "Google";
  onClick?: () => void;
}

export function RegisterButton(props: RegisterButtonProps) {
  return (
    <button
      type="button"
      className={className(styles.registerButton, styles[props.icon])}
      onClick={props.onClick}
    >
      <span className={styles.registerButtonIcon}>
        <GoogleIcon />
      </span>
      <span className={styles.registerButtonLabel}>Sign in with Google</span>
    </button>
  );
}
