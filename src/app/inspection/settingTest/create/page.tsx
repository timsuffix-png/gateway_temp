import React from "react";
import BackButton from "@/components/backButton";
import Link from "next/link";

export default function Create_page() {
  return (
    <div>
      <div className="w-full flex items-center px-20 py-5 ">
        <BackButton href="/inspection/settingTest" />
        <p className="font-bold ml-15 text-xl 2xl:text-2xl">สร้างการทดสอบ</p>
        <Link
          href=""
          className="ml-auto px-10 py-3 text-white  text-lg   rounded-xl bg-[#001F3F] 
            xl:text-xl 
            2xl:text-2xl"
        >
          สร้าง
        </Link>
      </div>

      <div className="mx-10 px-10 py-10 flex flex-col gap-8 rounded-xl border-2">
        {/* เลือกประเภทการทดสอบ*/}
        <div>
          <div className="flex">
            <p>ประเภทการทดสอบ</p>
            <span className="text-red-600">&nbsp;*</span>
          </div>

          <div className="flex gap-10 items-center">
            <select className="w-[80%] px-8 h-10 text-lg border rounded-sm">
              <option value="" disabled hidden>
                {" "}
                เลือกประเภทการทดสอบ
              </option>
              <option value="seaward">seaward</option>
              <option value="temp">temperature</option>
            </select>
            <button
              className="w-[20%] p-2 rounded-xl bg-gray-200
            xl:px-2 xl:py-4 xl:text-lg 
            hover:cursor-pointer hover:bg-gray-300"
            >
              จัดการประเภทการทดสอบ
            </button>
          </div>
        </div>

        {/* ชื่อการทดสอบ */}
        <div>
          <div className="flex">
            <p>ชื่อการทดสอบ</p>
            <span className="text-red-600">&nbsp;*</span>
          </div>

          <div className="flex gap-10 items-center">
            <input
              placeholder="ชื่อการทดสอบ"
              className="w-full px-8 h-10 text-lg border rounded-sm"
            />
          </div>
        </div>

        {/* รายละเอียดการทดสอบ */}
        <div>
          {" "}
          <div className="flex">
            <p>รายละเอียด</p>
            <span className="text-red-600">&nbsp;*</span>
          </div>
          <div className="flex gap-10 items-center">
            <input
              className="w-full px-8 h-10 text-lg border rounded-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
