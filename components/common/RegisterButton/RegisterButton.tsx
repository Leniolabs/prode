import { className } from "../../../utils/classname";
import { FacebookIcon, GitHubIcon, GoogleIcon, MicrosoftIcon, TwitterIcon } from "../Icons";
import styles from "./RegisterButton.module.scss";

interface RegisterButtonProps {
  icon: "Twitter" | "Google" | "Github" | "Facebook" | "Microsoft";
  onClick?: () => void;
}

export function RegisterButton(props: RegisterButtonProps) {
  return (
    <div
      className={className(styles.registerButton, styles[props.icon])}
      onClick={props.onClick}
    >
      <div className={styles.registerButtonIcon}>
        {props.icon === "Twitter" && <TwitterIcon />}
        {props.icon === "Google" && <GoogleIcon />}
        {props.icon === "Github" && <GitHubIcon />}
        {props.icon === "Facebook" && <FacebookIcon />}
        {props.icon === "Microsoft" && <MicrosoftIcon />}
      </div>
      <div className={styles.registerButtonLabel}>{props.icon}</div>
    </div>
  );
}
