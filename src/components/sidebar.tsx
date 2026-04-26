"use client";
import { useAuth } from "@/lib/auth/authProvider";
import Index from ".";
import { Translator } from "./translator";
import { useState, useEffect, useRef } from "react";
import { localStorageWeb } from "@/utils/localstorage";

export default function SideBar() {
  const auth = useAuth();
  const logoImageRef = useRef<any | null>(null);
  const nameRef = useRef(null);
  const menuRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [currentWidth, setCurrentWidth] = useState(0);

  const currentUrl =
    typeof window !== "undefined"
      ? localStorageWeb.getItem("currentUrl")?.split("/") || []
      : []; // ค่าเริ่มต้นเป็น array ว่าง

  useEffect(() => {
    const handleResize = () => {
      setCurrentWidth(window.innerWidth);
    };
    if (typeof window) {
      window.addEventListener("resize", handleResize);
      setCurrentWidth(window.innerWidth);
    }
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (logoImageRef.current) {
      const loadImage = async () => {
        const logo = await window.electronAPI.loadImg("logo.png");
        logoImageRef.current.src = logo;
      };
      loadImage();
    }
  }, [auth]);

  const signoutAction = async () => {
    auth.handleLogout(localStorageWeb.getItem("ID"));
  };

  var menus: any = {
    qc: Translator.qc,
    thermostat: Translator.thermostat,
    "calibration-test": Translator["calibration-test"],
  };

  if (!auth.user) return <Index />;
  else {
    //ถ้าจอใหญ่
    if (isOpen || currentWidth >= 1536) {
      if (logoImageRef.current) {
        const loadImage = async () => {
          const logo = await window.electronAPI.loadImg("logo.png");
          logoImageRef.current.src = logo;
        };
        loadImage();
      }
      return (
        <>
          <div
            className="
        fixed top-0 left-0 z-50
        w-screen h-screen bg-white
        2xl:static 2xl:flex 2xl:flex-col 2xl:w-[310px] 
        border-r-2 border-black
      "
            ref={menuRef}
          >
            <div className="flex flex-col w-full h-full">
              <div className="w-full h-24 lg:h-28 xl:h-32 2xl:h-40 flex flex-wrap">
                <div className="w-full h-2/3 flex justify-center place-items-center">
                  <button onClick={() => setIsOpen(false)}>
                    <img
                      className="w-[195px] h-[45px] md:w-[227px] md:h-[52px] 2xl:w-[260px] 2xl:h-[60px]"
                      ref={logoImageRef}
                      width={260}
                      height={60}
                      alt="logo"
                    />
                  </button>
                </div>
                <div className="w-full h-1/3 flex">
                  <h2
                    className="w-full h-full text-black text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl flex place-items-center justify-center text-nowrap text-ellipsis overflow-hidden"
                    ref={nameRef}
                  >
                    ผู้ใช้: {auth.user.data?.name} {auth.user.data?.surname}
                  </h2>
                </div>
              </div>
              <div className="w-full h-[65px] text-black text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl font-bold  text-left flex place-items-center border-t-[2px] border-t-black">
                <span className="ml-[20px]">รายการ</span>
              </div>
              <div className="w-full h-full overflow-y-auto">
                {Object.keys(menus).map((menu) => {
                  if (currentUrl.includes(menu)) {
                    return (
                      <button
                        className="w-full"
                        key={menu}
                        onClick={() => {
                          setIsOpen(true);
                          localStorageWeb.setItem("currentUrl", menu);
                          window.location.reload();
                        }}
                      >
                        <div className="w-full h-[50px] xl:h-[60px] 2xl:h-[70px] flex place-items-center bg-gray-200 hover:bg-gray-300">
                          <div className="ml-[20px] mr-[10px] w-[40px] h-[40px]">
                            <div className="flex place-items-center place-content-center h-full 2xl:scale-[133.33%]">
                              {menus[menu].icon}
                            </div>
                          </div>
                          <div className="w-full h-full">
                            <h3 className="w-full h-full text-black text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl  font-normal  flex place-items-center justify-start pl-5">
                              {menus[menu].name}
                            </h3>
                          </div>
                        </div>
                      </button>
                    );
                  } else {
                    return (
                      <button
                        className="w-full"
                        key={menu}
                        onClick={() => {
                          setIsOpen(true);
                          localStorageWeb.setItem("currentUrl", menu);
                          window.location.reload();
                        }}
                      >
                        <div className="w-full h-[50px] xl:h-[60px] 2xl:h-[70px] flex place-items-center hover:bg-gray-200">
                          <div className="ml-[20px] mr-[10px] w-[40px] h-[40px]">
                            <div className="flex place-items-center place-content-center h-full 2xl:scale-[133.33%]">
                              {menus[menu].icon}
                            </div>
                          </div>
                          <div className="w-full h-full">
                            <h3 className="w-full h-full text-black text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl  font-normal  flex place-items-center justify-start pl-5">
                              {menus[menu].name}
                            </h3>
                          </div>
                        </div>
                      </button>
                    );
                  }
                })}
              </div>
              <div className="flex w-full h-[50px] xl:h-[60px] 2xl:h-[70px]">
                <button
                  onClick={signoutAction}
                  className="flex place-self-end w-[33%] h-[50px] xl:h-[60px] 2xl:h-[70px]"
                >
                  <div className="w-full h-[50px] xl:h-[60px] 2xl:h-[70px]">
                    <div className="w-full h-[50px] xl:h-[60px] 2xl:h-[70px] bg-red-400 hover:bg-red-500 flex place-items-center justify-center">
                      <div className="scale-[133.33%] rotate-180">
                        {Translator.logout.icon}
                      </div>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    localStorageWeb.setItem("currentUrl", "setting");
                    window.location.reload();
                  }}
                  className="w-[67%] h-[50px] xl:h-[60px] 2xl:h-[70px] flex place-self-end"
                >
                  <div className="w-full h-[50px] xl:h-[60px] 2xl:h-[70px]">
                    <div className="w-full h-[50px] xl:h-[60px] 2xl:h-[70px] left-0 top-0 bg-slate-400 hover:bg-slate-500 flex justify-center place-items-center">
                      <div className="scale-[133.33%] rotate-180">
                        {Translator.setting.icon}
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </>
      );
    } else {
      if (logoImageRef.current) {
        const loadImage = async () => {
          const logo = await window.electronAPI.loadImg("logo.png");
          logoImageRef.current.src = logo;
        };
        loadImage();
      }
      return (
        <button
          className="absolute 2xl:top-[10px] 2xl:left-[10px] 2xl:scale-150"
          onClick={() => setIsOpen(true)}
        >
          <img
            className="w-[227px] h-[52px] block 2xl:hidden"
            ref={logoImageRef}
            width={260}
            height={60}
            alt="logo"
          />
          <div className="hidden 2xl:block">{Translator.logo.icon}</div>
        </button>
      );
    }
  }
}
