import { ButtonIcon } from "../ButtonIcon";
import { CloseIcon } from "../Icons";
import { InstagramLoadingIcon } from "../Icons/InstagramLoadingIcon";
import styles from "./LoadingOverlay.module.scss";

interface LoadingOverlayProps {
  message?: string;
  loading?: boolean;
  onClose?: () => void;
}

export function LoadingOverlay(
  props: React.PropsWithChildren<LoadingOverlayProps>
) {
  return (
    <div className={styles.loadingOverlayWrapper}>
      <div className={styles.loadingOverlay}>
        <div className={styles.loadingOverlayClose}>
          {props.onClose && (
            <ButtonIcon className={styles.closeButton} onClick={props.onClose}>
              <CloseIcon />
            </ButtonIcon>
          )}
        </div>
        {props.loading && <InstagramLoadingIcon />}
        <div className={styles.loadingOverlayMessage}>{props.message}</div>
        <div className={styles.loadingOverlayContent}>{props.children}</div>
      </div>
    </div>
  );
}
