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
import Swal from "sweetalert2";
import { resolve } from "path";
import Select from "react-select";

export default function MainTempTest_page() {
  // Selectbar
  const [productId, setProductId] = useState<number | null>(null);
  const [currentCOMPort, setCurrentCOMPort] = useState<number | null>();
  const [popup, setPopup] = useState(false);
  const openPopup = () => setPopup(true);
  const closePopup = async () => {
    setPopup(false);
    setCurrentCOMPort(Number(await window.electronAPI.getPort()));
  };

  const [qcTest, setQcTest] = useState("");
  const [temp1, setTemp1] = useState<number | null>(null);
  const [temp2, setTemp2] = useState<number | null>(null);
  const [temp3, setTemp3] = useState<number | null>(null);
  const [current, setCurrent] = useState<number | null>(null);
  const [time, setTime] = useState<number | null>(null);
  const [case_precess, setCaseProcess] = useState<string>("stop");
  const [sendData, setSendData] = useState<{
    state: string;
    tempLim: number;
    currentLim: number;
    timeLim: number;
  }>({
    state: "",
    tempLim: 60.0,
    currentLim: 6.0,
    timeLim: 10,
  });
  const [qcProjectList, setQcProjectList] = useState<{
    error: boolean;
    message: string;
    data: [
      {
        ID: string;
        projectName: string;
        detail: string;
        qcItemProject: [
          {
            ID: string;
            qcMain: {
              ID: string;
              testName: string;
              detail: string;
            };
          }
        ];
      }
    ];
    allPage: number;
  } | null>();

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
      console.log("State command : " + JSON.stringify(sendData));
      console.log("Data  : " + data);
    } catch (error) {
      console.log("Error in serialPort: " + error);
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

  //fetch API
  const fetchQcProjectList = async () => {
    const data = await window.electronAPI.fetchAPI({
      method: "GET",
      URL: `qc/project/extend?limit=100&page=1`,
    });
    if (!data) {
      throw new Error("Failed to fetch data");
    }
    return data;
  };

  const fetchScript = async (idProject: string) => {
    console.log("ID Project: " + idProject);
    const rawData = await window.electronAPI.fetchAPI({
      method: "GET",
      URL: `qc/itemProject/${idProject}`,
    });
    console.log("rawData is:", rawData);
    if (!rawData) {
      throw new Error("Failed to fetch data");
    }
    const format_script = await rawData?.data?.find(
      //หาที่ qcType = temperature
      (data: any) =>
        data.qcMain?.qcType?.ID === "796a7f7f-3aa0-4e8a-98b1-b6f7dbeeb600"
    );

    console.log("format_script" + JSON.stringify(format_script));

    console.log(
      "temp : " + format_script?.qcMain?.qcScript?.script?.TemperatureMax
    );
    console.log(
      "current : " + format_script?.qcMain?.qcScript?.script?.CurrentMax
    );
    console.log("time : " + format_script?.qcMain?.qcScript?.script?.Time);
    setSendData((prev) => ({
      ...prev,
      tempLim: format_script?.qcMain?.qcScript?.script?.TemperatureMax,
      currentLim: format_script?.qcMain?.qcScript?.script?.CurrentMax,
      timeLim: format_script?.qcMain?.qcScript?.script?.Time,
    }));
  };

  const refreshData = async () => {
    const data = await fetchQcProjectList();
    setQcProjectList(data);
    console.log("QcProjectList: ", data);
  };

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    fetchScript(qcTest);
  }, [qcTest]);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Select Bar */}
      <div className="flex flex-col 2x:flex-row">
        <ul
          className="flex flex-col justify-between items-start pt-5 px-10 gap-2 text-lg font-['Sarabun']
       md:flex-row md:gap-10 md:items-center "
        >
          <li
            className="flex flex-col justify-center items-center text-center whitespace-nowrap
        md:basis-40"
          >
            <h4 className="flex-nowrap text-lg xl:text-xl font-normal font-['Sarabun']">
              Temperature port
              <span className="text-red-600">&nbsp;*</span>
            </h4>
            <div className="text-black text-lg xl:text-xl flex place-content-start w-full lg:mt-3">
              {currentCOMPort ? <h1>{"COM" + currentCOMPort}</h1> : null}
              <button className="ml-5" onClick={openPopup}>
                {currentCOMPort ? "เปลี่ยน" : "เลือก"}
              </button>
            </div>
            {popup && (
              <Popup onClose={closePopup}>
                <SerialCommunicationPort />
              </Popup>
            )}
          </li>
          <li className="w-full md:basis-60">
            <div className="flex">
              <p className="">โปรเจคการทดสอบ</p>
              <span className="text-red-600">&nbsp;*</span>
            </div>

            <Select
              className="rounded-sm border"
              options={
                qcProjectList?.data
                  ? qcProjectList.data
                      //1) filter
                      .filter((project) =>
                        project.qcItemProject?.some(
                          (item) =>
                            item.qcMain?.ID ===
                            "daf844d8-2e39-4f05-8d45-4102b4baf7f4"
                        )
                      )
                      //2) map
                      .map((project) => ({
                        value: project.ID,
                        label: project.projectName,
                      }))
                  : []
              }
              onChange={(e) => setQcTest(e ? e.value : "")}
            />
          </li>
          <li className="w-full md:flex-grow md:w-auto">
            <div className="flex">
              <p>รหัสสินค้า</p>
              <span className="text-red-600">&nbsp;*</span>
            </div>
            <input
              required
              className="w-full px-2 py-1 rounded-sm border"
              placeholder="รหัสสินค้า"
              onChange={(e) => {
                const value = e.target.value;
                setProductId(value ? Number(value) : null);
              }}
            ></input>
          </li>
        </ul>
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
            className="w-40 h-15  rounded-lg bg-[#001F3F] hover:cursor-pointer
          md:w-45 md:h-20"
            onClick={async () => {
              const port = await window.electronAPI.getPort();

              if (!port) {
                Swal.fire({
                  icon: "error",
                  title: "เกิดข้อผิดพลาด",
                  text: "กรุณาเลือกพอร์ตให้ถูกต้อง",
                });
                return;
              }

              setSendData((prev) => ({
                ...prev,
                state: "on",
              }));
            }}
          >
            <label className="text-xl text-white font-semibold">ทดสอบ</label>
          </button>
          <button
            className="w-40 h-15  rounded-lg bg-red-600 hover:cursor-pointer
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
