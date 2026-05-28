export function BallIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100"
      height="44"
      viewBox="0 0 100 44"
      overflow="visible"
      fill="#FF5463"
    >
      <defs>
        <svg id="inline">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="44"
            height="44"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="#fff"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
            <circle cx="12" cy="12" r="9"></circle>
            <path d="M12 7l4.76 3.45l-1.76 5.55h-6l-1.76 -5.55z"></path>
            <path d="M12 7v-4m3 13l2.5 3m-.74 -8.55l3.74 -1.45m-11.44 7.05l-2.56 2.95m.74 -8.55l-3.74 -1.45"></path>
          </svg>
        </svg>
      </defs>
      <use xlinkHref="#inline" x="0">
        <animate
          attributeName="opacity"
          values="0;1;0"
          dur="1s"
          begin="0s"
          repeatCount="indefinite"
        ></animate>
      </use>
      <use xlinkHref="#inline" x="20">
        <animate
          attributeName="opacity"
          values="0;1;0"
          dur="1s"
          begin="0.25s"
          repeatCount="indefinite"
        ></animate>
      </use>
      <use xlinkHref="#inline" x="40">
        <animate
          attributeName="opacity"
          values="0;1;0"
          dur="1s"
          begin="0.5s"
          repeatCount="indefinite"
        ></animate>
      </use>
      <use xlinkHref="#inline" x="60">
        <animate
          attributeName="opacity"
          values="0;1;0"
          dur="1s"
          begin="0.75s"
          repeatCount="indefinite"
        ></animate>
      </use>
    </svg>
  );
}
