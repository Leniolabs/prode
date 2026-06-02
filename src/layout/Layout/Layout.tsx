import React from "react";
import { className } from "@/utils/classname";

interface LayoutProps {
  className?: string;
  backgroundImage?: string;
}

export function Layout(props: React.PropsWithChildren<LayoutProps>) {
  return (
    <section
      className={className(
        "text-[#333] min-h-screen bg-cover bg-no-repeat bg-bottom flex flex-col [background-image:url('/background-1.png')]",
        props.className
      )}
      style={
        props.backgroundImage
          ? { backgroundImage: `url(${props.backgroundImage})` }
          : undefined
      }
    >
      {props.children}
    </section>
  );
}
