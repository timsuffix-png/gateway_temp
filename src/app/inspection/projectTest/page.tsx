"use client";
import React from "react";
import BackButton from "@/components/backButton";
import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { Translator } from "@/components/translator";
import Navbar from "@/components/navbar";
import Breadcrumb from "@/components/breadcrumb";

export default function QcProject() {
  const [qcProject, setQcProject] = useState<{
    error: boolean;
    message: string;
    data: [
      {
        ID: string;
        projectName: string;
        qcItemProject: [
          {
            ID: string;
            qcMain: {
              testName: string;
              detail: string;
            };
          }
        ];
      }
    ];
    allPage: number;
  } | null>();

  useEffect(() => {
    refreshData();
  }, []);

  const fetchData = async () => {
    const data = await window.electronAPI.fetchAPI({
      method: "GET",
      URL: `qc/project/extend?limit=100&page=1`,
    });
    if (!data) {
      throw new Error("Failed to fetch data");
    }
    return data;
  };

  const refreshData = async () => {
    const data = await fetchData();
    setQcProject(data);
  };

  return (
    <div className="flex">
      <Navbar />
      <div className="w-full ">
        <Breadcrumb />
        <div className="w-full flex items-center px-20 py-5  ">
          <div
            tabIndex={0}
            onClick={() => {
              localStorage.setItem("currentUrl", "qc");
              window.location.reload();
            }}
            className="ml-5 sm:ml-20 cursor-pointer"
          >
            <BackButton />
          </div>

          <p className="font-bold ml-15 text-xl 2xl:text-2xl">
            โปรเจ็คการทดสอบ
          </p>
          <button
            onClick={() => {
              localStorage.setItem("currentUrl", "qc/projectTest/create");
              window.location.reload();
            }}
            className="ml-auto px-10 py-3 text-white  text-lg   rounded-xl bg-[#001F3F] 
            xl:text-xl 
            2xl:text-2xl"
          >
            สร้าง
          </button>
        </div>

        {/* ตารางข้อมูลโปรเจ็ต */}
        <div className="w-full h-auto mt-[20px]">
          {qcProject?.data?.map((project) => {
            return (
              <div
                key={project.ID}
                className="sm:ml-10 sm:mr-20 mt-10 pb-10 flex flex-col place-content-center place-items-center border border-[#cecece] rounded-xl shadow-lg"
              >
                <div className="w-full flex place-content-between px-5 mt-2">
                  <div className="flex place-items-end">
                    <h3 className="text-black text-lg lg:text-xl font-bold font-['Sarabun']">
                      {project.projectName}
                    </h3>
                  </div>
                  <div className="flex place-items-center">
                    <svg
                      onClick={() => {
                        Swal.fire({
                          title: `ลบข้อมูล "${project.projectName}" จริงหรือไม่`,
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
                              URL: `qc/projectTest/${project.ID}`,
                            });
                            await refreshData();
                            Swal.fire({
                              title: "ลบข้อมูลสำเร็จ",
                              text: `ข้อมูลเกี่ยวกับ "${project.projectName}" ถูกลบสำเร็จ`,
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
                  </div>
                </div>
                <h4 className="text-gray-500 w-full text-base font-normal font-['Sarabun'] pl-16 mt-5">
                  รายละเอียด
                </h4>
                <div className="w-[92%] h-auto my-[20px] flex flex-col place-content-start">
                  <div>
                    <h3 className="text-black font-bold mt-10">
                      {/* {itemProject.name} */}
                    </h3>
                    <div className="mt-5">
                      <div className="text-black font-bold">
                        <div className="bg-[#6494d3] rounded-t-3xl flex flex-row h-10 place-items-center">
                          <div className="w-4/12 text-center text-base lg:text-lg font-bold font-['Sarabun'] text-ellipsis overflow-hidden">
                            ชื่อการทดสอบ
                          </div>
                          <div className="w-8/12 text-center text-base lg:text-lg font-bold font-['Sarabun'] text-ellipsis overflow-hidden">
                            รายละเอียด
                          </div>
                        </div>
                      </div>
                      {project.qcItemProject.map((itemProject) => {
                        return (
                          <div key={itemProject.ID} className="text-black">
                            <div className="flex flex-row w-full h-12 hover:bg-gray-200">
                              <div className="w-4/12 text-start text-base lg:text-lg font-['Sarabun'] flex place-items-center place-content-start">
                                <div className="hidden sm:block">
                                  {Translator.qc.icon}
                                </div>
                                <h5 className="sm:ml-1 text-ellipsis overflow-hidden">
                                  {itemProject.qcMain.testName}
                                </h5>
                              </div>
                              <div className="w-8/12 text-start text-base lg:text-lg font-['Sarabun'] flex place-items-center place-content-start">
                                <div className="hidden sm:block">
                                  {Translator.detail.icon}
                                </div>
                                <h5 className="sm:ml-1 text-ellipsis overflow-hidden">
                                  {itemProject.qcMain.detail}
                                </h5>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
