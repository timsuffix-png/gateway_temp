import React from "react";
import Link
 from "next/link";
interface BackButtonProps {
    href?: string;
}

export default function BackButton(props: BackButtonProps) {
  return (
    <Link 
    href={props.href || "#"}
    className="px-2 border-3 rounded-lg text-xl 2xl:text-2xl">🡨 ย้อนกลับ</Link>
  );
}
