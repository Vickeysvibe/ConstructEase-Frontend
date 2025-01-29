import { useState, Suspense, lazy } from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import Navbar from "./Nav/Navbar";
import SitePG from "./Site/SitePG";

// Lazy loaded components
const Login = lazy(() => import("./Login/Login"));
const Home = lazy(() => import("./Home/Home"));
// ------------------------------Master-------------------------------------
const Master = lazy(() => import("./Site/Master/Master"));
const Clientform = lazy(() => import("./Site/Master/masterComp/Client"));
const Labourform = lazy(() => import("./Site/Master/masterComp/Labour"));
const ProductForm = lazy(() => import("./Site/Master/masterComp/Product"));
const Supervisors = lazy(() => import("./Site/Master/masterComp/Supervisors"));
const Vendors = lazy(() => import("./Site/Master/masterComp/Vendor"));
//--------------------------Attendance--------------------------------
const Attendance = lazy(() => import("./Site//Attendance/Attendance"));
const LabourAttendance = lazy(() =>
  import("./Site//Attendance/attendanceComp/LabourAttendance")
);
const SupervisorAttendance = lazy(() =>
  import("./Site//Attendance/attendanceComp/SupervisorAttendance")
);
const TodayAttendance = lazy(() =>
  import("./Site//Attendance/attendanceComp/TodayAttendance")
);

//--------------------------Reports-----------------------------------------

const Report = lazy(() => import("./Site/Report/Report"));
const Labourwise = lazy(() => import("./Site/Report/reportComp/Labourwise"));
const Vendorwise = lazy(() => import("./Site/Report/reportComp/Vendorwise"));
const Payment = lazy(() => import("./Site/Report/reportComp/Paymentwise"));
const Material = lazy(() => import("./Site/Report/reportComp/Materialwise"));
const Overall = lazy(() => import("./Site/Report/reportComp/Overallstatus"));

function App() {
  return (
    <Router>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          {/* Login */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />

          {/* Dashboard */}
          <Route path=":companyName">
            <Route index element={<Home />} />
            <Route path="dashboard" element={<Home />} />
            {/* site */}
            <Route path=":siteId">
              {/* Master */}
              <Route path="master" element={<Master />}>
                <Route path="client" element={<Clientform />} />
                <Route path="labour" element={<Labourform />} />
                <Route path="product" element={<ProductForm />} />
                <Route path="supervisors" element={<Supervisors />} />
                <Route path="vendor" element={<Vendors />} />
              </Route>
              {/* Attendance */}
              <Route path="attendance" element={<Attendance />}>
                <Route path="labour" element={<LabourAttendance />} />
                <Route path="today" element={<TodayAttendance />} />
                <Route path="supervisors" element={<SupervisorAttendance />} />
              </Route>
              {/* Report */}
              <Route path="report" element={<Report />}>
                <Route path="labourwise" element={<Labourwise />} />
                <Route path="vendorwise" element={<Vendorwise />} />
                <Route path="paymentwise" element={<Payment />} />
                <Route path="materialwise" element={<Material />} />
                <Route path="overallwise" element={<Overall />} />
              </Route>
              {/* Payroll */}
              <Route path="payroll" element={<SitePG />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
