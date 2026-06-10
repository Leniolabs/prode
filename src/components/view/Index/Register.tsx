import { RegisterButton } from "../../common/RegisterButton";
import { signIn } from "next-auth/react";
import React from "react";
import { className } from "../../../utils/classname";

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
    <div>
      <div className="flex place-content-center mb-[1em] mt-[0.5em] [&>div:nth-child(1)]:w-2/5 [&>div:nth-child(1)]:border-b-[1.5px] [&>div:nth-child(1)]:border-white/50 [&>div:nth-child(1)]:h-[2px] [&>div:nth-child(1)]:m-auto [&>div:nth-child(1)]:mr-5 [&>div:nth-child(2)]:text-center [&>div:nth-child(2)]:text-white [&>div:nth-child(2)]:text-[28px] [&>div:nth-child(2)]:leading-none [&>div:nth-child(3)]:w-2/5 [&>div:nth-child(3)]:border-b-[1.5px] [&>div:nth-child(3)]:border-white/50 [&>div:nth-child(3)]:h-[2px] [&>div:nth-child(3)]:m-auto [&>div:nth-child(3)]:ml-5">
        <div />
        <div>Login</div>
        <div />
      </div>
      {error && <div className="text-[red]">{error}</div>}
      <div
        className={className(
          "flex flex-col items-stretch gap-3 mx-auto",
          // margin: 3em (with auto left/right). When an error precedes the
          // buttons, the original collapses the top margin to 0.
          error ? "mt-0 mb-[3em]" : "my-[3em]",
          "[&>div]:m-3 [&>div]:w-[85px] [&>div]:p-[0.6em] [&>div:first-child]:ml-auto [&>div:last-child]:mr-auto"
        )}
      >
        <RegisterButton icon="Google" onClick={() => signIn("google", { callbackUrl: "/rooms" })} />
        <RegisterButton icon="Microsoft" onClick={() => signIn("azure-ad", { callbackUrl: "/rooms" })} />
      </div>
    </div>
  );
}
