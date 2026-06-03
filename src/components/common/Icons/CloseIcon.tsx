interface CloseIconProps {
  color?: string;
}

export function CloseIcon(props: CloseIconProps) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2 2L22.3 22.3"
        stroke={props.color || "white"}
        strokeWidth="2.32"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M22.3 2L2 22.3"
        stroke={props.color || "white"}
        strokeWidth="2.32"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
