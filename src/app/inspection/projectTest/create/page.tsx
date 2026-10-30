"use client";
import React from "react";
import BackButton from "@/components/backButton";
import { localStorageWeb } from "@/utils/localstorage";
import { useState, useEffect } from "react";
import Select, { MultiValue } from "react-select";
import Swal from "sweetalert2";
import SideBar from "@/components/sidebar";

import Breadcrumb from "@/components/breadcrumb";
import Footer from "@/components/footer";

export default function CreateQcproject() {
  const [detail, setDetail] = useState("");
  const [name, setName] = useState("");
  const [qcMain, setQcMain] =
    useState<MultiValue<{ value: string; label: string }>>();
  const [disAbleClick, setDisAbleClick] = useState(false);

  const [qcMainList, setQcMainList] = useState<{
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
      },
    ];
    allPage: number;
  } | null>();

  const createQcProject = async () => {
    if (disAbleClick) return;
    setDisAbleClick(true);
    setTimeout(() => {
      setDisAbleClick(false);
    }, 2000);
    // ตรวจสอบ fields ที่มี * สีแดง
    if (!name || !qcMain?.length) {
      return Swal.fire({
        position: "top-end",
        icon: "error",
        title: "กรอกข้อมูลไม่ครบ",
        text: "กรุณากรอกข้อมูลให้ครบตามช่องที่มี * สีแดง",
      });
    }
    const temp = qcMain.map((data) => data.value);
    const data = await window.electronAPI.fetchAPI({
      method: "POST",
      URL: `qc/itemProject/multi`,
      body: {
        projectName: name,
        detail: detail,
        qcMainID: temp,
      },
    });
    if (!data) {
      return Swal.fire({
        icon: "error",
        title: "ไม่สามารถสร้างโปรเจกต์ได้",
        text: "กรุณาตรวจสอบข้อมูล หรือการเชื่อมต่อกับระบบใหม่อีกครั้ง",
      });
    } else {
      return Swal.fire({
        position: "top-end",
        icon: "success",
        title: "บันทึกข้อมูลเรียบร้อย",
        showConfirmButton: false,
        timer: 1500,
      }).then(() => {
        window.location.reload();
      });
    }
  };
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
    setQcMainList(data);
  };

  return (
    <div className="flex h-screen">
      <SideBar />
      <div className="w-full h-full flex flex-col">
        <Breadcrumb />
        <div className=" flex flex-col bg-white w-full h-full overflow-y-auto whitespace-nowrap place-items-center pt-10">
          <div className="flex flex-col sm:flex-row w-full sm:place-content-between sm:place-items-centers ">
            <div
              tabIndex={0}
              onClick={() => {
                localStorageWeb.setItem("currentUrl", "qc/projectTest");
                window.location.reload();
              }}
              className="ml-5 sm:ml-20 cursor-pointer"
            >
              <BackButton />
            </div>
            <p className="font-bold ml-15 text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl">
              สร้างโปรเจกต์การทดสอบ
            </p>
            <button
              className="ml-auto mr-5 sm:mr-20 px-10 py-3 text-white  text-lg   rounded-xl bg-[#001F3F]
            xl:text-xl 
            2xl:text-2xl
            hover:cursor-pointer"
              onClick={createQcProject}
            >
              สร้าง
            </button>
          </div>

          <div className="w-[90%] mx-10 px-10 py-10 flex flex-col gap-8 rounded-xl border-2 mt-[20px]">
            {/* ชื่อการทดสอบ */}
            <div>
              <div className="flex">
                <p className="text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl">
                  ชื่อโปรเจกต์การทดสอบ
                </p>
                <span className="text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl text-red-600">
                  &nbsp;*
                </span>
              </div>

              <div className="flex gap-10 items-center">
                <input
                  placeholder="ชื่อโปรเจกต์การทดสอบ"
                  className="w-full px-8 h-10 text-xl  2xl:text-2xl 3xl:text-3xl 4xl:text-4xl border rounded-sm"
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            {/* เลือกประเภทการทดสอบ*/}
            <div>
              <div className="flex">
                <p className="text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl">
                  การทดสอบ{" "}
                </p>
                <span className="text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl text-red-600">
                  &nbsp;*
                </span>
              </div>

              <div className="flex gap-10 items-center">
                <Select
                  isMulti
                  className="w-full text-xl  2xl:text-2xl 3xl:text-3xl 4xl:text-4xl rounded-sm border-gray-300"
                  options={qcMainList?.data?.map((data: any) => ({
                    value: data.ID,
                    label: data.testName,
                  }))}
                  onChange={(e) => setQcMain(e)}
                />
              </div>
            </div>

            {/* รายละเอียดการทดสอบ */}
            <div>
              {" "}
              <div className="flex">
                <p className="text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl">
                  รายละเอียด
                </p>

              </div>
              <div className="flex gap-10 items-center">
                <textarea
                  className="bg-white border border-black w-full h-[150px] min-h-[50px] max-h-[150px] rounded-lg text-base text-xl  2xl:text-2xl 3xl:text-3xl 4xl:text-4xl font-normal  px-2 py-2"
                  maxLength={200}
                  onChange={(e) => setDetail(e.target.value)}
                ></textarea>
              </div>
            </div>
          </div>
          <div className="flex flex-col-reverse place-content-center mt-auto">
            <Footer />
          </div>
        </div>
      </div>
    </div>
  );
}
