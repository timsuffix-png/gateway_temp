"use client";

import { useState } from "react";
import { Option } from "@/app/temp/main";
import Select from "react-select";
import Popup from "./popup";
import SerialCommunicationPort from "./serialCommunicationPort";

interface SelectBarProps {
  projects: Option[];
}

export default function SelectBar({ projects }: SelectBarProps) {
  const [productId, setProductId] = useState<number | null>(null);
  const [currentCOMPort, setCurrentCOMPort] = useState<number | null>();
  const [popup, setPopup] = useState(false);
  const openPopup = () => setPopup(true);
  const closePopup = async () => {
    setPopup(false);
    setCurrentCOMPort(Number(await window.electronAPI.getPort()));
  };

  return (
    <>
      <div className="flex border-b">
        <img
          src="/logo.png"
          alt="โลโก้"
          className="w-[227px] h-[52px] block 2xl:hidden"
          width={260}
          height={60}
        />
      </div>
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
            options={projects?.map((data) => ({
              value: data.id,
              label: data.name,
            }))}
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
    </>
  );
}
