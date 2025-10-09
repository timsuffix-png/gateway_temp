import { useState, useEffect } from "react";
import SubmitButton from "../submitButton";
import Select from "react-select";
import Swal from "sweetalert2";

export default function SerialCommunicationPort() {
  type SerialPort = {
    portName: string;
    displayName: string;
  };
  const [portList, setPortList] = useState<SerialPort[]>(); // รายชื่อพอร์ตทั้งหมด
  const [COMPort, setCOMPort] = useState<number | null>(); //พอร์ตที่ user เลือก เช่น COM3
  const [currentWidth, setCurrentWidth] = useState(0); //ขนาดความกว้างของหน้าจอ

  const serialPortList = async () => {
    try {
      await navigator.serial.requestPort();
    } catch {}
  };

  useEffect(() => {
    if (typeof window !== "undefined" && window.electronAPI) {
      const fetchData = async () => {
        window.electronAPI.portlist(setPortList);
        await serialPortList();
        setCOMPort(Number(await window.electronAPI.getPort()));
      };
      fetchData();
    }

    const handleResize = () => {
      setCurrentWidth(window.innerWidth);
    };
    if (typeof window) {
      window.addEventListener("resize", handleResize);
      setCurrentWidth(window.innerWidth);
    }
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="text-start bg-white p-5 sm:p-10 2xl:p-20 border-black border-2 rounded-2xl flex flex-col">
      <label className="flex flex-col w-full">
        <h1 className="text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl text-black  mb-2">
          พอร์ตในเครื่องทั้งหมด
        </h1>
        <div
          className="h-[40px] md:h-[50px] bg-white rounded-md text-black text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl px-3 font-normal "
          style={{ width: currentWidth / 2 }}
        >
          <Select
            name="formulaProject"
            closeMenuOnSelect={true}
            options={portList?.map((data) => ({
              value: data.portName,
              label: data.portName + " " + data.displayName,
            }))}
            defaultMenuIsOpen
                      // onChange={(e) => setCOMPort(e.value)}
            onChange={e => setCOMPort(e ? Number(e.value.replace("COM", "")) : null)}

          />
          
        </div>
        <div className="mt-10 flex place-content-end">
          <SubmitButton
            text={"บันทึก"}
            onClick={async () => {
              if (!COMPort)
                return Swal.fire({
                  icon: "error",
                  title: "ตรวจสอบข้อมูลใหม่อีกครั้ง",
                  text: "กรุณาเลือกพอร์ตก่อนบันทึก",
                });
              await window.electronAPI.setPort(COMPort);
              setCOMPort(await window.electronAPI.getAPIPath());
              return Swal.fire({
                position: "top-end",
                icon: "success",
                title: "บันทึกข้อมูลเรียบร้อย",
                showConfirmButton: false,
                timer: 1500,
              });
            }}
          />
        </div>
      </label>
    </div>
  );
}
