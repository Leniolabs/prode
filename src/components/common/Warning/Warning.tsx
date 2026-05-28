import { className } from "../../../utils/classname";
import { InfoIcon } from "../Icons";
import styles from "./Warning.module.scss";

interface WarningProps {
  offset?: boolean;
  className?: string;
}

export function Warning(props: React.PropsWithChildren<WarningProps>) {
  return (
    <div
      className={className(
        styles.warning,
        props.offset && styles.offset,
        props.className
      )}
    >
      <div className={styles.warningIcon}>
        <InfoIcon />
      </div>
      <div className={styles.warningContent}>{props.children}</div>
    </div>
  );
}
