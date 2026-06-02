import { className } from "../../../utils/classname";
import { InfoIcon } from "../Icons";

interface WarningProps {
  offset?: boolean;
  className?: string;
}

export function Warning(props: React.PropsWithChildren<WarningProps>) {
  return (
    <div
      className={className(
        "bg-[#f6f5f5] text-[#1f2740] my-6 mx-auto flex p-3",
        props.offset && "max-lg:mb-12",
        props.className
      )}
    >
      <div className="flex items-center mr-3">
        <InfoIcon />
      </div>
      <div className="[&_a]:text-[#1f2740] [&_a]:underline">{props.children}</div>
    </div>
  );
}
