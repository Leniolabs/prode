import React from "react";
import { className } from "@/utils/classname";

interface CardProps {
  className?: string;
  title?: React.ReactNode;
  gridArea?: string;
}

export function Card(props: React.PropsWithChildren<CardProps>) {
  return (
    <section
      className={className(
        "flex flex-col w-full mb-3 bg-[#f6f5f5cc]",
        props.className
      )}
      style={{ gridArea: props.gridArea }}
    >
      {props.title && (
        <div className="py-1.5 px-0 text-center text-white bg-[#1f2740] relative text-xl font-bold min-h-[40px] flex w-full content-center justify-center items-center">
          {props.title}
        </div>
      )}
      {props.children}
    </section>
  );
}
