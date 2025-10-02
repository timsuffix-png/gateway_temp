"use client";

import { useAuth } from "@/lib/auth/authProvider";
import { useEffect, useState } from "react";

import LoadingPage from "./temperature/loading";
import Login from "@/app/login/page";

import MainTemp from "@/app/temp/page";
import Setting from "@/app/setting/page";
import QcDetail from "@/app/inspection/detail/page";
import QcType from "@/app/inspection/settingTest/create/qcType/page";
import EditQcType from "@/app/inspection/settingTest/create/qcType/edit/page";
import Inspection from "@/app/inspection/page";
import TestSetting from "@/app/inspection/settingTest/page";
import CreateTestSetting from "@/app/inspection/settingTest/create/page";
import QcProject from "@/app/inspection/projectTest/page";
import CreateQcproject from "@/app/inspection/projectTest/create/page";
// import QcDetail from "./inspection/detail";

export default function Routing() {
  const auth = useAuth();

  const [currentUrl, setCurrentUrl] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("currentUrl");
      if (stored) {
        setCurrentUrl(stored);
      } else {
        window.localStorage.setItem("currentUrl", "qc");
        setCurrentUrl("qc");
      }
    } catch {
      setCurrentUrl("qc");
    }
  }, []);

  if (auth.status === "loading") return <LoadingPage />;
  else if (auth.status === "unauthenticated") return <Login />;
  else {
    switch (currentUrl) {
      case "qc":
        return <Inspection />;
      case "setting":
        return <Setting />;
      case "qc/detail":
        return <QcDetail />;

      case "qc/projectTest/create":
        return <CreateQcproject />;
      case "qc/projectTest":
        return <QcProject />;

      case "qc/testSetting":
        return <TestSetting />;
      case "qc/testSetting/create":
        return <CreateTestSetting />;
      case "qc/testSetting/create/qcType":
        return <QcType />;
      case "qc/testSetting/create/qcType/edit":
        return <EditQcType />;

      case "temperature":
        return <MainTemp />;

      default:
        return <Login />; // ค่าเริ่มต้นหาก currentUrl ไม่ตรงกับกรณีใดๆ
    }
  }
}
