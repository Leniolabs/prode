import React from "react";
import { ON_ERROR_IMAGE } from "@/config/settings";
import { className } from "../../../utils/classname";
import { compressImage } from "../../../utils/images";
import { EditIcon } from "../Icons";
import styles from "./UserImage.module.scss";

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
        styles.userImage,
        props.small && styles.small,
        props.big && styles.big,
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
            className={styles.userImageEditable}
            onClick={handleImageChangeClick}
          >
            <EditIcon />
          </div>
        </>
      )}
    </div>
  );
}
