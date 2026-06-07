"use client";

import React from "react";
import { useEffect, useState } from "react";
import Select from "react-select";
import { Translator } from "../translator";
import { localStorageWeb } from "@/utils/localstorage";
import SubmitButton from "../submitButton";
import Swal from "sweetalert2";
import ButtonBlue from "../buttonBlue";

type CalibrationData = {
  // Sensor 1 (also mirrored to Sensor 3)
  m1?: number; c1?: number; m2?: number; c2?: number; k1?: number; x01?: number;
  // Sensor 2 (also mirrored to Sensor 4)
  m3?: number; c3?: number; m4?: number; c4?: number; k2?: number; x02?: number;
};

export default function CalibrateFile({
  onSave,
  onClose,
}: {
  onSave?: (data: CalibrationData) => void;
  onClose?: () => void;
}) {
  const [currentWidth, setCurrentWidth] = useState(0); //ขนาดความกว้างของหน้าจอ
  const [existingFileName, setExistingFileName] = useState<string | null>(null);
  const [mode, setMode] = useState<"file">("file");
  const [files, setFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [colabIcon, setColabIcon] = useState<string | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setCurrentWidth(window.innerWidth);
    };
    if (typeof window) {
      window.addEventListener("resize", handleResize);
      setCurrentWidth(window.innerWidth);
    }
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const loadIcon = async () => {
      // @ts-ignore
      const icon = await window.electronAPI.loadImg("colab-icon.png");
      setColabIcon(icon);
    };
    loadIcon();
  }, []);

  useEffect(() => {
    const loadExisting = async () => {
      const res = await window.electronAPI.readCalibrateFile();
      if (res?.status && res?.name) {
        const name = res.name;
        setExistingFileName(name || null);
        setSelectedFile(name || null);
      }
    };
    loadExisting();
  }, []);




  useEffect(() => {
    const loadFiles = async () => {
      const res = await window.electronAPI.listDataFiles();
      if (res?.status && Array.isArray(res.files)) {
        setFiles(res.files);
        if (!selectedFile && res.files.length) {
          setSelectedFile(
            res.files.includes(existingFileName || "")
              ? existingFileName
              : res.files[0]
          );
        }
      }
    };
    loadFiles();
  }, [existingFileName]);


  const handleSaveSelectedFile = async (fileName?: string) => {
    const fileToRead = fileName || selectedFile;
    if (!fileToRead) {
      Swal.fire({ icon: "warning", title: "กรุณาเลือกไฟล์" });
      return;
    }
    const res = await window.electronAPI.readCalibrateFile(fileToRead);
    if (res?.status) {
      localStorageWeb.setItem("fileCalibrate", fileToRead);
      setExistingFileName(fileToRead);

      // อ่านค่าจากไฟล์และส่งกลับผ่าน onSave
      const pairs = res.text;
      if (onSave && pairs) {
        onSave({
          // Sensor 1 (mirrored to Sensor 3 in commandStr)
          m1: pairs[0]?.x ?? 0,
          c1: pairs[0]?.y ?? 0,
          m2: pairs[1]?.x ?? 0,
          c2: pairs[1]?.y ?? 0,
          k1: pairs[2]?.x ?? 0,
          x01: pairs[2]?.y ?? 0,
          // Sensor 2 (mirrored to Sensor 4 in commandStr)
          m3: pairs[3]?.x ?? 0,
          c3: pairs[3]?.y ?? 0,
          m4: pairs[4]?.x ?? 0,
          c4: pairs[4]?.y ?? 0,
          k2: pairs[5]?.x ?? 0,
          x02: pairs[5]?.y ?? 0,
        });
      }
      Swal.fire({ icon: "success", title: "เลือกไฟล์สำเร็จ", timer: 1500, showConfirmButton: false });
    } else {
      Swal.fire({ icon: "error", title: res?.error || "ไม่สามารถอ่านไฟล์ได้" });
    }
  };

  const handleDeleteSelectedFile = async () => {
    if (!selectedFile) {
      Swal.fire({ icon: "warning", title: "กรุณาเลือกไฟล์" });
      return;
    }
    const result = await Swal.fire({
      title: `ลบข้อมูล "${selectedFile}" จริงหรือไม่`,
      text: "หลังจากลบไปแล้วข้อมูลที่เกี่ยวข้องทั้งหมดจะถูกลบไปด้วย",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "ตกลง",
      cancelButtonText: "ยกเลิก",
    });

    if (!result.isConfirmed) return;

    const res = await window.electronAPI.deleteDataFile(selectedFile);
    if (!res?.status) {
      Swal.fire({ icon: "error", title: res?.error || "ลบไฟล์ไม่สำเร็จ" });
      return;
    }

    const nextFiles = files.filter((f) => f !== selectedFile);
    setFiles(nextFiles);
    const nextSelected = nextFiles.length ? nextFiles[0] : null;
    setSelectedFile(nextSelected);
    if (existingFileName === selectedFile) {
      setExistingFileName(nextSelected);
      if (nextSelected) {
        localStorageWeb.setItem("fileCalibrate", nextSelected);
      } else {
        localStorageWeb.setItem("fileCalibrate", "");
      }
    }
    Swal.fire({ icon: "success", title: "ลบไฟล์สำเร็จ" });
  };


  return (
    <div className="text-start bg-white p-5 sm:p-10 2xl:p-20 border-black border-2 rounded-2xl flex flex-col">
      <div className=" flex flex-col w-full">
        <h1 className="text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl text-black mb-4">
          ตั้งค่าอุณหภูมิเซนเซอร์
        </h1>
        <div className="flex flex-col gap-3" style={{ width: currentWidth / 2 }}>
          <label className="text-black text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl">
            ไฟล์ Calibrate Sensor
          </label>
          <div className="flex items-center gap-4">
            <div className="w-full h-[40px] md:h-[50px] bg-white rounded-md text-black text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl px-3 font-normal ">
              <Select
                className="rounded-sm border"
                options={files.map((name) => ({ value: name, label: name }))}
                value={
                  selectedFile
                    ? { value: selectedFile, label: selectedFile }
                    : null
                }
                onChange={(opt: any) => setSelectedFile(opt?.value || null)}
              />
            </div>

            <button
              className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 cursor-pointer"
              onClick={async () => {
                const res =
                  await window.electronAPI.uploadCalibrateFileDialog();
                if (res?.status) {
                  const list = await window.electronAPI.listDataFiles();
                  if (list?.status) setFiles(list.files);
                  setSelectedFile(res.name);
                  setExistingFileName(res.name);
                  // บันทึกและปิดอัตโนมัติ
                  await handleSaveSelectedFile(res.name);
                } else {
                  if (res?.error !== "canceled")
                    Swal.fire({
                      icon: "error",
                      title: res?.error || "อัปโหลดไม่สำเร็จ",
                    });
                }
              }}
            >
              อัปโหลดไฟล์
            </button>

            <button className="px-3 py-2 cursor-pointer" onClick={() => handleDeleteSelectedFile()}>
              {Translator.delete.icon}
            </button>
          </div>
          <div className="flex justify-between gap-4 mt-6 w-full">
            <button
              className="w-fit h-fit py-2 px-4 gap-2 self-end text-sm md:text-base xl:text-lg 2xl:text-xl 3xl:text-2xl 4xl:text-3xl bg-white rounded-md border border-gray-300 flex items-center justify-center 
              hover:bg-gray-100 cursor-pointer overflow-hidden "
              onClick={() => {
                // @ts-ignore
                window.electronAPI.openExternal("https://colab.research.google.com/drive/1g0utsyj2iORA-kIcznrrNam_okgxYL3R?usp=sharing&fbclid=IwY2xjawSRNMRleHRuA2FlbQIxMABicmlkETExNWg3OHBhY3o2bFQ1RkpTc3J0YwZhcHBfaWQQMjIyMDM5MTc4ODIwMDg5MgABHux-FEWqoDI_V2evMnKPdd2qL9wPUzCkxp4tAOhO1zoM6BeEDp99OSLALJAL_aem_MMbI62ZmWlot6k-gUraWCg#scrollTo=TxURO99NSc_m");
              }}
              title="Open Colab Notebook"
            >
              {colabIcon ? (
                <>
                  <img className="w-8 h-8 object-contain" src={colabIcon} alt="Colab Icon" />
                  <p>คาลิเบตสูตรใหม่</p>
                </>
              ) : (
                "C"
              )}
            </button>
            <SubmitButton text={"บันทึก"} onClick={async () => {
              await handleSaveSelectedFile();
              if (onClose) onClose();
            }} />
          </div>
        </div>

      </div>
    </div>
  );
}
