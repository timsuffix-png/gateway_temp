"use client";
import React, { useEffect, useState } from "react";
import SelectBar from "@/components/selectBar";
import axios from "axios";
import Footer from "@/components/footer";
import Popup from "@/components/popup";
import SerialCommunicationPort from "@/components/serialCommunicationPort";
import { error } from "console";
import { ipcRenderer } from "electron";

export interface Option {
  id: number;
  name: string;
}

const ops: Option[] = [
  {
    id: 1,
    name: "class1(3legs)",
  },
  {
    id: 2,
    name: "class2(2legs)",
  },
  {
    id: 3,
    name: "class3(4legs)",
  },
  {
    id: 4,
    name: "iron",
  },
];

export default function MainTempTest() {

  const [temp1, setTemp1] = useState<number >(0);
  const [temp2, setTemp2] = useState<number >(0);
  const [temp3, setTemp3] = useState<number >(0);
  const [current, setCurrent] = useState<number >(0);
  const [time, setTime] = useState<number>(0);
  const [serialData, setSerialData] = useState<string[]>([]);

  const [state, setState] = useState("off");


  const serialPort = async () => {
    try {
      const port = await window.electronAPI.getPort();
      await window.electronAPI.openPort(port);
      const data =  await window.electronAPI.writeData({port, command:state});
      console.log("State command : " + state);
      console.log("Data  : " + data);
    } catch (error) {
      console.error("Failed to open/write port:", error);
    }
  };

  useEffect(() => {
    const handleSerialData = (data: string) => {
      console.log("Received data:", data); // เช็คข้อมูลที่รับมา
      setSerialData((prev) => [...prev, data]);
      const parts = data.split(",");
      if (parts.length === 5) {
        // const [t1, t2, t3, curr, tm] = parts;
        setTemp1(parseFloat(parts[0]));
        setTemp2(parseFloat(parts[1]));
        setTemp3(parseFloat(parts[2]));
        setCurrent(parseFloat(parts[3]));
        setTime(parseInt(parts[4]));
      }
    };

     const handlePortClosed = () => {
    console.log('Serial port ถูกปิดแล้ว');  // แจ้งสถานะ port ถูกปิด
    // TODO: อัพเดต UI แจ้งเตือนผู้ใช้ว่า port ปิดแล้ว เช่น ปิดปุ่ม หรือแสดงข้อความ
  };


 window.electronAPI.onSerialData(handleSerialData);
  window.electronAPI.onSerialPortClosed(handlePortClosed); //ฟังพอตปิด

  // ล้าง listener เมื่อ component ถูก unmount
  return () => {
    window.electronAPI.removeSerialDataListener(handleSerialData); 
    window.electronAPI.removeSerialPortClosedListener(handlePortClosed); 
  };
  }, []);


  useEffect(() => {
    serialPort();
  }, [state]);

  return (
    <div className="w-screen h-auto min-h-screen flex flex-col">
      <div>
        <SelectBar projects={ops} />
      </div>

      <div
        className="flex-grow grid grid-cols-1 gap-10  pt-10
      md:grid-cols-3 md:gap-0"
      >
        <ul
          className="flex flex-col h-full gap-10 items-center text-lg  border
        md:items-end md:pr-[15%]"
        >
         

          <li className="flex items-center gap-4">
            <p>ตัววัดอุณหภูมิตัวที่ 1 :</p>
            <input
              type="text"
              value={temp1}
              readOnly
              className="w-35 h-10 border rounded-sm"
            ></input>
          </li>
          <li className="flex items-center gap-4">
            <p>ตัววัดอุณหภูมิตัวที่ 2 :</p>
            <input
              type="text"
              value={temp2}
              readOnly
              className="w-35 h-10 border rounded-sm"
            ></input>
          </li>
          <li className="flex items-center gap-4">
            <p>ตัววัดอุณหภูมิตัวที่ 3 :</p>
            <input
              type="text"
              value={temp3}
              readOnly
              className="w-35 h-10 border rounded-sm"
            ></input>
          </li>
        </ul>

        <div className="h-full border">
          <ul
            className="flex flex-col h-full gap-10 items-center text-lg 
        md:items-end md:pr-[15%]"
          >
            <li className="flex items-center gap-4">
              <p>กระแสไฟฟ้า :</p>
              <input
                type="text"
              value={current}
                readOnly
                className="w-35 h-10 border rounded-sm"
              ></input>
            </li>
            <li className="flex items-center gap-4">
              <p>เวลา :</p>
              <input
                type="text"
              value={time}
                readOnly
                className="w-35 h-10 border rounded-sm"
              ></input>
            </li>

             {/* ------------------------------------------- */}
          {serialData.map((data, idx) => (
            <li className="w-30 h-50 border-4"key={idx}>{data}</li>
          ))}
          {/* ------------------------------------------- */}
          </ul>
        </div>

        <div className="flex flex-col h-full items-center gap-10 border">
          <button
            id="test"
            className="w-40 h-15  rounded-lg bg-blue-900 hover:bg-blue-950
          md:w-45 md:h-20"
            onClick={() => setState("on")}
          >
            <label className="text-xl text-white font-semibold">ทดสอบ</label>
          </button>
          <button
            className="w-40 h-15  rounded-lg bg-red-600 hover:bg-red-700
          md:w-45 md:h-20"
            onClick={() => setState("off")}
          >
            <label className="text-xl text-white font-semibold">หยุด</label>
          </button>
        </div>
      </div>

      <div className="flex flex-col-reverse m-2 place-content-center">
        <Footer />
      </div>
    </div>
  );
}
