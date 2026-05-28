import React from "react";
import { className } from "../../../utils/classname";
import styles from "./Table.module.scss";

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

export function Table<T>(props: React.PropsWithChildren<TableProps<T>>) {
  return (
    <table
      className={className(
        props.className,
        styles.table,
        props.stripped && styles.stripped
      )}
    >
      <thead>
        <tr>
          {props.columns.map((col, index) => (
            <th
              key={index}
              style={{ width: col.width }}
              className={className(
                col.align ? styles[col.align] : "",
                col.bold && styles.bold,
                col.hideInMobile && styles.hideInMobile
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
                styles.clickable
            )}
          >
            {props.columns.map((col, colIndex) => (
              <td
                key={colIndex}
                className={className(
                  col.align ? styles[col.align] : "",
                  col.bold && styles.bold,
                  col.hideInMobile && styles.hideInMobile
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
