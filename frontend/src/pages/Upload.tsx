import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  FileText,
  Building,
  Sparkles,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import * as mammoth from "mammoth";

// Extend Window interface for PDF.js
declare global {
  interface Window {
    pdfjsLib?: any;
  }
}

const parsePdfText = async (arrayBuffer: ArrayBuffer): Promise<string> => {
  try {
    if (!window.pdfjsLib) {
      // Dynamically load PDF.js
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load PDF.js library'));
        document.head.appendChild(script);
      });
      
      // Wait a bit for the library to initialize
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Set worker path
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      }
    }

    if (!window.pdfjsLib) {
      throw new Error('PDF.js library failed to load');
    }

    const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Combine text items with proper spacing
        const pageText = textContent.items
          .map((item: any) => {
            // Handle different item types
            if (item.str && typeof item.str === 'string') {
              return item.str;
            }
            return '';
          })
          .filter((text: string) => text.trim().length > 0)
          .join(' ');
        
        if (pageText.trim()) {
          fullText += pageText + '\n\n';
        }
      } catch (pageError) {
        console.warn(`Error processing page ${pageNum}:`, pageError);
        // Continue with other pages
      }
    }
    
    if (!fullText.trim()) {
      throw new Error('No readable text found in PDF');
    }
    
    return fullText.trim();
    
  } catch (error) {
    console.error('PDF parsing error:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to parse PDF: ${error.message}`);
    }
    throw new Error('Failed to parse PDF. The file may be corrupted, password-protected, or contain only images.');
  }
};

const UploadPage = () => {
  const [requirements, setRequirements] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // ✅ MOVED INSIDE THE COMPONENT - This fixes the hook call error
  const { isLoggedIn, user } = useAuth();

  const MAX_CHARS = 3000;

  // Redirect to /auth if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/auth", { replace: true });
    }
  }, [isLoggedIn, navigate]);

  // Update character count when requirements change
  useEffect(() => {
    setCharCount(requirements.length);
  }, [requirements]);


// Helper function to get user's Jira data from Firebase
async function getUserJiraData(userId) {
  try {
    const url = `${process.env.DATABASE_URL}/users/${userId}/jira.json`;
    console.log("🔍 Fetching Jira data from:", url);
    
    const response = await axios.get(url);
    console.log("📦 Raw Jira data response:", response.data);
    
    if (!response.data) {
      console.warn("⚠️ No Jira data found for user:", userId);
      return null;
    }
    
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching user Jira data:", error.message);
    if (error.response?.status === 404) {
      return null; // User hasn't connected Jira yet
    }
    throw error;
  }
}
	// Update these functions in your UploadPage.tsx
const CallJiraAdd = async () => {
  try {
    console.log("🚀 Starting CallJiraAdd...");
    
    // First check if Jira is connected
    const statusResponse = await fetch(
      `${import.meta.env.VITE_REQUEST_URL}/integrations/jira/status`,
      {
        method: "GET",
        credentials: "include",
      }
    );
    
    console.log("📊 Status response status:", statusResponse.status);
    const statusData = await statusResponse.json();
    console.log("📊 Status data:", statusData);
    
    if (!statusData.connected) {
      toast({
        title: "Jira not connected",
        description: "Redirecting to Jira authentication...",
      });
      
      // Redirect to Jira OAuth
      const authResponse = await fetch(
        `${import.meta.env.VITE_REQUEST_URL}/integrations/jira`,
        {
          method: "GET",
          credentials: "include",
        }
      );
      const authData = await authResponse.json();
      console.log("🔐 Auth URL:", authData.url);
      window.location.href = authData.url;
      return;
    }

    console.log("✅ Jira is connected, fetching projects...");

    // Get projects first
    const projectsResponse = await fetch(
      `${import.meta.env.VITE_REQUEST_URL}/integrations/jira/projects`,
      {
        method: "GET",
        credentials: "include",
      }
    );
    
    console.log("📋 Projects response status:", projectsResponse.status);
    
    if (!projectsResponse.ok) {
      const errorData = await projectsResponse.json();
      console.error("❌ Projects fetch error:", errorData);
      
      // If token expired or invalid, reconnect
      if (projectsResponse.status === 401 || errorData.error?.includes("token")) {
        toast({
          title: "Session expired",
          description: "Please reconnect to Jira",
          variant: "destructive",
        });
        
        const authResponse = await fetch(
          `${import.meta.env.VITE_REQUEST_URL}/integrations/jira`,
          {
            method: "GET",
            credentials: "include",
          }
        );
        const authData = await authResponse.json();
        window.location.href = authData.url;
        return;
      }
      
      throw new Error(errorData.message || errorData.error || "Failed to fetch projects");
    }
    
    const projectsData = await projectsResponse.json();
    console.log("📋 Projects data:", projectsData);
    
    if (!projectsData.projects || projectsData.projects.length === 0) {
      toast({
        title: "No projects found",
        description: "Please create a project in Jira first. Visit your Jira site to create one.",
        variant: "destructive",
      });
      
      // Open Jira site in new tab
      if (statusData.sites && statusData.sites.length > 0) {
        window.open(statusData.sites[0].url, "_blank");
      }
      return;
    }

    console.log("✅ Found projects:", projectsData.projects.length);

    // Use the first project or let user select
    const firstProject = projectsData.projects[0];
    console.log("📦 Using project:", firstProject.key);
    
    // Create issue with requirements
    const issueResponse = await fetch(
      `${import.meta.env.VITE_REQUEST_URL}/integrations/jira/issue`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          projectKey: firstProject.key,
          summary: "Requirements from MedTest AI",
          description: requirements.substring(0, 1000), // Jira has character limits
          issueType: "Task",
        }),
      }
    );

    if (!issueResponse.ok) {
      const errorData = await issueResponse.json();
      console.error("❌ Issue creation error:", errorData);
      throw new Error(errorData.error || "Failed to create issue");
    }

    const issueData = await issueResponse.json();
    console.log("✅ Issue created:", issueData);
    
    toast({
      title: "Success!",
      description: `Issue created in project ${firstProject.key}: ${issueData.issue.key}`,
    });
    
    // Optional: Open the issue in Jira
    const jiraUrl = `${statusData.sites[0].url}/browse/${issueData.issue.key}`;
    window.open(jiraUrl, "_blank");
    
  } catch (err: any) {
    console.error("❌ Failed to add to Jira:", err);
    toast({
      title: "Error",
      description: err.message || "Failed to add requirements to Jira. Please try again.",
      variant: "destructive",
    });
  }
};

const CallJiraFetch = async () => {
  try {
    console.log("🚀 Starting CallJiraFetch...");
    
    const statusResponse = await fetch(
      `${import.meta.env.VITE_REQUEST_URL}/integrations/jira/status`,
      {
        method: "GET",
        credentials: "include",
      }
    );
    
    const statusData = await statusResponse.json();
    
    if (!statusData.connected) {
      toast({
        title: "Jira not connected",
        description: "Redirecting to Jira authentication...",
      });
      
      const authResponse = await fetch(
        `${import.meta.env.VITE_REQUEST_URL}/integrations/jira`,
        {
          method: "GET",
          credentials: "include",
        }
      );
      const authData = await authResponse.json();
      window.location.href = authData.url;
      return;
    }

    console.log("✅ Jira is connected, fetching projects...");

    const projectsResponse = await fetch(
      `${import.meta.env.VITE_REQUEST_URL}/integrations/jira/projects`,
      {
        method: "GET",
        credentials: "include",
      }
    );
    
    if (!projectsResponse.ok) {
      const errorData = await projectsResponse.json();
      throw new Error(errorData.message || "Failed to fetch projects");
    }
    
    const projectsData = await projectsResponse.json();
    
    if (!projectsData.projects || projectsData.projects.length === 0) {
      toast({
        title: "No projects found",
        description: "Please create a project in Jira first.",
        variant: "destructive",
      });
      return;
    }

    const firstProject = projectsData.projects[0];
    console.log("📦 Fetching issues from project:", firstProject.key);
    
    const issuesResponse = await fetch(
      `${import.meta.env.VITE_REQUEST_URL}/integrations/jira/issues?projectKey=${firstProject.key}&maxResults=50`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (!issuesResponse.ok) {
      const errorData = await issuesResponse.json();
      console.error("❌ Issues fetch error:", errorData);
      throw new Error(errorData.error || "Failed to fetch issues");
    }

    const issuesData = await issuesResponse.json();
    console.log("📋 Issues data:", issuesData);
    
    if (issuesData.total === 0) {
      toast({
        title: "No issues found",
        description: `No issues found in project ${firstProject.key}. Create some issues first.`,
      });
      return;
    }

    // ✅ IMPROVED: Better parsing of Jira description format (ADF - Atlassian Document Format)
    const parseJiraDescription = (description: any): string => {
      if (!description) return "";
      
      // Handle Atlassian Document Format (ADF)
      if (description.content && Array.isArray(description.content)) {
        return description.content
          .map((node: any) => {
            if (node.type === "paragraph" && node.content) {
              return node.content
                .map((item: any) => item.text || "")
                .join("");
            }
            return "";
          })
          .filter((text: string) => text.trim())
          .join("\n");
      }
      
      // Handle plain text
      if (typeof description === "string") {
        return description;
      }
      
      return "";
    };

    // Combine all issue summaries and descriptions
    const combinedRequirements = issuesData.issues
      .map((issue: any) => {
        const summary = issue.fields.summary || "";
        const description = parseJiraDescription(issue.fields.description);
        
        // Format: Issue Key: Summary\nDescription
        return `[${issue.key}] ${summary}${description ? '\n' + description : ''}`;
      })
      .filter((text: string) => text.trim())
      .join("\n\n");

    console.log("📝 Combined requirements length:", combinedRequirements.length);

    if (!combinedRequirements.trim()) {
      toast({
        title: "No content found",
        description: "Issues found but no readable content extracted.",
        variant: "destructive",
      });
      return;
    }

    // Set the requirements
    setRequirements(truncateText(combinedRequirements, MAX_CHARS));
    
    toast({
      title: "Success!",
      description: `Fetched ${issuesData.issues.length} issues from ${firstProject.key}`,
    });
    
  } catch (err: any) {
    console.error("❌ Failed to fetch from Jira:", err);
    toast({
      title: "Error",
      description: err.message || "Failed to fetch requirements from Jira. Please try again.",
      variant: "destructive",
    });
  }
};
  // Function to truncate text to max characters
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength);
  };

  // Function to parse PDF files
  const parsePDF = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const extractedText = await parsePdfText(arrayBuffer);
      
      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error("No text could be extracted from the PDF. The file might be image-based or corrupted.");
      }
      
      return extractedText;
    } catch (error) {
      console.error("PDF parsing error:", error);
      throw new Error(error.message || "Failed to parse PDF file. Please ensure it contains readable text.");
    }
  };

  // Function to parse Word documents
  const parseWordDocument = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      
      if (!result.value || result.value.trim().length === 0) {
        throw new Error("No text could be extracted from the Word document.");
      }
      
      return result.value;
    } catch (error) {
      console.error("Word document parsing error:", error);
      throw new Error("Failed to parse Word document. Please ensure it's a valid .docx file.");
    }
  };

  // Function to parse text files
  const parseTextFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (!content || content.trim().length === 0) {
          reject(new Error("The text file appears to be empty."));
          return;
        }
        resolve(content);
      };
      reader.onerror = () => reject(new Error("Failed to read text file"));
      reader.readAsText(file);
    });
  };

  // Main file processing function
  const processFile = async (file: File) => {
    setIsParsingFile(true);
    
    try {
      let extractedText = "";
      const fileType = file.type;
      const fileName = file.name.toLowerCase();
      const fileSizeMB = file.size / (1024 * 1024);

      // Check file size (optional limit, adjust as needed)
      if (fileSizeMB > 10) {
        throw new Error("File size too large. Please upload files smaller than 10MB.");
      }

      if (fileType === "text/plain" || fileName.endsWith(".txt") || fileName.endsWith(".md")) {
        extractedText = await parseTextFile(file);
      } else if (
        fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        fileName.endsWith(".docx")
      ) {
        extractedText = await parseWordDocument(file);
      } else if (fileType === "application/pdf" || fileName.endsWith(".pdf")) {
        extractedText = await parsePDF(file);
      } else {
        throw new Error("Unsupported file type. Please upload TXT, DOCX, or PDF files.");
      }

      // Clean up extracted text
      extractedText = extractedText.replace(/\s+/g, ' ').trim();

      if (!extractedText || extractedText.length === 0) {
        throw new Error("No readable content found in the file.");
      }

      // Truncate if necessary
      const truncatedText = truncateText(extractedText, MAX_CHARS);
      
      setRequirements(truncatedText);
      
      toast({
        title: "File uploaded successfully",
        description: `Loaded ${file.name} (${truncatedText.length} characters)${
          extractedText.length > MAX_CHARS ? ` - Truncated to ${MAX_CHARS} chars` : ""
        }`,
      });

      if (extractedText.length > MAX_CHARS) {
        toast({
          title: "Content truncated",
          description: `File content was truncated to ${MAX_CHARS} characters limit.`,
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error("File processing error:", error);
      toast({
        title: "File parsing failed",
        description: error.message || "An unknown error occurred while processing the file.",
        variant: "destructive",
      });
    } finally {
      setIsParsingFile(false);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        processFile(files[0]);
      }
    },
    []
  );

  const handleProcess = async () => {
    if (!requirements.trim()) {
      toast({
        title: "No requirements provided",
        description: "Please enter or upload your requirements first.",
        variant: "destructive",
      });
      return;
    }

    if (requirements.length > MAX_CHARS) {
      toast({
        title: "Content too long",
        description: `Please reduce content to ${MAX_CHARS} characters or less.`,
        variant: "destructive",
      });
      return;
    }

    console.log('🚀 Processing with user:', user);
    console.log('📧 User email:', user?.email);

    setIsProcessing(true);

    try {
      // ✅ NOW PASSING USER INFO IN REQUEST BODY
      const requestBody = {
        requirements: requirements.trim(),
        charCount: requirements.length,
        userInfo: user ? {
          uid: user.uid || user.id,
          email: user.email,
          displayName: user.displayName || user.name,
          photoURL: user.photoURL || null
        } : null
      };

      console.log('📤 Sending request with user info:', requestBody.userInfo);

     // const response = await fetch("http://localhost:3000/upload/generate-test", {
      const response = await fetch(`${import.meta.env.VITE_REQUEST_URL}/upload/generate-test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies for session
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      console.log('✅ Response received:', result);
      console.log('👤 Created by:', result.metadata?.createdBy);
      
      toast({
        title: "Processing complete!",
        description: "Your test cases have been generated successfully.",
      });
      
      navigate("/output", { state: { testCases: result } });
      
    } catch (error) {
      console.error("Error generating test cases:", error);
      toast({
        title: "Processing failed",
        description: "Failed to generate test cases. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const isOverLimit = charCount > MAX_CHARS;
  const progressPercentage = Math.min((charCount / MAX_CHARS) * 100, 100);

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-4 animate-fade-in">
        <h1 className="text-4xl font-bold text-foreground">
          Upload Requirements
        </h1>
        <p className="text-xl text-muted-foreground">
          Convert your healthcare software requirements into compliant test cases
        </p>
        {/* Debug info - remove in production */}
        {user && (
          <p className="text-sm text-muted-foreground">
            Logged in as: {user.email} ({user.displayName || user.name})
          </p>
        )}
      </div>
	  {/* Add to Jira Button */}
		<div className="pt-4 border-t border-glass-border">
		<Button
			variant="default"
			className="w-full glass-button"
			onClick={CallJiraAdd}
		>
			<Building className="h-4 w-4 mr-2" />
			Add Requirements to Jira
		</Button>
		</div>

		{/* fetch from Jira Button */}
		<div className="pt-4 border-t border-glass-border">
		<Button
			variant="default"
			className="w-full glass-button"
			onClick={CallJiraFetch}
		>
			<Building className="h-4 w-4 mr-2" />
			'Fetch Requirements from Jira'
		</Button>
		</div>
		
      <div className="grid gap-6 md:grid-cols-2">
        {/* Upload Area */}
        <Card className="glass-card animate-slide-up">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5 text-primary" />
              <span>Upload Documents</span>
            </CardTitle>
            <CardDescription>
              Support for TXT, DOCX, and PDF files (max {MAX_CHARS.toLocaleString()} characters)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragOver
                  ? "border-primary bg-primary/5"
                  : "border-glass-border hover:border-primary/50"
              } ${isParsingFile ? "opacity-50" : ""}`}
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
            >
              <div className="space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  {isParsingFile ? (
                    <Sparkles className="h-6 w-6 text-primary animate-spin" />
                  ) : (
                    <FileText className="h-6 w-6 text-primary" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {isParsingFile ? "Parsing file..." : "Drop your files here"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Supports .txt, .docx, .pdf files (max 10MB)
                  </p>
                </div>
                <input
                  type="file"
                  accept=".txt,.md,.docx,.pdf"
                  className="hidden"
                  id="file-upload"
                  onChange={handleFileInput}
                  disabled={isParsingFile}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="glass-button"
                  onClick={() =>
                    document.getElementById("file-upload")?.click()
                  }
                  disabled={isParsingFile}
                >
                  {isParsingFile ? "Parsing..." : "Choose File"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Manual Input */}
        <Card
          className="glass-card animate-slide-up"
          style={{ animationDelay: "0.1s" }}
        >
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-primary" />
              <span>Manual Input</span>
            </CardTitle>
            <CardDescription>
              Paste your requirements directly into the text area
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Enter your healthcare software requirements here..."
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              className={`min-h-[200px] glass-input resize-none ${
                isOverLimit ? "border-red-500" : ""
              }`}
            />
            <div className="mt-4 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className={`text-muted-foreground ${isOverLimit ? "text-red-500" : ""}`}>
                  {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()} characters
                </span>
                {isOverLimit && (
                  <span className="flex items-center text-red-500 text-xs">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Over limit
                  </span>
                )}
              </div>
              <Progress 
                value={progressPercentage} 
                className={`h-2 ${isOverLimit ? "bg-red-100" : ""}`}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Processing Section */}
      {requirements && (
        <Card className="glass-card animate-fade-in">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground">
                  Ready to Process
                </h3>
                <p className="text-sm text-muted-foreground">
                  {charCount.toLocaleString()} characters loaded • AI-powered test case generation
                </p>
              </div>
              <Button
                onClick={handleProcess}
                disabled={isProcessing || isOverLimit || isParsingFile}
                className="flex items-center space-x-2"
              >
                {isProcessing ? (
                  <>
                    <Sparkles className="h-4 w-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Generate Test Cases</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Features Preview */}
      <div
        className="grid gap-4 md:grid-cols-3 animate-slide-up"
        style={{ animationDelay: "0.2s" }}
      >
        <Card className="glass-card text-center">
          <CardContent className="pt-6">
            <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">AI-Powered</h3>
            <p className="text-sm text-muted-foreground">
              Advanced AI analyzes your requirements and generates comprehensive test cases
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card text-center">
          <CardContent className="pt-6">
            <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Multiple Formats</h3>
            <p className="text-sm text-muted-foreground">
              Supports TXT, Word (DOCX), and PDF document formats
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card text-center">
          <CardContent className="pt-6">
            <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center justify-center mb-4">
              <ArrowRight className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Traceable</h3>
            <p className="text-sm text-muted-foreground">
              Maintains full traceability from requirements to test cases
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UploadPage;