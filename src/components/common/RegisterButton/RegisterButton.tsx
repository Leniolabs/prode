import { className } from "../../../utils/classname";
import { GoogleIcon, MicrosoftIcon } from "../Icons";
import styles from "./RegisterButton.module.scss";

interface RegisterButtonProps {
  icon: "Google" | "Microsoft";
  onClick?: () => void;
}

const icons = {
  Google: GoogleIcon,
  Microsoft: MicrosoftIcon,
} as const;

export function RegisterButton(props: RegisterButtonProps) {
  const Icon = icons[props.icon];

  return (
    <button
      type="button"
      className={className(styles.registerButton, styles[props.icon])}
      onClick={props.onClick}
    >
      <span className={styles.registerButtonIcon}>
        <Icon />
      </span>
      <span className={styles.registerButtonLabel}>Sign in with {props.icon}</span>
    </button>
  );
}
