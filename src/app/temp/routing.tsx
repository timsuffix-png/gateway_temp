// import { useAuth } from "../auth/authProvider";
// import Loading from "./loading";
// import Login from "./login";
// import Main from "./qc/main";
// import CreateQcProject from "./qc/qcProject/create";
// import QcProject from "./qc/qcProject/main";
// import AddTestSetting from "./qc/qcTestSetting/create";
// import EditTestSetting from "./qc/qcTestSetting/edit";
// import QcSetting from "./qc/qcTestSetting/main";
// import { useEffect } from "react";
// import QcType from "./qc/qcTestSetting/qcType/main";
// import EditQcType from "./qc/qcTestSetting/qcType/edit";
// import QcDetail from "./qc/detail";
// import Setting from "./setting";
// import Seaward from "./seaward/main";

// export default function Routing() {
//   const auth = useAuth();

//   useEffect(() => {}, [auth]);

//   const currentUrl = localStorage.getItem("currentUrl") ?? "qc"; // กำหนดค่าเริ่มต้นเป็น "qc"
//   if (!localStorage.getItem("currentUrl")) localStorage.setItem("currentUrl", "qc");
//   if (auth.status === "loading") return <Loading />;
//   else if (auth.status === "unauthenticated") return <Login />;
//   else {
//     if (currentUrl === "qc") return <Main />;
//     else if (currentUrl === "setting") return <Setting />;
//     else if (currentUrl === "qc/project") return <QcProject />;
//     else if (currentUrl === "qc/project/create") return <CreateQcProject />;
//     else if (currentUrl === "qc/testSetting") return <QcSetting />;
//     else if (currentUrl === "qc/testSetting/create") return <AddTestSetting />;
//     else if (currentUrl === "qc/testSetting/edit") return <EditTestSetting />;
//     else if (currentUrl === "qc/testSetting/create/qcType") return <QcType />;
//     else if (currentUrl === "qc/testSetting/create/qcType/edit") return <EditQcType />;
//     else if (currentUrl === "qc/detail") return <QcDetail />;
//     else if (currentUrl === "seaward") return <Seaward />;
//   }
// }