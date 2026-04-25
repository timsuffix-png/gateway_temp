"use client";

import { useAuth } from "@/lib/auth/authProvider";
import { useEffect, useState } from "react";
import { localStorageWeb } from "@/utils/localstorage";

import LoadingPage from "./temperature/loading";
import Login from "@/app/login/page";

import MainTemp from "@/app/temp/page";
import Setting from "@/app/setting/page";
import QcDetail from "@/app/inspection/detail/page";
import QcType from "@/app/inspection/testSetting/create/qcType/page";
import EditQcType from "@/app/inspection/testSetting/create/qcType/edit/page";
import Inspection from "@/app/inspection/page";
import TestSetting from "@/app/inspection/testSetting/page";
import CreateTestSetting from "@/app/inspection/testSetting/create/page";
import QcProject from "@/app/inspection/projectTest/page";
import CreateQcproject from "@/app/inspection/projectTest/create/page";
import EditTestSetting from "@/app/inspection/testSetting/edit/page";
import CalibrationTestPage from "@/app/calibration-test/page";

export default function Routing() {
  const auth = useAuth();

  const [currentUrl, setCurrentUrl] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorageWeb.getItem("currentUrl");
      if (stored) {
        setCurrentUrl(stored);
      } else {
        localStorageWeb.setItem("currentUrl", "qc");
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
      case "qc/testSetting/edit":
        return <EditTestSetting />;
      case "qc/testSetting/create/qcType":
        return <QcType />;
      case "qc/testSetting/create/qcType/edit":
        return <EditQcType />;

      case "thermostat":
        return <MainTemp />;

      case "calibration-test":
        return <CalibrationTestPage />;

      default:
        return <Login />; // ค่าเริ่มต้นหาก currentUrl ไม่ตรงกับกรณีใดๆ
    }
  }
}
