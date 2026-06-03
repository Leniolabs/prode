interface InstagramLoadingIcon {
  className?: string;
}

export function InstagramLoadingIcon(props: InstagramLoadingIcon) {
  return (
    <svg
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      x="0px"
      y="0px"
      viewBox="0 0 36.3 36.3"
      xmlSpace="preserve"
      className={props.className}
    >
      <linearGradient
        id="SVGID_00000080172004734420557480000016362740553861992891_"
        gradientUnits="userSpaceOnUse"
        x1="1.8743"
        y1="20.4606"
        x2="20.4606"
        y2="1.8743"
      >
        <stop offset="0" style={{ stopColor: "#FEBF1E" }} />
        <stop offset="5.854080e-02" style={{ stopColor: "#FEB71D" }} />
        <stop offset="0.1495" style={{ stopColor: "#FCA119" }} />
        <stop offset="0.2615" style={{ stopColor: "#FB7D14" }} />
        <stop offset="0.3901" style={{ stopColor: "#F84B0D" }} />
        <stop offset="0.5313" style={{ stopColor: "#F50C03" }} />
        <stop offset="0.5321" style={{ stopColor: "#F50C03" }} />
        <stop offset="1" style={{ stopColor: "#C1009D" }} />
      </linearGradient>
      <g transform="translate(18.1, 18.1)">
        <circle
          r={11.1 + 6}
          stroke={
            "url(#SVGID_00000080172004734420557480000016362740553861992891_)"
          }
          strokeWidth={2}
          strokeDashoffset="-20"
          strokeDasharray={"80 1 3 1 3 1 3 1 3 1 3 1 3 1 3 1"}
          fill="transparent"
        />
      </g>
    </svg>
  );
}
