"use client";
import { use, useEffect, useState } from "react";
import React from "react";
import BackButton from "@/components/backButton";
import Link from "next/link";
import Swal from "sweetalert2";

export default function Create_page() {
  const [name, setName] = useState("");
  const [detail, setDetail] = useState("");
  const [qcType, setQcType] = useState({ name: "", value: "" });
  const [qcTypeList, setQcTypeList] = useState<{
    error: boolean;
    message: string;
    data: [
      {
        ID: string;
        name: string;
      }
    ];
    allPage: number;
  } | null>();
  const [qcScript, setQcScript] = useState({
    TemperatureMax: 0,
    CurrentMax: 0,
    Time: 0,
  });

  async function clickCreate() {
    try {
      const temp = { ...qcScript };
      if (!name || !qcType.value) {
        Swal.fire({
          icon: "error",
          title: "กรอกข้อมูลไม่ครบ",
          text: "กรุณากรอกข้อมูลให้ครบตามช่องที่มี * สีแดง",
        });
        return;
      }

      const data = await window.electronAPI.fetchAPI({
        method: "POST",
        URL: "qc/main",
        body: {
          qcType: qcType.value,
          testName: name,
          detail: detail,
          script: temp,
        },
      });
      if (!data) {
        Swal.fire({
          icon: "error",
          title: "ตรวจสอบข้อมูลใหม่อีกครั้ง",
          text: "ชื่อการทดสอบไม่สามารถซ้ำกับของที่มีอยู่ได้ และข้อมูลที่จำเป็นต้องกรอกกรอกครบเรียบร้อยแล้ว",
        });
      } else {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: "บันทึกข้อมูลเรียบร้อย",
          showConfirmButton: false,
          timer: 1500,
        }).then(() => window.location.reload());
      }
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "API Error",
        text:
          error?.response?.data?.message ||
          error?.message ||
          "Unknown error occurred",
      });
    }
  }

  const fetchData = async () => {
    const qcTypeData = await fetchQcTypeList();
    setQcTypeList(qcTypeData);
  };

  const fetchQcTypeList = async () => {
    var data = await window.electronAPI.fetchAPI({
      method: "GET",
      URL: `qc/type?limit=9999999&page=1`,
    });
    if (!data) {
      throw new Error("Failed to fetch data");
    }
    return data;
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div>
      <div className="w-full flex items-center px-20 py-5 ">
        <BackButton href="/inspection/settingTest" />
        <p className="font-bold ml-15 text-xl 2xl:text-2xl">สร้างการทดสอบ</p>
        <button
          className="ml-auto px-10 py-3 text-white  text-lg   rounded-xl bg-[#001F3F] 
            xl:text-xl 
            2xl:text-2xl"
          onClick={clickCreate}
        >
          สร้าง
        </button>
      </div>

      <div className="mx-10 px-10 py-10 flex flex-col gap-8 rounded-xl border-2">
        {/* เลือกประเภทการทดสอบ*/}
        <div>
          <div className="flex">
            <p className="lg:text-lg xl:text-xl">ประเภทการทดสอบ</p>
            <span className="text-red-600">&nbsp;*</span>
          </div>

          <div className="flex gap-10 items-center">
            {qcType ? (
              <select
                defaultValue={"none"}
                onChange={(e) => {
                  setQcType({
                    value: e.target.value,
                    name: e.target.options[e.target.selectedIndex].text,
                  });
                }}
                className="w-[80%] px-8 h-10 text-lg border rounded-sm"
              >
                <option value="" disabled hidden>
                  {" "}
                  เลือกประเภทการทดสอบ
                </option>
                {qcTypeList?.data?.map((data) => {
                  return (
                    <option
                      key={data.ID}
                      value={data.ID}
                      data-something={data.name}
                    >
                      {data.name}
                    </option>
                  );
                })}
              </select>
            ) : (
              <select className="w-[80%] px-8 h-10 text-lg border rounded-sm">
                <option value="" disabled hidden>
                  {" "}
                  No options
                </option>
              </select>
            )}

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
            <p className="lg:text-lg xl:text-xl">ชื่อการทดสอบ</p>
            <span className="text-red-600">&nbsp;*</span>
          </div>

          <div className="flex gap-10 items-center">
            <input
              placeholder="ชื่อการทดสอบ"
              className="w-full px-8 h-10 text-lg border rounded-sm"
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>

        {/* รายละเอียดการทดสอบ */}
        <div>
          {" "}
          <div className="flex">
            <p className="lg:text-lg xl:text-xl">รายละเอียด</p>
            <span className="text-red-600">&nbsp;*</span>
          </div>
          <div className="flex gap-10 items-center">
            <input
              className="w-full px-8 h-10 text-lg border rounded-sm"
              onChange={(e) => setDetail(e.target.value)}
            />
          </div>
        </div>

        {qcType.name === "temperature" && (
          <div className="grid grid-cols-2 rounded-xl border">
            {Object.keys(qcScript).map((key, index) => (
              <div key={index}>
                <label className="w-full md:w-[45%] h-auto mx-5 md:mx-3 lg:mx-5 my-3 flex flex-col">
                  <h4 className="text-base lg:text-lg xl:text-xl">
                    {key}
                    <span className="text-red-600">&nbsp;*</span>
                  </h4>
                  <input
                    className="h-[40px] md:h-[50px] w-full border mt-1 px-3 text-base lg:text-lg xl:text-2xl rounded-md"
                    type="number"
                    maxLength={50}
                    placeholder="PowerLowLimit"
                    value={qcScript[key as keyof typeof qcScript]}
                    onChange={(e) =>
                      setQcScript({
                        ...qcScript,
                        [key]: Number(e.target.value),
                      })
                    }
                    required
                  />
                </label>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
