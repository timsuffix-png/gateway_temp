"use client"
import ButtonBlue from "@/components/buttonBlue";
import { useState, useEffect } from "react";
import Swal from "sweetalert2";

export default function APISetting() {
  const [apiPath, setApiPath] = useState("");
  const [currentWidth, setCurrentWidth] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setApiPath(await window.electronAPI.getAPIPath());
    };
    fetchData();
    
    const handleResize = () => {
      setCurrentWidth(window.innerWidth);
    };
    if (typeof window) {
      window.addEventListener("resize", handleResize);
      setCurrentWidth(window.innerWidth);
    }
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="bg-white p-5 sm:p-10 2xl:p-20 border-black border-2 rounded-2xl flex flex-col">
      <label className="flex flex-col w-full">
        <h1 className="text-lg lg:text-2xl text-black  mb-2">
          ลิ้งค์ปลายทาง
        </h1>
        <input
          className="h-[40px] md:h-[50px] bg-white rounded-md border border-black text-black text-lg lg:text-2xl px-3 font-normal "
          style={{width: currentWidth/2}}
          type="text"
          placeholder="https://"
          value={apiPath}
          onChange={(e) => setApiPath(e.target.value)} //เซ็ทAPI
          onClick={(e: any) => {
            e.target.selectionStart = 0;
            e.target.selectionEnd = apiPath.length;
          }}
        />
      </label>
      <div className="mt-10 flex place-content-end">
        <ButtonBlue
          name="บันทึก"
          onClick={async () => {
            if (apiPath.length < 10)
              return Swal.fire({
                icon: "error",
                title: "ตรวจสอบข้อมูลใหม่อีกครั้ง",
                text: "ข้อมูลไม่ถูกต้อง",
              });
            await window.electronAPI.setAPIPath(apiPath);
            setApiPath(await window.electronAPI.getAPIPath());
            return Swal.fire({
              position: "top-end",
              icon: "success",
              title: "บันทึกข้อมูลเรียบร้อย",
              showConfirmButton: false,
              timer: 1500,
            });
          }}
        />
      </div>
    </div>
  );
}
