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
        "flex flex-col w-full bg-card-body text-dark-navy rounded-card shadow-card",
        props.className,
      )}
      style={{ gridArea: props.gridArea }}
    >
      {props.title && (
        <div
          className={
            "py-[6px] text-center text-dark-navy bg-brand-green relative text-[25px] font-bold min-h-[40px] flex w-full items-center place-content-center align-content-center rounded-t-[8px]"
          }
        >
          {props.title}
        </div>
      )}
      {props.children}
    </section>
  );
}
