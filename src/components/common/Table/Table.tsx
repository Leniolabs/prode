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
  /** Dark-navy header with top-rounded corners, matching the /rooms table. */
  dark?: boolean;
  onRowClick?: (row: T) => void;
  clickable?: boolean | ((row: T) => boolean);
}

const alignClass = {
  LEFT: "text-left",
  CENTER: "text-center",
  RIGHT: "text-right",
} as const;

export function Table<T>(props: React.PropsWithChildren<TableProps<T>>) {
  const hasHeaders = props.columns.some((col) => col.header);
  const isRowClickable = React.useCallback(
    (row: T) =>
      !!props.clickable &&
      (typeof props.clickable === "boolean" || props.clickable(row)),
    [props.clickable]
  );

  const lastColIndex = props.columns.length - 1;

  return (
    <table
      className={className(
        props.className,
        "w-full border-collapse"
      )}
    >
      {hasHeaders && (
        <thead className={props.dark ? "" : "bg-table-header-bg"}>
          <tr
            className={
              props.dark
                ? "bg-dark-navy text-white text-[20px] [&>th]:px-4 [&>th]:py-2.5 [&>th]:font-bold [&>th]:whitespace-nowrap max-[640px]:text-[14px] max-[640px]:[&>th]:px-2"
                : ""
            }
          >
            {props.columns.map((col, index) => (
              <th
                key={index}
                scope="col"
                style={{ width: col.width }}
                className={className(
                  props.dark
                    ? "font-bold"
                    : "h-[55px] text-[20px] text-dark-navy font-semibold text-left px-3 py-[6px]",
                  col.align ? alignClass[col.align] : props.dark ? "text-left" : "",
                  col.bold && "font-bold",
                  col.hideInMobile && "max-lg:hidden",
                  props.dark && index === 0 && "rounded-tl-[8px]",
                  props.dark && index === lastColIndex && "rounded-tr-[8px]"
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
      )}
      <tbody>
        {props.data.map((row, index, arr) => (
          <tr
            key={index}
            data-striped={props.stripped && index % 2 === 1 ? true : undefined}
            onClick={() => {
              if (isRowClickable(row)) {
                props.onRowClick?.(row as T);
              }
            }}
            onKeyDown={(event) => {
              if (!isRowClickable(row)) return;
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                props.onRowClick?.(row as T);
              }
            }}
            tabIndex={isRowClickable(row) ? 0 : undefined}
            role={isRowClickable(row) ? "button" : undefined}
            className={className(
              props.dark
                ? "text-dark-navy text-[20px] data-[striped=true]:bg-[rgba(0,0,0,0.09)] [&>td]:px-4 [&>td]:py-3 max-[640px]:text-[14px] max-[640px]:[&>td]:px-2"
                : "h-[55px] text-[20px]",
              !props.dark && props.stripped && index % 2 === 0 && "bg-[rgba(0,0,0,0.04)]",
              isRowClickable(row) &&
                "hover:bg-[rgba(0,0,0,0.04)] [&:hover_*]:cursor-pointer"
            )}
          >
            {props.columns.map((col, colIndex) => (
              <td
                key={colIndex}
                className={className(
                  props.dark
                    ? "text-[20px] max-[640px]:text-[14px]"
                    : "px-3 py-[6px] text-[20px] max-[600px]:text-[14px]",
                  col.align ? alignClass[col.align] : "",
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
