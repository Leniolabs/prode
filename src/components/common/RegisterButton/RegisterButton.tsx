import { className } from "../../../utils/classname";
import { FacebookIcon, GitHubIcon, GoogleIcon, TwitterIcon } from "../Icons";

interface RegisterButtonProps {
  icon: "Twitter" | "Google" | "Github" | "Facebook";
  onClick?: () => void;
}

const ICON_COLORS: Record<RegisterButtonProps["icon"], string> = {
  Twitter: "bg-[#50abf1] text-white text-center",
  Google: "bg-white text-[#274159] text-center",
  Github: "bg-white text-[#274159] text-center",
  Facebook: "bg-[#1b4993] text-white text-center",
};

export function RegisterButton(props: RegisterButtonProps) {
  return (
    <div
      className={className(
        "p-[.5em] border border-gray-400 inline-flex flex-col justify-center rounded cursor-pointer font-normal",
        ICON_COLORS[props.icon]
      )}
      onClick={props.onClick}
    >
      <div className="flex justify-center mb-[.3em]">
        {props.icon === "Twitter" && <TwitterIcon />}
        {props.icon === "Google" && <GoogleIcon />}
        {props.icon === "Github" && <GitHubIcon />}
        {props.icon === "Facebook" && <FacebookIcon />}
      </div>
      <div>{props.icon}</div>
    </div>
  );
}
