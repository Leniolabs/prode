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
    <div>
      <div className="flex mb-[1em] mt-[0.5em]">
        <div className="w-2/5 border-b-[1.5px] border-[#1f274050] h-0.5 m-auto mr-5" />
        <div className="text-center text-[#354156]">Login</div>
        <div className="w-2/5 border-b-[1.5px] border-[#1f274050] h-0.5 m-auto ml-5" />
      </div>
      {error && <div className="text-red-600">{error}</div>}
      <div className="flex mt-0 mx-auto my-[3em] [&>div]:m-3 [&>div:first-child]:ml-auto [&>div:last-child]:mr-auto [&>div]:w-[85px] [&>div]:p-[0.6em]">
        <RegisterButton icon="Google" onClick={() => signIn("google")} />
        {/* <RegisterButton icon="Facebook" onClick={() => signIn("facebook")} /> */}
        <RegisterButton icon="Github" onClick={() => signIn("github")} />
        {/* <RegisterButton icon="Twitter" onClick={() => signIn("twitter")} /> */}
      </div>
    </div>
  );
}
