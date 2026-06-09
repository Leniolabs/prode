import styles from "./Index.module.scss";
import { RegisterButton } from "../../common/RegisterButton";
import { signIn } from "next-auth/react";
import React from "react";

interface RegisterProps {
  authError?: string;
}

export function Register(props: RegisterProps) {
  const error = React.useMemo(() => {
    switch (props.authError) {
      case "OAuthAccountNotLinked":
        return "Por favor, ingresa con la cuenta original que registraste este mail para validar tu cuenta.";
      default:
        return "";
    }
  }, [props.authError]);

  return (
    <div className={styles.register}>
      <div className={styles.registerDivider}>
        <div />
        <div>Login</div>
        <div />
      </div>
      {error && <div className={styles.registerError}>{error}</div>}
      <div className={styles.registerButtons}>
        <RegisterButton icon="Google" onClick={() => signIn("google", { callbackUrl: "/rooms" })} />
        <RegisterButton icon="Microsoft" onClick={() => signIn("azure-ad", { callbackUrl: "/rooms" })} />
      </div>
    </div>
  );
}
