import axios from "axios";
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
  ArrowRight,
  CheckCircle,
  Upload,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { getDatabase, ref, get } from "firebase/database";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import controller functions
import { exportToPDF } from "@/controllers/download-pdf";
import { exportToExcel } from "@/controllers/download-excel";
import { exportToXML } from "@/controllers/download-xml";
import { exportToJira } from "@/controllers/export-jira";

interface TestCaseDetail {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  requirementId: string;
  traceabilityLink: string;
  preconditions: string[];
  testSteps: {
    stepNumber: number;
    action: string;
    expectedResult: string;
  }[];
  expectedResults: string;
  complianceStandards: string[];
  riskLevel: string;
  testData: {
    inputs: string;
    outputs: string;
  };
  automationPotential: string;
  estimatedDuration: string;
}

interface TestCaseData {
  id: string;
  testCases: TestCaseDetail[];
  summary:
    | {
        totalTestCases: number;
        categoriesBreakdown: Record<string, number>;
        priorityBreakdown: Record<string, number>;
        complianceStandardsCovered: string[];
        overallRiskAssessment: string;
      }
    | Record<string, never>;
  metadata: {
    generatedAt: string;
    requirementsLength: number;
    originalRequirements: string;
    createdBy: string;
    userName: string;
    userEmail: string;
  };
}

const ChatInterface = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [hoveredMessage, setHoveredMessage] = useState<number | null>(null);
  const [testCaseData, setTestCaseData] = useState<TestCaseData | null>(null);
  const [selectedTestCase, setSelectedTestCase] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, user } = useAuth();

  // Redirect to /auth if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/auth", { replace: true });
    }
  }, [isLoggedIn, navigate]);

  // Fetch the most recent test case for the current user
  useEffect(() => {
    const fetchLatestTestCase = async () => {
      try {
        setLoading(true);

        // PRIORITY 1: Check if test case was passed from Profile via navigation state
        if (location.state?.testCase) {
          setTestCaseData(location.state.testCase);
          setLoading(false);
          return;
        }

        // PRIORITY 2: Check if test case data was passed from the upload page
        if (location.state?.testCases) {
          setTestCaseData(location.state.testCases);
          setLoading(false);
          return;
        }

        // PRIORITY 3: If no data in state, fetch the latest test case from Firebase
        if (!user?.email) {
          setLoading(false);
          return;
        }

        const database = getDatabase();
        const testCasesRef = ref(database, "testCases");
        const snapshot = await get(testCasesRef);

        if (snapshot.exists()) {
          const allTestCases = snapshot.val();
          let latestTestCase: TestCaseData | null = null;
          let latestTimestamp = 0;

          // Find the most recent test case for this user
          Object.keys(allTestCases).forEach((testCaseId) => {
            const testCase = allTestCases[testCaseId];

            if (
              testCase.metadata?.createdBy === user.email ||
              testCase.metadata?.userEmail === user.email
            ) {
              const timestamp = new Date(
                testCase.metadata?.generatedAt || 0
              ).getTime();

              if (timestamp > latestTimestamp) {
                latestTimestamp = timestamp;
                latestTestCase = {
                  id: testCaseId,
                  testCases: testCase.testCases || [],
                  summary: testCase.summary || {},
                  metadata: testCase.metadata || {},
                };
              }
            }
          });

          if (latestTestCase) {
            setTestCaseData(latestTestCase);
          } else {
            console.log("No test cases found for user");
          }
        } else {
          console.log("No test cases collection exists");
        }
      } catch (error) {
        toast({
          title: "Error loading test cases",
          description: "Failed to load your test cases. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (isLoggedIn && user) {
      fetchLatestTestCase();
    }
  }, [isLoggedIn, user, location.state, toast]);

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

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  // Export handlers using controller functions
  const handleExportToPDF = () => {
    exportToPDF(testCaseData, toast);
  };

  const handleExportToExcel = () => {
    exportToExcel(testCaseData, toast);
  };

  const handleExportToXML = () => {
    exportToXML(testCaseData, toast);
  };

  const handleExportToJira = async () => {
    await exportToJira(testCaseData, toast);
  };

  // Copy test case to clipboard
  const copyTestCase = (testCase: TestCaseDetail) => {
    const text = `${testCase.id}: ${testCase.title}\n\nDescription: ${
      testCase.description
    }\n\nCategory: ${testCase.category}\nPriority: ${
      testCase.priority
    }\n\nTest Steps:\n${testCase.testSteps
      .map(
        (step) =>
          `${step.stepNumber}. ${step.action}\n   Expected: ${step.expectedResult}`
      )
      .join("\n")}\n\nOverall Expected Result: ${testCase.expectedResults}`;

    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Test case details copied successfully",
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFiles = e.target.files ? Array.from(e.target.files) : [];
    const files = rawFiles as File[];
    const validTypes = [
      "application/pdf",
      "text/plain",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    const validFiles = files.filter((file) => validTypes.includes(file.type));
    setAttachedFiles((prev) => [
      ...prev,
      ...validFiles.slice(0, 5 - prev.length),
    ]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() && attachedFiles.length === 0) return;

    const userMessage = {
      id: Date.now(),
      type: "user",
      content: inputValue,
      files: attachedFiles.map((f) => ({
        name: f.name,
        type: f.type,
        size: f.size,
      })),
      timestamp: new Date(),
    };

    // add user message instantly to chat
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setAttachedFiles([]);
    setIsTyping(true);

    try {
      // Prepare context data to send with the message
      const contextData = testCaseData
        ? {
            testCases: testCaseData.testCases,
            summary: testCaseData.summary,
            metadata: testCaseData.metadata,
            totalTestCases: testCaseData.testCases?.length || 0,
            requirements: testCaseData.metadata?.originalRequirements || "",
          }
        : null;

      const res = await axios.post(
        `${import.meta.env.VITE_REQUEST_URL}/chat/ai`,
        {
          message: userMessage,
          context: contextData,
        }
      );

      const aiMessage = {
        id: Date.now() + 1,
        type: "ai",
        content: res.data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      const errorMessage = {
        id: Date.now() + 1,
        type: "ai",
        content: "Something went wrong. Please try again later.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyMessage = (content: any) => {
    const textContent = typeof content === "string" ? content : content.text;
    navigator.clipboard.writeText(textContent);
  };

  const renderAIMessage = (message: any) => {
    const content = message.content;

    if (typeof content === "string") {
      // Convert markdown-style **bold** to HTML
      const htmlContent = content.replace(
        /\*\*(.*?)\*\*/g,
        '<strong class="font-semibold text-gray-900">$1</strong>'
      );

      return (
        <div
          className="text-[15px] leading-relaxed whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      );
    }

    return (
      <div className="space-y-4">
        <div
          className="text-[15px] leading-relaxed"
          dangerouslySetInnerHTML={{
            __html: content.text.replace(
              /\*\*(.*?)\*\*/g,
              '<strong class="font-semibold text-gray-900">$1</strong>'
            ),
          }}
        />

        {content.sections?.map((section: any, idx: number) => (
          <div key={idx} className="space-y-3">
            {section.title && (
              <h4 className="text-sm font-semibold text-gray-900">
                {section.title}
              </h4>
            )}

            {section.type === "analysis" && (
              <div className="grid grid-cols-2 gap-2">
                {section.items.map((item: any, i: number) => (
                  <div
                    key={i}
                    className="bg-white border border-gray-200 rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">
                        {item.label}
                      </span>
                      {item.status === "success" && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      )}
                      {item.status === "warning" && (
                        <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                      )}
                      {item.status === "info" && (
                        <Clock className="h-3.5 w-3.5 text-blue-600" />
                      )}
                    </div>
                    <div className="text-lg font-bold text-gray-900">
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {section.type === "insights" && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 space-y-2">
                {section.content.map((item: string, i: number) => (
                  <div key={i} className="text-sm text-gray-700">
                    {item}
                  </div>
                ))}
              </div>
            )}

            {section.type === "actions" && (
              <div className="flex flex-wrap gap-2">
                {section.buttons.map((btn: any, i: number) => (
                  <button
                    key={i}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all text-sm font-medium text-gray-700 shadow-sm"
                  >
                    {btn.icon === "download" && (
                      <Download className="h-4 w-4" />
                    )}
                    {btn.icon === "check" && <FileCheck className="h-4 w-4" />}
                    {btn.icon === "shield" && <Shield className="h-4 w-4" />}
                    {btn.label}
                  </button>
                ))}
              </div>
            )}

            {section.type === "capabilities" && (
              <div className="space-y-3">
                {section.items.map((item: any, i: number) => (
                  <div
                    key={i}
                    className="flex gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-emerald-300 hover:shadow-sm transition-all"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                      {item.icon === "zap" && (
                        <Zap className="h-5 w-5 text-white" />
                      )}
                      {item.icon === "shield" && (
                        <Shield className="h-5 w-5 text-white" />
                      )}
                      {item.icon === "check" && (
                        <FileCheck className="h-5 w-5 text-white" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm mb-1">
                        {item.title}
                      </div>
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

  const suggestedPrompts = [];

  const testCases = testCaseData?.testCases || [];
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50 overflow-hidden">
      {/* Modal for Test Case Details */}
      {selectedTestCase !== null && testCases[selectedTestCase] && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900">
                  {testCases[selectedTestCase]?.id}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {testCases[selectedTestCase]?.title}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyTestCase(testCases[selectedTestCase])}
                  className="glass-button"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTestCase(null)}
                  className="hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="trace">Traceability</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4 mt-4">
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Description</h4>
                    <p className="text-sm text-gray-700 p-3 bg-gray-50 rounded-lg">
                      {testCases[selectedTestCase]?.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <h4 className="font-semibold mb-2 text-xs text-gray-600">
                        Category
                      </h4>
                      <Badge variant="outline">
                        {testCases[selectedTestCase]?.category}
                      </Badge>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 text-xs text-gray-600">
                        Priority
                      </h4>
                      <Badge
                        variant={
                          testCases[selectedTestCase]?.priority === "High"
                            ? "destructive"
                            : testCases[selectedTestCase]?.priority === "Medium"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {testCases[selectedTestCase]?.priority}
                      </Badge>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 text-xs text-gray-600">
                        Risk Level
                      </h4>
                      <Badge variant="outline">
                        {testCases[selectedTestCase]?.riskLevel}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2 text-sm">
                      Preconditions
                    </h4>
                    <ul className="text-sm space-y-1 list-disc list-inside text-gray-700 bg-gray-50 p-3 rounded-lg">
                      {testCases[selectedTestCase]?.preconditions?.map(
                        (pre, i) => (
                          <li key={i}>{pre}</li>
                        )
                      )}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Test Steps</h4>
                    <ol className="text-sm space-y-3">
                      {testCases[selectedTestCase]?.testSteps.map((step, i) => (
                        <li key={i} className="space-y-1">
                          <div className="flex">
                            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs flex items-center justify-center mr-3 mt-0.5 flex-shrink-0 font-medium">
                              {step.stepNumber}
                            </span>
                            <div className="flex-1">
                              <div className="text-gray-700 font-medium">
                                {step.action}
                              </div>
                              <div className="text-xs text-emerald-600 mt-1 bg-emerald-50 p-2 rounded">
                                Expected: {step.expectedResult}
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2 text-sm">
                      Overall Expected Results
                    </h4>
                    <p className="text-sm text-gray-700 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                      {testCases[selectedTestCase]?.expectedResults}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <h4 className="font-semibold mb-2 text-xs text-gray-600">
                        Estimated Duration
                      </h4>
                      <p className="text-sm text-gray-700">
                        {testCases[selectedTestCase]?.estimatedDuration}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 text-xs text-gray-600">
                        Automation Potential
                      </h4>
                      <p className="text-sm text-gray-700">
                        {testCases[selectedTestCase]?.automationPotential}
                      </p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="trace" className="space-y-4 mt-4">
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">
                      Requirement Traceability
                    </h4>
                    <div className="space-y-2">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">
                          Requirement ID
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          {testCases[selectedTestCase]?.requirementId}
                        </p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">
                          Traceability Link
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          {testCases[selectedTestCase]?.traceabilityLink}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2 text-sm">
                      Compliance Standards
                    </h4>
                    <div className="space-y-2">
                      {testCases[selectedTestCase]?.complianceStandards?.map(
                        (comp) => (
                          <div
                            key={comp}
                            className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200"
                          >
                            <span className="text-sm font-medium text-gray-900">
                              {comp}
                            </span>
                            <CheckCircle className="h-4 w-4 text-emerald-600" />
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Test Data</h4>
                    {testCases[selectedTestCase]?.testData && (
                      <div className="space-y-3">
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <label className="text-xs font-medium text-gray-600 block mb-1">
                            Inputs:
                          </label>
                          <p className="text-sm text-gray-900">
                            {testCases[selectedTestCase]?.testData.inputs ||
                              "N/A"}
                          </p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <label className="text-xs font-medium text-gray-600 block mb-1">
                            Expected Outputs:
                          </label>
                          <p className="text-sm text-gray-900">
                            {testCases[selectedTestCase]?.testData.outputs ||
                              "N/A"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      )}

      {/* Left Side - Test Cases List */}
      <div className="w-[32rem] mt-5 pt-5 border-r border-gray-200 flex flex-col bg-white/50 backdrop-blur-sm overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 mt-5 border-b border-gray-200 bg-white/80 backdrop-blur-xl shadow-sm px-4 py-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Test Cases</h2>
            <p className="text-xs text-gray-600">AI-generated & compliant</p>
          </div>
          {testCaseData && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportToExcel}
                  className="flex-1 text-xs"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Excel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportToJira}
                  className="flex-1 text-xs"
                >
                  <Upload className="h-3 w-3 mr-1" />
                  Jira
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportToPDF}
                  className="flex-1 text-xs"
                >
                  <Download className="h-3 w-3 mr-1" />
                  PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportToXML}
                  className="flex-1 text-xs"
                >
                  <Upload className="h-3 w-3 mr-1" />
                  XML
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Test Cases Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-4">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent mx-auto"></div>
                  <p className="text-gray-600 text-sm">Loading...</p>
                </div>
              </div>
            ) : !testCaseData ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-4">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    No Test Cases
                  </h3>
                  <p className="text-sm text-gray-600">
                    Generate test cases to see them here
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <Card className="glass-card">
                    <CardContent className="pt-4 pb-3">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">
                          {testCases.length}
                        </p>
                        <p className="text-xs text-gray-600">Test Cases</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass-card">
                    <CardContent className="pt-4 pb-3">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">
                          {testCaseData.summary.complianceStandardsCovered
                            ?.length || 0}
                        </p>
                        <p className="text-xs text-gray-600">Standards</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Test Cases List */}
                <div className="space-y-2">
                  {testCases.map((testCase, index) => (
                    <div
                      key={testCase.id}
                      className="p-3 rounded-lg border border-gray-200 hover:border-emerald-300 cursor-pointer transition-all bg-white hover:shadow-md"
                      onClick={() => setSelectedTestCase(index)}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge
                            variant="outline"
                            className="text-xs px-1.5 py-0"
                          >
                            {testCase.id}
                          </Badge>
                          <Badge
                            variant={
                              testCase.priority === "High"
                                ? "destructive"
                                : testCase.priority === "Medium"
                                ? "default"
                                : "secondary"
                            }
                            className="text-xs px-1.5 py-0"
                          >
                            {testCase.priority}
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-gray-900 text-xs leading-tight">
                          {testCase.title}
                        </h3>
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {testCase.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Center - Chat Interface Card */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-hidden">
        <Card className="w-full max-w-3xl h-[85vh] flex flex-col shadow-2xl border-2 border-gray-200">
          {/* Chat Header */}
          <CardHeader className="border-b border-gray-200 flex-shrink-0 bg-gradient-to-r from-emerald-50 to-teal-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">MedTest AI Assistant</CardTitle>
                <CardDescription className="text-xs">
                  Healthcare testing & compliance expert
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          {/* Messages Area */}
          <CardContent className="flex-1 overflow-y-auto p-6">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-6 max-w-md">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 flex items-center justify-center mx-auto shadow-2xl">
                      <Sparkles className="h-8 w-8 text-white" />
                    </div>
                    <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-full blur-2xl -z-10"></div>
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      Welcome to MedTest AI
                    </h2>
                    <p className="text-sm text-gray-600">
                      Your intelligent assistant for healthcare software testing
                      and compliance validation.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-2 pt-2">
                    {suggestedPrompts.map((prompt, idx) => {
                      const Icon = prompt.icon;
                      return (
                        <button
                          key={idx}
                          onClick={() => setInputValue(prompt.text)}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white hover:bg-gray-50 text-left transition-all border border-gray-200 hover:border-emerald-300 hover:shadow-md group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                            <Icon className="h-4 w-4 text-white" />
                          </div>
                          <span className="text-xs font-medium text-gray-700 group-hover:text-gray-900">
                            {prompt.text}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 group ${
                      message.type === "user" ? "justify-end" : "justify-start"
                    }`}
                    onMouseEnter={() => setHoveredMessage(message.id)}
                    onMouseLeave={() => setHoveredMessage(null)}
                  >
                    {message.type === "ai" && (
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex-shrink-0 flex items-center justify-center shadow-lg">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                    )}

                    <div
                      className={`max-w-[75%] ${
                        message.type === "user" ? "flex flex-col items-end" : ""
                      }`}
                    >
                      <div
                        className={`rounded-2xl px-4 py-3 ${
                          message.type === "user"
                            ? "bg-gradient-to-br from-emerald-600 to-emerald-700 text-white shadow-lg"
                            : "bg-white text-gray-900 shadow-md border border-gray-100"
                        }`}
                      >
                        {message.files && message.files.length > 0 && (
                          <div className="space-y-2 mb-3 pb-3 border-b border-emerald-500/30">
                            {message.files.map((file: any, idx: number) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2 bg-emerald-500/20 rounded-lg px-3 py-2"
                              >
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
                          <div className="text-sm leading-relaxed whitespace-pre-wrap">
                            {message.content}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mt-1.5 px-2">
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
                              className="p-1 rounded-lg hover:bg-gray-200 transition-colors"
                              title="Copy message"
                            >
                              <Copy className="h-3 w-3 text-gray-500" />
                            </button>
                            {message.type === "ai" && (
                              <button
                                className="p-1 rounded-lg hover:bg-gray-200 transition-colors"
                                title="Regenerate"
                              >
                                <RefreshCw className="h-3 w-3 text-gray-500" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {message.type === "user" && (
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 flex-shrink-0 flex items-center justify-center shadow-lg">
                        <User className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                ))}

                {isTyping && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex-shrink-0 flex items-center justify-center shadow-lg">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div className="bg-white rounded-2xl px-4 py-3 shadow-md border border-gray-100">
                      <div className="flex gap-1.5">
                        <div
                          className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        ></div>
                        <div
                          className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        ></div>
                        <div
                          className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </CardContent>

          {/* Input Area */}
          <div className="flex-shrink-0 border-t border-gray-200 bg-white p-4">
            {attachedFiles.length > 0 && (
              <div className="mb-3 space-y-2">
                {attachedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-2 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200"
                  >
                    <FileText className="h-4 w-4 text-emerald-600" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-900 truncate">
                        {file.name}
                      </div>
                      <div className="text-xs text-gray-600">
                        {(file.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeAttachment(idx)}
                      className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600 rounded-lg"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 items-end">
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
                className="h-10 w-10 flex-shrink-0 border-gray-300 hover:bg-emerald-50 hover:border-emerald-400 rounded-xl transition-all shadow-sm"
              >
                <Paperclip className="h-4 w-4 text-gray-600" />
              </Button>

              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about test cases, compliance..."
                  className="min-h-[40px] max-h-[120px] resize-none border-2 border-gray-300 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 px-4 py-2.5 pr-12 text-sm shadow-sm bg-white"
                  rows={1}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() && attachedFiles.length === 0}
                  className="absolute right-1.5 bottom-1.5 h-7 w-7 rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 disabled:opacity-40 disabled:hover:from-emerald-600 shadow-lg transition-all"
                  size="icon"
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <p className="text-xs text-gray-500 text-center mt-3">
              MedTest AI can make mistakes. Always verify compliance-critical
              information.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ChatInterface;
