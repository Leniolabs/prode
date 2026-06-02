import Link from "next/link";
import React from "react";

export function BrandLogo() {
  const leniolabsText = React.useRef<SVGTextElement>(null);

  React.useEffect(() => {
    let letters = "labs";
    let index = 0;
    const interval = setInterval(() => {
      if (leniolabsText?.current) {
        leniolabsText.current.innerHTML += letters[index];
        index++;
        if (index > 3) {
          clearInterval(interval);
        }
      }
    }, 500);
  }, []);

  return (
    <Link href="https://www.leniolabs.com/" legacyBehavior>
      <a className="text-white w-max" title="Leniolabs">
        <svg viewBox="0 0 400 162" className="[&]:m-auto h-12">
          <style>{`
            .lenio-text { fill: currentColor; font-family: "Roboto Mono", monospace; font-size: 60px; font-weight: bold; }
            .cursor-type { animation: cursorBlink 0.5s step-end infinite alternate, cursorMoveRight 2s steps(4) alternate forwards; }
            .online-dot { fill: #f20353; animation: onlineColor 1s 2s forwards; }
          `}</style>
          <g>
            <text
              ref={leniolabsText}
              transform="translate(55, 108)"
              className="lenio-text"
              fill="currentColor"
            >
              Lenio
            </text>
          </g>
          <path
            className="cursor-type"
            fill="currentColor"
            d="M411.4 110.9v7.5h-39.3v-7.5H411.4z"
          ></path>
          <polyline
            id="logoscreen"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeMiterlimit="10"
            points="249.5 126 249.5 162 5 162 5 5 249.5 5 249.5 42 "
          />
          <circle className="online-dot" cx="31.7" cy="30.7" r="9.6" />
        </svg>
      </a>
    </Link>
  );
}
