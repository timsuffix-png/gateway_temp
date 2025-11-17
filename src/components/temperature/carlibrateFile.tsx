import React from "react";
import { useEffect, useState } from "react";
import { localStorageWeb } from "@/utils/localstorage";
import SubmitButton from "../submitButton";
import Swal from "sweetalert2";

export default function CalibrateFile() {
  const [currentWidth, setCurrentWidth] = useState(0); //ขนาดความกว้างของหน้าจอ
  const [file, setFile] = useState<File | null>(null);
  const [existingFileName, setExistingFileName] = useState<string | null>(null);
  const [mode, setMode] = useState<"emissivity" | "file">("emissivity");
  const [emissivity, setEmissivity] = useState<string>("");

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
      }
    };
    loadExisting();
  }, []);

  useEffect(() => {
    const saved = localStorageWeb.getItem("emissivity");
    if (saved) setEmissivity(saved);
  }, []);

    const handleUpload = async () => {
    if (!file) {
      Swal.fire({ icon: "warning", title: "กรุณาเลือกไฟล์" });
      return;
    }
    try {
      const bytes = await file.arrayBuffer();
      const res = await window.electronAPI.uploadCalibrateFile({
        name: file.name,
        bytes,
      });
      if (res?.status) {
        localStorageWeb.setItem("fileCalibrate", file.name);
        setExistingFileName(file.name); // เก็บชื่อไฟล์ลง state เพื่อแสดงผลทันที
        localStorageWeb.removeItem("emissivity");
        Swal.fire({ icon: "success", title: "อัปโหลดสำเร็จ" });
      } else {
        Swal.fire({ icon: "error", title: res?.error || "อัปโหลดไม่สำเร็จ" });
      }
    } catch (e: any) {
      Swal.fire({ icon: "error", title: e?.message || "อัปโหลดไม่สำเร็จ" });
    }
  };

  const handleSaveEmissivity = async () => {
    const val = Number(emissivity);
    if (Number.isNaN(val) || val < 0 || val > 1) {
      Swal.fire({ icon: "error", title: "ค่าต้องอยู่ระหว่าง 0 ถึง 1" });
      return;
    }
    localStorageWeb.setItem("emissivity", String(val));
    localStorageWeb.removeItem("fileCalibrate");
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
              กำหนดค่า Emissivity
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
              <SubmitButton
                text={"บันทึก"}
                onClick={handleSaveEmissivity}
              />
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
              <input
                id="fileInput"
                type="file"
                accept=".txt"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  setFile(f || null);
                }}
              />
              <label
                htmlFor="fileInput"
                className="border w-full p-2 text-gray-600 text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl text-black rounded-sm cursor-pointer"
              >
                {file ? file.name : (existingFileName ?? "กรุณาเลือกไฟล์...")}
              </label>
            </div>
            <div className="mt-6 flex place-content-end">
              <SubmitButton text={"บันทึก"} onClick={handleUpload} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
