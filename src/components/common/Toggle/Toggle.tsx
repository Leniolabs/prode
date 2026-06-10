"use client";

import * as Switch from "@radix-ui/react-switch";

interface ToggleProps {
  id?: string;
  className?: string;
  value?: boolean;
  onChange?: (value: boolean) => void;
  disabled?: boolean;
  ariaLabel?: string;
}

export function Toggle(props: React.PropsWithChildren<ToggleProps>) {
  return (
    <Switch.Root
      id={props.id}
      checked={!!props.value}
      onCheckedChange={props.onChange}
      disabled={props.disabled}
      aria-label={props.ariaLabel}
      className={[
        "relative block box-border",
        "w-[44px] h-[24px] min-w-[44px] min-h-[24px]",
        "p-[2px] rounded-[15px] border-0 overflow-hidden",
        "bg-[#CD5367]",
        "data-[state=checked]:bg-brand-green",
        "cursor-pointer",
        "transition-colors duration-100 ease-in-out",
        "focus-visible:outline-2 focus-visible:outline-brand-blue focus-visible:outline-offset-2",
        props.disabled ? "cursor-not-allowed opacity-60" : "",
        props.className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Switch.Thumb
        className={[
          "absolute top-1/2 -translate-y-1/2",
          "left-[2px] data-[state=checked]:left-[22px]",
          "block w-[20px] h-[20px] rounded-full bg-white",
          "transition-[left] duration-100 ease-in-out",
        ].join(" ")}
      />
    </Switch.Root>
  );
}
