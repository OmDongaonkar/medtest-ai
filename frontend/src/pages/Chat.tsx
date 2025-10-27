import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Send,
  Paperclip,
  X,
  FileText,
  Bot,
  User,
  Sparkles,
  Download,
  CheckCircle2,
  AlertCircle,
  Zap,
  Shield,
  FileCheck,
  Clock,
  Copy,
  RefreshCw,
} from "lucide-react";

const ChatInterface = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [hoveredMessage, setHoveredMessage] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 150) + "px";
    }
  }, [inputValue]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFiles = e.target.files ? Array.from(e.target.files) : [];
    const files = rawFiles as File[];
    const validTypes = ["application/pdf", "text/plain", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    
    const validFiles = files.filter(file => validTypes.includes(file.type));
    setAttachedFiles(prev => [...prev, ...validFiles.slice(0, 5 - prev.length)]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (index) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = () => {
    if (!inputValue.trim() && attachedFiles.length === 0) return;

    const userMessage = {
      id: Date.now(),
      type: "user",
      content: inputValue,
      files: attachedFiles.map(f => ({ name: f.name, type: f.type, size: f.size })),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setAttachedFiles([]);
    setIsTyping(true);

    setTimeout(() => {
      const aiMessage = {
        id: Date.now() + 1,
        type: "ai",
        content: generateAdvancedResponse(userMessage),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500 + Math.random() * 1000);
  };

  const generateAdvancedResponse = (userMessage) => {
    if (userMessage.files && userMessage.files.length > 0) {
      const fileNames = userMessage.files.map(f => f.name).join(", ");
      return {
        text: `I've analyzed your ${userMessage.files.length} document${userMessage.files.length > 1 ? 's' : ''}: **${fileNames}**`,
        sections: [
          {
            type: "analysis",
            title: "Document Analysis",
            items: [
              { label: "Requirements Extracted", value: "47", status: "success" },
              { label: "Test Cases Generated", value: "132", status: "success" },
              { label: "Compliance Gaps", value: "3", status: "warning" },
              { label: "Processing Time", value: "2.3s", status: "info" },
            ]
          },
          {
            type: "insights",
            title: "Key Findings",
            content: [
              "✓ All HIPAA security requirements mapped to test cases",
              "✓ FDA 21 CFR Part 11 compliance validated",
              "⚠ 3 requirements need additional documentation",
              "✓ Traceability matrix generated successfully"
            ]
          },
          {
            type: "actions",
            title: "Available Actions",
            buttons: [
              { label: "Download Test Cases", icon: "download" },
              { label: "View Traceability Matrix", icon: "check" },
              { label: "Export Compliance Report", icon: "shield" },
            ]
          }
        ]
      };
    }
    
    return {
      text: `I can help you with comprehensive healthcare software testing and compliance validation. Here's what I can do:`,
      sections: [
        {
          type: "capabilities",
          items: [
            {
              icon: "zap",
              title: "Intelligent Test Generation",
              desc: "Convert requirements into comprehensive test cases with full traceability"
            },
            {
              icon: "shield",
              title: "Compliance Validation",
              desc: "Ensure HIPAA, FDA 21 CFR Part 11, and GDPR compliance"
            },
            {
              icon: "check",
              title: "Automated Documentation",
              desc: "Generate audit-ready traceability matrices and reports"
            }
          ]
        }
      ]
    };
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyMessage = (content) => {
    const textContent = typeof content === 'string' ? content : content.text;
    navigator.clipboard.writeText(textContent);
  };

  const renderAIMessage = (message) => {
    const content = message.content;
    
    if (typeof content === 'string') {
      return <div className="text-[15px] leading-relaxed whitespace-pre-wrap">{content}</div>;
    }

    return (
      <div className="space-y-4">
        <div className="text-[15px] leading-relaxed" dangerouslySetInnerHTML={{ __html: content.text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>') }} />
        
        {content.sections?.map((section, idx) => (
          <div key={idx} className="space-y-3">
            {section.title && (
              <h4 className="text-sm font-semibold text-gray-900">{section.title}</h4>
            )}
            
            {section.type === "analysis" && (
              <div className="grid grid-cols-2 gap-2">
                {section.items.map((item, i) => (
                  <div key={i} className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">{item.label}</span>
                      {item.status === "success" && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                      {item.status === "warning" && <AlertCircle className="h-3.5 w-3.5 text-amber-600" />}
                      {item.status === "info" && <Clock className="h-3.5 w-3.5 text-blue-600" />}
                    </div>
                    <div className="text-lg font-bold text-gray-900">{item.value}</div>
                  </div>
                ))}
              </div>
            )}
            
            {section.type === "insights" && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 space-y-2">
                {section.content.map((item, i) => (
                  <div key={i} className="text-sm text-gray-700">{item}</div>
                ))}
              </div>
            )}
            
            {section.type === "actions" && (
              <div className="flex flex-wrap gap-2">
                {section.buttons.map((btn, i) => (
                  <button
                    key={i}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all text-sm font-medium text-gray-700 shadow-sm"
                  >
                    {btn.icon === "download" && <Download className="h-4 w-4" />}
                    {btn.icon === "check" && <FileCheck className="h-4 w-4" />}
                    {btn.icon === "shield" && <Shield className="h-4 w-4" />}
                    {btn.label}
                  </button>
                ))}
              </div>
            )}
            
            {section.type === "capabilities" && (
              <div className="space-y-3">
                {section.items.map((item, i) => (
                  <div key={i} className="flex gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-emerald-300 hover:shadow-sm transition-all">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                      {item.icon === "zap" && <Zap className="h-5 w-5 text-white" />}
                      {item.icon === "shield" && <Shield className="h-5 w-5 text-white" />}
                      {item.icon === "check" && <FileCheck className="h-5 w-5 text-white" />}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm mb-1">{item.title}</div>
                      <div className="text-sm text-gray-600">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const suggestedPrompts = [
    { text: "Generate test cases from requirements", icon: FileCheck },
    { text: "Validate HIPAA compliance", icon: Shield },
    { text: "Create traceability matrix", icon: Zap },
    { text: "Analyze security requirements", icon: AlertCircle },
  ];

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50 fixed inset-0 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white/80 backdrop-blur-xl shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">MedTest AI</h1>
              <p className="text-xs text-gray-600">Healthcare Testing Assistant</p>
            </div>
          </div>
          <div className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
            Online
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="max-w-5xl mx-auto px-6 py-8">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center min-h-[calc(100vh-280px)]">
              <div className="text-center space-y-8 max-w-3xl px-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 flex items-center justify-center mx-auto shadow-2xl">
                    <Sparkles className="h-10 w-10 text-white" />
                  </div>
                  <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-full blur-2xl -z-10"></div>
                </div>
                
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-3">
                    Welcome to MedTest AI
                  </h2>
                  <p className="text-lg text-gray-600 max-w-xl mx-auto">
                    Your intelligent assistant for healthcare software testing, compliance validation, and test case generation.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4">
                  {suggestedPrompts.map((prompt, idx) => {
                    const Icon = prompt.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => setInputValue(prompt.text)}
                        className="flex items-center gap-3 px-5 py-4 rounded-xl bg-white hover:bg-gray-50 text-left transition-all border border-gray-200 hover:border-emerald-300 hover:shadow-lg group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                          {prompt.text}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-4 group ${
                    message.type === "user" ? "justify-end" : "justify-start"
                  }`}
                  onMouseEnter={() => setHoveredMessage(message.id)}
                  onMouseLeave={() => setHoveredMessage(null)}
                >
                  {message.type === "ai" && (
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex-shrink-0 flex items-center justify-center shadow-lg">
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                  )}

                  <div className={`max-w-[75%] ${message.type === "user" ? "flex flex-col items-end" : ""}`}>
                    <div
                      className={`rounded-2xl px-5 py-4 ${
                        message.type === "user"
                          ? "bg-gradient-to-br from-emerald-600 to-emerald-700 text-white shadow-lg"
                          : "bg-white text-gray-900 shadow-md border border-gray-100"
                      }`}
                    >
                      {message.files && message.files.length > 0 && (
                        <div className="space-y-2 mb-3 pb-3 border-b border-emerald-500/30">
                          {message.files.map((file, idx) => (
                            <div key={idx} className="flex items-center gap-2 bg-emerald-500/20 rounded-lg px-3 py-2">
                              <FileText className="h-4 w-4" />
                              <span className="text-sm font-medium flex-1 truncate">
                                {file.name}
                              </span>
                              <span className="text-xs opacity-75">
                                {(file.size / 1024).toFixed(1)} KB
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {message.type === "ai" ? (
                        renderAIMessage(message)
                      ) : (
                        <div className="text-[15px] leading-relaxed whitespace-pre-wrap">
                          {message.content}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 mt-2 px-2">
                      <div className="text-xs text-gray-500">
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      
                      {hoveredMessage === message.id && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => copyMessage(message.content)}
                            className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                            title="Copy message"
                          >
                            <Copy className="h-3.5 w-3.5 text-gray-500" />
                          </button>
                          {message.type === "ai" && (
                            <button
                              className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                              title="Regenerate"
                            >
                              <RefreshCw className="h-3.5 w-3.5 text-gray-500" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {message.type === "user" && (
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 flex-shrink-0 flex items-center justify-center shadow-lg">
                      <User className="h-5 w-5 text-white" />
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-4">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex-shrink-0 flex items-center justify-center shadow-lg">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <div className="bg-white rounded-2xl px-5 py-4 shadow-md border border-gray-100">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: "0ms" }}></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: "150ms" }}></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: "300ms" }}></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-white/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 py-5">
          {attachedFiles.length > 0 && (
            <div className="mb-3 space-y-2">
              {attachedFiles.map((file, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200">
                  <FileText className="h-5 w-5 text-emerald-600" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{file.name}</div>
                    <div className="text-xs text-gray-600">{(file.size / 1024).toFixed(1)} KB</div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeAttachment(idx)}
                    className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600 rounded-lg"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3 items-end">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.docx,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileSelect}
              multiple
              className="hidden"
            />

            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={attachedFiles.length >= 5}
              className="h-12 w-12 flex-shrink-0 border-gray-300 hover:bg-emerald-50 hover:border-emerald-400 rounded-xl transition-all shadow-sm"
            >
              <Paperclip className="h-5 w-5 text-gray-600" />
            </Button>

            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about test cases, compliance, or requirements..."
                className="min-h-[48px] max-h-[150px] resize-none border-2 border-gray-300 rounded-2xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 px-5 py-3.5 pr-14 text-[15px] shadow-sm bg-white"
                rows={1}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() && attachedFiles.length === 0}
                className="absolute right-2 bottom-2 h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 disabled:opacity-40 disabled:hover:from-emerald-600 shadow-lg transition-all"
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <p className="text-xs text-gray-500 text-center mt-4">
            MedTest AI can make mistakes. Always verify compliance-critical information.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;