import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "../Attendance.css";
import TodayAttendance from "./TodayAttendance";
import { request } from "../../../api/request";
import { use } from "react";

export default function LabourAtt() {
  const [currentDate, setCurrentDate] = useState("");
  const [laboratt, setLaboratt] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [presentlab, setPresentLab] = useState([]);
  const [presentDetails, setPresentDetails] = useState([]);
  const [today, setToday] = useState(false);

  console.log(presentlab);
  const { companyName, siteId: site } = useParams();
  const laboratthead = [
    "Serial No",
    "Name",
    "Category",
    "SubCategory",
    "Wages",
    "Attendance",
  ];

  useEffect(() => {
    const today = new Date();
    const formattedDate = `${today.getDate()}-${
      today.getMonth() + 1
    }-${today.getFullYear()}`;
    setCurrentDate(formattedDate);
    fetchLabours(); // Fetch labours on component mount
  }, []);

  // Fetch labors from backend
  const fetchLabours = async () => {
    try {
      const response = await request(
        "GET",
        `/attendance/labours?siteId=${site}`
      );
      setLaboratt(response.labourDetails);
      setFilteredData(response.labourDetails);
    } catch (error) {
      console.error("Error fetching labours:", error);
    }
  };

  // Search functionality
  useEffect(() => {
    const result = laboratt.filter(
      (worker) =>
        worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        worker.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        worker.subCategory.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredData(result);
  }, [searchTerm, laboratt]);

  // Handle attendance checkbox selection
  const handleCheckboxChange = (e, worker) => {
    console.log("Worker received:", worker); // Debugging
    if (!worker) {
      console.error("Worker is undefined!");
      return;
    }

    if (e.target.checked) {
      setPresentLab((prev) => [...prev, worker.id]);
      setPresentDetails((prev) => [...prev, worker]);
    } else {
      setPresentLab((prev) => prev.filter((id) => id !== worker.id));
      setPresentDetails((prev) => prev.filter((w) => w.id !== worker.id));
    }
  };

  // Handle finish button
  const [finishBtn, setFinishBtn] = useState(0);

  useEffect(() => {
    if(presentlab.length>0){
        setFinishBtn(1)
    }
  }, [presentlab]);

  // Submit attendance to backend
  const finish = async () => {
    try {
      console.log("Selected Labour IDs:", presentlab); // Debugging
      const response = await request(
        "POST",
        `/attendance/labouratt?siteId=${site}`,
        { labourIds: presentlab } // Ensure correct body format
      );
      console.log("Attendance submitted:", response);
    } catch (error) {
      console.error("Error submitting attendance:", error);
    }
  };

  return (
    <main className="attendancemain">
      {today && <TodayAttendance />}
      <section className="attendancesec">
        <div className="searchcon">
          <h1>Labour Manage</h1>
          <div className="inpcon">
            <input
              type="search"
              className="search"
              placeholder="Search by name, type"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <p>Search</p>
            <p className="adtxt">|</p>
            <p className="adtxt">{currentDate}</p>
          </div>
        </div>
        <div className="tablecon">
          {filteredData.length > 0 ? (
            <table className="attendancetable">
              <thead>
                <tr className="labhead">
                  {laboratthead.map((header, index) => (
                    <th className="attendanceth" key={index}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredData.map((worker, index) => (
                  <tr key={index}>
                    <td className="attendancetd">{index + 1}</td>
                    <td className="attendancetd">{worker.name}</td>
                    <td className="attendancetd">{worker.category}</td>
                    <td className="attendancetd">{worker.subCategory}</td>
                    <td className="attendancetd">{worker.wagesPerShift}</td>
                    <td className="attendancetd attbox">
                      <input
                        type="checkbox"
                        onChange={(e) => handleCheckboxChange(e, worker)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No result found</p>
          )}
        </div>
        {finishBtn == 1 && (
          <div onClick={finish} className="finishbtn">
            Finish
          </div>
        )}
      </section>
    </main>
  );
}
