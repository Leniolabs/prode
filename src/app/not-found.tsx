import Image from "next/image";
import { BrandLogo } from "@/components/common/BrandLogo";
import { Footer, Layout } from "@/layout";
import styles from "./not-found.module.scss";

export default function NotFound() {
  return (
    <Layout className={styles.page}>
      <main className={styles.media}>
        <div className={styles.imageFrame}>
          <Image
            src="/card.svg"
            alt="Yellow card illustration"
            width={662}
            height={947}
            priority
            className={styles.image}
          />
        </div>
        <div className={styles.overlay}>
          <h1 className={styles.code}>404</h1>
          <p className={styles.message}>Ups, algo salió mal</p>
        </div>
      </main>
      <Footer dark className={styles.footer}>
        <BrandLogo />
      </Footer>
    </Layout>
  );
}
