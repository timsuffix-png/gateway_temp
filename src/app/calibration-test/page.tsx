"use client";

import { useState } from "react";
import SideBar from "@/components/sidebar";
import Breadcrumb from "@/components/breadcrumb";
import BackButton from "@/components/backButton";
import Footer from "@/components/footer";
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

export default function CalibrationTestPage() {
  const [data, setData] = useState<SensorData[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRead, setLastRead] = useState<SensorData | null>(null);

  const MAX_SAMPLES = 5;

  /**
   * Mock function to simulate sensor data retrieval
   */
  const mockFetchSensorData = (): Promise<SensorData> => {
    return new Promise((resolve) => {
      // Simulate network or hardware delay
      setTimeout(() => {
        resolve({
          ir1: Math.floor(Math.random() * 800) + 200,
          ir2: Math.floor(Math.random() * 800) + 200,
          ir3: Math.floor(Math.random() * 800) + 200,
          ir4: Math.floor(Math.random() * 800) + 200,
          time: data.length, // time = index (0,1,2,...)
        });
      }, 600);
    });
  };

  /**
   * Handle the "Test" button click
   */
  const handleTest = async () => {
    if (data.length >= MAX_SAMPLES) return;

    setLoading(true);
    try {
      const newData = await mockFetchSensorData();
      setData((prev) => [...prev, newData]);
      setLastRead(newData);
    } catch (error) {
      console.error("Sensor read error:", error);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถอ่านค่าจาก sensor ได้",
      });
    } finally {
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
        setLastRead(null);
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
      // mapping:
      // IR_S2 = ir1
      // IR_S3 = ir2
      // IR_S4 = ir3
      // IR_S5 = ir4
      // TC1, TC2, TC3 = "" (empty)
      // Time(sec) = time
      const excelRows = data.map((item) => ({
        IR_S2: item.ir1,
        IR_S3: item.ir2,
        IR_S4: item.ir3,
        IR_S5: item.ir4,
        TC1: "",
        TC2: "",
        TC3: "",
        "Time(sec)": item.time,
      }));

      // Create Worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelRows);
      
      // Create Workbook and append the sheet
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "CalibrationData");

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
    <div className="flex h-screen bg-[#F8FAFC]">
      <SideBar />
      <div className="w-full h-full flex flex-col">
        <Breadcrumb />
        <div className="flex flex-col bg-white w-full h-full overflow-y-auto pt-8 px-6 lg:px-12">
          
          {/* Header Section */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div 
                className="cursor-pointer transition-transform hover:scale-110 active:scale-95"
                onClick={() => {
                  localStorageWeb.setItem("currentUrl", "qc");
                  window.location.reload();
                }}
              >
                <BackButton />
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold text-[#001F3F] font-['Sarabun']">
                Calibration Test
              </h1>
            </div>
          </div>

          {/* Main Dashboard Card */}
          <div className="w-full max-w-5xl mx-auto bg-white rounded-3xl border border-gray-100 shadow-[0_20px_50px_rgba(0,31,63,0.05)] p-6 lg:p-10 mb-10">
            
            {/* Progress Visualization */}
            <div className="mb-12">
              <div className="flex justify-between items-end mb-3">
                <div>
                  <h2 className="text-lg font-bold text-gray-700">ความคืบหน้าการทดสอบ</h2>
                  <p className="text-sm text-gray-500">เก็บตัวอย่างข้อมูลให้ครบ {MAX_SAMPLES} ครั้ง</p>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-[#001F3F]">{data.length}</span>
                  <span className="text-xl font-bold text-gray-400"> / {MAX_SAMPLES}</span>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-2xl h-5 p-1 overflow-hidden border border-gray-200">
                <div
                  className={`h-full rounded-xl transition-all duration-700 ease-in-out ${
                    data.length === MAX_SAMPLES ? "bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]" : "bg-[#001F3F]"
                  }`}
                  style={{ width: `${(data.length / MAX_SAMPLES) * 100}%` }}
                ></div>
              </div>
              {data.length === MAX_SAMPLES && (
                <div className="mt-4 flex items-center gap-2 text-green-600 animate-bounce">
                  <span className="text-xl font-bold">✓</span>
                  <span className="font-bold">ข้อมูลครบถ้วน พร้อมสำหรับการส่งออกไฟล์</span>
                </div>
              )}
            </div>

            {/* Current Values Display */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
              {[
                { label: "IR_S2 (ir1)", value: lastRead?.ir1 ?? "-", color: "bg-blue-50 text-blue-700 border-blue-100" },
                { label: "IR_S3 (ir2)", value: lastRead?.ir2 ?? "-", color: "bg-indigo-50 text-indigo-700 border-indigo-100" },
                { label: "IR_S4 (ir3)", value: lastRead?.ir3 ?? "-", color: "bg-violet-50 text-violet-700 border-violet-100" },
                { label: "IR_S5 (ir4)", value: lastRead?.ir4 ?? "-", color: "bg-purple-50 text-purple-700 border-purple-100" },
              ].map((card, i) => (
                <div 
                  key={i} 
                  className={`p-5 rounded-2xl border transition-all duration-300 hover:shadow-lg ${card.color}`}
                >
                  <p className="text-xs font-black uppercase tracking-widest mb-1 opacity-70">{card.label}</p>
                  <p className="text-3xl font-bold">{card.value}</p>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap justify-center gap-6 mb-12">
              <button
                onClick={handleTest}
                disabled={data.length >= MAX_SAMPLES || loading}
                className={`group flex items-center gap-2 px-10 py-4 rounded-2xl font-bold text-lg shadow-xl transition-all active:scale-95 ${
                  data.length >= MAX_SAMPLES || loading
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
                    : "bg-[#001F3F] text-white hover:bg-[#002d5c] hover:shadow-indigo-200"
                }`}
              >
                {loading && data.length < MAX_SAMPLES ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    กำลังอ่านค่า...
                  </span>
                ) : (
                  <>
                    <span>ทดสอบ</span>
                    <span className="text-xs bg-white/20 px-2 py-1 rounded-md group-hover:bg-white/30 transition-colors">SPACE</span>
                  </>
                )}
              </button>

              <button
                onClick={handleExport}
                disabled={data.length < MAX_SAMPLES || loading}
                className={`flex items-center gap-2 px-10 py-4 rounded-2xl font-bold text-lg shadow-xl transition-all active:scale-95 ${
                  data.length < MAX_SAMPLES || loading
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
                    : "bg-green-600 text-white hover:bg-green-700 hover:shadow-green-200"
                }`}
              >
                {loading && data.length === MAX_SAMPLES ? "กำลังเตรียมไฟล์..." : "ส่งออกไฟล์"}
              </button>

              <button
                onClick={handleReset}
                disabled={data.length === 0 || loading}
                className={`px-10 py-4 rounded-2xl font-bold text-lg transition-all active:scale-95 ${
                  data.length === 0 || loading
                    ? "bg-gray-50 text-gray-300 cursor-not-allowed"
                    : "bg-white text-red-500 border-2 border-red-100 hover:bg-red-50 hover:border-red-200"
                }`}
              >
                รีเซ็ต
              </button>
            </div>

            {/* Data Preview Table */}
            {data.length > 0 && (
              <div className="mt-6 border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                <div className="bg-gray-50 px-8 py-4 border-b border-gray-100">
                  <h3 className="font-bold text-gray-600">พรีวิวข้อมูล ({data.length} รายการ)</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-['Sarabun']">
                    <thead>
                      <tr className="bg-white border-b border-gray-50">
                        <th className="px-8 py-4 text-sm font-black text-gray-400 uppercase tracking-widest">Time(sec)</th>
                        <th className="px-8 py-4 text-sm font-black text-gray-400 uppercase tracking-widest">IR_S2</th>
                        <th className="px-8 py-4 text-sm font-black text-gray-400 uppercase tracking-widest">IR_S3</th>
                        <th className="px-8 py-4 text-sm font-black text-gray-400 uppercase tracking-widest">IR_S4</th>
                        <th className="px-8 py-4 text-sm font-black text-gray-400 uppercase tracking-widest">IR_S5</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {data.map((row, idx) => (
                        <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                          <td className="px-8 py-4 font-bold text-[#001F3F]">{row.time}</td>
                          <td className="px-8 py-4 text-gray-600">{row.ir1}</td>
                          <td className="px-8 py-4 text-gray-600">{row.ir2}</td>
                          <td className="px-8 py-4 text-gray-600">{row.ir3}</td>
                          <td className="px-8 py-4 text-gray-600">{row.ir4}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-auto">
            <Footer />
          </div>
        </div>
      </div>
    </div>
  );
}
