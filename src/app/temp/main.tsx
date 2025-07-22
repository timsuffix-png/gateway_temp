"use client";
import React, { useEffect, useState } from "react";
import SelectBar from "@/components/selectBar";
import axios from "axios";
import Footer from "@/components/footer";
import Popup from "@/components/popup";
import SerialCommunicationPort from "@/components/serialCommunicationPort";
import { error } from "console";
import { useMemo } from "react";
import { ipcRenderer } from "electron";

export interface Option {
  id: number;
  name: string;
}

interface SendCommand {
  state: string;
  tempLim: number;
  currentLim: number;
  timeLim: number;
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
  const [temp1, setTemp1] = useState<number | null>(null);
  const [temp2, setTemp2] = useState<number | null>(null);
  const [temp3, setTemp3] = useState<number | null>(null);
  const [current, setCurrent] = useState<number | null>(null);
  const [time, setTime] = useState<number | null>(null);
  const [case_precess, setCaseProcess] = useState<string>("stop");

  const [sendData, setSendData] = useState<SendCommand>({
    // state: "",
    // tempLim: 34.5,
    // currentLim: 12.9,
    // timeLim: 10,

    state: "",
    tempLim: 60.0,
    currentLim: 6.0,
    timeLim: 10,
  });

  const { css, stateName } = useMemo(() => {
    switch (case_precess) {
      case "stop":
        return { css: "bg-red-600", stateName: "STOP" };
      case "on":
        return { css: "bg-yellow-600", stateName: "IN PROCESS" };
      case "pass":
        return { css: "bg-green-600", stateName: "PASS" };
      case "fail":
        return { css: "bg-red-400", stateName: "Fail" };
      default:
        return { css: "bg-gray-400", stateName: "OFF" };
    }
  }, [case_precess]);

  const serialPort = async () => {
    try {
      const port = await window.electronAPI.getPort();
      await window.electronAPI.openPort(port);
      const data = await window.electronAPI.writeData({
        port,
        command: sendData,
      });
      console.log("State command : " + sendData);
      console.log("Data  : " + data);
    } catch (error) {
      console.error("Failed to open/write port:", error);
    }
  };

  useEffect(() => {
    const handleSerialData = (data: string) => {
      console.log("Received data:", data); // เช็คข้อมูลที่รับมาใน console app
      const parts = data.split(",");
      if (parts.length > 1) {
        // const [t1, t2, t3, curr, tm, sendData] = parts;

        // setTemp1(parseFloat(parts[0]));
        // setTemp2(parseFloat(parts[1]));
        // setTemp3(parseFloat(parts[2]));
        // setCurrent(parseFloat(parts[3]));
        // setTime(parseInt(parts[4]));
        // setCaseProcess(parseInt(parts[5]));

        setTemp1(parseFloat(parts[0]));
        setTemp2(parseFloat(parts[1]));
        setTemp3(parseFloat(parts[2]));
        setCurrent(parseFloat(parts[4]));
        setTime(parseInt(parts[3]));
        setCaseProcess(parts[8].trim());
      }
    };

    const handlePortClosed = () => {
      console.log("Serial port ถูกปิดแล้ว"); // แจ้งสถานะ port ถูกปิด
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
  }, [sendData]);

  return (
    <div className="w-full h-auto border min-h-screen flex flex-col">
      <div>
        <SelectBar projects={ops} />
      </div>
      <div className="w-full h-10 my-4"> </div>
      <div
        className="flex-grow grid grid-cols-1 gap-10 
      md:grid-cols-3 md:gap-0"
      >
        <ul className="flex flex-col h-full gap-10 items-center text-lg">
          <div>ตัววัดอุณหภูมิ</div>
          <li className="flex items-center gap-4">
            <div className="whitespace-nowrap">ตัวที่ 1 :</div>

            <input
              className="w-25 h-10 text-center border rounded-sm "
              type="text"
              value={temp1 ? temp1 : 0}
              readOnly
            ></input>
          </li>
          <li className="flex items-center gap-4">
            <div className="whitespace-nowrap">ตัวที่ 2 :</div>

            <input
              className="w-25 h-10 text-center border rounded-sm "
              type="text"
              value={temp2 ? temp2 : 0}
              readOnly
            ></input>
          </li>
          <li className="flex items-center gap-4">
            <div className="whitespace-nowrap">ตัวที่ 3 :</div>
            <input
              className="w-25 h-10 text-center border rounded-sm "
              type="text"
              value={temp3 ? temp3 : 0}
              readOnly
            ></input>
          </li>
        </ul>

        <div className="h-full">
          <ul
            className="flex flex-col h-full gap-10 items-center text-lg 
        md:items-end md:pr-[15%]"
          >
            <div className="hidden md:inline">
              <br />
            </div>
            <li className="flex items-center gap-4">
              <p>กระแสไฟฟ้า :</p>
              <input
                className="w-25 h-10 text-center border rounded-sm "
                type="text"
                value={current ? current : 0}
                readOnly
              ></input>
            </li>
            <li className="flex items-center gap-4">
              <p>เวลา :</p>
              <input
                className="w-25 h-10 text-center border rounded-sm "
                type="text"
                value={time ? time : 0}
                readOnly
              ></input>
            </li>
          </ul>
        </div>

        <div className="flex flex-col h-full items-center gap-10">
          <div className="flex h-auto w-auto items-center justify-center gap-4 ">
            <p>ผลลัพธ์ : </p>
            <div
              className={`w-24 flex py-2 justify-center items-center whitespace-nowrap rounded-lg text-white ${css}`}
            >
              {stateName}
            </div>
          </div>
          <button
            id="test"
            className="w-40 h-15  rounded-lg bg-blue-900 hover:bg-blue-950
          md:w-45 md:h-20"
            onClick={() => {
              setSendData((prev) => ({
                ...prev,
                state: "on",
              }));
              return;
            }}
          >
            <label className="text-xl text-white font-semibold">ทดสอบ</label>
          </button>
          <button
            className="w-40 h-15  rounded-lg bg-red-600 hover:bg-red-700
          md:w-45 md:h-20"
            onClick={() => {
              setSendData((prev) => ({
                ...prev,
                state: "stop",
              }));
              return;
            }}
          >
            <label className="text-xl text-white font-semibold">หยุด</label>
          </button>
        </div>
      </div>
    </div>
  );
}
