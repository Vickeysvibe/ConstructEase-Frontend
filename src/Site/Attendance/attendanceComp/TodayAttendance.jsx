  import { useState, useEffect } from "react";
  import "../Attendance.css";
  import { request } from "../../../api/request";
  import { useParams } from "react-router-dom";
  import { AiOutlineDelete } from "react-icons/ai";

  export default function TodayAttendance() {
    const [currentDate, setCurrentDate] = useState("");
    const [editMode, setEditMode] = useState(false);
    const [updatedData, setUpdatedData] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const { companyName, siteId: site } = useParams();

    const laboratthead = [
      "Serial No",
      "Name",
      "Category",
      "SubCategory",
      "Shift",
      "Wages",
      "Total",
      "Attendance",
      "Delete"
    ];

    useEffect(() => {
      const today = new Date();
      const formattedDate = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
      setCurrentDate(formattedDate);

      fetchTodayAttendance();
    }, []);

    const fetchTodayAttendance = async () => {
      try {
        const response = await request("GET", `/attendance/todayAttendance?siteId=${site}`);
        
        const dataWithOriginalShift = response.attendanceResponse.map(worker => ({
          ...worker,
          Shift: Number(worker.Shift), // Ensure it's stored as a number
          originalShift: Number(worker.Shift), // Store original shift value as a number
        }));

        setUpdatedData(dataWithOriginalShift);
      } catch (error) {
        console.error("Error fetching today's attendance:", error);
        setUpdatedData([]);
      }
    };

    const handleShiftChange = (e, index) => {
      const newShiftDef = Number(e.target.value);
      const worker = updatedData[index];

      const labourId = worker.labourId || worker.id || worker._id;

      if (!labourId) {
        console.error("labourId is missing for worker at index:", index);
        return;
      }

      // Update shift locally
      const updated = updatedData.map((worker, idx) => {
        if (idx === index) {
          return { 
            ...worker, 
            Shift: newShiftDef, 
            Total: newShiftDef * worker.WagesPerShift,
          };
        }
        return worker;
      });

      setUpdatedData(updated);
    };

    const handleSaveShift = async () => {
      try {
        const updates = updatedData
          .filter(worker => worker.Shift !== worker.originalShift) // Filter out workers with unchanged shifts
          .map(worker => ({
            labourId: worker.id,
            newShift: worker.Shift
          }));
    
        if (updates.length === 0) {
          console.log("No changes detected.");
          toggleEditMode();
          return;
        }
    
        // Send the updates
        const updateResponses = await Promise.all(
          updates.map(worker =>
            request("PUT", `/attendance/updateshift?siteId=${site}`, worker)
          )
        );
    
        // Handle responses if needed
        updateResponses.forEach(response => {
          console.log("Shift update response:", response);
        });
    
        // Update local data to reflect changes
        setUpdatedData(prevData =>
          prevData.map(worker => {
            const updatedWorker = updates.find(u => u.labourId === worker.id);
            return updatedWorker
              ? { ...worker, originalShift: updatedWorker.newShift }
              : worker;
          })
        );
    
        toggleEditMode();
      } catch (error) {
        console.error("Error saving updated shifts:", error);
      }
    };
    
    

    const toggleEditMode = () => {
      setEditMode((prev) => !prev);
    };

    const filteredResults = (updatedData || []).filter(worker =>
      worker?.Name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const[del,setDel]=useState();
    useEffect(()=>{
      console.log(del);
    },[del])
    
    return (
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
                <button onClick={editMode ? handleSaveShift : toggleEditMode}>
                  {editMode ? "Save" : "Edit"}
                </button>
              </div>
            </div>
          </div>

          <div className="tablecon">
            {filteredResults.length > 0 ? (
              <table className="attendancetable">
                <thead>
                  <tr className="labhead">
                    {laboratthead.map((header, index) => (
                      <th className="attendanceth" key={index}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.map((worker, index) => (
                    <tr key={index}>
                      <td className="attendancetd">{index + 1}</td>
                      <td className="attendancetd">{worker.Name}</td>
                      <td className="attendancetd">{worker.Category}</td>
                      <td className="attendancetd">{worker.SubCategory || "N/A"}</td>
                      <td className="attendancetd">
                        {editMode ? (
                          <input
                            type="number"
                            step="0.5"
                            min="0.5"
                            max="2"
                            value={worker.Shift}
                            onChange={(e) => handleShiftChange(e, index)}
                          />
                        ) : (
                          worker.Shift
                        )}
                      </td>
                      <td className="attendancetd">{worker.WagesPerShift}</td>
                      <td className="attendancetd">{worker.Total}</td>
                      <td className="attendancetd">Present</td>
                      <td className="attendancetd del" onClick={()=>{setDel(index)}}><AiOutlineDelete/></td>
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
    );
  }
