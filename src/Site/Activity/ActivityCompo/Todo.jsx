import { useEffect, useState } from "react";
import "../Activity.css";
import { AiTwotoneEdit } from "react-icons/ai";
import { AiOutlineDelete } from "react-icons/ai";
import { MdOutlineSave } from "react-icons/md";
import { request } from "../../../api/request";
import { useParams } from "react-router-dom";

export default function Todo() {
  const { siteId } = useParams();
  const [tasks, setTasks] = useState([]);
  const [newColName, setNewColName] = useState();
  const [refresh, setRefresh] = useState();
  const [columns, setColumns] = useState([
    { id: "checkBox", label: "Check box", isEditing: false },
    { id: "startDate", label: "Start Date", isEditing: false },
    { id: "endDate", label: "End Date", isEditing: false },
    { id: "task", label: "Task", isEditing: false },
  ]);

  useEffect(() => {
    const runFunc = async () => {
      const res = await request("GET", `/todo/getAll?siteId=${siteId}`);
      setTasks(
        res.map((task) => ({
          ...task,
          startDate: new Date(task.start).toLocaleDateString(),
          endDate: new Date(task.end).toLocaleDateString(),
          task: task.task,
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

  console.log(columns);

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
        res = await request("POST", `/todo/addColumn?siteId=${siteId}`, {
          columnName: newColName,
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
    setColumns((prevColumns) =>
      prevColumns.map((column) =>
        column.id === id ? { ...column, isEditing: !column.isEditing } : column
      )
    );
  };

  const handleChangeColumnName = (id, newLabel) => {
    setColumns((prevColumns) =>
      prevColumns.map((column) =>
        column.id === id ? { ...column, label: newLabel } : column
      )
    );
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
    const res = await request("DELETE", `/todo/delete/${id}`, {});
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

    const res = await request("POST", `/todo/create-todo?siteId=${siteId}`, {
      id: tasks[index]._id,
      start: tasks[index].startDate,
      end: tasks[index].endDate,
      task: tasks[index].task,
      additionalCols: adds,
    });
    setRefresh((prev) => !prev);
  };

  return (
    <main className="todo-main">
      <p className="todo-title">
        ToDo's
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
                    <input
                      type="text"
                      value={newColName}
                      onChange={(e) => setNewColName(e.target.value)}
                      autoFocus
                    />
                  ) : (
                    <span
                      onDoubleClick={() => handleEditColumn(column.id)}
                      style={{ cursor: "pointer" }}
                    >
                      {column.label}
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
                        type={
                          column.id == "startDate" || column.id == "endDate"
                            ? "date"
                            : "text"
                        }
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
