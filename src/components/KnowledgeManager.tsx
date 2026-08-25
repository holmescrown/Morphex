import React, { useState } from "react";
import { KnowledgeBase, KnowledgeDoc } from "../types/schemas.ts";
import {
  Database,
  Plus,
  FileText,
  Trash2,
  Search,
  CheckCircle2,
  Sparkles,
  Layers,
  Edit3,
} from "lucide-react";

interface KnowledgeManagerProps {
  knowledgeBases: KnowledgeBase[];
  knowledgeDocs: KnowledgeDoc[];
  onUpdateKnowledgeBases: (kbs: KnowledgeBase[]) => void;
  onUpdateDocs: (docs: KnowledgeDoc[]) => void;
}

export const KnowledgeManager: React.FC<KnowledgeManagerProps> = ({
  knowledgeBases,
  knowledgeDocs,
  onUpdateKnowledgeBases,
  onUpdateDocs,
}) => {
  const [selectedKbId, setSelectedKbId] = useState<string>(knowledgeBases[0]?.id || "");
  const selectedKb = knowledgeBases.find((k) => k.id === selectedKbId) || knowledgeBases[0];

  const currentDocs = knowledgeDocs.filter((d) => d.knowledgeBaseId === selectedKb?.id);

  // New Doc Form Modal / State
  const [isAddingDoc, setIsAddingDoc] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocContent, setNewDocContent] = useState("");

  // Search Tester State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ doc: KnowledgeDoc; score: number }>>([]);

  const handleCreateKb = () => {
    const id = "kb_" + Math.random().toString(36).substring(2, 8);
    const newKb: KnowledgeBase = {
      id,
      name: "新建企业知识库",
      description: "用于存储行业规范、政策或产品文档",
      documentsCount: 0,
      vectorDimension: 1536,
      status: "ready",
      createdAt: new Date().toISOString(),
    };
    onUpdateKnowledgeBases([...knowledgeBases, newKb]);
    setSelectedKbId(id);
  };

  const handleAddDocument = () => {
    if (!newDocTitle.trim() || !newDocContent.trim() || !selectedKb) return;

    const chunkCount = Math.max(1, Math.ceil(newDocContent.length / 500));
    const newDoc: KnowledgeDoc = {
      id: "doc_" + Math.random().toString(36).substring(2, 8),
      knowledgeBaseId: selectedKb.id,
      title: newDocTitle,
      content: newDocContent,
      chunkCount,
      status: "indexed",
      createdAt: new Date().toISOString(),
    };

    const updatedDocs = [...knowledgeDocs, newDoc];
    onUpdateDocs(updatedDocs);

    // Update doc count on KB
    const updatedKbs = knowledgeBases.map((kb) => {
      if (kb.id === selectedKb.id) {
        return { ...kb, documentsCount: kb.documentsCount + 1 };
      }
      return kb;
    });
    onUpdateKnowledgeBases(updatedKbs);

    setNewDocTitle("");
    setNewDocContent("");
    setIsAddingDoc(false);
  };

  const handleDeleteDoc = (docId: string) => {
    const updatedDocs = knowledgeDocs.filter((d) => d.id !== docId);
    onUpdateDocs(updatedDocs);

    const updatedKbs = knowledgeBases.map((kb) => {
      if (kb.id === selectedKb?.id) {
        return { ...kb, documentsCount: Math.max(0, kb.documentsCount - 1) };
      }
      return kb;
    });
    onUpdateKnowledgeBases(updatedKbs);
  };

  const handleTestSearch = () => {
    if (!searchQuery.trim()) return;
    const tokens = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);

    const results = currentDocs.map((doc) => {
      const text = (doc.title + " " + doc.content).toLowerCase();
      let matchCount = 0;
      for (const t of tokens) {
        if (text.includes(t)) matchCount++;
      }
      const score = tokens.length > 0 ? Number((matchCount / tokens.length).toFixed(2)) : 0;
      return { doc, score };
    })
    .sort((a, b) => b.score - a.score);

    setSearchResults(results);
  };

  return (
    <div id="knowledge-manager-root" className="flex-1 flex h-full bg-slate-950 text-slate-200 overflow-hidden">
      {/* Left KB List */}
      <div className="w-72 border-r border-slate-800 bg-slate-900/60 flex flex-col">
        <div className="p-3 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300">知识库集合 (Knowledge)</span>
          <button
            onClick={handleCreateKb}
            className="flex items-center gap-1 px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[11px] font-semibold"
          >
            <Plus className="w-3 h-3" /> 新建库
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {knowledgeBases.map((kb) => (
            <div
              key={kb.id}
              onClick={() => {
                setSelectedKbId(kb.id);
                setSearchResults([]);
              }}
              className={`p-3 rounded-xl cursor-pointer transition-colors border ${
                selectedKb?.id === kb.id
                  ? "bg-purple-950/30 border-purple-500/50 text-purple-100"
                  : "bg-slate-900/40 border-slate-800 hover:border-slate-700 text-slate-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs truncate">{kb.name}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800">
                  {kb.documentsCount} 篇
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{kb.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Panel: Documents in KB */}
      <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
        {selectedKb ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-slate-800 bg-slate-900/40 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-purple-400" />
                  <h2 className="font-bold text-sm text-white">{selectedKb.name}</h2>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{selectedKb.description}</p>
              </div>

              <button
                onClick={() => setIsAddingDoc(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold shadow-md"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>导入/添加文档</span>
              </button>
            </div>

            {/* Content Area with Split Search & Docs */}
            <div className="flex-1 flex overflow-hidden">
              {/* Document List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {currentDocs.length === 0 ? (
                  <div className="text-center py-16 text-slate-500">
                    <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">该知识库中暂无文档，请点击右上角导入。</p>
                  </div>
                ) : (
                  currentDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm space-y-2 hover:border-slate-700"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-purple-400" />
                          <h3 className="font-bold text-xs text-white">{doc.title}</h3>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-800 text-slate-400 rounded">
                            {doc.chunkCount} 分块 (Chunks)
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteDoc(doc.id)}
                          className="text-slate-500 hover:text-rose-400 p-1"
                          title="删除文档"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-300 font-mono whitespace-pre-wrap line-clamp-4 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                        {doc.content}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Right RAG Retrieval Test Sandbox */}
              <div className="w-96 border-l border-slate-800 bg-slate-900/40 flex flex-col p-4 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300">
                  <Search className="w-4 h-4" />
                  <span>语义与关键词匹配调试器</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleTestSearch()}
                    placeholder="输入测试 Query (e.g. 429 配额限制)"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:border-purple-500 focus:outline-none"
                  />
                  <button
                    onClick={handleTestSearch}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold"
                  >
                    检索
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2">
                  {searchResults.map(({ doc, score }) => (
                    <div
                      key={doc.id}
                      className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-purple-200 truncate">{doc.title}</span>
                        <span className="font-mono text-[10px] text-emerald-400">
                          Score: {(score * 100).toFixed(0)}%
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-3">{doc.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>

      {/* Add Document Modal */}
      {isAddingDoc && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-400" />
              <span>导入文档至「{selectedKb?.name}」</span>
            </h3>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">文档标题</label>
              <input
                type="text"
                value={newDocTitle}
                onChange={(e) => setNewDocTitle(e.target.value)}
                placeholder="例如: 平台安全规范与 SLA 协议"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">文档内容 (文本)</label>
              <textarea
                rows={8}
                value={newDocContent}
                onChange={(e) => setNewDocContent(e.target.value)}
                placeholder="粘贴或编写文档正文内容..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 font-mono focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsAddingDoc(false)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
              >
                取消
              </button>
              <button
                onClick={handleAddDocument}
                disabled={!newDocTitle.trim() || !newDocContent.trim()}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold"
              >
                分块并建立索引 (Index)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
