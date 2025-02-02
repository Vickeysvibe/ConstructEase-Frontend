import { Outlet } from "react-router-dom";
import "./Activity.css";
import Navbar from "../../Nav/Navbar";
export default function Activity() {
  return (
    <>
      <Navbar />
      <main className="activity-main">
        <Outlet />
      </main>
    </>
  );
}
