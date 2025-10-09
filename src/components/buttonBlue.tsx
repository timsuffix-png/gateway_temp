import React from "react";
import Link from "next/link";

export default function ButtonBlue({ ...props }) {
  for (let attribute of ["name"]) {
    //ถ้าไม่มีtextส่งมา
    if (!props[attribute]) throw new Error(`Please specify ${attribute}`);
  }

  return (
    <Link
      href={props.href || "#"}
      onClick={props.onClick}
      className="px-1 py-3 text-white text-xl  2xl:text-2xl 3xl:text-3xl 4xl:text-4xl rounded-xl bg-[#001F3F] 
       xl:px-4 xl:py-5
      2xl:px-4 2xl:py-6 2xl:text-2xl"
    >
      {props.name}
    </Link>
  );
}
