"use client";
import React, { use } from "react";
import { localStorageWeb } from "@/utils/localstorage";
import BackButton from "@/components/backButton";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Translator } from "@/components/translator";
import SideBar from "@/components/sidebar";

import Breadcrumb from "@/components/breadcrumb";
import { useAuth } from "@/lib/auth/authProvider";
import Pagination from "@/components/pagination";
import Footer from "@/components/footer";

export default function TestSetting() {
  const auth = useAuth();
  const [page, setPage] = useState(1);
  const [qcMain, setQcMain] = useState<{
    error: boolean;
    message: string;
    data: [
      {
        ID: string;
        qcType: {
          name: string;
        };
        testName: string;
        detail: string;
      },
    ];
    allPage: number;
  } | null>();

  const fetchQcMainData = async () => {
    const data = await window.electronAPI.fetchAPI({
      method: "GET",
      URL: `qc/main?limit=10&page=${page}`,
    });
    if (!data) {
      throw new Error("Failed to fetch data");
    }
    return data;
  };

  useEffect(() => {
    refreshData();
  }, [auth, page]);

  const refreshData = async () => {
    const data = await fetchQcMainData();
    setQcMain(data);
  };

  const increasePage = () => {
    setPage(qcMain && page >= qcMain.allPage ? qcMain.allPage : page + 1);
  };
  const decreasePage = () => {
    setPage(page <= 1 ? 1 : page - 1);
  };
  const firstPage = () => {
    setPage(1);
  };
  const lastPage = () => {
    setPage(qcMain?.allPage || 1);
  };

  return (
    <div className="flex h-screen">
      <SideBar />
      <div className="flex flex-col w-full h-full overflow-y-auto">
        <Breadcrumb />
        <div className="flex flex-col bg-white w-full h-full overflow-y-auto whitespace-nowrap place-items-center pt-10">
          <div className="flex flex-col sm:flex-row w-full sm:place-content-between sm:place-items-center">
            <div
              tabIndex={0}
              onClick={() => {

                localStorageWeb.setItem("currentUrl", "qc");
                window.location.reload();

              }}
              className="ml-5 sm:ml-20 cursor-pointer"
            >
              <BackButton />
            </div>
            <p className="self-center font-bold ml-15 text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl">
              ตั้งค่าการทดสอบ
            </p>
            <button
              onClick={() => {

                localStorageWeb.setItem("currentUrl", "qc/testSetting/create");
                window.location.reload();

              }}
              className="ml-auto mr-5 sm:mr-20 px-10 py-3 text-white  text-lg   rounded-xl bg-[#001F3F]
            xl:text-xl 
            2xl:text-2xl
            hover:cursor-pointer"
            >
              สร้าง
            </button>
          </div>

          <div className="w-full h-auto mt-[20px]">
            <div className="mx-10 p-5 rounded-xl border border-gray-300">
              <div className="overflow-hidden rounded-t-3xl w-full">
                <div className="mt-5">
                  <div className="text-black font-bold">
                    <div className="bg-[#6494d3] rounded-t-3xl flex flex-row h-10 place-items-center">
                      <div className="w-2/12 text-center text-base text-xl  2xl:text-2xl 3xl:text-3xl 4xl:text-4xl font-bold  text-ellipsis overflow-hidden">
                        ประเภท
                      </div>
                      <div className="w-3/12 text-center text-base text-xl  2xl:text-2xl 3xl:text-3xl 4xl:text-4xl font-bold  text-ellipsis overflow-hidden">
                        ชื่อการทดสอบ
                      </div>
                      <div className="w-5/12 text-center text-base text-xl  2xl:text-2xl 3xl:text-3xl 4xl:text-4xl font-bold  text-ellipsis overflow-hidden">
                        รายละเอียด
                      </div>
                      <div className="w-1/12 text-center text-base text-xl  2xl:text-2xl 3xl:text-3xl 4xl:text-4xl font-bold  text-ellipsis overflow-hidden">
                        แก้ไข
                      </div>
                      <div className="w-1/12 text-center text-base text-xl  2xl:text-2xl 3xl:text-3xl 4xl:text-4xl font-bold  text-ellipsis overflow-hidden">
                        ลบ
                      </div>
                    </div>
                  </div>
                  <div className="text-black">
                    {qcMain?.data?.map((data) => {
                      return (
                        <div
                          key={data.ID}
                          className="flex flex-row w-full h-12 hover:bg-gray-200"
                        >
                          <div className="w-2/12 text-start text-base  flex place-content-start place-items-center">
                            <div className="hidden sm:block">
                              {Translator.type.icon}
                            </div>
                            <h5 className="sm:ml-1 text-ellipsis  text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl overflow-hidden">
                              {data.qcType.name}
                            </h5>
                          </div>
                          <div className="w-3/12 text-center text-base text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl  flex place-content-start place-items-center">
                            <h5 className="text-ellipsis overflow-hidden">
                              {data.testName}
                            </h5>
                          </div>
                          <div className="w-5/12 text-center text-base text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl  flex place-content-start place-items-center">
                            <h5 className="text-ellipsis overflow-hidden">
                              {data.detail}
                            </h5>
                          </div>
                          <div className="w-1/12 text-center text-base text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl  flex place-content-center place-items-center text-ellipsis overflow-hidden">
                            <button
                              onClick={() => {
                                localStorageWeb.setItem(
                                  "currentUrl",
                                  "qc/testSetting/edit"
                                );
                                localStorageWeb.setItem("param", data.ID);
                                window.location.reload();
                              }}
                            >
                              {Translator.edit.icon}
                            </button>
                          </div>
                          <div className="w-1/12 text-center text-base   flex place-content-center place-items-center text-ellipsis overflow-hidden">
                            <button
                              onClick={() => {
                                Swal.fire({
                                  title: `ลบข้อมูล \n"${data.testName}" \nจริงหรือไม่`,
                                  text: "หลังจากลบไปแล้วข้อมูลที่เกี่ยวข้องทั้งหมดจะถูกลบไปด้วย",
                                  icon: "warning",
                                  showCancelButton: true,
                                  confirmButtonColor: "#d33",
                                  cancelButtonColor: "#3085d6",
                                  confirmButtonText: "ตกลง",
                                  cancelButtonText: "ยกเลิก",
                                }).then(async (result) => {
                                  if (result.isConfirmed) {
                                    await window.electronAPI.fetchAPI({
                                      method: "DELETE",
                                      URL: `qc/main/${data.ID}`,
                                    });
                                    await refreshData();
                                    Swal.fire({
                                      title: "ลบข้อมูลสำเร็จ",
                                      text: `ข้อมูลเกี่ยวกับ "${data.testName}" ถูกลบสำเร็จ`,
                                      icon: "success",
                                    });
                                  }
                                });
                              }}
                            >
                              {Translator.delete.icon}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>


              </div>
            </div>
          </div>
          <div className="flex place-content-center">
            <Pagination
              currentPage={page}
              allPage={qcMain?.allPage}
              increase={increasePage}
              decrease={decreasePage}
              first={firstPage}
              last={lastPage}
            />
          </div>
          <div className="flex flex-col-reverse place-content-center mt-auto">
            <Footer />
          </div>
        </div>
      </div>
    </div>
  );
}
