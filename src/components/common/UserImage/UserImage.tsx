import React from "react";
import { ON_ERROR_IMAGE } from "@/config/settings";
import { className } from "../../../utils/classname";
import { compressImage } from "../../../utils/images";
import { EditIcon } from "../Icons";

interface UserImageProps {
  className?: string;
  image?: string | null | undefined;
  onClick?: () => void;
  small?: boolean;
  big?: boolean;
  alt?: string;
  editable?: boolean;
  onChange?: (image: string) => void;
}

export function UserImage(props: UserImageProps) {
  const imageInputRef = React.useRef<HTMLInputElement>(null);
  const imageRef = React.useRef<HTMLImageElement>(null);

  const handleImageFail = React.useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      (e.target as HTMLImageElement).src = ON_ERROR_IMAGE;
    },
    []
  );

  const handleImageChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || !e.target.files[0]) return;

      const FR = new FileReader();

      FR.addEventListener("load", function (evt: any) {
        compressImage(evt.target.result).then((compressed) => {
          props.onChange?.(compressed);
          if (imageRef.current) imageRef.current.src = compressed;
        });
      });

      FR.readAsDataURL(e.target.files[0]);
    },
    [props.onChange]
  );

  const handleImageChangeClick = React.useCallback(() => {
    imageInputRef?.current?.click?.();
  }, []);

  return (
    <div
      className={className(
        "w-16 h-16 rounded-full bg-[#1f2740] border-none cursor-pointer flex relative",
        "[&_img]:m-auto [&_img]:w-16 [&_img]:h-16 [&_img]:rounded-full [&_img]:border-none [&_img]:outline-none",
        props.small && "!w-[2.2rem] !h-[2.2rem] [&_img]:!w-8 [&_img]:!h-8",
        props.big && "!w-28 !h-28 [&_img]:!w-28 [&_img]:!h-28",
        "group",
        props.className
      )}
      onClick={props.onClick}
    >
      <img
        ref={imageRef}
        src={props.image || ""}
        width={48}
        height={48}
        alt={props.alt}
        onError={handleImageFail}
      />
      {props.editable && (
        <>
          <input
            ref={imageInputRef}
            type="file"
            style={{ display: "none" }}
            onChange={handleImageChange}
          />
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#00000050] w-[calc(100%-4px)] h-[calc(100%-4px)] rounded-full m-0 flex [&>*]:m-auto opacity-0 transition-opacity duration-100 group-hover:opacity-100"
            onClick={handleImageChangeClick}
          >
            <EditIcon />
          </div>
        </>
      )}
    </div>
  );
}
