import React from "react";
import Link from "next/link";

interface ButtonBlueProps {
  name: string,
    href?: string;
}

export default function ButtonBlue(props: ButtonBlueProps) {
  return (
    <Link
      href={props.href || "#"}
      className="px-1 py-3 text-white  text-lg   rounded-xl bg-[#001F3F] 
      xl:text-xl xl:px-4 xl:py-5
      2xl:px-4 2xl:py-6 2xl:text-2xl"
    >
      {props.name}
    </Link>
  );
}
