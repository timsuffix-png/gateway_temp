"use client";

import { Translator } from "./translator";

export default function Breadcrumb() {
  var currentUrl = localStorage.getItem("currentUrl").split("/");
  var link = "/";

  return (
    <div className="bg-white w-full h-14 whitespace-nowrap overflow-x-auto border-b border-black">
      <div className="w-full h-full 2xl:flex place-items-center hidden">
        <div className="ml-10"></div>
        
        <h3 className="ml-2 text-black text-xl 2xl:text-2xl font-normal font-['Sarabun']">
          หน้าหลัก
        </h3>
        <h3 className="ml-2 text-black text-2xl 2xl:text-3xl font-bold font-['Sarabun']">
          /
        </h3>
        {currentUrl.map((path) => {
          try {
            link += path + "/";
            if (path === currentUrl[currentUrl.length - 1]) {
              return (
                <button key={path} onClick={() => link}>
                  <h3 className="ml-2 text-black text-xl 2xl:text-2xl font-normal font-['Sarabun']">
                    {Translator[path].name}
                  </h3>
                </button>
              );
            } else {
              return (
                <div key={path} className="flex">
                  <button onClick={() => link}>
                    <h3 className="ml-2 text-black text-xl 2xl:text-2xl font-normal font-['Sarabun']">
                      {Translator[path].name}
                    </h3>
                  </button>
                  <h3 className="ml-2 text-black text-2xl 2xl:text-3xl font-bold font-['Sarabun']">
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
