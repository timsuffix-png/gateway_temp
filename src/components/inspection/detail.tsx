"use client";

import Navbar from "@/components/navbar";
import Breadcrumb from "../breadcrumb";
import Footer from "../footer";
import BackButton from "../backButton";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/authProvider";

export default function QcDetail() {
  const auth = useAuth();
  const param = localStorage.getItem("param");
  const [record, setRecord] = useState([]);

  useEffect(() => {
    refreshData();
  }, [auth]);

  const fetchData = async () => {
    const data = await window.electronAPI.fetchAPI({
      method: "POST",
      URL: `qc/record/findBySerialNumber`,
      body: {
        serialNumber: param
      }
    });
    if (!data) throw new Error("Failed to fetch data.");

    return data;
  };

  const refreshData = async () => {
    const data = await fetchData();
    setRecord(data.data);
  };

  return (
    <>
      <div className="flex w-screen h-screen">
        <div>
          <Navbar />
        </div>
        <div className="flex flex-col w-full h-full">
          <Breadcrumb />
          <div className="flex flex-col bg-white w-full h-full overflow-y-auto whitespace-nowrap place-items-center pt-5">
            <div className="flex flex-row w-full place-items-center">
              <div className="flex place-items-center">
                <div
                  tabIndex={0}
                  onClick={() => {
                    localStorage.setItem("currentUrl", "qc");
                    window.location.reload();
                  }}
                  className="ml-5 sm:ml-20 cursor-pointer"
                >
                  <BackButton text="ย้อนกลับ" />
                </div>
                <h2 className="ml-5 sm:ml-20 text-black text-lg xl:text-xl 2xl:text-2xl font-bold font-['Sarabun'] text-wrap sm:text-nowrap">
                  รายละเอียดการทดสอบ
                </h2>
              </div>
            </div>
            <div className="flex flex-col w-full sm:w-10/12 md:w-7/12 h-auto">
              {record.length ? (
                record.map((data) => {
                  if (data.tag === "qcRecord") {
                    return (
                      <div
                        key={data.ID}
                        className="text-black w-full border border-black mt-5 rounded-2xl pb-5"
                      >
                        <div className="w-full flex px-5 pt-3 pb-2 place-content-between place-items-center bg-[#76a0d6] rounded-t-2xl">
                          <div className="flex w-1/2">
                            <h1 className="text-black font-['Sarabun'] text-lg lg:text-xl font-normal">
                              ทดสอบ
                            </h1>
                            <div className="ml-2 overflow-hidden text-ellipsis">
                              {data.statusOverView === "Passed" ? (
                                <h3 className="text-[#13A452] bg-[#adff9d] px-2 text-base lg:text-lg rounded-xl text-center mr-5 overflow-hidden text-ellipsis">
                                  ผ่าน
                                </h3>
                              ) : data.statusOverView === "Failed" ? (
                                <h3 className="text-[#ff0000] bg-[#ffa6a6] px-2 text-base lg:text-lg rounded-xl text-center mr-5 overflow-hidden text-ellipsis">
                                  ไม่ผ่าน
                                </h3>
                              ) : data.statusOverView === "In progress" ? (
                                <h3 className="text-[#ff6600] bg-[#ffea8f] px-2 text-base lg:text-lg rounded-xl text-center mr-5 overflow-hidden text-ellipsis">
                                  รอการตรวจสอบ
                                </h3>
                              ) : null}
                            </div>
                          </div>
                          <div className="flex place-content-end w-1/2">
                            <h1 className="text-black text-base lg:text-lg font-normal font-['Sarabun'] overflow-hidden text-ellipsis">
                              {data.updatedAt.split("T")[0] +
                                " " +
                                data.updatedAt.split("T")[1]}
                            </h1>
                          </div>
                        </div>
                        <h1 className="text-black font-normal font-['Sarabun'] text-base lg:text-lg w-full text-center mt-5">
                          ทดสอบโดย
                        </h1>
                        <h1 className="text-black font-normal font-['Sarabun'] text-base lg:text-lg w-full text-center mt-5">
                          ผู้ใช้: {data.testBy.name + " " + data.testBy.surname}
                        </h1>
                      </div>
                    );
                  } else if (data.tag === "repair") {
                    return (
                      <div
                        key={data.ID}
                        className="text-black w-full border border-black mt-5 rounded-2xl pb-5"
                      >
                        <div className="w-full flex px-5 pt-3 pb-2 place-content-between place-items-center bg-[#f3856a] rounded-t-2xl">
                          <h1 className="text-black font-['Sarabun'] text-lg lg:text-xl font-normal">
                            ซ่อมแซม
                          </h1>
                          <div className="flex overflow-hidden text-ellipsis">
                            <h1 className="text-black text-base lg:text-lg font-normal font-['Sarabun'] overflow-hidden text-ellipsis">
                              {data.createdAt.split("T")[0] +
                                " " +
                                data.createdAt.split("T")[1]}
                            </h1>
                          </div>
                        </div>
                        <h1 className="text-black font-normal font-['Sarabun'] text-base lg:text-lg w-full text-center mt-5">
                          ซ่อมแซมโดย
                        </h1>
                        <h1 className="text-black font-normal font-['Sarabun'] text-base lg:text-lg w-full text-center mt-5">
                          ผู้ใช้:{" "}
                          {data.repairBy.name + " " + data.repairBy.surname}
                        </h1>
                      </div>
                    );
                  } else {
                    null;
                  }
                })
              ) : (
                <h1 className="text-black w-full text-base lg:text-lg font-normal font-['Sarabun'] text-center">
                  ไม่มีข้อมูล
                </h1>
              )}
            </div>
            <div className="flex flex-col-reverse place-content-center">
              <Footer />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
