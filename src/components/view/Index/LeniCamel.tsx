import styles from "./Index.module.scss";
import Image from "next/image";

export function LeniCamel() {
  return (
    <div className={styles.leniCamel}>
      <Image src="/leni-camel.png" alt="Leni camel illustration" width={342} height={252} />
    </div>
  );
}
