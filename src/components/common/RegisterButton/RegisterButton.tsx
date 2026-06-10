import { className } from "../../../utils/classname";
import { GoogleIcon, MicrosoftIcon } from "../Icons";

interface RegisterButtonProps {
  icon: "Google" | "Microsoft";
  onClick?: () => void;
}

const icons = {
  Google: GoogleIcon,
  Microsoft: MicrosoftIcon,
} as const;

const iconColors: Record<RegisterButtonProps["icon"], string> = {
  Google: "text-[#3c4043]",
  Microsoft: "text-[#5e5e5e]",
};

export function RegisterButton(props: RegisterButtonProps) {
  const Icon = icons[props.icon];

  return (
    <button
      type="button"
      className={className(
        "appearance-none border border-[#dadce0] bg-white font-[inherit] cursor-pointer rounded-[4px] py-[0.5em] px-[1.5em] inline-flex items-center gap-[0.5em] min-w-[220px] justify-center hover:bg-[#f8f9fa]",
        iconColors[props.icon]
      )}
      onClick={props.onClick}
    >
      <span className="flex items-center">
        <Icon />
      </span>
      <span className="text-[15px] font-medium">Sign in with {props.icon}</span>
    </button>
  );
}
