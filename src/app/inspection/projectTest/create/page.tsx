"use client";
import React from "react";
import BackButton from "@/components/backButton";
import Link from "next/link";
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
    if (!qcMain?.length)
      return Swal.fire({
        icon: "error",
        title: "กรอกข้อมูลไม่ครบ",
        text: "กรุณากรอกข้อมูลให้ครบตามช่องที่มี * สีแดง",
      });
    const temp = qcMain.map((data) => data.value);
    if (!(!name || !qcMain.length)) {
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
          title: "ตรวจสอบข้อมูลใหม่อีกครั้ง",
          text: "ชื่อผู้ใช้งานและอีเมล์ไม่สามารถซ้ำกับของที่มีอยู่ได้ และข้อมูลที่จำเป็นต้องกรอกกรอกครบเรียบร้อยแล้ว",
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
    } else {
      return Swal.fire({
        icon: "error",
        title: "กรอกข้อมูลไม่ครบ",
        text: "กรุณากรอกข้อมูลให้ครบตามช่องที่มี * สีแดง",
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
    <div className="flex">
      <SideBar />
      <div className="w-full h-full flex flex-col">
        <Breadcrumb />
        <div className="w-full flex items-center px-20 py-5 ">
          <div
            tabIndex={0}
            onClick={() => {
              localStorage.setItem("currentUrl", "qc/projectTest");
              window.location.reload();
            }}
            className="ml-5 sm:ml-20 cursor-pointer"
          >
            <BackButton />
          </div>
          <p className="font-bold ml-15 text-xl 2xl:text-2xl">
            สร้างโปรเจ็คการทดสอบ
          </p>
          <button
            className="ml-auto px-10 py-3 text-white  text-lg   rounded-xl bg-[#001F3F] 
            xl:text-xl 
            2xl:text-2xl"
            onClick={createQcProject}
          >
            สร้าง
          </button>
        </div>

        <div className="mx-10 px-10 py-10 flex flex-col gap-8 rounded-xl border-2">
          {/* ชื่อการทดสอบ */}
          <div>
            <div className="flex">
              <p>ชื่อโปรเจ็คการทดสอบ</p>
              <span className="text-red-600">&nbsp;*</span>
            </div>

            <div className="flex gap-10 items-center">
              <input
                placeholder="ชื่อโปรเจ็คการทดสอบ"
                className="w-full px-8 h-10 text-lg border rounded-sm"
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          {/* เลือกประเภทการทดสอบ*/}
          <div>
            <div className="flex">
              <p>การทดสอบ </p>
              <span className="text-red-600">&nbsp;*</span>
            </div>

            <div className="flex gap-10 items-center">
              <Select
                isMulti
                className="w-full rounded-sm border-gray-300"
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
              <p>รายละเอียด</p>
              <span className="text-red-600">&nbsp;*</span>
            </div>
            <div className="flex gap-10 items-center">
              <textarea
                className="bg-white border border-black w-full h-[150px] min-h-[50px] max-h-[150px] rounded-lg text-base lg:text-lg xl:text-2xl font-normal  px-2 py-2"
                maxLength={200}
                onChange={(e) => setDetail(e.target.value)}
              ></textarea>
            </div>
          </div>
        </div>
        <div className="flex flex-col-reverse place-content-center">
          <Footer />
        </div>
      </div>
    </div>
  );
}
