"use client";

import { useState, useEffect, useRef } from "react";
import SideBar from "@/components/sidebar";
import Breadcrumb from "@/components/breadcrumb";
import BackButton from "@/components/backButton";
import Footer from "@/components/footer";
import Popup from "@/components/popup";
import SerialCommunicationPort from "@/components/temperature/serialCommunicationPort";
import { localStorageWeb } from "@/utils/localstorage";
import * as XLSX from "xlsx";
import Swal from "sweetalert2";

/**
 * Data structure for sensor readings
 */
interface SensorData {
  ir1: number;
  ir2: number;
  ir3: number;
  ir4: number;
  time: number;
}

const detailTemp: Record<string, Record<string, string>> = {
  ironInterrupt: {
    "010": "เซนเซอร์ ขวา มีปัญหาในการอ่านค่า",
    "011": "เซนเซอร์ ซ้าย มีปัญหาในการอ่านค่า",
    "012": "เซนเซอร์ กลาง มีปัญหาในการอ่านค่า",
    "013": "เซนเซอร์ บน มีปัญหาในการอ่านค่า",
    "000": "โปรดตรวจเช็คว่าเครื่องเปิดหรือว่าเสียบปลั๊กหรือยัง",
    "666": "กำลังดำเนินการ",
    "777": "หยุดโดยผู้ใช้งาน",
  },

  detailFailed: {
    "888": "ผ่าน",
    "020": "อุณหภูมิเกินกว่าค่าที่กำหนด",
    "021": "อุณหภูมิต่ำกว่าค่าที่กำหนด",
    "030": "เทอโมสตัดตัดก่อนกำหนด",
    "031": "เทอโมสตัดตัดหลังกำหนด",
    "040": "กระแสไฟฟ้าเกิน"
  },
};

export default function CalibrationTestPage() {
  const [data, setData] = useState<SensorData[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRead, setLastRead] = useState<SensorData | null>(null);
  const [currentCOMPort, setCurrentCOMPort] = useState<number | null>(null);
  const [popup, setPopup] = useState(false);
  const [status, setStatus] = useState("");
  const [detail, setDetail] = useState("");
  const [mode, setMode] = useState<"real" | "mockup">("real");

  const [ambient1, setAmbient1] = useState(0);
  const [ambient2, setAmbient2] = useState(0);
  const [ambient3, setAmbient3] = useState(0);
  const [ambient4, setAmbient4] = useState(0);
  const [current, setCurrent] = useState(0);
  const [time, setTime] = useState(0);

  const ironImageRef = useRef<any | null>(null);
  const dataRef = useRef(data);
  const isFinishingRef = useRef(false);

  const MAX_SAMPLES = 5;

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    const initPort = async () => {
      // @ts-ignore
      const port = await window.electronAPI.getPort();
      setCurrentCOMPort(Number(port));
    };
    initPort();

    // Set current URL for breadcrumb and sidebar
    localStorageWeb.setItem("currentUrl", "calibration-test");

    if (ironImageRef.current) {
      const loadImage = async () => {
        // @ts-ignore
        const logo = await window.electronAPI.loadImg("iron-plate.png");
        ironImageRef.current.src = logo;
      };
      loadImage();
    }

    // @ts-ignore
    const listener = window.electronAPI.onSerialData(handleSerialData);

    return () => {
      // @ts-ignore
      if (window.mockInterval) clearInterval(window.mockInterval);
      // @ts-ignore
      window.electronAPI.removeSerialDataListener(listener);
    };
  }, []);

  const handleSerialData = (dataStr: string) => {
    const parts = dataStr.split(",");
    if (parts.length >= 6) {
      const ir1 = parseFloat(parts[0]);
      const ir2 = parseFloat(parts[1]);
      const ir3 = parseFloat(parts[2]);
      const ir4 = parseFloat(parts[3]);

      let statusVal = "";
      let detailCode = "";
      let currentTime = 0;
      let currentCurr = 0;

      // If 11 or more parts (like temp page), extract extra info
      if (parts.length >= 11) {
        const amb1 = parseFloat(parts[4]) || 0;
        const amb2 = parseFloat(parts[5]) || 0;
        const amb3 = parseFloat(parts[6]) || 0;
        const amb4 = parseFloat(parts[7]) || 0;
        currentTime = parseFloat(parts[9]) || 0;
        currentCurr = parseFloat(parts[10]) || 0;

        setAmbient1(amb1);
        setAmbient2(amb2);
        setAmbient3(amb3);
        setAmbient4(amb4);
        setTime(currentTime);
        setCurrent(currentCurr);

        statusVal = parts[11]?.trim();
        detailCode = parts[12]?.trim();
        setStatus(statusVal);
        setDetail(detailTemp.detailFailed[detailCode] || "-");

        // Record history every 5 seconds while in process OR on finish
        const shouldRecord = (statusVal === "on" && currentTime % 5 === 0) || detailCode === "888";

        if (shouldRecord) {
          // Play beep every 5 seconds (not on 0)
          if (currentTime > 0 && currentTime % 5 === 0) {
            playBeep();
          }

          setHistory(prev => [...prev, {
            sample: dataRef.current.length + 1,
            ir1, ir2, ir3, ir4,
            amb1, amb2, amb3, amb4,
            time: currentTime,
            current: currentCurr,
            status: statusVal,
            detail: detailTemp.detailFailed[detailCode] || "-"
          }]);
        }

        if (detailCode === "888") finishCycle({ ir1, ir2, ir3, ir4 });
      } else {
        // Fallback for 6 parts
        statusVal = parts[4].trim();
        detailCode = parts[5].trim();
        setStatus(statusVal);
        setDetail(detailTemp.detailFailed[detailCode] || "-");

        // Record history every 5 seconds while in process OR on finish
        const shouldRecord = (statusVal === "on" && dataRef.current.length % 5 === 0) || detailCode === "888";

        if (shouldRecord) {
          setHistory(prev => [...prev, {
            sample: dataRef.current.length + 1,
            ir1, ir2, ir3, ir4,
            time: dataRef.current.length,
            status: statusVal,
            detail: detailTemp.detailFailed[detailCode] || "-"
          }]);
        }

        if (detailCode === "888") finishCycle({ ir1, ir2, ir3, ir4 });
      }

      setLastRead({ ir1, ir2, ir3, ir4, time: dataRef.current.length });
    }
  };

  const finishCycle = (readings: Omit<SensorData, 'time'>) => {
    if (isFinishingRef.current) return;
    isFinishingRef.current = true;

    setData((prev) => {
      if (prev.length < MAX_SAMPLES) {
        // Play success sound/beep on finish
        playBeep();
        return [...prev, { ...readings, time: prev.length }];
      }
      return prev;
    });
    setLoading(false);
    setStatus("Passed"); // Update status to Passed explicitly
    // @ts-ignore
    if (window.mockInterval) {
      // @ts-ignore
      clearInterval(window.mockInterval);
      // @ts-ignore
      window.mockInterval = null;
    }
  };

  const playBeep = () => {
    try {
      // @ts-ignore
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(800, audioCtx.currentTime); // 800Hz beep
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);

      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        audioCtx.close();
      }, 150); // 150ms duration
    } catch (e) {
      console.error("Beep failed:", e);
    }
  };

  const openPopup = () => setPopup(true);
  const closePopup = async () => {
    setPopup(false);
    // @ts-ignore
    setCurrentCOMPort(Number(await window.electronAPI.getPort()));
  };


  /**
   * Handle the "Test" button click
   */
  const handleTest = async () => {
    if (data.length >= MAX_SAMPLES) return;

    if (mode === "mockup") {
      isFinishingRef.current = false;
      setLoading(true);
      setStatus("on");
      setDetail("กำลังเริ่มการทดสอบ (Mockup)...");

      let currentSec = 0;
      // @ts-ignore
      if (window.mockInterval) clearInterval(window.mockInterval);

      // @ts-ignore
      window.mockInterval = setInterval(() => {
        currentSec++;
        const ir1 = (Math.random() * 5 + 35).toFixed(2);
        const ir2 = (Math.random() * 5 + 35).toFixed(2);
        const ir3 = (Math.random() * 5 + 35).toFixed(2);
        const ir4 = (Math.random() * 5 + 35).toFixed(2);
        const amb = (Math.random() * 2 + 28).toFixed(2);
        const curr = (Math.random() * 0.5 + 4.5).toFixed(2);
        const avg = ((parseFloat(ir1) + parseFloat(ir2) + parseFloat(ir3) + parseFloat(ir4)) / 4).toFixed(2);

        // Small chance to fail for realism after 10 seconds
        const failChance = currentSec > 10 && Math.random() < 0.05;

        if (currentSec < 20 && !failChance) {
          // Sending periodic data
          const mockData = `${ir1},${ir2},${ir3},${ir4},${amb},${amb},${amb},${amb},${avg},${currentSec},${curr},on,666`;
          handleSerialData(mockData);
        } else if (failChance) {
          // Mock a random failure
          const mockData = `${ir1},${ir2},${ir3},${ir4},${amb},${amb},${amb},${amb},${avg},${currentSec},0.00,Failed,020`;
          handleSerialData(mockData);
        } else {
          // Finish cycle
          const mockData = `${ir1},${ir2},${ir3},${ir4},${amb},${amb},${amb},${amb},${avg},${currentSec},0.00,Passed,888`;
          handleSerialData(mockData);
          // Interval is cleared inside finishCycle
        }
      }, 1000);

      return;
    }

    if (!currentCOMPort) {
      Swal.fire("Error", "กรุณาเลือกพอร์ตก่อนทดสอบ", "error");
      return;
    }

    setLoading(true);
    isFinishingRef.current = false;
    try {
      // @ts-ignore
      await window.electronAPI.openPort(String(currentCOMPort));
      // Wait for port to be ready (Arduinos often reset on connection)
      await new Promise((resolve) => setTimeout(resolve, 2000));
      // @ts-ignore
      await window.electronAPI.writeData({
        port: currentCOMPort,
        command: "calibrate",
      });
      setStatus("on");
      setDetail("กำลังเริ่มการทดสอบ...");
    } catch (error) {
      console.error("Test error:", error);
      Swal.fire("Error", "ไม่สามารถส่งคำสั่งไปยัง Arduino ได้", "error");
      setLoading(false);
    }
  };

  /**
   * Handle the "Reset" button click
   */
  const handleReset = () => {
    Swal.fire({
      title: "คุณแน่ใจหรือไม่?",
      text: "ข้อมูลการทดสอบทั้งหมดจะถูกลบ",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "ลบข้อมูล",
      cancelButtonText: "ยกเลิก",
    }).then((result) => {
      if (result.isConfirmed) {
        setData([]);
        setHistory([]);
        isFinishingRef.current = false;
        setLastRead(null);
        setStatus("");
        setDetail("");
        setTime(0);
        setCurrent(0);
        // @ts-ignore
        if (window.mockInterval) {
          // @ts-ignore
          clearInterval(window.mockInterval);
          // @ts-ignore
          window.mockInterval = null;
        }
      }
    });
  };

  /**
   * Handle the "Export" button click
   */
  const handleExport = () => {
    if (data.length < MAX_SAMPLES) {
      Swal.fire("คำเตือน", `กรุณาทดสอบให้ครบ ${MAX_SAMPLES} ครั้งก่อนส่งออก`, "warning");
      return;
    }

    setLoading(true);
    try {
      // Use history for detailed recording based on image requirements
      const excelRows = history.map((item) => ({
        "IR_S2": item.ir1,
        "IR_S3": item.ir2,
        "IR_S4": item.ir3,
        "IR_S5": item.ir4,
        "TC1": "",
        "TC2": "",
        "TC3": "",
        "Time(sec)": item.time
      }));

      // Create Worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelRows);

      // Create Workbook and append the sheet
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "ข้อมูลคาลิเบรชัน");

      // Generate Filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `calibration_${timestamp}.xlsx`;

      // Trigger Download
      XLSX.writeFile(workbook, filename);

      Swal.fire({
        icon: "success",
        title: "ส่งออกไฟล์เรียบร้อย",
        text: `ไฟล์ ${filename} ถูกดาวน์โหลดแล้ว`,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Export error:", error);
      Swal.fire("Error", "เกิดข้อผิดพลาดในการสร้างไฟล์ Excel", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen">
      <SideBar />
      <div className="flex flex-col w-full h-full  overflow-y-auto">
        <Breadcrumb />

        {/* Progress Bar (Full Width, Top) */}
        <div className="w-full bg-gray-50 p-0 h-14 flex flex-col justify-center flex-shrink-0 ">
          <div className="w-full h-2 bg-gray-200 pl-64 2xl:pl-0 ">
            <div
              className="bg-[#001F3F] h-full transition-all duration-700 ease-in-out shadow-[0_0_10px_rgba(0,31,63,0.3)]"
              style={{ width: `${(data.length / MAX_SAMPLES) * 100}%` }}
            />
          </div>
          <div className="px-6 flex justify-between items-center pl-6 2xl:pl-6">
            <div className="w-full flex items-center gap-4  ">
              <p className="text-[20px] text-center align-middle font-bold text-gray-500 uppercase tracking-widest">
                สถานะการเก็บข้อมูล: {data.length} / {MAX_SAMPLES} ตัวอย่าง
              </p>
              {/* Mode Toggle Switch */}
              {/* <div className="flex items-center bg-gray-200 rounded-full p-1 ml-4 scale-75 origin-left">
                <button
                  onClick={() => setMode("real")}
                  className={`px-4 py-1 rounded-full text-xs font-bold transition-all ${mode === "real" ? "bg-[#001F3F] text-white shadow-md" : "text-gray-500 hover:text-gray-700"}`}
                >
                  REAL
                </button>
                <button
                  onClick={() => setMode("mockup")}
                  className={`px-4 py-1 rounded-full text-xs font-bold transition-all ${mode === "mockup" ? "bg-orange-500 text-white shadow-md" : "text-gray-500 hover:text-gray-700"}`}
                >
                  MOCKUP
                </button>
              </div> */}
            </div>
            {data.length === MAX_SAMPLES && (
              <p className="text-[10px] font-bold text-green-600 animate-pulse">✓ พร้อมสำหรับการส่งออกข้อมูล</p>
            )}
          </div>
        </div>

        <div className="flex flex-col bg-white w-full h-full  overflow-y-auto whitespace-nowrap">
          <div className="w-full flex flex-col ">
            <ul
              className="flex flex-col justify-between items-start pt-5 px-10 gap-2 text-lg 
            md:flex-row md:gap-10 md:items-center pl-6 2xl:pl-10"
            >
              <li
                className="flex flex-col justify-start items-start text-center whitespace-nowrap
              md:basis-40"
              >
                <h4 className="flex-nowrap pb-3 text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl font-normal ">
                  พอร์ต Calibration
                  <span className="text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl text-red-600">
                    &nbsp;*
                  </span>
                </h4>
                <div className="flex flex-row w-40 justify-start gap-2 items-center text-black text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl  lg:mt-3">
                  {currentCOMPort ? <h1>{"COM" + currentCOMPort}</h1> : null}
                  <button className="bg-cyan-500 text-white px-5 py-1 rounded-lg cursor-pointer hover:bg-cyan-600" onClick={openPopup}>
                    <p className="">{currentCOMPort ? "เปลี่ยน" : "เลือก"}</p>
                  </button>
                </div>

                {popup && (
                  <Popup onClose={closePopup}>
                    <SerialCommunicationPort />
                  </Popup>
                )}
              </li>

              <li className="flex flex-col justify-end items-end ml-auto">
                <button
                  onClick={handleExport}
                  disabled={data.length < MAX_SAMPLES || loading}
                  className={`flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-bold text-white shadow-lg transition-all active:scale-95 text-base sm:text-lg md:text-xl xl:text-2xl 2xl:text-3xl ${data.length < MAX_SAMPLES || loading
                    ? "bg-green-600/30 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700 shadow-green-100"
                    }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  ส่งออกไฟล์ (.xlsx)
                </button>
              </li>
            </ul>
          </div>

          <div className="w-full h-10 my-4"> </div>

          {/* ----------- Body -------------*/}
          <div className="w-full h-full flex px-[20%] flex-col justify-between lg:gap-10 lg:px-[10%] lg:my-2">

            {/* ภาพเตารีด (Identical to reference) */}
            <div className="relative self-center pt-10 pb-10">
              <img
                className="w-[240px] h-[400px]"
                ref={ironImageRef}
                alt="iron plate"
              />

              <div>
                {/* บน */}
                <div className="absolute left-1/2 -translate-x-1/2 -top-7 text-[#d6bb0fff] text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl font-bold whitespace-nowrap">
                  {lastRead?.ir4 ?? 0} °C
                </div>
                <div className="absolute left-1/2 -translate-x-1/2 top-3 text-gray-900 text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl font-semibold whitespace-nowrap">
                  อุณหภูมิรอบข้าง : {ambient4} °C
                </div>
                <div className="flex flex-col absolute left-25 top-20 items-center">
                  <label className="text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl text-[#fbff00ff] font-bold">บน</label>
                  <svg className="h-6 w-6" fill="#fbff00ff" viewBox="0 0 512 512"><path d="M256 56c110.532 0 200 89.451 200 200 0 110.532-89.451 200-200 200-110.532 0-200-89.451-200-200 0-110.532 89.451-200 200-200m0-48C119.033 8 8 119.033 8 256s111.033 248 248 248 248-111.033 248-248S392.967 8 256 8zm0 168c-44.183 0-80 35.817-80 80s35.817 80 80 80 80-35.817 80-80-35.817-80-80-80z" /></svg>
                </div>

                {/* กลาง */}
                <div className="absolute left-1/2 -translate-x-1/2 bottom-1 text-[#1496ecff] text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl font-bold whitespace-nowrap">
                  {lastRead?.ir2 ?? 0} °C
                </div>
                <div className="absolute left-1/2 -translate-x-1/2 -bottom-7 text-gray-900 text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl font-semibold whitespace-nowrap">
                  อุณหภูมิรอบข้าง : {ambient2} °C
                </div>
                <div className="flex flex-col absolute left-23 top-45 items-center">
                  <label className="text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl text-[#66f0ffff] font-bold">กลาง</label>
                  <svg className="h-6 w-6" fill="#66f0ffff" viewBox="0 0 512 512"><path d="M256 56c110.532 0 200 89.451 200 200 0 110.532-89.451 200-200 200-110.532 0-200-89.451-200-200 0-110.532 89.451-200 200-200m0-48C119.033 8 8 119.033 8 256s111.033 248 248 248 248-111.033 248-248S392.967 8 256 8zm0 168c-44.183 0-80 35.817-80 80s35.817 80 80 80 80-35.817 80-80-35.817-80-80-80z" /></svg>
                </div>

                {/* ซ้าย */}
                <div className="absolute right-58 bottom-36 text-[#0fb500ff] text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl font-bold whitespace-nowrap">
                  {lastRead?.ir3 ?? 0} °C
                </div>
                <div className="absolute right-58 bottom-28 text-gray-900 text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl font-semibold whitespace-nowrap">
                  อุณหภูมิรอบข้าง : {ambient3} °C
                </div>
                <div className="flex flex-col absolute left-6 bottom-30 items-center">
                  <label className="text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl text-[#61ff53ff] font-bold">ซ้าย</label>
                  <svg className="h-6 w-6" fill="#61ff53ff" viewBox="0 0 512 512"><path d="M256 56c110.532 0 200 89.451 200 200 0 110.532-89.451 200-200 200-110.532 0-200-89.451-200-200 0-110.532 89.451-200 200-200m0-48C119.033 8 8 119.033 8 256s111.033 248 248 248 248-111.033 248-248S392.967 8 256 8zm0 168c-44.183 0-80 35.817-80 80s35.817 80 80 80 80-35.817 80-80-35.817-80-80-80z" /></svg>
                </div>

                {/* ขวา */}
                <div className="absolute left-58 bottom-36 text-[#FF5CB6] text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl font-bold whitespace-nowrap">
                  {lastRead?.ir1 ?? 0} °C
                </div>
                <div className="absolute left-58 bottom-28 text-gray-900 text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl font-semibold whitespace-nowrap">
                  อุณหภูมิรอบข้าง : {ambient1} °C
                </div>
                <div className="flex flex-col absolute right-5 bottom-30 items-center">
                  <label className="text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl text-[#FFB8DF] font-bold">ขวา</label>
                  <svg className="h-6 w-6" fill="#FFB8DF" viewBox="0 0 512 512"><path d="M256 56c110.532 0 200 89.451 200 200 0 110.532-89.451 200-200 200-110.532 0-200-89.451-200-200 0-110.532 89.451-200 200-200m0-48C119.033 8 8 119.033 8 256s111.033 248 248 248 248-111.033 248-248S392.967 8 256 8zm0 168c-44.183 0-80 35.817-80 80s35.817 80 80 80 80-35.817 80-80-35.817-80-80-80z" /></svg>
                </div>
              </div>
            </div>

            {/* Bottom Controls Section */}
            <div className="w-full h-full flex flex-col justify-between gap-6 pt-6 sm:gap-8 sm:pt-8 lg:pt-0 lg:flex-row lg:gap-0">

              {/* Left Side: Stats and Info */}
              <div className="flex flex-col w-full h-full gap-6 justify-between text-base sm:text-lg md:text-xl xl:text-2xl 2xl:text-3xl lg:items-start">
                <div className="flex flex-col pt-10 lg:flex-row lg:pt-0 gap-4 sm:gap-8">
                  <div className="flex items-center gap-4">
                    <p>กระแสไฟฟ้า :</p>
                    <input
                      className="w-20 sm:w-24 md:w-28 h-8 sm:h-9 md:h-10 text-center border rounded-sm"
                      type="text"
                      value={current}
                      readOnly
                    />
                    <span>แอมแปร์</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <p>เวลา :</p>
                    <input
                      className="w-20 sm:w-24 md:w-28 h-8 sm:h-9 md:h-10 text-center border rounded-sm"
                      type="text"
                      value={time}
                      readOnly
                    />
                    <span>วินาที</span>
                  </div>
                </div>

                <div className="flex flex-col gap-10 items-start">
                  <div className="flex h-auto w-auto items-center justify-center gap-4">
                    <p>ผลลัพธ์ : </p>
                    <div className={`w-auto flex px-6 py-2 justify-center items-center whitespace-nowrap rounded-lg text-white font-bold transition-colors ${status === "on" ? "bg-yellow-600" : status === "Passed" ? "bg-green-600" : status === "Failed" ? "bg-red-400" : "bg-gray-400"
                      }`}>
                      {status === "on" ? "กำลังดำเนินการ" : status === "Passed" ? "ผ่าน" : status === "Failed" ? "ไม่ผ่าน" : "ปิด"}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 whitespace-normal">
                    <p>หมายเหตุ :</p>
                    <p className="text-gray-600">{detail || "-"}</p>
                  </div>
                </div>
              </div>

              {/* Right Side: Action Buttons */}
              <div className="flex flex-col h-auto w-full items-center gap-6 py-6 sm:gap-8 lg:items-end">
                <button
                  onClick={handleTest}
                  disabled={data.length >= MAX_SAMPLES || loading}
                  className={`w-full sm:w-[70%] lg:w-[70%] xl:w-[50%] h-12 sm:h-14 lg:h-16 text-base sm:text-lg md:text-xl xl:text-2xl 2xl:text-3xl rounded-lg font-semibold text-white transition duration-200 ${data.length >= MAX_SAMPLES || loading
                    ? "bg-[#001F3F]/60 cursor-not-allowed"
                    : "bg-[#003366] hover:bg-[#001F3F] hover:cursor-pointer shadow-lg"
                    }`}
                >
                  {loading ? "กำลังทดสอบ..." : "ทดสอบ"}
                </button>

                <button
                  onClick={handleReset}
                  disabled={data.length === 0}
                  className={`w-full sm:w-[70%] lg:w-[70%] xl:w-[50%] h-12 sm:h-14 lg:h-16 text-base sm:text-lg md:text-xl xl:text-2xl 2xl:text-3xl rounded-lg font-semibold text-white transition duration-300 shadow-md ${data.length === 0
                    ? "bg-red-500/50 cursor-not-allowed"
                    : "bg-red-500 hover:bg-red-600 hover:cursor-pointer"
                    }`}
                >
                  รีเซ็ตข้อมูล
                </button>
              </div>
            </div>

            <div className="flex flex-col-reverse place-content-center mt-auto">
              <Footer />
            </div>
          </div>
        </div>
      </div>
    </div >
  );
}
