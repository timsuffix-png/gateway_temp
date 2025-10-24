"use client";

import { useState, useEffect } from "react";
import { localStorageWeb } from "@/utils/localstorage";
import SideBar from "@/components/sidebar";
import Breadcrumb from "@/components/breadcrumb";
import Footer from "@/components/footer";
import SubmitButton from "@/components/submitButton";
import Swal from "sweetalert2";
import BackButton from "@/components/backButton";
import { useAuth } from "@/lib/auth/authProvider";

export default function EditQcType() {
  const auth = useAuth()
  const param = localStorageWeb.getItem("param")
  const [name, setName] = useState("");

  useEffect(() => {
    refreshData();
  }, [auth]);

  const fetchQcTypeData = async () => {
    const data = await window.electronAPI.fetchAPI({
      method: "GET",
      URL: `qc/type/${param}`
    })
    if (!data) {
      throw new Error("Failed to fetch data");
    }
    return data
  };

  const refreshData = async () => {
    const qcTypeData = await fetchQcTypeData();
    setName(qcTypeData.data.name);
  };

  const editQcType = async () => {
    if (name) {
      const data = await window.electronAPI.fetchAPI({
        method: "PATCH",
        URL: `qc/type/${param}`,
        body: {
          name: name
        }
      })
      if (!data) {
        Swal.fire({
          icon: "error",
          title: "ตรวจสอบข้อมูลใหม่อีกครั้ง",
          text: "ชื่อประเภทการทดสอบอาจจะซ้ำกับของที่มีอยู่",
        });
      } else {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: "บันทึกข้อมูลเรียบร้อย",
          showConfirmButton: false,
          timer: 1500,
        });
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } else {
      Swal.fire({
        icon: "error",
        title: "กรอกข้อมูลไม่ครบ",
        text: "กรุณากรอกข้อมูลให้ครบตามช่องที่มี * สีแดง",
      });
    }
  };

  return (
    <>
      <div className="flex w-screen h-screen scroll-smooth">
        <div>
          <SideBar />
        </div>
        <div className="flex flex-col w-full h-full">
          <Breadcrumb />
          <div className="flex flex-col bg-white w-full h-full overflow-y-auto whitespace-nowrap place-qcs-center pt-[60px]">
            <div className="flex flex-row w-full place-qcs-center">
              <div tabIndex={0} onClick={() => {
                  localStorageWeb.setItem("currentUrl", "qc/testSetting/create/qcType");
                  window.location.reload();
                }} className="ml-5 sm:ml-20 cursor-pointer">
                <BackButton text="ย้อนกลับ" />
              </div>
              <h2 className="ml-5 sm:ml-20 text-black text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl  font-bold  text-wrap">
                แก้ไขประเภทการทดสอบ
              </h2>
            </div>
            <div className="flex flex-col w-full mt-10">
              <div className="flex flex-row w-full place-qcs-center">
                <h2 className="ml-16 lg:ml-40 text-black text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl font-normal ">
                  แก้ไขชื่อประเภทการทดสอบ
                </h2>
              </div>
              <div className="flex place-qcs-center place-content-center mt-10">
                <label className="mx-20 w-3/4 sm:w-1/2 flex flex-col">
                  <h4 className="text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl text-black font-normal ">
                    ชื่อประเภทการทดสอบ
                    <span className="text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl text-red-600">&nbsp;*</span>
                  </h4>
                  <input
                    type="text"
                    className="h-[40px] md:h-[50px] w-[90%] xl:w-[600px] border border-black mt-1 lg:ml-10 px-3 text-black text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl font-normal  rounded-md"
                    defaultValue={name}
                    placeholder="ชื่อประเภทการทดสอบ"
                    onChange={(e) => setName(e.target.value)}
                  />
                </label>
                <SubmitButton text="บันทึก" onClick={editQcType} />
              </div>
            </div>
            <div className="flex flex-col-reverse place-content-center mt-auto">
              <Footer />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
