import { useState, useEffect } from "react";
import "../Attendance.css";
import TodayAttendance from "./TodayAttendance";

export default function LabourAtt() {
  const [currentDate, setCurrentDate] = useState("");
  const [editMode, setEditMode] = useState(false); // To toggle edit mode
  const [updatedData, setUpdatedData] = useState([]); // Editable data
  const [changedValues, setChangedValues] = useState([]); // Track changes
  const [searchTerm, setSearchTerm] = useState("");

  const laboratthead = [
    "Serial No",
    "Name",
    "Category",
    "SubCategory",
    "Shift",
    "Wages",
    "Total",
    "Attendance",
  ];

  const laboratt = [
    {
      id: 1,
      name: "John Doe",
      category: "Labour",
      subCategory: "Mason",
      shiftDef: 1,
      wagesPerShift: 500,
      Total: 500,
    },
    {
      id: 2,
      name: "Jane Smith",
      category: "Labour",
      subCategory: "Carpenter",
      shiftDef: 1,
      wagesPerShift: 600,
      Total: 600,
    },
    {
      id: 3,
      name: "Ali Khan",
      category: "Labour",
      subCategory: "Electrician",
      shiftDef: 1,
      wagesPerShift: 700,
      Total: 700,
    },
    {
      id: 4,
      name: "Emily Davis",
      category: "Labour",
      subCategory: "Painter",
      shiftDef: 1,
      wagesPerShift: 550,
      Total: 550,
    },
    {
      id: 5,
      name: "Rajesh Gupta",
      category: "Labour",
      subCategory: "Plumber",
      shiftDef: 1,
      wagesPerShift: 650,
      Total: 650,
    },
  ];

  useEffect(() => {
    const today = new Date();
    const formattedDate = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
    setCurrentDate(formattedDate);
    setUpdatedData(laboratt); // Initialize editable data
  }, []);

  useEffect(() => {
    // Log changed values when toggling edit mode
    if (!editMode) {
      console.log("Changed Values:", changedValues);
    }
  }, [editMode]);

  const handleShiftChange = (e, id) => {
    const newShiftDef = parseFloat(e.target.value);

    const updated = updatedData.map((worker) => {
      if (worker.id === id) {
        const newTotal = newShiftDef * worker.wagesPerShift;

        // Track changes
        const change = {
          id: worker.id,
          name: worker.name,
          oldShiftDef: worker.shiftDef,
          newShiftDef,
          oldTotal: worker.Total,
          newTotal,
        };

        // Update changed values array
        setChangedValues((prev) => {
          const existingIndex = prev.findIndex((item) => item.id === id);
          if (existingIndex !== -1) {
            const updatedChanges = [...prev];
            updatedChanges[existingIndex] = change;
            return updatedChanges;
          }
          return [...prev, change];
        });

        return { ...worker, shiftDef: newShiftDef, Total: newTotal };
      }
      return worker;
    });

    setUpdatedData(updated);
  };

  const toggleEditMode = () => {
    setEditMode((prev) => !prev);
  };

  const filteredData = updatedData.filter((worker) =>
    worker.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <main className="attendancemain">
        <section className="attendancesec">
          <div className="searchcon">
            <h1>Today Attendance</h1>
            <div className="inpcon">
              <div className="searchbar">
                <input
                  type="search"
                  className="search"
                  placeholder="Search by name"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <p>Search</p>
                <p className="adtxt">|</p>
                <p className="adtxt">{currentDate}</p>
              </div>
              <div className="edit">
                <button onClick={toggleEditMode}>
                  {editMode ? "Save" : "Edit"}
                </button>
              </div>
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
                    <tr key={worker.id}>
                      <td className="attendancetd">{index + 1}</td>
                      <td className="attendancetd">{worker.name}</td>
                      <td className="attendancetd">{worker.category}</td>
                      <td className="attendancetd">{worker.subCategory}</td>
                      <td className="attendancetd">
                        {editMode ? (
                          <input
                            type="number"
                            step="0.5"
                            min="0.5"
                            max="2"
                            value={worker.shiftDef}
                            onChange={(e) => handleShiftChange(e, worker.id)}
                          />
                        ) : (
                          worker.shiftDef
                        )}
                      </td>
                      <td className="attendancetd">{worker.wagesPerShift}</td>
                      <td className="attendancetd">{worker.Total}</td>
                      <td className="attendancetd">Present</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No result found</p>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
