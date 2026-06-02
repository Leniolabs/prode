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
    <div className="fixed left-0 top-0 h-screen w-screen bg-[#000000aa] z-[999999] flex content-center justify-center items-center uppercase">
      <div className="relative w-full h-full flex-col flex content-center justify-center items-center text-white">
        <div className="absolute right-1.5 top-1.5">
          {props.onClose && (
            <ButtonIcon className="!w-24 !h-24 !max-w-24 !max-h-24" onClick={props.onClose}>
              <CloseIcon />
            </ButtonIcon>
          )}
        </div>
        {props.loading && (
          <div className="[&_svg]:!w-[30%] [&_svg]:!h-[30%] [&_circle]:[animation:spin360_1s_ease-in-out_infinite]">
            <InstagramLoadingIcon />
          </div>
        )}
        <div className="text-white mt-3 text-[1.5em]">{props.message}</div>
        <div className="mt-3 flex content-center items-center justify-center">{props.children}</div>
      </div>
    </div>
  );
}
