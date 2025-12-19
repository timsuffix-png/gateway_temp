"use client";
import { localStorageWeb } from "@/utils/localstorage";
import SideBar from "@/components/sidebar";
import Breadcrumb from "@/components/breadcrumb";
import Footer from "@/components/footer";
import BackButton from "@/components/backButton";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/authProvider";

export default function QcDetail() {
  const auth = useAuth();
  const param = localStorageWeb.getItem("param");
  const [record, setRecord] = useState([]);

  useEffect(() => {
    refreshData();
  }, [auth]);

  const fetchData = async () => {
    const data = await window.electronAPI.fetchAPI({
      method: "POST",
      URL: `qc/record/findBySerialNumber`,
      body: {
        serialNumber: param,
      },
    });
    if (!data) throw new Error("Failed to fetch data.");

    return data;
  };

  const fetchFailedReason = async (qcRecordId: string) => {
    const res = await window.electronAPI.fetchAPI({
      method: "GET",
      URL: `qc/status/type/${qcRecordId}?limit=99999&page=1&type=both`,
    });

    if (!res) throw new Error("Failed to fetchFailedReason data.");

    const has_seaward_data = res.data?.some(
      (item: any) =>
        item.qcMain?.qcType?.name === "seaward" &&
        ["Passed", "Failed", "In progress"].includes(item.status)
    );
    const has_temp_data = res.data?.some(
      (item: any) =>
        item.qcMain?.qcType?.name === "thermostat" &&
        ["Passed", "Failed", "In progress"].includes(item.status)
    );

    const failed_seaward_item = res.data?.filter(
      (item: any) =>
        item.qcMain?.qcType?.name === "seaward" && item.status === "Failed"
    );

    const failed_thermostat_item = res.data?.find(
      (item: any) =>
        item.qcMain?.qcType?.name === "thermostat" && item.status === "Failed"
    );

    const seaward_details =
      failed_seaward_item?.map((item: any) => item.qcMain?.testName?.trim()) ??
      [];

    const thermostat_details = failed_thermostat_item?.detail?.split(",") ?? [];
    const script_temp = failed_thermostat_item?.qcMain?.qcScript?.script;

    return {
      seaward:
        failed_seaward_item?.length > 0
          ? "Failed"
          : has_seaward_data
            ? "Passed"
            : "-",
      seaward_failed: seaward_details,
      thermostat: failed_thermostat_item
        ? "Failed"
        : has_temp_data
          ? "Passed"
          : "-",

      thermostat_failed:
        thermostat_details[thermostat_details.length - 1]?.trim(),
      result: {
        time: thermostat_details[9]?.trim(),
        temp0: thermostat_details[0]?.trim(),
        temp1: thermostat_details[1]?.trim(),
        temp2: thermostat_details[2]?.trim(),
        temp3: thermostat_details[3]?.trim(),
      },
      script_temp: script_temp ?? "-",
    };
  };

  const refreshData = async () => {
    const data = await fetchData();

    const fetchPromises = data.data.map(async (item: any) => {
      if (item.tag === "qcRecord") {
        try {
          const failedReasonText = await fetchFailedReason(item.ID);
          return {
            ...item,
            status: {
              seaward: failedReasonText.seaward,
              seaward_failed: failedReasonText.seaward_failed,
              thermostat: failedReasonText.thermostat,
              thermostat_failed: failedReasonText.thermostat_failed,
              result: failedReasonText.result,
              script_temp: failedReasonText.script_temp,
            },
          };
        } catch (error) {
          console.error(
            `Error fetching failed reason for ID ${item.ID}:`,
            error
          );
          return { ...item, failedReasonText: "ไม่สามารถดึงข้อมูลสาเหตุได้" };
        }
      }
      return item;
    });

    //รอให้ Promise ทั้งหมดเสร็จสิ้นพร้อมกัน
    const updatedRecords: any = await Promise.all(fetchPromises);
    setRecord(updatedRecords);
  };

  return (
    <>
      <div className="flex w-screen h-screen">
        <div>
          <SideBar />
        </div>
        <div className="flex flex-col w-full h-full">
          <Breadcrumb />
          <div className="flex flex-col bg-white w-full h-full overflow-y-auto whitespace-nowrap place-items-center pt-5">
            <div className="flex flex-row w-full place-items-center">
              <div className="flex place-items-center">
                <div
                  tabIndex={0}
                  onClick={() => {
                    localStorageWeb.setItem("currentUrl", "qc");
                    window.location.reload();
                  }}
                  className="ml-5 sm:ml-20 cursor-pointer"
                >
                  <BackButton text="ย้อนกลับ" />
                </div>
                <h2 className="ml-5 sm:ml-20 text-black text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl  font-bold  text-wrap sm:text-nowrap">
                  รายละเอียดการทดสอบ
                </h2>
              </div>
            </div>
            <div className="flex flex-col w-full sm:w-10/12 md:w-7/12 h-auto">
              {record.length ? (
                record.map((data: any) => {
                  if (data.tag === "qcRecord") {
                    return (
                      <div
                        key={data.ID}
                        className="text-black w-full border border-black mt-5 rounded-2xl pb-5"
                      >
                        <div className="w-full flex px-5 pt-3 pb-2 place-content-between place-items-center bg-[#76a0d6] rounded-t-2xl">
                          <div className="flex w-1/2">
                            {/* /ผลลัพธ์การทดสอบ/ */}
                            <div className="ml-2 overflow-hidden text-ellipsis">
                              {data.statusOverView === "Passed" ? (
                                <h3 className="text-[#13A452] bg-[#adff9d] px-2 text-base text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl rounded-xl text-center mr-5 overflow-hidden text-ellipsis">
                                  ผ่าน
                                </h3>
                              ) : data.statusOverView === "Failed" ? (
                                <h3 className="text-[#ff0000] bg-[#ffa6a6] px-2 text-base text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl rounded-xl text-center mr-5 overflow-hidden text-ellipsis">
                                  ไม่ผ่าน
                                </h3>
                              ) : data.statusOverView === "In progress" ? (
                                <h3 className="text-[#ff6600] bg-[#ffea8f] px-2 text-base text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl rounded-xl text-center mr-5 overflow-hidden text-ellipsis">
                                  รอการตรวจสอบ
                                </h3>
                              ) : null}
                            </div>
                          </div>
                          <div className="flex place-content-end w-1/2">
                            <h1 className="text-black text-base text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl font-normal  overflow-hidden text-ellipsis">
                              {data.updatedAt.split("T")[0] +
                                " " +
                                data.updatedAt.split("T")[1]}
                            </h1>
                          </div>
                        </div>
                        <h1 className="text-start pl-[15%] text-black font-normal text-base text-lg xl:text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl w-full text-center mt-5">
                          ซีเวิร์ด : {data?.status?.seaward}
                          {data?.status?.seaward === "Failed" && (
                            <label className="whitespace-normal text-black font-normal text-base text-lg xl:text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl w-full text-center mt-5 ">
                              {" "}
                              {"("}{" "}
                              {data.status.seaward_failed
                                .map((item: any) => item.trim())
                                .join(", ")}
                              {" )"}
                            </label>
                          )}
                        </h1>

                        <div className="mt-5 w-full text-center">
                          <h1 className="text-start pl-[15%] text-black font-normal text-base text-lg xl:text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl">
                            เทอร์โมสตัท : {data?.status?.thermostat}
                            {data?.status?.thermostat === "Failed" && (
                              <span className="whitespace-normal text-black font-normal text-base text-lg xl:text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl">
                                {" ( "}
                                {data.status.thermostat_failed}
                                {" )"}
                              </span>
                            )}
                          </h1>

                          {/* Test Time Details */}
                          <div className=" pl-[17%] flex gap-[10%] items-start">
                            <div className=" text-start whitespace-normal text-black font-normal text-sm xl:text-lg 2xl:text-xl 3xl:text-2xl 4xl:text-3xl mt-5">
                              <h1 className="mb-2 underline">ค่าที่กำหนด</h1>
                              <h1>
                                เวลาเริ่มต้น : {data.status?.script_temp?.StartMoment ?? "-"}
                              </h1>
                              <h1>
                                เวลาสิ้นสุด : {data.status?.script_temp?.EndMoment ?? "-"}
                              </h1>
                              <h1>
                                อุณหภูมิต่ำสุด :{" "}
                                {data.status?.script_temp?.TemperatureMin ?? "-"}
                              </h1>
                              <h1>
                                อุณหภูมิสูงสุด :{" "}
                                {data.status?.script_temp?.TemperatureMax ?? "-"}
                              </h1>
                            </div>
                            <div className=" text-start  whitespace-normal text-black font-normal text-sm xl:text-lg 2xl:text-xl 3xl:text-2xl 4xl:text-3xl mt-5">
                              <h1 className="mb-2 underline">ผลลัพธ์</h1>
                              <h1>
                                เวลา : {data?.status?.result?.time ?? "-"}{" "}
                                วินาที
                              </h1>
                              <h1>
                                อุณหภูมิขวา :{" "}
                                {data?.status?.result?.temp0 ?? "-"} องศา
                              </h1>
                              <h1>
                                อุณหภูมิซ้าย :{" "}
                                {data?.status?.result?.temp1 ?? "-"} องศา
                              </h1>
                              <h1>
                                อุณหภูมิบน :{" "}
                                {data?.status?.result?.temp2 ?? "-"} องศา
                              </h1>
                              <h1>
                                อุณหภูมิกลาง :{" "}
                                {data?.status?.result?.temp3 ?? "-"} องศา
                              </h1>
                            </div>
                          </div>
                        </div>

                        <h1 className="text-black font-normal  text-base text-lg xl:text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl w-full text-center mt-5">
                          ทดสอบโดย
                        </h1>
                        <h1 className="text-black font-normal  text-base text-lg xl:text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl w-full text-center mt-5">
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
                          <h1 className="text-black  text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl font-normal">
                            ซ่อมแซม
                          </h1>
                          <div className="flex overflow-hidden text-ellipsis">
                            <h1 className="text-black text-base text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl font-normal  overflow-hidden text-ellipsis">
                              {data.createdAt.split("T")[0] +
                                " " +
                                data.createdAt.split("T")[1]}
                            </h1>
                          </div>
                        </div>
                        <h1 className="text-black font-normal  text-base text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl w-full text-center mt-5">
                          ซ่อมแซมโดย
                        </h1>
                        <h1 className="text-black font-normal  text-base text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl w-full text-center mt-5">
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
                <h1 className="text-black w-full text-base text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl font-normal  text-center">
                  ไม่มีข้อมูล
                </h1>
              )}
            </div>
            <div className="flex flex-col-reverse place-content-center mt-[50px]">
              <Footer />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
