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
        "group rounded-full bg-brand-blue border-none cursor-pointer flex relative",
        props.small ? "w-[2.2rem] h-[2.2rem]" : props.big ? "w-[7rem] h-[7rem]" : "w-16 h-16",
        props.className
      )}
      onClick={props.onClick}
    >
      <img
        ref={imageRef}
        src={props.image || undefined}
        width={48}
        height={48}
        alt={props.alt}
        onError={handleImageFail}
        className={className(
          "m-auto rounded-full border-none outline-none",
          props.small ? "w-[2rem] h-[2rem]" : props.big ? "w-[7rem] h-[7rem]" : "w-16 h-16"
        )}
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
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#00000050] w-[calc(100%-4px)] h-[calc(100%-4px)] rounded-full m-0 flex opacity-0 transition-opacity duration-100 ease-in-out group-hover:opacity-100"
            onClick={handleImageChangeClick}
          >
            <span className="m-auto">
              <EditIcon />
            </span>
          </div>
        </>
      )}
    </div>
  );
}
