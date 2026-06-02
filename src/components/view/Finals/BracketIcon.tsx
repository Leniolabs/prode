

interface BracketIconProps {
  className?: string;
  order?: number;
  big?: boolean;
}

export function BracketIcon(props: BracketIconProps) {
  if (props.big) {
    return (
      <svg
        viewBox="0 0 373 22"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={props.className}
        style={{ order: props.order, minWidth: props.big ? "calc(50% - 12px)" : "" }}
      >
        <path
          d="M371.874 0V4C372.688 7.33333 369.922 14 352.355 14C334.787 14 244.183 14 201.077 14C196.197 14 186.437 15.1 186.437 21.5"
          stroke="#23304250"
        />
        <path
          d="M1.1252 0L1.1252 4C0.311883 7.33333 3.07718 14 20.6449 14C38.2127 14 128.817 14 171.923 14C176.803 14 186.562 15.1 186.562 21.5"
          stroke="#23304250"
        />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 211 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={props.className}
      style={{ order: props.order }}
    >
      <path
        d="M209.981 0V4C210.439 7.33333 208.881 14 198.982 14C189.083 14 138.029 14 113.739 14C110.99 14 105.49 15.1 105.49 21.5"
        stroke="#23304250"
      />
      <path
        d="M1.07063 0L1.07063 4C0.612336 7.33333 2.17053 14 12.0696 14C21.9687 14 73.0223 14 97.3117 14C100.061 14 105.561 15.1 105.561 21.5"
        stroke="#23304250"
      />
    </svg>
  );
}
