"use client";

import { localStorageWeb } from "@/utils/localstorage";
import ButtonBlue from "@/components/buttonBlue";
import SideBar from "@/components/sidebar";

import Footer from "@/components/footer";
import Breadcrumb from "@/components/breadcrumb";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/authProvider";
import { Translator } from "@/components/translator";
import Pagination from "@/components/pagination";

export default function Inspection() {
  const auth = useAuth();
  const [like, setLike] = useState("");
  const [passPercent, setPassPercent] = useState(0);
  const [failPercent, setFailPercent] = useState(0);
  const [inProgressPercent, setInProgressPercent] = useState(0);
  const [page, setPage] = useState(1);

  const [qcRecords, setQcRecords] = useState<{
    error: boolean;
    message: string;
    data: [
      {
        ID: string;
        construct: {
          ID: string;
          productionSub: {
            productionLot: {
              name: string;
            };
          };
        };
        qcProject: {
          projectName: string;
        };
        qcRecordStatus: [
          {
            createdAt: string;
            status: string;
            qcMain: {
              qcType: {
                name: string;
              };
            };
          },
        ];
        testBy: {
          name: string;
          surname: string;
        };
        statusOverView: string;
        createdAt: string;
      },
    ];
    allPage: number;
  } | null>();

  useEffect(() => {
    refreshData();
  }, [auth]);

  useEffect(() => {
    const fetchData = async () => {
      const qcRecordData = await fetchQcRecordList();
      setQcRecords(qcRecordData);
    };
    fetchData();
  }, [page, like]);

  const fetchSummaryQcOverall = async () => {
    const data = await window.electronAPI.fetchAPI({
      method: "GET",
      URL: "summary/qc/overall",
    });
    if (!data) {
      throw new Error("Failed to fetch data");
    }
    return data;
  };

  const fetchQcRecordList = async () => {
    const data = await window.electronAPI.fetchAPI({
      method: "GET",
      URL: `qc/record/serial/type?limit=50&page=${page}&like=${like}`,
    });
    if (!data) {
      throw new Error("Failed to fetch data");
    }
    return data;
  };

  const refreshData = async () => {
    const qcRecordStatus = await fetchQcRecordList();
    const summaryQcOverallData = await fetchSummaryQcOverall();
    setQcRecords(qcRecordStatus);
    var passCount, failCount, inProgressCount, sum;
    for (let data of summaryQcOverallData.data) {
      if (data.statusOverView === "Passed") passCount = data.amount;
      else if (data.statusOverView === "Failed") failCount = data.amount;
      else if (data.statusOverView === "In progress")
        inProgressCount = data.amount;
    }
    sum = passCount + failCount + inProgressCount;
    setPassPercent(Number(((passCount / sum) * 100).toFixed(2)));
    setFailPercent(Number(((failCount / sum) * 100).toFixed(2)));
    setInProgressPercent(Number(((inProgressCount / sum) * 100).toFixed(2)));
  };

  const increasePage = () => {
    setPage(
      qcRecords && page >= qcRecords.allPage ? qcRecords.allPage : page + 1
    );
  };
  const decreasePage = () => {
    setPage(page <= 1 ? 1 : page - 1);
  };
  const firstPage = () => {
    setPage(1);
  };
  const lastPage = () => {
    setPage(qcRecords?.allPage || 1);
  };

  return (
    <>
      <div className="flex h-screen">
        <SideBar />
        <div className="flex flex-col w-full h-full overflow-y-auto">
          <Breadcrumb />
          <div className="flex flex-col bg-white w-full h-full overflow-y-auto whitespace-nowrap place-items-center pt-10">
            <div className="flex flex-col sm:flex-row w-full sm:place-content-between sm:place-items-center">
              <h2 className="ml-14 2xl:ml-20 text-black text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl  font-bold ">
                การตรวจสอบคุณภาพสินค้า
              </h2>
              <div className="mt-5 flex place-content-between sm:mt-0 sm:place-content-start">
                <div
                  tabIndex={0}
                  onClick={() => {
                    localStorageWeb.setItem("currentUrl", "qc/testSetting");
                    window.location.reload();
                  }}
                  className="ml-10 sm:mr-3"
                >
                  <ButtonBlue name="ตั้งค่าการทดสอบ" />
                </div>
                <div
                  tabIndex={0}
                  onClick={() => {
                    localStorageWeb.setItem("currentUrl", "qc/projectTest");
                    window.location.reload();
                  }}
                  className="mr-10 sm:mr-20"
                >
                  <ButtonBlue name="โปรเจกต์การทดสอบ" />
                </div>
              </div>
            </div>
            <div className="w-full flex flex-col mt-10 px-1 sm:pl-10 sm:pr-20">
              <div className="flex place-items-center place-content-between">
                <p className="text-black text-xl  2xl:text-2xl 3xl:text-3xl 4xl:text-4xl font-normal  ml-5">
                  ผลการตรวจสอบโดยรวม
                </p>
              </div>
              <div className="w-full flex text-lg 2xl:text-xl 3xl:text-2xl  4xl:text-3xl border border-black rounded-full bg-gray-200">
                <div
                  className="h-7 sm:h-10 bg-[#13A452] rounded-l-full flex place-items-center place-content-center group"
                  style={{ width: `${passPercent}%` }}
                >
                  <div className="w-auto h-auto px-3 py-1 bg-[#13A452] rounded-full place-items-center place-content-center group-hover:flex group-hover:-translate-y-12 hidden ">
                    ผ่าน {passPercent}%
                  </div>
                </div>
                <div
                  className="h-7 sm:h-10 bg-[#ffea8f] flex place-items-center place-content-center group"
                  style={{ width: `${inProgressPercent}%` }}
                >
                  <div className="w-auto h-auto px-3 py-1 bg-[#ffea8f] rounded-full place-items-center place-content-center group-hover:flex group-hover:-translate-y-12 hidden ">
                    รอการตรวจสอบ {inProgressPercent}%
                  </div>
                </div>
                <div
                  className="h-7 sm:h-10 bg-[#EE6C4D] rounded-r-full flex place-items-center place-content-center group"
                  style={{ width: `${failPercent}%` }}
                >
                  <div className="w-auto h-auto px-3 py-1 bg-[#EE6C4D] rounded-full place-items-center place-content-center group-hover:flex group-hover:-translate-y-12 hidden ">
                    ไม่ผ่าน {failPercent}%
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col lg:flex-row w-full lg:place-items-center mt-10">
              <h2 className="ml-16 lg:ml-40 text-black text-xl  2xl:text-2xl 3xl:text-3xl 4xl:text-4xl font-normal ">
                ตารางผลการทดสอบ
              </h2>
              <div className="w-full flex place-items-center place-content-center lg:place-content-start">
                <input
                  className="h-[40px] md:h-[50px] w-[90%] xl:w-[700px] border border-black mt-1 lg:ml-10 px-3 text-xl xl:text-2xl font-normal  rounded-md text-black"
                  type="number"
                  min="0"
                  onKeyDown={(e) => {
                    if (e.key === "-") e.preventDefault();
                  }}
                  placeholder="ค้นหาจากรหัสสินค้า หรือวัตถุดิบ"
                  onChange={(e) => {
                    if (Number(e.target.value) >= 0) {
                      setLike(e.target.value);
                    }
                  }}
                />
              </div>
            </div>
            <div className="flex flex-col w-full">
              <div className="sm:ml-10 sm:mr-10 mt-10 flex flex-col place-content-center border border-[#cecece] rounded-xl">
                <div className="flex place-content-center">
                  <div className="w-[98%] my-[20px]">
                    <div className="text-black font-bold">
                      <div className="bg-[#6494d3] rounded-t-3xl flex flex-row h-10 place-items-center">
                        <div className="w-7/12 sm:w-4/12 md:w-3/12 lg:w-2/12 text-center text-base lg:text-lg font-bold font-['Sarabun'] text-ellipsis overflow-hidden">
                          รหัสสินค้า
                        </div>
                        <div className="w-3/12 sm:w-2/12 lg:w-2/12 text-center text-base lg:text-lg  3xl:text-2xl  4xl:text-3xl  font-bold  text-ellipsis overflow-hidden">
                          ประเภทการทดสอบ
                        </div>
                        <div className="w-2/12 lg:w-2/12 text-center text-base lg:text-lg font-bold font-['Sarabun'] text-ellipsis overflow-hidden">
                          โปรเจ็คการทดสอบ
                        </div>
                        <div className="hidden lg:block w-2/12 text-center text-base lg:text-lg font-bold font-['Sarabun'] text-ellipsis overflow-hidden">
                          ชื่อล็อตการผลิต
                        </div>
                        <div className="hidden sm:block sm:w-2/12 lg:w-1/12 text-center text-base lg:text-lg font-bold font-['Sarabun'] text-ellipsis overflow-hidden">
                          ชื่อผู้ทดสอบ
                        </div>
                        <div className="w-1/12 sm:w-1/12 lg:w-1/12 text-center text-base lg:text-lg font-bold font-['Sarabun'] text-ellipsis overflow-hidden">
                          สถานะ
                        </div>
                        <div className="hidden md:block w-2/12 lg:w-1/12 text-center text-base lg:text-lg font-bold font-['Sarabun'] text-ellipsis overflow-hidden">
                          เวลา
                        </div>
                        <div className="w-1/12 text-center text-base lg:text-lg font-bold font-['Sarabun'] text-ellipsis overflow-hidden">
                          ข้อมูล
                        </div>
                      </div>
                    </div>
                    <div className="text-black">
                      {qcRecords?.data?.flatMap((data) => {
                        const sorted = [...(data.qcRecordStatus ?? [])].sort(
                          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                        );
                        const typeGroups: Record<string, typeof sorted> = {};
                        for (const s of sorted) {
                          const t = s.qcMain?.qcType?.name ?? "unknown";
                          if (!typeGroups[t]) typeGroups[t] = [];
                          typeGroups[t].push(s);
                        }
                        if (Object.keys(typeGroups).length === 0) {
                          typeGroups["unknown"] = [];
                        }
                        return Object.entries(typeGroups).reverse().map(([typeName, typeStatuses]) => {
                          const typeDisplay =
                            typeName === "thermostat" ? "เทอร์โมสตัท"
                              : typeName === "seaward" ? "ซีเวิร์ด"
                                : typeName;
                          const allPassed = typeStatuses.length > 0 && typeStatuses.every((s: any) => s.status === "Passed");
                          const anyFailed = typeStatuses.some((s: any) => s.status === "Failed");
                          const rowStatus = allPassed ? "Passed" : anyFailed ? "Failed" : "In progress";
                          return (
                            <div
                              key={`${data.ID}-${typeName}`}
                              className="flex flex-row w-full h-12 hover:bg-gray-200"
                            >
                              <div className="w-7/12 sm:w-4/12 md:w-3/12 lg:w-2/12 text-center text-base lg:text-lg font-['Sarabun'] flex items-center justify-center">
                                <div className="hidden xl:block">
                                  {Translator.item.icon}
                                </div>
                                <h5 className="xl:ml-1 text-ellipsis overflow-hidden">
                                  {data.construct.ID}
                                </h5>
                              </div>
                              <div className="w-3/12 sm:w-2/12 lg:w-2/12 text-center text-base lg:text-lg  3xl:text-2xl  4xl:text-3xl   flex items-center justify-center">
                                <div className="text-ellipsis overflow-hidden">
                                  {typeDisplay}
                                </div>
                              </div>
                              <div className="w-2/12 lg:w-2/12 text-center text-base lg:text-lg  3xl:text-2xl  4xl:text-3xl font-['Sarabun'] flex items-center justify-center">
                                <div className="text-ellipsis overflow-hidden">
                                  {data.qcProject.projectName}
                                </div>
                              </div>
                              <div className="hidden lg:flex w-2/12 text-center text-base lg:text-lg  3xl:text-2xl  4xl:text-3xl font-['Sarabun'] items-center justify-center">
                                <div className="text-ellipsis overflow-hidden">
                                  {
                                    data.construct.productionSub.productionLot
                                      .name
                                  }
                                </div>
                              </div>
                              <div className="hidden sm:flex sm:w-2/12 lg:w-1/12 text-center text-base lg:text-lg  3xl:text-2xl  4xl:text-3xl font-['Sarabun'] items-center justify-center">
                                <div className="hidden xl:block">
                                  {Translator.user.icon}
                                </div>
                                <h5 className="xl:ml-1 text-ellipsis overflow-hidden">
                                  {data.testBy.name + " " + data.testBy.surname}
                                </h5>
                              </div>
                              <div className="w-1/12 sm:w-1/12 lg:w-1/12 text-center text-base lg:text-lg  3xl:text-2xl  4xl:text-3xl font-['Sarabun'] flex items-center justify-center">
                                {rowStatus === "Passed" ? (
                                  <h3 className="text-[#13A452] bg-[#adff9d] px-2 text-sm rounded-xl text-ellipsis overflow-hidden">
                                    ผ่าน
                                  </h3>
                                ) : rowStatus === "Failed" ? (
                                  <h3 className="text-[#ff0000] bg-[#ffa6a6] px-2 text-sm rounded-xl text-ellipsis overflow-hidden">
                                    ไม่ผ่าน
                                  </h3>
                                ) : (
                                  <h3 className="text-[#ff6600] bg-[#ffea8f] px-2 text-sm rounded-xl text-ellipsis overflow-hidden">
                                    รอการตรวจสอบ
                                  </h3>
                                )}
                              </div>
                              <div className="hidden md:block w-2/12 lg:w-1/12 text-center text-base text-lg 2xl:text-xl 3xl:text-2xl  4xl:text-3xl   place-content-center place-items-center">
                                <div className="text-ellipsis overflow-hidden">
                                  {data.createdAt.split("T")[0]}
                                </div>
                              </div>
                              <div className="w-1/12 text-center text-base text-lg 2xl:text-xl 3xl:text-2xl  4xl:text-3xl   flex place-content-center place-items-center">
                                <button
                                  onClick={() => {
                                    localStorageWeb.setItem(
                                      "currentUrl",
                                      "qc/detail"
                                    );
                                    localStorageWeb.setItem(
                                      "param",
                                      data.construct.ID
                                    );
                                    window.location.reload();
                                  }}
                                >
                                  <svg
                                    width="30"
                                    height="30"
                                    viewBox="0 0 30 30"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M15 1.875C18.4812 1.875 21.8198 3.25791 24.2814 5.7195C26.743 8.18109 28.1259 11.5197 28.1259 15.0009C28.1259 18.4822 26.743 21.8208 24.2814 24.2824C21.8198 26.744 18.4812 28.1269 15 28.1269C11.5188 28.1269 8.18014 26.744 5.71855 24.2824C3.25696 21.8208 1.87405 18.4822 1.87405 15.0009C1.87405 11.5197 3.25696 8.18109 5.71855 5.7195C8.18014 3.25791 11.5188 1.875 15 1.875ZM16.9687 9.93375C17.9437 9.93375 18.735 9.25687 18.735 8.25375C18.735 7.25062 17.9419 6.57375 16.9687 6.57375C15.9937 6.57375 15.2062 7.25062 15.2062 8.25375C15.2062 9.25687 15.9937 9.93375 16.9687 9.93375ZM17.3119 20.4844C17.3119 20.2838 17.3812 19.7625 17.3419 19.4662L15.8006 21.24C15.4819 21.5756 15.0825 21.8081 14.895 21.7462C14.8099 21.7149 14.7388 21.6543 14.6945 21.5753C14.6501 21.4962 14.6355 21.4039 14.6531 21.315L17.2219 13.2C17.4319 12.1706 16.8544 11.2313 15.63 11.1113C14.3381 11.1113 12.4369 12.4219 11.28 14.085C11.28 14.2838 11.2425 14.7787 11.2819 15.075L12.8212 13.2994C13.14 12.9675 13.5112 12.7331 13.6987 12.7969C13.7911 12.83 13.8668 12.8981 13.9096 12.9864C13.9524 13.0748 13.9588 13.1763 13.9275 13.2694L11.3812 21.345C11.0869 22.29 11.6437 23.2163 12.9937 23.4263C14.9812 23.4263 16.155 22.1475 17.3137 20.4844H17.3119Z"
                                      fill="#EE6C4D"
                                    />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          );
                        });
                      })}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex place-content-center">
                <Pagination
                  currentPage={page}
                  allPage={qcRecords?.allPage}
                  increase={increasePage}
                  decrease={decreasePage}
                  first={firstPage}
                  last={lastPage}
                />
              </div>
            </div>
            <div className="flex flex-col-reverse place-content-center mt-auto">
              <Footer />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
