interface ChevronIconProps {
  orientation: "RIGHT" | "DOWN";
}

export function ChevronIcon(props: ChevronIconProps) {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 19 19"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {props.orientation === "RIGHT" && (
        <path
          d="M6 2.00008L13.3333 9.33341L6 16.6667"
          stroke="#03203E"
          strokeWidth="2.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {props.orientation === "DOWN" && (
        <path
          d="M16.9997 5.66675L9.66634 13.0001L2.33301 5.66675"
          stroke="#03203E"
          strokeWidth="2.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}
