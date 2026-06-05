import Image from "next/image";
import styles from "./BrandLogo.module.scss";

export function BrandLogo() {
  return (
    <Image
      src="/improving-logo-light.png"
      alt="Improving"
      width={120}
      height={40}
      className={styles.brandLogo}
    />
  );
}
