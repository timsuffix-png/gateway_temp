"use client";
import React, { useState } from "react";
import SelectBar from "@/components/selectBar";
import axios from "axios";
import Footer from "@/components/footer";
import Popup from "@/components/popup";
import SerialCommunicationPort from "@/components/serialCommunicationPort";

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
  // const [data, setData] = useState<object | null>(null);
  const [clickTest, setClickTest] = useState(false);

  const Testing = () => {
    // Import dependencies
    const SerialPort = require("serialport");
    const Readline = require("@serialport/parser-readline");

    // Defining the serial port
    const port = new SerialPort("COM3", {
      baudRate: 9600,
    });

    // The Serial port parser
    const parser = new Readline();
    port.pipe(parser);

    // Read the data from the serial port
    parser.on("data", (line: string) => console.log(line));

    // Write the data to the serial port
    port.write("on");
  };

  async function fetchData() {
    try {
      const res = await axios.get("");
    } catch {}
  }

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
              readOnly
              className="w-35 h-10 border rounded-sm"
            ></input>
          </li>
          <li className="flex items-center gap-4">
            <p>ตัววัดอุณหภูมิตัวที่ 2 :</p>
            <input
              type="text"
              readOnly
              className="w-35 h-10 border rounded-sm"
            ></input>
          </li>
          <li className="flex items-center gap-4">
            <p>ตัววัดอุณหภูมิตัวที่ 3 :</p>
            <input
              type="text"
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
                readOnly
                className="w-35 h-10 border rounded-sm"
              ></input>
            </li>
            <li className="flex items-center gap-4">
              <p>เวลา :</p>
              <input
                type="text"
                readOnly
                className="w-35 h-10 border rounded-sm"
              ></input>
            </li>
          </ul>
        </div>

        <div className="flex flex-col h-full items-center gap-10 border">
          <button
            id="test"
            className="w-40 h-15  rounded-lg bg-blue-900 hover:bg-blue-950
          md:w-45 md:h-20"
            onClick={Testing}
          >
            <label className="text-xl text-white font-semibold">ทดสอบ</label>    
          </button>
          <button
            className="w-40 h-15  rounded-lg bg-red-600 hover:bg-red-700
          md:w-45 md:h-20"
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
