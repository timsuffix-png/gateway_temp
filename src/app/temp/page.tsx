"use client";
import React, { useEffect, useRef, useState } from "react";
import Footer from "@/components/footer";
import Popup from "@/components/popup";
import SerialCommunicationPort from "@/components/temperature/serialCommunicationPort";
import CalibrateFile from "@/components/temperature/carlibrateFile";
import Swal from "sweetalert2";
import Select from "react-select";
import SideBar from "@/components/sidebar";

import Breadcrumb from "@/components/breadcrumb";
import { useAuth } from "@/lib/auth/authProvider";
import { localStorageWeb } from "@/utils/localstorage";
import TestHistory from "@/components/temperature/testHistory";

const statusMap: Record<string, { css: string; stateName: string }> = {
  stop: { css: "bg-red-600", stateName: "STOP" },
  on: { css: "bg-yellow-600", stateName: "กำลังดำเนินการ" },
  Passed: { css: "bg-green-600", stateName: "ผ่าน" },
  Failed: { css: "bg-red-400", stateName: "ไม่ผ่าน" },
};

export default function MainTempTest() {
  // Selectbar
  const [serialNumber, setSerialNumber] = useState(""); //รหัสสินค้า
  const [isSelectedCard, setIsSelectedCard] = useState<boolean>(false);
  const [currentCOMPort, setCurrentCOMPort] = useState<number | null>();
  const [popup, setPopup] = useState(false);
  const openPopup = () => setPopup(true);
  const closePopup = async () => {
    setPopup(false);
    setCurrentCOMPort(Number(await window.electronAPI.getPort()));
  };

  const [disAbleClick, setDisAbleClick] = useState<boolean>(false);

  const auth = useAuth();

  const [qcProject, setQcProject] = useState<string | null>(null); //qcProject ID
  const [temp1, setTemp1] = useState<number | 0>(0); //หันหน้าเข้าแผ่นเตารีด ขวา
  const [temp2, setTemp2] = useState<number | 0>(0); //หันหน้าเข้าแผ่นเตารีด ซ้าย
  const [temp3, setTemp3] = useState<number | 0>(0); //บนหน้าเตารีด
  const [temp4, setTemp4] = useState<number | 0>(0); //กลางหน้าเตารีด

  const [ambient1, setAmbient1] = useState<number | 0>(0);
  const [ambient2, setAmbient2] = useState<number | 0>(0);
  const [ambient3, setAmbient3] = useState<number | 0>(0);
  const [ambient4, setAmbient4] = useState<number | 0>(0);

  const [current, setCurrent] = useState<number | null>(null);
  const [time, setTime] = useState<number | null>(null);
  const [status, setStatus] = useState<string>(""); //สถานะการทดสอบ
  const { css, stateName } = statusMap[status] || {
    css: "bg-gray-400",
    stateName: "ปิด",
  };
  const [detail, setDetail] = useState("");
  const ironImageRef = useRef<any | null>(null);
  const [sendData, setSendData] = useState<{
    state: string;
    tempMin: number;
    tempLim: number;
    currentLim: number;
    startMoment: number;
    endMoment: number;
    // Sensor 1 (also used for Sensor 3)
    m1: number; c1: number; m2: number; c2: number; k1: number; x01: number;
    // Sensor 2 (also used for Sensor 4)
    m3: number; c3: number; m4: number; c4: number; k2: number; x02: number;
  }>({
    state: "on",
    tempMin: 0.0,
    tempLim: 0.0,
    currentLim: 0.0,
    startMoment: 0.0,
    endMoment: 0.0,
    // Sensor 1 (also used for Sensor 3)
    m1: 0.0, c1: 0.0, m2: 0.0, c2: 0.0, k1: 0.0, x01: 0.0,
    // Sensor 2 (also used for Sensor 4)
    m3: 0.0, c3: 0.0, m4: 0.0, c4: 0.0, k2: 0.0, x02: 0.0,
  });

  const [qcMains, setQcMains] = useState<{
    error: boolean;
    message: string;
    data: [
      {
        ID: string;
        qcMain:
        | {
          qcType: {
            ID: string;
            name: string;
          };
          ID: string;
          testName: string;
          detail: string;
          qcScript: {
            ID: string;
            script: {
              TemperatureMin: number;
              TemperatureMax: number;
              CurrentMax: number;
              StartMoment: number;
              EndMoment: number;
              m1: number;
              c1: number;
              m2: number;
              c2: number;
              k1: number;
              x01: number;
              m3: number;
              c3: number;
              m4: number;
              c4: number;
              k2: number;
              x02: number;
            };
          };
          status: string | null; //ค่าสถานะ
          result: string | null; //ผลลัพธ์ล่าสุด
          allResult: string[] | null; //ข้อมูลทั้งหมด
        }
        | undefined;
        qcProject: {
          ID: string;
          projectName: string;
          detail: string;
        };
      },
    ];
  } | null>();
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
          },
        ];
      },
    ];
    allPage: number;
  } | null>();



  const detailTemp: Record<string, Record<string, string>> = {
    ironInterrupt: {
      "010": "เซนเซอร์ ขวา มีปัญหาในการอ่านค่า",
      "011": "เซนเซอร์ ซ้าย มีปัญหาในการอ่านค่า",
      "012": "เซนเซอร์ กลาง มีปัญหาในการอ่านค่า",
      "013": "เซนเซอร์ บน มีปัญหาในการอ่านค่า",
      "000": "กรุณาตรวจสอบเตารีดของท่าน",
      "666": "กำลังดำเนินการ",
      "777": "หยุดโดยผู้ใช้งาน",
    },
    detailFailed: {
      "888": "ผ่าน",
      "020": "อุณหภูมิเกินกว่าค่าที่กำหนด",
      "021": "อุณหภูมิต่ำกว่าค่าที่กำหนด",
      "030": "เทอโมสตัดตัดก่อนกำหนด",
      "031": "เทอโมสตัดตัดหลังกำหนด",
      "040": "กระแสไฟฟ้าเกิน",

    },
  };

  const recordedRef = useRef(false);
  const isSelectedCardRef = useRef(isSelectedCard);
  const qcMainsRef = useRef(qcMains);
  const qcProjectRef = useRef(qcProject);
  const serialNumberRef = useRef(serialNumber);
  const statusRef = useRef(status);
  // ref สำหรับ input รหัสสินค้า เพื่อ set value หลัง lookup encrypted QR
  const serialInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ironImageRef.current) {
      const loadImage = async () => {
        const logo = await window.electronAPI.loadImg("iron-plate.png");

        ironImageRef.current.src = logo;
      };
      loadImage();
    }
  }, [auth]);

  //ฟังชั่นรับserial Data
  const handleSerialData = (data: string) => {
    //0ขวา, 1กลาง, 2ซ้าย , 3บน
    const parts = data.split(",");
    if (parts.length > 10) {
      const detail = parts[12]?.trim();
      const status = parts[11].trim();

      setTemp1(parseFloat(parts[0]));
      setTemp2(parseFloat(parts[1]));
      setTemp3(parseFloat(parts[2]));
      setTemp4(parseFloat(parts[3]));

      setAmbient1(parseFloat(parts[4]));
      setAmbient2(parseFloat(parts[5]));
      setAmbient3(parseFloat(parts[6]));
      setAmbient4(parseFloat(parts[7]));

      setTime(parseInt(parts[9]));
      setCurrent(parseFloat(parts[10]));
      setStatus(detail === "777" ? "stop" : status);
      setDetail(detailTemp.detailFailed[detail] || detailTemp.ironInterrupt[detail] || "-");

      // เซฟเฉพาะ Passed หรือ Failed เพราะเหตุผลใน detailFailed เท่านั้น
      if (
        status === "Passed" ||
        (status === "Failed" && detail in detailTemp.detailFailed)
      ) {
        if (!recordedRef.current) {
          recordedRef.current = true;
          recordData(parts);
        }
      }
    }
  };

  //fetch API
  const fetchQcProjectList = async () => {
    const data = await window.electronAPI.fetchAPI({
      method: "GET",
      URL: `qc/project/extend?limit=999999999999&page=1`,
    });
    if (!data) {
      throw new Error("Failed to fetch data");
    }
    return data;
  };
  // MainTempTest.tsx

  const fetchScript = async (
    projectID: string | null,
    isCardSelected: boolean,
    currentQcMains: typeof qcMains
  ) => {
    let rawData = null;
    let dataToProcess = null;
    //ถ้ามีการเลือกcard
    if (isCardSelected && currentQcMains && currentQcMains.data.length > 0) {
      dataToProcess = currentQcMains.data;
    }
    //ถ้าไม่มีการเลือกcard
    else if (projectID && projectID.length > 0 && !isCardSelected) {
      const hasData = currentQcMains?.data?.some(
        (d: any) => d.qcProject?.ID === projectID
      );
      if (!hasData) {
        rawData = await window.electronAPI.fetchAPI({
          method: "GET",
          URL: `qc/itemProject/${projectID}`,
        });
        setQcMains(rawData);
        dataToProcess = rawData?.data;
      } else {
        dataToProcess = currentQcMains?.data;
      }
    }

    if (dataToProcess) {
      const format_script = (dataToProcess || []).find(
        (data: any) =>
          String(data?.qcMain?.qcType?.name || "").toLowerCase() === "thermostat"
      );

      setSendData((prev) => ({
        ...prev,
        tempMin: format_script?.qcMain?.qcScript?.script?.TemperatureMin ?? 0.0,
        tempLim: format_script?.qcMain?.qcScript?.script?.TemperatureMax ?? 0.0,
        currentLim: format_script?.qcMain?.qcScript?.script?.CurrentMax ?? 0.0,
        startMoment: format_script?.qcMain?.qcScript?.script?.StartMoment ?? 0.0,
        endMoment: format_script?.qcMain?.qcScript?.script?.EndMoment ?? 0.0,

        m3: format_script?.qcMain?.qcScript?.script?.m3 ?? 0.0,
        c3: format_script?.qcMain?.qcScript?.script?.c3 ?? 0.0,
        m4: format_script?.qcMain?.qcScript?.script?.m4 ?? 0.0,
        c4: format_script?.qcMain?.qcScript?.script?.c4 ?? 0.0,
        k2: format_script?.qcMain?.qcScript?.script?.k2 ?? 0.0,
        x02: format_script?.qcMain?.qcScript?.script?.x02 ?? 0.0,

        m1: format_script?.qcMain?.qcScript?.script?.m1 ?? 0.0,
        c1: format_script?.qcMain?.qcScript?.script?.c1 ?? 0.0,
        m2: format_script?.qcMain?.qcScript?.script?.m2 ?? 0.0,
        c2: format_script?.qcMain?.qcScript?.script?.c2 ?? 0.0,
        k1: format_script?.qcMain?.qcScript?.script?.k1 ?? 0.0,
        x01: format_script?.qcMain?.qcScript?.script?.x01 ?? 0.0,


      }));
    }
  };

  const clickTest = async (state: string) => {
    // console.log("senData :", sendData);
    recordedRef.current = false;
    if (!currentCOMPort) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "กรุณาเลือกพอร์ตให้ถูกต้อง",
      });
      return;
    }

    if (!isSelectedCard && !qcProject) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "กรุณาเลือกโปรเจกต์การทดสอบ",
      });
      return;
    }

    if (!serialNumber) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "กรุณากรอกรหัสสินค้า",
      });
      return;
    }

    if (qcMains) {
      const newQcMains = {
        ...qcMains,
        data: qcMains.data.map((item) => ({
          ...item,
          qcMain: item.qcMain
            ? {
              ...item.qcMain,
              status: null,
              result: null,
              allResult: null,
            }
            : undefined,
        })),
      };
      setQcMains(newQcMains as any);
    }

    try {
      if (disAbleClick) return;
      setDisAbleClick(true); //กดไม่ได้

      setTimeout(() => {
        setDisAbleClick(false); //กดได้
      }, 2000);

      await window.electronAPI.openPort(String(currentCOMPort));
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Build command string (Arduino derives sensorCount = calibrationParams / 6):
      // Build single-line command, no spaces, terminated with \n
      // Format: state,tempMin,tempLim,currentLim,startMoment,endMoment,
      //         S1(m3,c3,m4,c4,k2,x02), S2(m1,c1,m2,c2,k1,x01),
      //         S3=S1,                   S4=S2
      //         (Arduino: sensorCount = 24 calibration params / 6 = 4)
      const commandStr =
        `${state},${sendData.tempMin},${sendData.tempLim},${sendData.currentLim},${sendData.startMoment},${sendData.endMoment},` +
        `${sendData.m3},${sendData.c3},${sendData.m4},${sendData.c4},${sendData.k2},${sendData.x02},` +
        `${sendData.m1},${sendData.c1},${sendData.m2},${sendData.c2},${sendData.k1},${sendData.x01},` +
        `${sendData.m3},${sendData.c3},${sendData.m4},${sendData.c4},${sendData.k2},${sendData.x02},` +
        `${sendData.m1},${sendData.c1},${sendData.m2},${sendData.c2},${sendData.k1},${sendData.x01}\n`;

      console.log("[clickTest] commandStr:", commandStr);

      await window.electronAPI.writeData({
        port: currentCOMPort,
        command: commandStr,
      });
    } catch (error) {
      const errStr = String(error ?? "").trim(); // รับรองเป็น string
      if (currentCOMPort !== null && errStr.includes("Access denied")) {
        Swal.fire({
          icon: "warning",
          title: "เกิดข้อผิดพลาด",
          text: `พอร์ต ${currentCOMPort} กำลังเชื่อมต่อกับที่อื่น`,
        });
      }
      return;
    }
  };

  const recordData = async (lastResult: string[]) => {
    try {
      // แทนค่า -999 (sensor error) ใน index 0-7 ด้วย string ว่าง ก่อน save
      // เพื่อป้องกันค่า error code ไปบิดเบือนกราฟใน dashboard
      const sanitized = [...lastResult];
      for (let i = 0; i <= 7; i++) {
        const num = parseFloat(sanitized[i]);
        if (num === -999 || isNaN(num)) sanitized[i] = "";
      }

      let record: any;

      if (!isSelectedCardRef.current) {
        console.log(
          "false isSelectedCardRef.current status :",
          isSelectedCardRef.current
        );
        record = await window.electronAPI.fetchAPI({
          method: "POST",
          URL: "qc/record",
          body: {
            qcProjectID: qcProjectRef.current,
            serialNumber: serialNumberRef.current,
            testBy: auth.user.data.ID,
          },
        });
        if (!record) {
          Swal.fire({
            icon: "error",
            title: "เกิดข้อผิดพลาด",
            text: "ไม่สามารถสร้างบันทึกการทดสอบได้",
          });
          return;
        }
      } else {
        record = qcMainsRef.current;
      }

      const qcMainTemp = qcMainsRef.current?.data.find(
        (d: any) => String(d?.qcMain?.qcType?.name || "").toLowerCase() === "thermostat"
      )?.qcMain?.ID;

      const res = await window.electronAPI.fetchAPI({
        method: "POST",
        URL: "qc/status",
        body: {
          qcRecordID: record?.data?.[0]?.ID,
          qcMainID: qcMainTemp,
          result: lastResult[11].trim(),
          status: lastResult[11].trim(),
          detail: sanitized.join(",").trim(),
        },
      });
      if (!res) {
        Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาด",
          text: "ไม่สามารถบันทึกผลการทดสอบได้",
        });
      }
    } catch (error) {
      console.error("Error recording data:", error);
    }
  };

  // ======================================================
  // lookup รหัสสินค้าจาก encrypted QR code ที่ scanner อ่านมา
  // scanner อ่าน QR → ได้ encryptIDValue (ขึ้นต้นด้วย U2FsdGVkX1)
  // → เรียก construct/encrypt API → return Construct.ID (serial 20 หลัก)
  // ======================================================
  const lookupEncryptedSerial = async (encryptedValue: string) => {
    try {
      const res = await window.electronAPI.fetchAPI({
        method: "POST",
        URL: "construct/encrypt",
        body: { encryptSerialNumber: encryptedValue },
      });

      if (res?.data?.ID) {
        // แปลง encrypted → serial number จริง แล้ว update state + input
        const realSerial: string = res.data.ID;
        setSerialNumber(realSerial);
        if (serialInputRef.current) {
          serialInputRef.current.value = realSerial;
        }
      } else {
        // QR code ไม่พบในระบบ
        Swal.fire({
          icon: "error",
          title: "QR Code ไม่ถูกต้อง",
          text: "ไม่พบข้อมูลสินค้าในระบบ กรุณาตรวจสอบอีกครั้ง",
        });
        setSerialNumber("");
        if (serialInputRef.current) serialInputRef.current.value = "";
      }
    } catch (err) {
      console.error("lookupEncryptedSerial error:", err);
    }
  };

  const refreshData = async () => {
    const data = await fetchQcProjectList();
    setQcProjectList(data);
  };

  useEffect(() => {
    isSelectedCardRef.current = isSelectedCard;
  }, [isSelectedCard]);
  useEffect(() => {
    qcProjectRef.current = qcProject;
  }, [qcProject]);
  useEffect(() => {
    serialNumberRef.current = serialNumber;
  }, [serialNumber]);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);
  useEffect(() => {
    qcMainsRef.current = qcMains;
  }, [qcMains]);

  useEffect(() => {
    // ส่ง callback เดิมเข้าไปทั้งตอน on และตอน remove)
    const serialDataListener = handleSerialData;

    window.electronAPI.onSerialData(serialDataListener); // เมื่อมีข้อมูล Serial Data เข้ามา ให้เรียกใช้ฟังก์ชัน handleSerialData
    // window.electronAPI.onSerialPortClosed(serialPortClosedListener); // เมื่อพอร์ตถูกปิด ให้เรียกใช้ฟังก์ชัน handlePortClosed

    // ล้าง listener เมื่อ component ถูก unmount หรือเมื่อdependencyเปลี่ยน
    // return () => {
    //   window.electronAPI.removeSerialDataListener(serialDataListener);
    //   window.electronAPI.removeSerialPortClosedListener(
    //     serialPortClosedListener
    //   );
    // };
  }, []);

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    console.log("qcProject isSelectedCard changed :", qcProject);
    console.log("qcMain isSelectedCard changed :", qcMains);

    if (isSelectedCard) return;
    setQcProject(null);
  }, [isSelectedCard]);

  useEffect(() => {
    fetchScript(qcProject, isSelectedCard, qcMains);
  }, [qcProject, isSelectedCard, qcMains]);

  return (
    <div className="flex h-screen">
      <SideBar />
      <div className="flex flex-col w-full h-full  overflow-y-auto">
        <Breadcrumb />
        <div className="flex flex-col bg-white w-full h-full overflow-y-auto whitespace-nowrap place-items-center">
          {/* Select Bar */}
          <div className="w-full flex flex-col 2x:flex-row ">
            <ul
              className="flex flex-col justify-between items-start pt-5 px-10 gap-2 text-lg 
            md:flex-row md:gap-10 md:items-center"
            >
              <li
                className="flex flex-col justify-start items-start text-center whitespace-nowrap
             md:basis-40"
              >
                <h4 className="flex-nowrap pb-3 text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl font-normal ">
                  พอร์ตเทอร์โมสตัท
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


              <li className="w-fit text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl md:min-w-[240px]">
                <div className="flex flex-col">
                  <div className="flex pb-3">
                    <p className="">โปรเจกต์การทดสอบ</p>
                    <span className="text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl text-red-600">
                      &nbsp;*
                    </span>
                  </div>
                  {!isSelectedCard ? (
                    <div className="relative w-fit min-w-[240px] max-w-[600px]">
                      {/* Hidden spacer to force width based on longest option */}
                      <div className="invisible h-0 px-10 whitespace-nowrap overflow-hidden pointer-events-none border border-transparent">
                        {qcProjectList?.data?.reduce((max: string, item: any) =>
                          ((item.projectName?.length || 0) > max.length ? item.projectName : max), "Select Project..."
                        )}
                      </div>
                      <Select
                        className="rounded-sm"
                        styles={{
                          container: (base) => ({
                            ...base,
                            width: "100%",
                          }),
                          control: (base) => ({
                            ...base,
                            width: "100%",
                            fontSize: "inherit",
                          }),
                          menu: (base) => ({
                            ...base,
                            width: "max-content",
                            minWidth: "100%",
                            maxWidth: "600px",
                          }),
                        }}
                        closeMenuOnSelect={true}
                        options={qcProjectList?.data?.map((data) => ({
                          value: data.ID,
                          label: data.projectName,
                        }))}
                        onChange={(e) => {
                          setQcProject(e ? e.value : "");
                        }}
                      />
                    </div>
                  ) : (
                    <h1 className="text-red-600 text-lg xl:text-xl h-10 flex place-items-end">
                      มีการทดสอบที่ถูกเลือกแล้ว
                    </h1>
                  )}
                </div>
              </li>
              <li className="w-full md:flex-grow md:w-auto text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl">
                <div className="flex pb-3">
                  <p>รหัสสินค้า</p>
                  <span className="text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl text-red-600">
                    &nbsp;*
                  </span>
                </div>
                <input
                  ref={serialInputRef}
                  required
                  className="w-full px-2 py-1 rounded-sm border border-gray-300"
                  placeholder="รหัสสินค้า"
                  onClick={(e: any) => {
                    e.target.value = "";
                    setSerialNumber("");
                  }}
                  onChange={(e) => {
                    const val = e.target.value;
                    // ถ้าไม่ใช่ encrypted QR → set ตามปกติ (พิมพ์เอง)
                    // ถ้าเป็น encrypted (U2FsdGVkX1...) รอ Enter จาก scanner ก่อน
                    if (!val.startsWith("U2FsdGVkX1")) {
                      setSerialNumber(val);
                    }
                  }}
                  onKeyDown={(e) => {
                    // scanner ส่ง Enter หลังสแกน → ตรวจว่าเป็น encrypted QR มั้ย
                    if (e.key === "Enter") {
                      const val = (e.target as HTMLInputElement).value;
                      if (val.startsWith("U2FsdGVkX1")) {
                        e.preventDefault(); // ป้องกัน Enter ทำงานอื่น
                        lookupEncryptedSerial(val);
                      }
                    }
                  }}
                />
              </li>
            </ul>
          </div>
          <div className="w-full h-10 my-4"> </div>

          {/* ----------- Body -------------*/}
          <div
            className="w-full h-full flex px-[20%] flex-col justify-between 
          lg:gap-10 lg:px-[10%] lg:my-2 "
          >
            <div>
              {serialNumber && (
                <TestHistory
                  serialNumber={serialNumber}
                  setData={(data: any) => setQcMains(data)}
                  isChecked={setIsSelectedCard}
                />
              )}
            </div>
            {/* ภาพเตารีด */}
            <div className="relative self-center pt-10 pb-10">
              <img
                className="w-[240px] h-[400px]"
                ref={ironImageRef}
                // width={500}
                // height={100}
                alt="logo"
              />

              <div>
                <div>
                  {/* บน */}
                  <div className="absolute left-1/2 -translate-x-1/2 -top-7 text-[#d6bb0fff] text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl  font-bold">
                    {temp4} °C
                  </div>
                  <div className="absolute left-1/2 -translate-x-1/2 top-3 text-gray-900 text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl font-semibold">
                    อุณหภูมิรอบข้าง : {ambient4} °C
                  </div>
                  <div className="flex flex-col absolute left-25 top-20 items-center">
                    <label className="text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl text-[#fbff00ff]">
                      บน
                    </label>

                    <svg
                      className="h-6 w-6"
                      fill="#fbff00ff"
                      viewBox="0 0 512 512"
                      xmlns="http://www.w3.org/2000/svg"
                      stroke="#ff0000"
                    >
                      <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                      <g
                        id="SVGRepo_tracerCarrier"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      ></g>
                      <g id="SVGRepo_iconCarrier">
                        <path d="M256 56c110.532 0 200 89.451 200 200 0 110.532-89.451 200-200 200-110.532 0-200-89.451-200-200 0-110.532 89.451-200 200-200m0-48C119.033 8 8 119.033 8 256s111.033 248 248 248 248-111.033 248-248S392.967 8 256 8zm0 168c-44.183 0-80 35.817-80 80s35.817 80 80 80 80-35.817 80-80-35.817-80-80-80z"></path>
                      </g>
                    </svg>
                  </div>
                </div>

                <div>
                  {/* กลาง */}
                  <div className="absolute absolute left-1/2 -translate-x-1/2 bottom-1 text-[#1496ecff] text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl  font-bold">
                    {temp2} °C
                  </div>
                  <div className="absolute left-1/2 -translate-x-1/2 -bottom-7 text-gray-900 text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl font-semibold">
                    อุณหภูมิรอบข้าง : {ambient2} °C
                  </div>
                  <div className="flex flex-col absolute left-23 top-45 items-center">
                    <label className="text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl text-[#66f0ffff]">
                      กลาง
                    </label>

                    <svg
                      className="h-6 w-6"
                      fill="#66f0ffff"
                      viewBox="0 0 512 512"
                      xmlns="http://www.w3.org/2000/svg"
                      stroke="#ff0000"
                    >
                      <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                      <g
                        id="SVGRepo_tracerCarrier"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      ></g>
                      <g id="SVGRepo_iconCarrier">
                        <path d="M256 56c110.532 0 200 89.451 200 200 0 110.532-89.451 200-200 200-110.532 0-200-89.451-200-200 0-110.532 89.451-200 200-200m0-48C119.033 8 8 119.033 8 256s111.033 248 248 248 248-111.033 248-248S392.967 8 256 8zm0 168c-44.183 0-80 35.817-80 80s35.817 80 80 80 80-35.817 80-80-35.817-80-80-80z"></path>
                      </g>
                    </svg>
                  </div>
                </div>

                {/* ซ้าย */}
                <div className="absolute right-58 bottom-36 text-[#0fb500ff] text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl  font-bold">
                  {temp3} °C
                </div>
                <div className="absolute right-58 bottom-28 text-gray-900 text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl  font-semibold">
                  อุณหภูมิรอบข้าง : {ambient3} °C
                </div>
                <div className="flex flex-col absolute left-6 bottom-30 items-center">
                  <label className="text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl text-[#61ff53ff]">
                    ซ้าย
                  </label>
                  <svg
                    className="h-6 w-6"
                    fill="#61ff53ff"
                    viewBox="0 0 512 512"
                    xmlns="http://www.w3.org/2000/svg"
                    stroke="#ff0000"
                  >
                    <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                    <g
                      id="SVGRepo_tracerCarrier"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></g>
                    <g id="SVGRepo_iconCarrier">
                      <path d="M256 56c110.532 0 200 89.451 200 200 0 110.532-89.451 200-200 200-110.532 0-200-89.451-200-200 0-110.532 89.451-200 200-200m0-48C119.033 8 8 119.033 8 256s111.033 248 248 248 248-111.033 248-248S392.967 8 256 8zm0 168c-44.183 0-80 35.817-80 80s35.817 80 80 80 80-35.817 80-80-35.817-80-80-80z"></path>
                    </g>
                  </svg>
                </div>
              </div>

              {/* ขวา */}
              <div>
                <div className="absolute left-58 bottom-36 text-[#FF5CB6] text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl  font-bold">
                  {temp1} °C
                </div>
                <div className="absolute  left-58 bottom-28 text-gray-900 text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl font-semibold">
                  อุณหภูมิรอบข้าง : {ambient1} °C
                </div>
                <div className="flex flex-col absolute right-5 bottom-30 items-center">
                  <label className="text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl text-[#FFB8DF]">
                    ขวา
                  </label>

                  <svg
                    className="h-6 w-6"
                    fill="#FFB8DF"
                    viewBox="0 0 512 512"
                    xmlns="http://www.w3.org/2000/svg"
                    stroke="#ff0000"
                  >
                    <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                    <g
                      id="SVGRepo_tracerCarrier"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></g>
                    <g id="SVGRepo_iconCarrier">
                      <path d="M256 56c110.532 0 200 89.451 200 200 0 110.532-89.451 200-200 200-110.532 0-200-89.451-200-200 0-110.532 89.451-200 200-200m0-48C119.033 8 8 119.033 8 256s111.033 248 248 248 248-111.033 248-248S392.967 8 256 8zm0 168c-44.183 0-80 35.817-80 80s35.817 80 80 80 80-35.817 80-80-35.817-80-80-80z"></path>
                    </g>
                  </svg>
                </div>
              </div>
            </div>

            <div className="w-full h-full flex flex-col justify-between gap-6 pt-6 sm:gap-8 sm:pt-8 lg:pt-0 lg:flex-row lg:gap-0">
              {/* กระแส อุณหภูมิ */}
              <div
                className="flex flex-col w-full h-full gap-6 justify-between text-base sm:text-lg md:text-xl xl:text-2xl 2xl:text-3xl
                lg:items-start "
              >
                <div className="flex flex-col pt-10 lg:flex-row lg:pt-0 gap-4 sm:gap-8">
                  <div className="flex items-center gap-4">
                    <p>กระแสไฟฟ้า :</p>
                    <input
                      className="w-20 sm:w-24 md:w-28 h-8 sm:h-9 md:h-10 text-center border rounded-sm"
                      type="text"
                      value={current ? current : 0}
                      readOnly
                    ></input>
                    <span>แอมแปร์</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <p>เวลา :</p>
                    <input
                      className="w-20 sm:w-24 md:w-28 h-8 sm:h-9 md:h-10 text-center border rounded-sm"
                      type="text"
                      value={time ? time : 0}
                      readOnly
                    ></input>
                    <span>วินาที</span>
                  </div>
                </div>
                <div className="flex flex-col gap-10 items-start">
                  <div className="flex h-auto w-auto items-center justify-center gap-4 ">
                    <p>ผลลัพธ์ : </p>
                    <div
                      className={`w-auto flex px-4 py-2 justify-center items-center whitespace-nowrap rounded-lg text-white ${css}`}
                    >
                      {stateName}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p>หมายเหตุ :</p>
                    <p>{detail}</p>
                  </div>
                </div>
              </div>

              {/* ปุ่มกดทดสอบ หยุด */}
              <div className="flex flex-col h-auto w-full items-center gap-6 py-6 sm:gap-8 lg:items-end">
                <button
                  id="test"
                  className={`w-full sm:w-[70%] lg:w-[70%] xl:w-[50%] h-12 sm:h-14 lg:h-16 text-base sm:text-lg md:text-xl xl:text-2xl 2xl:text-3xl 
                  rounded-lg font-semibold text-white transition duration-200
                  ${disAbleClick
                      ? "bg-[#001F3F]/60 cursor-not-allowed"
                      : "bg-[#003366] hover:bg-[#001F3F] hover:cursor-pointer"
                    }`}
                  onClick={() => clickTest("on")}
                >
                  ทดสอบ
                </button>
                <button
                  className="w-full sm:w-[70%] lg:w-[70%] xl:w-[50%] h-12 sm:h-14 lg:h-16 text-base sm:text-lg md:text-xl xl:text-2xl 2xl:text-3xl rounded-lg bg-red-500 hover:cursor-pointer text-white font-semibold 
                  transition duration-300 hover:bg-red-600"
                  onClick={() => clickTest("stop")}
                >
                  หยุด
                </button>
              </div>
            </div>
            <div className="flex flex-col-reverse place-content-center mt-auto">
              <Footer />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
