import { useEffect, useState } from "react";
import "../Activity.css";
import { AiTwotoneEdit } from "react-icons/ai";
import { AiOutlineDelete } from "react-icons/ai";
import { MdOutlineSave } from "react-icons/md";
import { request } from "../../../api/request";
import { useParams } from "react-router-dom";
import { Pencil, Trash2, ArrowUp, ArrowDown } from "lucide-react";

export default function Work() {
  const { siteId } = useParams();
  const [tasks, setTasks] = useState([]);
  const [newColName, setNewColName] = useState();
  const [refresh, setRefresh] = useState();
  const [columns, setColumns] = useState([
    { id: "checkBox", label: "Check box", isEditing: false },
    { id: "title", label: "Title", isEditing: false },
    { id: "description", label: "Description", isEditing: false },
    { id: "date", label: "Date", isEditing: false },
  ]);

  useEffect(() => {
    const runFunc = async () => {
      const res = await request("GET", `/work/getAllWorks?siteId=${siteId}`);
      setTasks(
        res.map((task) => ({
          ...task,
          date: new Date(task.date).toLocaleDateString(),
          isEditing: false,
          isChecked: false,
        }))
      );
      res.map((task) => {
        if (task.additionalCols) {
          Object.keys(task.additionalCols).forEach((key) => {
            setColumns((prevColumns) => [
              ...prevColumns.filter((column) => column.id !== key),
              { id: key, label: key, isEditing: false, isAdd: true },
            ]);
            setTasks((prevTasks) =>
              prevTasks.map((task) => ({
                ...task,
                [key]: task.additionalCols[key],
              }))
            );
          });
        }
      });
    };
    runFunc();
  }, [refresh]);

  const [isAddingColumn, setIsAddingColumn] = useState(false);

  const handleAddColumn = async () => {
    if (!isAddingColumn) {
      const newColumnId = newColName;
      setColumns([
        ...columns,
        { id: newColumnId, label: newColName, isEditing: true },
      ]);
      setTasks((prevTasks) =>
        prevTasks.map((task) => ({ ...task, [newColumnId]: "" }))
      );
      setIsAddingColumn(true);
    } else {
      let res;
      if (tasks.length > 0) {
        res = await request("POST", `/work/createColums`, {
          columnName: newColName,
          siteId,
        });
        setColumns((prevColumns) =>
          prevColumns.filter((column) => column.isEditing !== true)
        );
        setRefresh((prev) => !prev);
      } else {
        setColumns([
          ...columns.filter(
            (column) => column.id !== newColName && column.id !== undefined
          ),
          {
            id: newColName,
            label: newColName,
            isEditing: false,
            isAdd: true,
          },
        ]);
        console.log(columns);
      }
      setIsAddingColumn(false);
    }
  };

  const handleEditColumn = (id) => {
    const dd = columns.find((col) => {
      col.id === id;
      if (col.id === id) return col;
    });
    setColumns((prevColumns) =>
      prevColumns.map((column) =>
        column.id === id
          ? { ...column, isEditing: !column.isEditing, sh: true }
          : column
      )
    );
    setNewColName(dd.id);
  };

  const handleChangeColumnName = async (id) => {
    const res = await request("PUT", `/work/editColumn`, {
      columnName: id,
      editedName: newColName,
      siteId,
    });
    setColumns((prevColumns) =>
      prevColumns.map((column) =>
        column.id === id
          ? { ...column, id: newColName, label: newColName }
          : column
      )
    );
    setRefresh((prev) => !prev);
  };

  const handleDeleteColumn = async (id) => {
    const res = await request("DELETE", `/work/deleteColumn`, {
      columnName: id,
      siteId,
    });
    setColumns((prevColumns) =>
      prevColumns.filter((column) => column.id !== id)
    );
    setRefresh((prev) => !prev);
  };

  const handleAddTask = () => {
    const emptyTask = columns.reduce(
      (acc, column) => ({
        ...acc,
        [column.id]: column.id === "checkBox" ? false : "",
      }),
      { id: Date.now(), isEditing: true, isChecked: false }
    );
    setTasks([...tasks, emptyTask]);
  };

  const handleEditTask = (id) => {
    console.log(id);
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task._id === id ? { ...task, isEditing: !task.isEditing } : task
      )
    );
  };

  const handleChangeTask = (id, field, value) => {
    console.log(id, field, value);
    console.log(tasks);
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task._id === id
          ? {
              ...task,
              [field]: value,
              isChecked: field === "checkBox" ? value : task.isChecked,
            }
          : task
      )
    );
  };

  const handleDeleteTask = async (id) => {
    const res = await request("DELETE", `/work/delete/${id}`, {});
    console.log(res);
    setTasks(tasks.filter((task) => task._id !== id));
  };

  const createTask = async (index) => {
    const adds = columns.reduce((acc, col) => {
      if (col.isAdd) {
        acc[col.label] = tasks[index][col.id];
      }
      return acc;
    }, {});

    const res = await request("POST", `/work/create`, {
      id: tasks[index]._id,
      title: tasks[index].title,
      description: tasks[index].description,
      date: tasks[index].date,
      additionalCols: adds,
      siteId,
    });
    setRefresh((prev) => !prev);
  };

  return (
    <main className="todo-main">
      <p className="todo-title">
        Work done
        <p onClick={handleAddColumn} className="todo-add-column">
          {isAddingColumn ? "Save" : "Add Column +"}
        </p>
      </p>
      <div className="todo-table-container">
        <table className="todo-table">
          <thead>
            <tr className="todo-head">
              {columns.map((column) => (
                <th
                  key={column.id}
                  className={`todo-th ${
                    column.id === "checkBox" ? "todo-checkbox" : ""
                  }`}
                >
                  {column.isEditing ? (
                    <>
                      <input
                        type="text"
                        value={newColName}
                        onChange={(e) => setNewColName(e.target.value)}
                        autoFocus
                      />
                      {column.sh && (
                        <button
                          onClick={() => {
                            handleChangeColumnName(column.id);
                          }}
                        >
                          save
                        </button>
                      )}
                    </>
                  ) : (
                    <span
                      onDoubleClick={() => handleEditColumn(column.id)}
                      style={{
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "8px",
                      }}
                    >
                      {column.label}
                      {column.isAdd && (
                        <div>
                          <Pencil
                            size={10}
                            onClick={() => handleEditColumn(column.id)}
                            style={{ cursor: "pointer", marginRight: "7px" }}
                          />
                          <Trash2
                            size={10}
                            onClick={() => {
                              handleDeleteColumn(column.id);
                            }}
                            style={{ cursor: "pointer", marginRight: "7px" }}
                          />
                        </div>
                      )}
                    </span>
                  )}
                </th>
              ))}
              <th className="todo-th todo-edit todo-edit-th">Edit</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task, index) => (
              <tr key={task.id} className="todo-row">
                {columns.map((column) => (
                  <td
                    key={column.id}
                    className={`todo-td ${
                      column.id === "checkBox" ? "todo-checkbox" : ""
                    }`}
                  >
                    {column.id === "checkBox" ? (
                      <input
                        type="checkbox"
                        checked={!!task[column.id]}
                        onChange={(e) =>
                          handleChangeTask(task.id, column.id, e.target.checked)
                        }
                      />
                    ) : task.isEditing ? (
                      <input
                        type={column.id == "date" ? "date" : "text"}
                        value={task[column.id]}
                        onChange={(e) =>
                          handleChangeTask(task._id, column.id, e.target.value)
                        }
                      />
                    ) : (
                      <span className={task.isChecked ? "checked-task" : ""}>
                        {task[column.id]}
                      </span>
                    )}
                  </td>
                ))}

                <td className="todo-td todo-edit">
                  {task.isEditing ? (
                    <p onClick={() => createTask(index)}>
                      <MdOutlineSave />
                    </p>
                  ) : (
                    <p onClick={() => handleEditTask(task._id)}>
                      <AiTwotoneEdit />
                    </p>
                  )}
                  <p onClick={() => handleDeleteTask(task._id)}>
                    <AiOutlineDelete />
                  </p>
                </td>
              </tr>
            ))}
            <tr className="todo-row todo-addtask" onClick={handleAddTask}>
              <td
                colSpan={columns.length + 2}
                style={{ textAlign: "center", cursor: "pointer" }}
              >
                Add Task +
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  );
}
