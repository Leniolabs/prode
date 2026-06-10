import { ButtonIcon } from "../ButtonIcon";
import { CloseIcon } from "../Icons";
import { InstagramLoadingIcon } from "../Icons/InstagramLoadingIcon";

interface LoadingOverlayProps {
  message?: string;
  loading?: boolean;
  onClose?: () => void;
}

export function LoadingOverlay(
  props: React.PropsWithChildren<LoadingOverlayProps>
) {
  return (
    <div className="fixed left-0 top-0 h-screen w-screen bg-[#000000aa] z-[999999] flex items-center place-content-center uppercase">
      <div className="relative w-full h-full flex flex-col items-center place-content-center text-white">
        <div className="absolute right-[6px] top-[6px]">
          {props.onClose && (
            <ButtonIcon
              className="w-24 h-24 max-w-24 max-h-24"
              onClick={props.onClose}
            >
              <CloseIcon />
            </ButtonIcon>
          )}
        </div>
        {props.loading && (
          <InstagramLoadingIcon className="w-[30%] h-[30%] [&_circle]:animate-spin-ease" />
        )}
        <div className="text-white mt-3 text-[1.5em]">{props.message}</div>
        <div className="mt-3 flex items-center place-content-center">
          {props.children}
        </div>
      </div>
    </div>
  );
}
