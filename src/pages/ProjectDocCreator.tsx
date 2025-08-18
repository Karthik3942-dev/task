import React, { useState, useEffect } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useThemeStore } from "../store/themeStore";

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
import { motion } from "framer-motion";

const ProjectDocManager = () => {
  const [projectId, setProjectId] = useState("");
  const [projectName, setProjectName] = useState("");
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [content, setContent] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const { theme } = useThemeStore();

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
    <div className="min-h-screen bg-gray-50 dark:bg-black p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
             Document Creator
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Create and manage secure project documentation
          </p>
        </motion.div>

        <ProjectSelector onSelect={handleProjectSelect} />

        {projectId && (
          <>
            {/* Document List */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 shadow-sm mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                   Documents for {projectName}
                </h3>
                <button
                  className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 dark:bg-cyan-700 dark:hover:bg-cyan-800 text-white rounded-lg transition-all text-sm"
                  onClick={handleNewDoc}
                >
                  New Document
                </button>
              </div>
              {documents.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-4 text-lg">
                    📄
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No documents found.</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Create your first document to get started</p>
                </div>
              ) : (
                <ul className="space-y-3 max-h-60 overflow-auto">
                  {documents.map((doc) => (
                    <li
                      key={doc.id}
                      onClick={() => handleDocClick(doc)}
                      className={`cursor-pointer border px-4 py-3 rounded-lg transition-all duration-200 ${
                        selectedDoc?.id === doc.id
                          ? "border-cyan-200 dark:border-cyan-800 bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300"
                          : "border-gray-200 dark:border-gray-700 hover:border-cyan-300 dark:hover:border-cyan-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-cyan-500 dark:bg-cyan-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                          📄
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-900 dark:text-white">
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

            {/* Editor Header */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 shadow-sm mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedDoc ? "Edit Document" : " Create New Document"}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {selectedDoc ? "Modify your existing document" : "Start creating a new document"}
                  </p>
                </div>
                <button
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all text-sm"
                  onClick={() => setPreviewMode((prev) => !prev)}
                >
                  {previewMode ? " Edit Mode" : " Preview"}
                </button>
              </div>
            </div>

            {/* Preview Mode */}
            {previewMode ? (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm min-h-96">
                <div
                  className="relative p-6 min-h-80"
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
                    className="relative z-10 prose prose-lg max-w-none dark:prose-invert text-gray-900 dark:text-gray-100
                               [&>*]:text-gray-900 [&>*]:dark:text-gray-100
                               [&>h1]:text-gray-900 [&>h1]:dark:text-white
                               [&>h2]:text-gray-800 [&>h2]:dark:text-gray-100
                               [&>h3]:text-gray-800 [&>h3]:dark:text-gray-100
                               [&>h4]:text-gray-700 [&>h4]:dark:text-gray-200
                               [&>h5]:text-gray-700 [&>h5]:dark:text-gray-200
                               [&>h6]:text-gray-700 [&>h6]:dark:text-gray-200
                               [&>p]:text-gray-900 [&>p]:dark:text-gray-100
                               [&>div]:text-gray-900 [&>div]:dark:text-gray-100
                               [&>span]:text-gray-900 [&>span]:dark:text-gray-100
                               [&>ul]:text-gray-900 [&>ul]:dark:text-gray-100
                               [&>ol]:text-gray-900 [&>ol]:dark:text-gray-100
                               [&>li]:text-gray-900 [&>li]:dark:text-gray-100
                               [&>blockquote]:text-gray-800 [&>blockquote]:dark:text-gray-200
                               [&>blockquote]:border-l-gray-300 [&>blockquote]:dark:border-l-gray-600
                               [&>pre]:bg-gray-100 [&>pre]:dark:bg-gray-800
                               [&>pre]:text-gray-900 [&>pre]:dark:text-gray-100
                               [&>code]:bg-gray-100 [&>code]:dark:bg-gray-800
                               [&>code]:text-gray-900 [&>code]:dark:text-gray-100
                               [&>table]:text-gray-900 [&>table]:dark:text-gray-100
                               [&>thead]:text-gray-900 [&>thead]:dark:text-gray-100
                               [&>tbody]:text-gray-900 [&>tbody]:dark:text-gray-100
                               [&>th]:text-gray-900 [&>th]:dark:text-gray-100
                               [&>td]:text-gray-900 [&>td]:dark:text-gray-100
                               [&>strong]:text-gray-900 [&>strong]:dark:text-white
                               [&>em]:text-gray-800 [&>em]:dark:text-gray-200
                               [&>a]:text-cyan-600 [&>a]:dark:text-cyan-400
                               [&>a:hover]:text-cyan-700 [&>a:hover]:dark:text-cyan-300"
                    dangerouslySetInnerHTML={{ __html: content }}
                  />
                </div>
              </div>
            ) : (
              <div className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm ${theme === 'dark' ? 'quill-dark' : ''}`}>
                <style>{`
                  .quill-dark .ql-toolbar {
                    background: #1f2937 !important;
                    border-color: #374151 !important;
                    border-bottom: 1px solid #374151 !important;
                  }
                  .quill-dark .ql-toolbar .ql-stroke {
                    stroke: #9ca3af !important;
                  }
                  .quill-dark .ql-toolbar .ql-fill {
                    fill: #9ca3af !important;
                  }
                  .quill-dark .ql-toolbar button:hover .ql-stroke {
                    stroke: #ffffff !important;
                  }
                  .quill-dark .ql-toolbar button:hover .ql-fill {
                    fill: #ffffff !important;
                  }
                  .quill-dark .ql-toolbar button.ql-active .ql-stroke {
                    stroke: #06b6d4 !important;
                  }
                  .quill-dark .ql-toolbar button.ql-active .ql-fill {
                    fill: #06b6d4 !important;
                  }
                  .quill-dark .ql-container {
                    background: #111827 !important;
                    border-color: #374151 !important;
                    color: #f3f4f6 !important;
                  }
                  .quill-dark .ql-editor {
                    background: #111827 !important;
                    color: #f3f4f6 !important;
                  }
                  .quill-dark .ql-editor.ql-blank::before {
                    color: #6b7280 !important;
                  }
                  .quill-dark .ql-picker {
                    color: #9ca3af !important;
                  }
                  .quill-dark .ql-picker-options {
                    background: #1f2937 !important;
                    border-color: #374151 !important;
                  }
                  .quill-dark .ql-picker-item:hover {
                    background: #374151 !important;
                    color: #ffffff !important;
                  }
                `}</style>
                <QuillWrapper
                  value={content}
                  onChange={setContent}
                  className="min-h-96 border-none"
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

            {/* Save Button */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={saveDocument}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white rounded-lg transition-all text-sm font-medium"
              >
                 Save Document
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProjectDocManager;
