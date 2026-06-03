interface InstagramReelIcon {
  loading?: boolean;
  className?: string;
}

export function InstagramReelIcon(props: InstagramReelIcon) {
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
        id="outline"
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
      <radialGradient
        id="inner"
        cx="11.013"
        cy="-129.653"
        r="44.899"
        gradientTransform="translate(0 174)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0" stop-color="#fd5" />
        <stop offset=".039" stop-color="#ffcf49" />
        <stop offset=".113" stop-color="#ffa92b" />
        <stop offset=".165" stop-color="#ff8a12" />
        <stop offset=".226" stop-color="#ff7325" />
        <stop offset=".295" stop-color="#ff543f" />
        <stop offset=".423" stop-color="#fc5245" />
        <stop offset=".541" stop-color="#e64771" />
        <stop offset=".653" stop-color="#d53e91" />
        <stop offset=".756" stop-color="#cc39a4" />
        <stop offset=".837" stop-color="#c837ab" />
      </radialGradient>
      <g transform="translate(18.1, 18.1)">
        <circle
          r={11.1 + 6}
          stroke={
            "url(#outline)"
          }
          strokeWidth={2}
          strokeDashoffset="-20"
          strokeDasharray={
            props.loading ? "80 1 3 1 3 1 3 1 3 1 3 1 3 1 3 1" : ""
          }
          fill="transparent"
        />
      </g>
      <g transform="translate(7, 7)">
        <g transform="scale(0.6) translate(-5, -5)">
          <path
            fill="url(#inner)"
            d="M34.017,41.99l-20,0.019c-4.4,0.004-8.003-3.592-8.008-7.992L5.993,17L7,16l-1.01-1.983	c-0.004-4.125,3.157-7.55,7.177-7.966C13.435,6.024,15,7,15,7l1.7-0.994l9.52-0.009L28,7l1.7-1.006l4.282-0.004	c4.4-0.004,8.003,3.592,8.008,7.992L41,15l0.993,2l0.016,16.982C42.014,38.383,38.417,41.986,34.017,41.99z"
          />
          <path
            fill="#fff"
            d="M18,33.114v-9.228c0-1.539,1.666-2.502,2.999-1.732l7.998,4.614c1.334,0.77,1.334,2.695,0,3.465	l-7.998,4.614C19.666,35.616,18,34.653,18,33.114z"
          />
          <path
            fill="#fff"
            d="M41.99,14v3h-36v-2.98c0-0.01,0-0.01,0-0.02h11.9l-4.65-7.96c0.24-0.02,0.49-0.03,0.74-0.03h2.72	L21.36,14h9.53l-4.67-8l3.48-0.01L34.36,14H41.99z"
          />
        </g>
      </g>
    </svg>
  );
}
