import Link from "next/link";

import React from "react";
import { className } from "../../../utils/classname";
import styles from "./Table.module.scss";

interface PaginationProps {
  totalPages: number;
  page: number;
}

export function Pagination(props: PaginationProps) {
  const prevPageLink = React.useMemo(() => {
    if (props.page > 0) {
      const includesPage = window.location.href.includes("page=");
      const includesPageLength = window.location.href.includes("pageLength=");

      if (props.page > 0) {
        if (includesPage) {
          return window.location.href.replace(
            `page=${props.page}`,
            `page=${props.page - 1}`
          );
        } else if (includesPageLength) {
          return window.location.href + `&page=${props.page - 1}`;
        } else {
          return window.location.href.split("?")[0] + `?page=${props.page - 1}`;
        }
      }
    }
    return null;
  }, [props.page, props.totalPages]);

  const nextPageLink = React.useMemo(() => {
    const includesPage = window.location.href.includes("page=");
    const includesPageLength = window.location.href.includes("pageLength=");

    if (props.page < props.totalPages - 1) {
      if (includesPage) {
        return window.location.href.replace(
          `page=${props.page}`,
          `page=${props.page + 1}`
        );
      } else if (includesPageLength) {
        return window.location.href + `&page=${props.page + 1}`;
      } else {
        return window.location.href.split("?")[0] + `?page=${props.page + 1}`;
      }
    }
    return null;
  }, [props.page, props.totalPages]);

  return (
    <div className={styles.pagination}>
      <Link legacyBehavior href={prevPageLink || window.location.href}>
        <a className={className(!prevPageLink && styles.disabled)}>{"‹"}</a>
      </Link>
      <div className={styles.paginationNumber}>
        {props.page + 1} / {props.totalPages}
      </div>
      <Link legacyBehavior href={nextPageLink || window.location.href}>
        <a className={className(!nextPageLink && styles.disabled)}>{"›"}</a>
      </Link>
    </div>
  );
}
