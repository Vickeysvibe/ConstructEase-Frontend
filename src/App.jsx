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

// ------------------------Purchase---------------------------------------------

import Purchase from "./Site/Purchase/Purchase";
import PurchaseOrder from "./Site/Purchase/purchaseComp/PurchaseOrder";
import VendorSelection from "./Site/Purchase/purchaseComp/VendorSelection";
import Details from "./Site/Purchase/purchaseComp/Details";
import PurchseMain from "./Site/Purchase/Purchase";

//-------------------------Activity----------------------

const Activity = lazy(() => import("./Site/Activity/Activity"));
const Todo = lazy(() => import("./Site/Activity/ActivityCompo/Todo"));
const Notes = lazy(() => import("./Site/Activity/ActivityCompo/Notes"));
const Workdone = lazy(() => import("./Site/Activity/ActivityCompo/Workdone"));
const Funds = lazy(() => import("./Site/Activity/ActivityCompo/funds.jsx"));
const Inward = lazy(() => import("./Site/Activity/ActivityCompo/Inward"));
const AddInward = lazy(() => import("./Site/Activity/ActivityCompo/AddInward"));
const ViewInward = lazy(() =>
  import("./Site/Activity/ActivityCompo/ViewInward")
);
const Outward = lazy(()=>import("./Site/Activity/ActivityCompo/Outward.jsx"))

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
              {/* Purchase */}
              <Route path="purchase">
                <Route path="order" element={<PurchseMain />}>
                  <Route path="details/:Poid" element={<Details />} />
                </Route>
                <Route path="vendor-selection" element={<VendorSelection />} />
              </Route>
              {/* Site Activity */}
              <Route path="activity" element={<Activity />}>
                <Route path="todo" element={<Todo />} />
                <Route path="inwards" element={<Inward />}>
                  <Route path="add-material-inward" element={<AddInward />} />
                  <Route path="view-material-inward" element={<ViewInward />} />
                </Route>
                <Route path="fund" element={<Funds />} />
                <Route path="outwards" element={<Outward />} />
                <Route path="notes" element={<Notes />} />
              </Route>
              {/* 404 Page */}
              <Route path="*" element={<h1>404 - Page Not Found</h1>} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
