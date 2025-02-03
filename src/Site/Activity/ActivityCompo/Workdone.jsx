import { useState } from "react";
import "../Activity.css";
import { AiTwotoneEdit } from "react-icons/ai";
import { AiOutlineDelete } from "react-icons/ai";
import { MdOutlineSave } from "react-icons/md";

export default function Workdone() {
    const [tasks, setTasks] = useState([
        { id: 1, startDate: "1/11/2004", endDate: "10/11/2005", task: "Complete the taskkk", isEditing: false, isChecked: false },
    ]);

    const [columns, setColumns] = useState([
        { id: "checkBox", label: "Check box", isEditing: false },
        { id: "startDate", label: "Start Date", isEditing: false },
        { id: "endDate", label: "End Date", isEditing: false },
        { id: "task", label: "Task", isEditing: false },
    ]);

    const [isAddingColumn, setIsAddingColumn] = useState(false);

    const handleAddColumn = () => {
        if (!isAddingColumn) {
            const newColumnId = `new_column_${Date.now()}`;
            setColumns([...columns, { id: newColumnId, label: "New Column", isEditing: true }]);
            setTasks((prevTasks) =>
                prevTasks.map((task) => ({ ...task, [newColumnId]: "" }))
            );
            setIsAddingColumn(true);
        } else {
            setColumns((prevColumns) =>
                prevColumns.map((column) =>
                    column.isEditing ? { ...column, isEditing: false } : column
                )
            );
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
            (acc, column) => ({ ...acc, [column.id]: column.id === "checkBox" ? false : "" }),
            { id: Date.now(), isEditing: true, isChecked: false }
        );
        setTasks([...tasks, emptyTask]);
    };

    const handleEditTask = (id) => {
        setTasks((prevTasks) =>
            prevTasks.map((task) =>
                task.id === id ? { ...task, isEditing: !task.isEditing } : task
            )
        );
    };

    const handleChangeTask = (id, field, value) => {
        setTasks((prevTasks) =>
            prevTasks.map((task) =>
                task.id === id ? { ...task, [field]: value, isChecked: field === "checkBox" ? value : task.isChecked } : task
            )
        );
    };

    const handleDeleteTask = (id) => {
        setTasks((prevTasks) => prevTasks.filter((task) => task.id !== id));
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
                                    className={`todo-th ${column.id === "checkBox" ? "todo-checkbox" : ""}`}
                                >
                                    {column.isEditing ? (
                                        <input
                                            type="text"
                                            value={column.label}
                                            onChange={(e) =>
                                                handleChangeColumnName(column.id, e.target.value)
                                            }
                                            onBlur={() => handleEditColumn(column.id)}
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
                        {tasks.map((task) => (
                            <tr key={task.id} className="todo-row">
                                {columns.map((column) => (
                                    <td
                                        key={column.id}
                                        className={`todo-td ${column.id === "checkBox" ? "todo-checkbox" : ""}`}
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
                                                type="text"
                                                value={task[column.id]}
                                                onChange={(e) =>
                                                    handleChangeTask(task.id, column.id, e.target.value)
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
                                        <p onClick={() => handleEditTask(task.id)}>
                                            <MdOutlineSave />
                                        </p>
                                    ) : (
                                        <p onClick={() => handleEditTask(task.id)}>
                                            <AiTwotoneEdit />
                                        </p>
                                    )}
                                    <p onClick={() => handleDeleteTask(task.id)}>
                                        <AiOutlineDelete />
                                    </p>
                                </td>
                            </tr>
                        ))}
                        <tr className="todo-row todo-addtask" onClick={handleAddTask}>
                            <td colSpan={columns.length + 2} style={{ textAlign: "center", cursor: "pointer" }}>
                                Add Task +
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </main>
    );
}
