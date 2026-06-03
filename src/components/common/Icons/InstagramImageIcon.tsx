interface InstagramImageIcon {
  loading?: boolean;
  className?: string;
}

export function InstagramImageIcon(props: InstagramImageIcon) {
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
          strokeDasharray={
            props.loading ? "80 1 3 1 3 1 3 1 3 1 3 1 3 1 3 1" : ""
          }
          fill="transparent"
        />
      </g>
      <g transform="scale(0.6) translate(6, 6)">
        <radialGradient
          id="yOrnnhliCrdS2gy~4tD8ma"
          cx="19.38"
          cy="42.035"
          r="44.899"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stop-color="#fd5" />
          <stop offset=".328" stop-color="#ff543f" />
          <stop offset=".348" stop-color="#fc5245" />
          <stop offset=".504" stop-color="#e64771" />
          <stop offset=".643" stop-color="#d53e91" />
          <stop offset=".761" stop-color="#cc39a4" />
          <stop offset=".841" stop-color="#c837ab" />
        </radialGradient>
        <path
          fill="url(#yOrnnhliCrdS2gy~4tD8ma)"
          d="M34.017,41.99l-20,0.019c-4.4,0.004-8.003-3.592-8.008-7.992l-0.019-20	c-0.004-4.4,3.592-8.003,7.992-8.008l20-0.019c4.4-0.004,8.003,3.592,8.008,7.992l0.019,20	C42.014,38.383,38.417,41.986,34.017,41.99z"
        />
        <radialGradient
          id="yOrnnhliCrdS2gy~4tD8mb"
          cx="11.786"
          cy="5.54"
          r="29.813"
          gradientTransform="matrix(1 0 0 .6663 0 1.849)"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stop-color="#4168c9" />
          <stop offset=".999" stop-color="#4168c9" stop-opacity="0" />
        </radialGradient>
        <path
          fill="url(#yOrnnhliCrdS2gy~4tD8mb)"
          d="M34.017,41.99l-20,0.019c-4.4,0.004-8.003-3.592-8.008-7.992l-0.019-20	c-0.004-4.4,3.592-8.003,7.992-8.008l20-0.019c4.4-0.004,8.003,3.592,8.008,7.992l0.019,20	C42.014,38.383,38.417,41.986,34.017,41.99z"
        />
        <path
          fill="#fff"
          d="M24,31c-3.859,0-7-3.14-7-7s3.141-7,7-7s7,3.14,7,7S27.859,31,24,31z M24,19c-2.757,0-5,2.243-5,5	s2.243,5,5,5s5-2.243,5-5S26.757,19,24,19z"
        />
        <circle cx="31.5" cy="16.5" r="1.5" fill="#fff" />
        <path
          fill="#fff"
          d="M30,37H18c-3.859,0-7-3.14-7-7V18c0-3.86,3.141-7,7-7h12c3.859,0,7,3.14,7,7v12	C37,33.86,33.859,37,30,37z M18,13c-2.757,0-5,2.243-5,5v12c0,2.757,2.243,5,5,5h12c2.757,0,5-2.243,5-5V18c0-2.757-2.243-5-5-5H18z"
        />
      </g>
    </svg>
  );
}
