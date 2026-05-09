"use client";
import { localStorageWeb } from "@/utils/localstorage";
import { Translator } from "./translator";

export default function Breadcrumb() {
  var currentUrl = (localStorageWeb.getItem("currentUrl") || "").split("/");
  var link = "/";

  return (
    <div className="bg-white w-full h-14 whitespace-nowrap overflow-x-auto border-b border-black">
      <div className="w-full h-full flex place-items-center pl-64 2xl:pl-0">
        
        <h3 className="ml-2 text-black text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl font-normal ">
          หน้าหลัก
        </h3>
        <h3 className="ml-2 text-black text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl font-bold ">
          /
        </h3>
        {currentUrl.map((path) => {
          try {
            link += path + "/";
            if (path === currentUrl[currentUrl.length - 1]) {
              return (
                <button key={path} onClick={() => link}>
                  <h3 className="ml-2 text-black text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl font-normal ">
                    {Translator[path].name}
                  </h3>
                </button>
              );
            } else {
              return (
                <div key={path} className="flex">
                  <button onClick={() => link}>
                    <h3 className="ml-2 text-black text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl font-normal ">
                      {Translator[path].name}
                    </h3>
                  </button>
                  <h3 className="ml-2 text-black text-2xl 2xl:text-3xl font-bold ">
                    /
                  </h3>
                </div>
              );
            }
          } catch (err) {}
        })}
      </div>
    </div>
  );
}
