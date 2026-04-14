"use client";

import React from "react";
import { useEffect, useState } from "react";
import Select from "react-select";
import { Translator } from "../translator";
import { localStorageWeb } from "@/utils/localstorage";
import SubmitButton from "../submitButton";
import Swal from "sweetalert2";
import ButtonBlue from "../buttonBlue";

export default function CalibrateFile() {
  const [currentWidth, setCurrentWidth] = useState(0); //ขนาดความกว้างของหน้าจอ
  const [existingFileName, setExistingFileName] = useState<string | null>(null);
  const [mode, setMode] = useState<"emissivity" | "file">("emissivity");
  const [emissivity, setEmissivity] = useState<string>("");
  const [files, setFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

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

  useEffect(() => {
    const saved = localStorageWeb.getItem("emissivity");
    if (saved) setEmissivity(saved);
  }, []);

  const handleSaveSelectedFile = async () => {
    if (!selectedFile) {
      Swal.fire({ icon: "warning", title: "กรุณาเลือกไฟล์" });
      return;
    }
    const res = await window.electronAPI.readCalibrateFile(selectedFile);
    if (res?.status) {
      localStorageWeb.setItem("fileCalibrate", selectedFile);
      setExistingFileName(selectedFile);
      Swal.fire({ icon: "success", title: "เลือกไฟล์สำเร็จ" });
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

  const handleSaveEmissivity = async () => {
    const val = Number(emissivity);
    if (Number.isNaN(val) || val < 0 || val > 1) {
      Swal.fire({ icon: "error", title: "ค่าต้องอยู่ระหว่าง 0 ถึง 1" });
      return;
    }
    localStorageWeb.setItem("emissivity", String(val));
    Swal.fire({ icon: "success", title: "บันทึกค่า Emissivity สำเร็จ" });
  };

  return (
    <div className="text-start bg-white p-5 sm:p-10 2xl:p-20 border-black border-2 rounded-2xl flex flex-col">
      <div className="flex flex-col w-full">
        <h1 className="text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl text-black mb-4">
          ตั้งค่าเซนเซอร์อุณหภูมิ
        </h1>
        <div className="flex gap-4 mb-6" style={{ width: currentWidth / 2 }}>
          <button
            className={`px-4 py-2 rounded-md border text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl ${mode === "emissivity" ? "bg-gray-200" : "bg-white"}`}
            onClick={() => setMode("emissivity")}
          >
            ใช้ค่า Emissivity
          </button>
          <button
            className={`px-4 py-2 rounded-md border text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl ${mode === "file" ? "bg-gray-200" : "bg-white"}`}
            onClick={() => setMode("file")}
          >
            คาลิเบรตจากไฟล์
          </button>
        </div>

        {mode === "emissivity" ? (
          <div
            className="flex flex-col gap-3"
            style={{ width: currentWidth / 2 }}
          >
            <label className="text-black text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl">
              กำหนดค่า Emissivity (ε)
            </label>
            <input
              type="number"
              step="0.01"
              min={0}
              max={1}
              value={emissivity}
              placeholder="0.00 - 1.00"
              className="h-[40px] md:h-[50px] w-full border border-black px-3 text-xl xl:text-2xl rounded-md"
              onChange={(e) => setEmissivity(e.target.value)}
              onBlur={(e) => {
                const num = Number(e.target.value);
                if (Number.isNaN(num)) return;
                const clamped = Math.max(0, Math.min(1, num));
                setEmissivity(String(clamped));
              }}
            />
            <div className="mt-6 flex place-content-end">
              <SubmitButton text={"บันทึก"} onClick={handleSaveEmissivity} />
            </div>
          </div>
        ) : (
          <div
            className="flex flex-col gap-3"
            style={{ width: currentWidth / 2 }}
          >
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
                    Swal.fire({ icon: "success", title: "อัปโหลดสำเร็จ" });
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

              <button className="px-3 py-2 cursor-pointer" onClick={handleDeleteSelectedFile}>
                {Translator.delete.icon}
              </button>
            </div>
            <div className="mt-6 flex place-content-end">
              <SubmitButton text={"บันทึก"} onClick={handleSaveSelectedFile} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
