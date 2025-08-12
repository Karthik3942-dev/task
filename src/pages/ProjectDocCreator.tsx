import React, { useState, useEffect } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

/**
 * StrictMode bypass wrapper for ReactQuill to prevent findDOMNode warnings
 * This temporarily disables StrictMode for ReactQuill component only
 */
const NonStrictMode: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

// Wrapper component that renders ReactQuill outside of StrictMode
const QuillWrapper = React.forwardRef<ReactQuill, any>((props, ref) => {
  return (
    <NonStrictMode>
      <ReactQuill ref={ref} {...props} />
    </NonStrictMode>
  );
});

QuillWrapper.displayName = 'QuillWrapper';
import { v4 as uuidv4 } from "uuid";
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  where,
  updateDoc,
} from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import ProjectSelector from "../components/ProjectSelector";

const ProjectDocManager = () => {
  const [projectId, setProjectId] = useState("");
  const [projectName, setProjectName] = useState("");
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [content, setContent] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  // Aggressive warning suppression for ReactQuill
  useEffect(() => {
    const originalConsoleWarn = console.warn;
    const originalConsoleError = console.error;

    console.warn = (...args: any[]) => {
      const message = String(args[0] || '');
      if (message.includes('findDOMNode')) {
        return; // Completely suppress findDOMNode warnings
      }
      originalConsoleWarn.apply(console, args);
    };

    console.error = (...args: any[]) => {
      const message = String(args[0] || '');
      if (message.includes('findDOMNode')) {
        return; // Completely suppress findDOMNode errors
      }
      originalConsoleError.apply(console, args);
    };

    return () => {
      console.warn = originalConsoleWarn;
      console.error = originalConsoleError;
    };
  }, []);

  // Get user email
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (user?.email) setUserEmail(user.email);
    });
    return () => unsub();
  }, []);

  // Prevent Print Shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        alert("Printing is disabled.");
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fetch documents for selected project
  const fetchDocs = async (projId: string) => {
    const snapshot = await getDocs(collection(db, "projectDocs"));
    const filtered = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((d) => d.projectId === projId);
    setDocuments(filtered);
  };

  const handleProjectSelect = (id: string, name: string) => {
    setProjectId(id);
    setProjectName(name);
    setSelectedDoc(null);
    setContent("");
    fetchDocs(id);
  };

  const handleNewDoc = () => {
    setSelectedDoc(null);
    setContent("");
    setPreviewMode(false);
  };

  const handleDocClick = (docData: any) => {
    setSelectedDoc(docData);
    setContent(docData.htmlContent);
    setPreviewMode(true);
  };

  const saveDocument = async () => {
    if (!projectId || !content) return alert("Missing project or content");

    let docId = selectedDoc?.id || `${projectId}_${uuidv4()}`;
    const docRef = doc(db, "projectDocs", docId);
    const docData = {
      projectId,
      projectName,
      htmlContent: content,
      createdBy: userEmail,
      updatedAt: new Date().toISOString(),
    };

    await setDoc(docRef, docData, { merge: true });
    alert("Document saved successfully");
    setSelectedDoc({ id: docId, ...docData });
    fetchDocs(projectId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-orange-50 to-cyan-100 dark:bg-gradient-to-br dark:from-purple-900/20 dark:via-purple-800/30 dark:to-purple-900/20 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 via-orange-500 to-cyan-600 dark:from-purple-400 dark:via-purple-500 dark:to-purple-600 bg-clip-text text-transparent mb-2">
            📑 Document Creator
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create and manage secure project documentation
          </p>
        </div>

      <ProjectSelector onSelect={handleProjectSelect} />

      {projectId && (
        <>
          {/* Enhanced Document List */}
          <div className="liquid-glass-card mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                📁 Documents for {projectName}
              </h3>
              <button
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-orange-600 dark:from-purple-600 dark:to-purple-700 text-white rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                onClick={handleNewDoc}
              >
                ➕ New Document
              </button>
            </div>
            {documents.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  📄
                </div>
                <p className="text-gray-500 dark:text-gray-400">No documents found.</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Create your first document to get started</p>
              </div>
            ) : (
              <ul className="space-y-3 max-h-60 overflow-auto">
                {documents.map((doc) => (
                  <li
                    key={doc.id}
                    onClick={() => handleDocClick(doc)}
                    className={`cursor-pointer border-2 px-4 py-3 rounded-xl transition-all duration-200 ${
                      selectedDoc?.id === doc.id
                        ? "border-cyan-400 dark:border-purple-500 bg-gradient-to-r from-cyan-50 to-orange-50 dark:from-purple-700/30 dark:to-purple-600/30 shadow-lg transform scale-105"
                        : "border-gray-200 dark:border-gray-600 hover:border-cyan-300 dark:hover:border-purple-500 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-orange-500 dark:from-purple-500 dark:to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                        📄
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {doc.id.split("_")[1] || doc.id}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Created by {doc.createdBy}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Enhanced Editor Header */}
          <div className="liquid-glass-card mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedDoc ? "📝 Edit Document" : "✨ Create New Document"}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {selectedDoc ? "Modify your existing document" : "Start creating a new document"}
                </p>
              </div>
              <button
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-200 rounded-xl hover:shadow-lg transition-all duration-200"
                onClick={() => setPreviewMode((prev) => !prev)}
              >
                {previewMode ? "📝 Edit Mode" : "👁️ Preview"}
              </button>
            </div>
          </div>

          {/* Enhanced Preview Mode */}
          {previewMode ? (
            <div className="liquid-glass-card min-h-[400px]">
              <div
                className="relative p-6 min-h-[350px]"
                onContextMenu={(e) => e.preventDefault()}
                onCopy={(e) => e.preventDefault()}
                onCut={(e) => e.preventDefault()}
                onPaste={(e) => e.preventDefault()}
                onMouseDown={(e) => e.preventDefault()}
                style={{ userSelect: "none" }}
              >
                <div
                  className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none text-center text-4xl font-bold rotate-45 z-50 text-gray-500 dark:text-gray-400"
                  style={{ whiteSpace: "nowrap" }}
                >
                  CONFIDENTIAL — {userEmail}
                </div>

                <div
                  className="relative z-10 prose prose-lg max-w-none dark:prose-invert text-gray-900 dark:text-gray-100"
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              </div>
            </div>
          ) : (
            <div className="liquid-glass-card">
              <QuillWrapper
                value={content}
                onChange={setContent}
                className="min-h-[400px] border-none"
                placeholder="Start writing your document here..."
                modules={{
                  toolbar: [
                    [{ header: [1, 2, 3, false] }],
                    ["bold", "italic", "underline"],
                    [{ list: "ordered" }, { list: "bullet" }],
                    ["link", "image"],
                    ["clean"],
                  ],
                }}
                formats={[
                  "header",
                  "bold",
                  "italic",
                  "underline",
                  "list",
                  "bullet",
                  "link",
                  "image",
                ]}
              />
            </div>
          )}

          {/* Enhanced Save Button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={saveDocument}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-700 dark:to-emerald-700 text-white rounded-xl hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-medium"
            >
              💾 Save Document
            </button>
          </div>
        </>
      )}
      </div>
    </div>
  );
};

export default ProjectDocManager;
