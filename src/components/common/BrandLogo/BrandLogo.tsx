import Link from "next/link";
import React from "react";
import styles from "./BrandLogo.module.scss";

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
      <a className={styles.brandLogo} title="Leniolabs">
        <svg viewBox="0 0 400 162">
          <g className={styles.lenioText}>
            <text
              ref={leniolabsText}
              // transform="matrix(1 0 0 1 55.067 108.0003)"
              // textLength="318"
              transform="translate(55, 108)"
              className={styles.lenioText}
              fill="currentColor"
            >
              Lenio
            </text>
          </g>
          <path
            className={styles.cursorType}
            fill="currentColor"
            d="M411.4 110.9v7.5h-39.3v-7.5H411.4z"
          ></path>
          <polyline
            className={styles.logoScreen}
            id="logoscreen"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeMiterlimit="10"
            points="249.5 126 249.5 162 5 162 5 5 249.5 5 249.5 42 "
          />
          <circle className={styles.online} cx="31.7" cy="30.7" r="9.6" />
        </svg>
      </a>
    </Link>
  );
}
