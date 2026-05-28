interface EditIconProps {
  className?: string;
}

export function EditIcon(props: EditIconProps) {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 21 21"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={props.className}
    >
      <g clipPath="url(#clip0_67_10836)">
        <path
          d="M10.5 13.1251L17.8369 5.76197C18.1815 5.41735 18.3751 4.94995 18.3751 4.46259C18.3751 3.97523 18.1815 3.50783 17.8369 3.16322C17.4923 2.8186 17.0249 2.625 16.5375 2.625C16.0501 2.625 15.5827 2.8186 15.2381 3.16322L7.875 10.5001V13.1251H10.5Z"
          stroke="white"
          strokeWidth="1.3125"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M14 4.375L16.625 7"
          stroke="white"
          strokeWidth="1.3125"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M7.87471 6.18604C6.34437 6.41028 4.95547 7.20503 3.98676 8.41077C3.01805 9.61652 2.54122 11.144 2.65197 12.6867C2.76271 14.2295 3.45284 15.6732 4.58385 16.7282C5.71485 17.7832 7.20303 18.3714 8.74971 18.3748C10.2224 18.3746 11.6458 17.844 12.7593 16.88C13.8727 15.916 14.6016 14.5832 14.8126 13.1257"
          stroke="white"
          strokeWidth="1.3125"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_67_10836">
          <rect width="21" height="21" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}
