"use client";
import React, { use } from "react";
import BackButton from "@/components/backButton";
import Link from "next/link";
import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Translator } from "@/components/translator";

export default function SettingTest_page() {
  // const [qcMain, setData] = useState([]);
  const [qcMain, setQcMain] = useState<{
    error: boolean;
    message: string;
    data: [
      {
        ID: string;
        qcType: {
          name: string;
        };
        testName: string;
        detail: string;
      }
    ];
    allPage: number;
  } | null>();

  const fetchQcMainData = async () => {
    const data = await window.electronAPI.fetchAPI({
      method: "GET",
      URL: `qc/main?limit=50&page=1`,
    });
    if (!data) {
      throw new Error("Failed to fetch data");
    }
    return data;
  };

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    const data = await fetchQcMainData();
    setQcMain(data);
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="w-full flex items-center px-20 py-5 ">
        <BackButton href="/inspection" />
        <p className="font-bold ml-15 text-xl 2xl:text-2xl">ตั้งค่าการทดสอบ</p>
        <Link
          href="/inspection/settingTest/create"
          className="ml-auto px-10 py-3 text-white  text-lg   rounded-xl bg-[#001F3F] 
            xl:text-xl 
            2xl:text-2xl"
        >
          สร้าง
        </Link>
      </div>

      <div className="mx-10 mt-10 p-5 rounded-xl border border-gray-300">
        <div className="overflow-hidden rounded-t-3xl w-full">
          <div className="mt-5">
            <div className="text-black font-bold">
              <div className="bg-[#6494d3] rounded-t-3xl flex flex-row h-10 place-items-center">
                <div className="w-2/12 text-center text-base lg:text-lg font-bold font-['Sarabun'] text-ellipsis overflow-hidden">
                  ประเภท
                </div>
                <div className="w-3/12 text-center text-base lg:text-lg font-bold font-['Sarabun'] text-ellipsis overflow-hidden">
                  ชื่อการทดสอบ
                </div>
                <div className="w-5/12 text-center text-base lg:text-lg font-bold font-['Sarabun'] text-ellipsis overflow-hidden">
                  รายละเอียด
                </div>
                <div className="w-1/12 text-center text-base lg:text-lg font-bold font-['Sarabun'] text-ellipsis overflow-hidden">
                  แก้ไข
                </div>
                <div className="w-1/12 text-center text-base lg:text-lg font-bold font-['Sarabun'] text-ellipsis overflow-hidden">
                  ลบ
                </div>
              </div>
            </div>
            <div className="text-black">
              {qcMain?.data?.map((data) => {
                return (
                  <div
                    key={data.ID}
                    className="flex flex-row w-full h-12 hover:bg-gray-200"
                  >
                    <div className="w-2/12 text-start text-base lg:text-lg font-['Sarabun'] flex place-content-start place-items-center">
                      <div className="hidden sm:block">
                        {Translator.type.icon}
                      </div>
                      <h5 className="sm:ml-1 text-ellipsis overflow-hidden">
                        {data.qcType.name}
                      </h5>
                    </div>
                    <div className="w-3/12 text-center text-base lg:text-lg font-['Sarabun'] flex place-content-start place-items-center">
                      <h5 className="text-ellipsis overflow-hidden">
                        {data.testName}
                      </h5>
                    </div>
                    <div className="w-5/12 text-center text-base lg:text-lg font-['Sarabun'] flex place-content-start place-items-center">
                      <h5 className="text-ellipsis overflow-hidden">
                        {data.detail}
                      </h5>
                    </div>
                    <div className="w-1/12 text-center text-base lg:text-lg font-['Sarabun'] flex place-content-center place-items-center text-ellipsis overflow-hidden">
                      <button
                        onClick={() => {
                          localStorage.setItem(
                            "currentUrl",
                            "qc/testSetting/edit"
                          );
                          localStorage.setItem("param", data.ID);
                          window.location.reload();
                        }}
                      >
                        {Translator.edit.icon}
                      </button>
                    </div>
                    <div className="w-1/12 text-center text-base lg:text-lg font-['Sarabun'] flex place-content-center place-items-center text-ellipsis overflow-hidden">
                      <button
                        onClick={() => {
                          Swal.fire({
                            title: `ลบข้อมูล "${data.testName}" จริงหรือไม่`,
                            text: "หลังจากลบไปแล้วข้อมูลที่เกี่ยวข้องทั้งหมดจะถูกลบไปด้วย",
                            icon: "warning",
                            showCancelButton: true,
                            confirmButtonColor: "#d33",
                            cancelButtonColor: "#3085d6",
                            confirmButtonText: "ตกลง",
                            cancelButtonText: "ยกเลิก",
                          }).then(async (result) => {
                            if (result.isConfirmed) {
                              await window.electronAPI.fetchAPI({
                                method: "DELETE",
                                URL: `qc/main/${data.ID}`,
                              });
                              await refreshData();
                              Swal.fire({
                                title: "ลบข้อมูลสำเร็จ",
                                text: `ข้อมูลเกี่ยวกับ "${data.testName}" ถูกลบสำเร็จ`,
                                icon: "success",
                              });
                            }
                          });
                        }}
                      >
                        {Translator.delete.icon}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* <table className=" w-full">
            <thead>
              <tr className="bg-blue-400 rounded-t-lg lg:text-lg xl:text-xl">
                <th className="px-4 py-1">ประเภท</th>
                <th className="px-4 py-1">ชื่อการทดสอบ</th>
                <th className="px-4 py-1">รายละเอียด</th>
                <th className="px-1 py-1">แก้ไข</th>
                <th className="px-1 py-1">ลบ</th>
              </tr>
            </thead>
            <tbody>
              {qcMain &&
                qcMain?.data?.map((item, index) => (
                  <tr key={index} className="lg:text-lg xl:text-xl">
                    <td>{item.qcType?.name}</td>
                    <td>{item.testName}</td>
                    <td>{item.detail}</td>
                    <td>
                      <svg
                        width="30"
                        height="30"
                        viewBox="0 0 30 30"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M8.75 21.2663L14.2662 21.2475L26.3062 9.3225C26.7787 8.85 27.0387 8.2225 27.0387 7.555C27.0387 6.8875 26.7787 6.26 26.3062 5.7875L24.3237 3.805C23.3787 2.86 21.73 2.865 20.7925 3.80125L8.75 15.7288V21.2663ZM22.5562 5.5725L24.5425 7.55125L22.5462 9.52875L20.5637 7.5475L22.5562 5.5725ZM11.25 16.7713L18.7875 9.305L20.77 11.2875L13.2337 18.7513L11.25 18.7575V16.7713Z"
                          fill="black"
                        ></path>
                        <path
                          d="M6.25 26.25H23.75C25.1288 26.25 26.25 25.1288 26.25 23.75V12.915L23.75 15.415V23.75H10.1975C10.165 23.75 10.1313 23.7625 10.0988 23.7625C10.0575 23.7625 10.0163 23.7513 9.97375 23.75H6.25V6.25H14.8088L17.3088 3.75H6.25C4.87125 3.75 3.75 4.87125 3.75 6.25V23.75C3.75 25.1288 4.87125 26.25 6.25 26.25Z"
                          fill="black"
                        ></path>
                      </svg>
                    </td>
                    <td >
                      <svg
                        onClick={() => {
                          Swal.fire({
                            title: `ลบข้อมูล "${item.testName}" จริงหรือไม่`,
                            text: "หลังจากลบไปแล้วข้อมูลที่เกี่ยวข้องทั้งหมดจะถูกลบไปด้วย",
                            icon: "warning",
                            showCancelButton: true,
                            confirmButtonColor: "#d33",
                            cancelButtonColor: "#3085d6",
                            confirmButtonText: "ตกลง",
                            cancelButtonText: "ยกเลิก",
                          }).then(async (result) => {
                            if (result.isConfirmed) {
                              await window.electronAPI.fetchAPI({
                                method: "DELETE",
                                URL: `qc/main/${item.ID}`,
                              });
                              await refreshData();
                              Swal.fire({
                                title: "ลบข้อมูลสำเร็จ",
                                text: `ข้อมูลเกี่ยวกับ "${item.testName}" ถูกลบสำเร็จ`,
                                icon: "success",
                              });
                            }
                          });
                        }}
                        width="39"
                        height="39"
                        viewBox="0 0 30 30"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="flex justify-center" 
                      >
                        <path
                          d="M6 7H18M10 11V17M14 11V17M5 7L6 19C6 20.1046 6.89543 21 8 21H16C17.1046 21 18 20.1046 18 19L19 7M9 7V5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5V7"
                          stroke="red"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        ></path>
                      </svg>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table> */}
        </div>
      </div>
    </div>
  );
}
