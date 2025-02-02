import "../Activity.css";
import { useEffect, useState } from "react";
import { FiLink } from "react-icons/fi";
import { LuCopy } from "react-icons/lu";
import { RiDeleteBin7Line } from "react-icons/ri";
import { PiMicrosoftExcelLogoFill } from "react-icons/pi";
import { request } from "../../../api/request";
import { useParams } from "react-router-dom";

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [links, setLinks] = useState([]);
  const [currentNote, setCurrentNote] = useState(null);
  const [view, setView] = useState(false);
  const [showAddLink, setShowAddLink] = useState(false);
  const [newLinkTitle, setNewLinkTitle] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [refresh, setRefresh] = useState(0);
  const { siteId } = useParams();

  useEffect(() => {
    const getNotes = async () => {
      const res = await request("GET", `/notes/getnotes?siteId=${siteId}`);
      setNotes(res.filter((note) => note.sheetsLink === null));
      setLinks(res.filter((note) => note.sheetsLink !== null));
    };
    getNotes();
  }, [refresh]);

  const handleAddNote = () => {
    const newNote = { _id: Date.now(), title: "", context: "" };
    setNotes([...notes, newNote]);
    setCurrentNote(newNote);
    setView(true);
  };

  const handleAddLink = async () => {
    const res = await request("POST", `/notes/createnotes`, {
      title: newLinkTitle,
      sheetsLink: newLinkUrl,
      siteId,
    });
    setRefresh((prev) => prev + 1);
    setShowAddLink(false);
    setNewLinkTitle("");
    setNewLinkUrl("");
  };

  const handleDeleteNote = async (id) => {
    await request("DELETE", `/notes/deletenotes/${id}`, {});
    setRefresh((prev) => prev + 1);
  };

  const handleDeleteLink = (id) => {
    setLinks(links.filter((link) => link.id !== id));
  };

  const handleCopyLink = (url) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard
        .writeText(url)
        // .then(() => alert("Link copied to clipboard!"))
        .catch(() => fallbackCopy(url));
    } else {
      fallbackCopy(url);
    }
  };

  const fallbackCopy = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand("copy");
      // alert("Link copied to clipboard!");
    } catch (err) {
      alert("Failed to copy link");
    }
    document.body.removeChild(textArea);
  };

  const createNote = async () => {
    const res = await request("POST", `/notes/createnotes`, {
      id: currentNote._id,
      title: currentNote.title,
      context: currentNote.context,
      siteId,
    });
    setRefresh((prev) => prev + 1);
    setView(false);
    setCurrentNote(null);
  };

  return (
    <main className="notes-main">
      {showAddLink && (
        <div className="notes-link-add-con">
          <div className="notes-link-add">
            <input
              placeholder="Title"
              className="notes-link-head-in"
              value={newLinkTitle}
              onChange={(e) => setNewLinkTitle(e.target.value)}
            />
            <input
              placeholder="Paste Link"
              className="notes-link-link-in"
              value={newLinkUrl}
              onChange={(e) => setNewLinkUrl(e.target.value)}
            />
            <div className="link-btns">
              <p
                className="link-save"
                onClick={() => {
                  setShowAddLink(false);
                }}
              >
                Cancle
              </p>
              <p className="link-save" onClick={handleAddLink}>
                Save
              </p>
            </div>
          </div>
        </div>
      )}
      {view && (
        <div className="notes-view-page">
          <div className="notes-view-head">
            <input
              className="notes-view-name-in"
              type="text"
              placeholder="Title"
              value={currentNote?.title || ""}
              onChange={(e) =>
                setCurrentNote({ ...currentNote, title: e.target.value })
              }
            />
            <p className="notes-save" onClick={createNote}>
              Save
            </p>
            <p
              className="notes-close"
              onClick={() => {
                setView(false);
              }}
            >
              X
            </p>
          </div>
          <textarea
            className="notes-view-desc-in"
            placeholder="Description"
            value={currentNote?.context || ""}
            onChange={(e) =>
              setCurrentNote({ ...currentNote, context: e.target.value })
            }
          />
        </div>
      )}
      <p className="todo-title">
        Notes / Sheets
        <p onClick={handleAddNote} className="notes-add-column">
          + New Notes
        </p>
        <p
          className="notes-add-excel"
          onClick={() => setShowAddLink(!showAddLink)}
        >
          <PiMicrosoftExcelLogoFill />
        </p>
      </p>
      <div className="notes-container">
        {notes.map((note) => (
          <div
            key={note._id}
            className="notes-card"
            onDoubleClick={() => handleDeleteNote(note._id)}
          >
            <p className="notes-head">{note.title || "Untitled Note"}</p>
            <p className="notes-desc">
              {note.context || "No description available"}
            </p>
            <p
              className="notes-btn"
              onClick={() => {
                setCurrentNote(note);
                setView(true);
              }}
            >
              View &gt;
            </p>
          </div>
        ))}
        {links.map((link) => (
          <div key={link._id} className="notes-link-card">
            <a
              className="notes-link"
              href={link.sheetsLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              <p className="notes-link-icon">
                <FiLink />
              </p>
              <p className="notes-link-head">{link.title || "No Title"}</p>
            </a>
            <p className="notes-link-icon">
              <span
                style={{ color: "red" }}
                className="notes-link-icon"
                onClick={() => handleDeleteNote(link._id)}
              >
                <RiDeleteBin7Line />
              </span>
              <span
                className="notes-link-icon"
                onClick={() => handleCopyLink(link.sheetsLink)}
              >
                <LuCopy />
              </span>
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}
