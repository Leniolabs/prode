import React from "react";
import { className } from "@/utils/classname";

interface LayoutProps {
  className?: string;
  dark?: boolean;
}

export function Layout(props: React.PropsWithChildren<LayoutProps>) {
  return (
    <section
      className={className(
        "text-dark-navy min-h-[100dvh] flex flex-col",
        props.dark
          ? "bg-brand-blue bg-[url('/bg-trophy.png')] bg-no-repeat bg-[center_60%] bg-cover bg-fixed text-white relative isolate"
          : "bg-app-gradient",
        props.className,
      )}
    >
      {props.children}
    </section>
  );
}
