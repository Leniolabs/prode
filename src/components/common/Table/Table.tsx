import React from "react";
import { className } from "../../../utils/classname";

type TableColumn<T> = {
  header?: string;
  accesor: (row: T, index: number, arr: T[]) => React.ReactNode;
  align?: "LEFT" | "CENTER" | "RIGHT";
  width?: string;
  bold?: boolean;
  slim?: boolean;
  hideInMobile?: boolean;
};

interface TableProps<T> {
  className?: string;
  columns: TableColumn<T>[];
  data: T[];
  stripped?: boolean;
  onRowClick?: (row: T) => void;
  clickable?: boolean | ((row: T) => boolean);
}

const ALIGN_MAP = { LEFT: "text-left", CENTER: "text-center", RIGHT: "text-right" };

export function Table<T>(props: React.PropsWithChildren<TableProps<T>>) {
  return (
    <table
      className={className(
        "w-full border-collapse [&_tr]:h-[55px] [&_th]:h-[55px] [&_tr]:text-xl [&_th]:text-xl",
        "[&_thead]:bg-[#cbd2e9]",
        "[&_thead_th]:text-[#1f2740] [&_thead_th]:font-semibold [&_thead_th]:text-left [&_thead_th]:px-3 [&_thead_th]:py-1.5",
        "[&_tbody_td]:px-3 [&_tbody_td]:py-1.5 [&_tbody_td]:text-xl",
        props.stripped && "[&_tbody_tr:nth-child(odd)]:bg-[#ffca3020]",
        props.className
      )}
    >
      <thead>
        <tr>
          {props.columns.map((col, index) => (
            <th
              key={index}
              style={{ width: col.width }}
              className={className(
                col.align ? ALIGN_MAP[col.align] : "",
                col.bold && "font-bold",
                col.hideInMobile && "max-lg:hidden"
              )}
            >
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {props.data.map((row, index, arr) => (
          <tr
            key={index}
            onClick={() => props.onRowClick?.(row as T)}
            className={className(
              props.clickable &&
                (typeof props.clickable === "boolean" ||
                  props.clickable?.(row)) &&
                "hover:bg-[#ffca3020] hover:[&_*]:cursor-pointer"
            )}
          >
            {props.columns.map((col, colIndex) => (
              <td
                key={colIndex}
                className={className(
                  col.align ? ALIGN_MAP[col.align] : "",
                  col.bold && "font-bold",
                  col.hideInMobile && "max-lg:hidden"
                )}
              >
                {col.accesor(row, index, arr)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
