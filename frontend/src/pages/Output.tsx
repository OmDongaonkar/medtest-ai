import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Download,
  FileText,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Copy,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

// Firebase imports
import { getDatabase, ref, get, query, orderByChild, equalTo, limitToLast } from "firebase/database";

// Import SheetJS for Excel export (same as Profile component)
import * as XLSX from 'xlsx';

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
  summary: {
    totalTestCases: number;
    categoriesBreakdown: Record<string, number>;
    priorityBreakdown: Record<string, number>;
    complianceStandardsCovered: string[];
    overallRiskAssessment: string;
  };
  metadata: {
    generatedAt: string;
    requirementsLength: number;
    originalRequirements: string;
    createdBy: string;
    userName: string;
    userEmail: string;
  };
}

const Output = () => {
  const [selectedTestCase, setSelectedTestCase] = useState(0);
  const [testCaseData, setTestCaseData] = useState<TestCaseData | null>(null);
  const [loading, setLoading] = useState(true);
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

        // Check if test case data was passed from the upload page
        if (location.state?.testCases) {
          console.log("Using test case data from state:", location.state.testCases);
          setTestCaseData(location.state.testCases);
          setLoading(false);
          return;
        }

        // If no data in state, fetch the latest test case from Firebase
        if (!user?.email) {
          console.log("No user email available");
          setLoading(false);
          return;
        }

        console.log("Fetching latest test case for user:", user.email);
        
        const database = getDatabase();
        const testCasesRef = ref(database, 'testCases');
        const snapshot = await get(testCasesRef);
        
        if (snapshot.exists()) {
          const allTestCases = snapshot.val();
          let latestTestCase: TestCaseData | null = null;
          let latestTimestamp = 0;
          
          // Find the most recent test case for this user
          Object.keys(allTestCases).forEach(testCaseId => {
            const testCase = allTestCases[testCaseId];
            
            if (testCase.metadata?.createdBy === user.email || 
                testCase.metadata?.userEmail === user.email) {
              
              const timestamp = new Date(testCase.metadata?.generatedAt || 0).getTime();
              
              if (timestamp > latestTimestamp) {
                latestTimestamp = timestamp;
                latestTestCase = {
                  id: testCaseId,
                  testCases: testCase.testCases || [],
                  summary: testCase.summary || {},
                  metadata: testCase.metadata || {}
                };
              }
            }
          });
          
          if (latestTestCase) {
            console.log("Found latest test case:", latestTestCase.id);
            setTestCaseData(latestTestCase);
          } else {
            console.log("No test cases found for user");
            toast({
              title: "No test cases found",
              description: "You don't have any generated test cases yet.",
              variant: "destructive",
            });
          }
        } else {
          console.log("No test cases collection exists");
        }
        
      } catch (error) {
        console.error("Error fetching test cases:", error);
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

  // Export to Excel using SheetJS (same implementation as Profile component)
  const exportToExcel = () => {
    if (!testCaseData) return;

    try {
      console.log("Exporting test cases to Excel");
      
      // Prepare data for Excel export
      const worksheetData = [];
      
      // Add header information
      worksheetData.push(['Test Case Report']);
      worksheetData.push(['Generated Date:', new Date(testCaseData.metadata.generatedAt).toLocaleString()]);
      worksheetData.push(['Created By:', testCaseData.metadata.createdBy]);
      worksheetData.push(['Total Test Cases:', testCaseData.summary.totalTestCases]);
      worksheetData.push(['Requirements Length:', testCaseData.metadata.requirementsLength + ' characters']);
      worksheetData.push([]);
      
      // Add summary information
      worksheetData.push(['SUMMARY']);
      worksheetData.push(['Categories Breakdown:']);
      Object.entries(testCaseData.summary.categoriesBreakdown || {}).forEach(([category, count]) => {
        worksheetData.push([`  ${category}:`, count]);
      });
      worksheetData.push([]);
      
      worksheetData.push(['Priority Breakdown:']);
      Object.entries(testCaseData.summary.priorityBreakdown || {}).forEach(([priority, count]) => {
        worksheetData.push([`  ${priority}:`, count]);
      });
      worksheetData.push([]);
      
      worksheetData.push(['Compliance Standards:', (testCaseData.summary.complianceStandardsCovered || []).join(', ')]);
      worksheetData.push(['Risk Assessment:', testCaseData.summary.overallRiskAssessment]);
      worksheetData.push([]);
      
      // Add original requirements
      worksheetData.push(['ORIGINAL REQUIREMENTS']);
      worksheetData.push([testCaseData.metadata.originalRequirements]);
      worksheetData.push([]);
      
      // Add detailed test cases
      worksheetData.push(['DETAILED TEST CASES']);
      worksheetData.push([]);
      
      testCaseData.testCases.forEach((tc, index) => {
        worksheetData.push([`TEST CASE ${index + 1}: ${tc.title}`]);
        worksheetData.push(['ID:', tc.id]);
        worksheetData.push(['Description:', tc.description]);
        worksheetData.push(['Category:', tc.category]);
        worksheetData.push(['Priority:', tc.priority]);
        worksheetData.push(['Risk Level:', tc.riskLevel]);
        worksheetData.push(['Estimated Duration:', tc.estimatedDuration]);
        worksheetData.push(['Automation Potential:', tc.automationPotential]);
        worksheetData.push(['Requirement ID:', tc.requirementId]);
        worksheetData.push(['Traceability:', tc.traceabilityLink]);
        worksheetData.push(['Compliance Standards:', (tc.complianceStandards || []).join(', ')]);
        worksheetData.push([]);
        
        // Preconditions
        worksheetData.push(['Preconditions:']);
        (tc.preconditions || []).forEach((precondition, idx) => {
          worksheetData.push([`  ${idx + 1}. ${precondition}`]);
        });
        worksheetData.push([]);
        
        // Test Steps
        worksheetData.push(['Test Steps:']);
        (tc.testSteps || []).forEach((step) => {
          worksheetData.push([`  Step ${step.stepNumber}:`]);
          worksheetData.push([`    Action: ${step.action}`]);
          worksheetData.push([`    Expected Result: ${step.expectedResult}`]);
        });
        worksheetData.push([]);
        
        // Expected Results
        worksheetData.push(['Overall Expected Results:', tc.expectedResults]);
        worksheetData.push([]);
        
        // Test Data
        if (tc.testData) {
          worksheetData.push(['Test Data:']);
          worksheetData.push(['  Inputs:', tc.testData.inputs]);
          worksheetData.push(['  Expected Outputs:', tc.testData.outputs]);
        }
        worksheetData.push([]);
        worksheetData.push(['=' .repeat(50)]);
        worksheetData.push([]);
      });

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      
      // Set column widths
      const maxWidth = 100;
      worksheet['!cols'] = [
        { wch: 25 }, // Column A
        { wch: maxWidth } // Column B
      ];
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Test Cases');
      
      // Generate filename
      const fileName = `TestCases_Output_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Download file
      XLSX.writeFile(workbook, fileName);
      
      toast({
        title: "Download started",
        description: `Test cases exported to ${fileName}`,
      });
      
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast({
        title: "Export failed",
        description: "Failed to export test cases to Excel.",
        variant: "destructive",
      });
    }
  };

  // Export to PDF - Simple text-based PDF since jsPDF isn't installed
  const exportToPDF = () => {
    if (!testCaseData) return;

    try {
      // Create a simple text representation for PDF
      let pdfContent = `TEST CASE REPORT\n`;
      pdfContent += `Generated Date: ${new Date(testCaseData.metadata.generatedAt).toLocaleString()}\n`;
      pdfContent += `Created By: ${testCaseData.metadata.createdBy}\n`;
      pdfContent += `Total Test Cases: ${testCaseData.summary.totalTestCases}\n`;
      pdfContent += `Requirements Length: ${testCaseData.metadata.requirementsLength} characters\n\n`;
      
      pdfContent += `SUMMARY\n`;
      pdfContent += `Categories Breakdown:\n`;
      Object.entries(testCaseData.summary.categoriesBreakdown || {}).forEach(([category, count]) => {
        pdfContent += `  ${category}: ${count}\n`;
      });
      
      pdfContent += `\nPriority Breakdown:\n`;
      Object.entries(testCaseData.summary.priorityBreakdown || {}).forEach(([priority, count]) => {
        pdfContent += `  ${priority}: ${count}\n`;
      });
      
      pdfContent += `\nCompliance Standards: ${(testCaseData.summary.complianceStandardsCovered || []).join(', ')}\n`;
      pdfContent += `Risk Assessment: ${testCaseData.summary.overallRiskAssessment}\n\n`;
      
      pdfContent += `ORIGINAL REQUIREMENTS\n${testCaseData.metadata.originalRequirements}\n\n`;
      
      pdfContent += `DETAILED TEST CASES\n\n`;
      
      testCaseData.testCases.forEach((tc, index) => {
        pdfContent += `TEST CASE ${index + 1}: ${tc.title}\n`;
        pdfContent += `ID: ${tc.id}\n`;
        pdfContent += `Description: ${tc.description}\n`;
        pdfContent += `Category: ${tc.category}\n`;
        pdfContent += `Priority: ${tc.priority}\n`;
        pdfContent += `Risk Level: ${tc.riskLevel}\n`;
        pdfContent += `Estimated Duration: ${tc.estimatedDuration}\n`;
        pdfContent += `Automation Potential: ${tc.automationPotential}\n`;
        pdfContent += `Requirement ID: ${tc.requirementId}\n`;
        pdfContent += `Compliance Standards: ${(tc.complianceStandards || []).join(', ')}\n\n`;
        
        pdfContent += `Preconditions:\n`;
        (tc.preconditions || []).forEach((precondition, idx) => {
          pdfContent += `  ${idx + 1}. ${precondition}\n`;
        });
        
        pdfContent += `\nTest Steps:\n`;
        (tc.testSteps || []).forEach((step) => {
          pdfContent += `  Step ${step.stepNumber}: ${step.action}\n`;
          pdfContent += `    Expected Result: ${step.expectedResult}\n`;
        });
        
        pdfContent += `\nOverall Expected Results: ${tc.expectedResults}\n`;
        
        if (tc.testData) {
          pdfContent += `\nTest Data:\n`;
          pdfContent += `  Inputs: ${tc.testData.inputs}\n`;
          pdfContent += `  Expected Outputs: ${tc.testData.outputs}\n`;
        }
        
        pdfContent += `\n${'='.repeat(50)}\n\n`;
      });

      // Create and download as text file (since we don't have jsPDF)
      const blob = new Blob([pdfContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `TestCases_Output_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download started",
        description: "Test cases exported as text file (install jsPDF for proper PDF export)",
      });
      
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      toast({
        title: "Export failed",
        description: "Failed to export test cases.",
        variant: "destructive",
      });
    }
  };

  // Copy test case to clipboard
  const copyTestCase = (testCase: TestCaseDetail) => {
    const text = `${testCase.id}: ${testCase.title}\n\nDescription: ${testCase.description}\n\nCategory: ${testCase.category}\nPriority: ${testCase.priority}\n\nTest Steps:\n${testCase.testSteps.map(step => `${step.stepNumber}. ${step.action}\n   Expected: ${step.expectedResult}`).join('\n')}\n\nOverall Expected Result: ${testCase.expectedResults}`;
    
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Test case details copied successfully",
    });
  };

  // Show loading state
  if (loading) {
    return (
      <div className="container max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Loading your test cases...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if no test case data
  if (!testCaseData) {
    return (
      <div className="container max-w-7xl mx-auto p-6">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">No Test Cases Found</h1>
          <p className="text-muted-foreground">Unable to load test case data.</p>
          <Button onClick={() => navigate('/upload')}>
            Generate Test Cases
          </Button>
        </div>
      </div>
    );
  }

  const testCases = testCaseData.testCases || [];
  const summary = testCaseData.summary || {};

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-4xl font-bold text-foreground">
            Generated Test Cases
          </h1>
          <p className="text-xl text-muted-foreground mt-2">
            AI-generated, compliant, and traceable test cases
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={exportToPDF}
            className="glass-button"
          >
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button
            variant="outline"
            onClick={exportToExcel}
            className="glass-button"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-4 animate-slide-up">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {testCases.length}
                </p>
                <p className="text-sm text-muted-foreground">Test Cases</p>
              </div>
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">100%</p>
                <p className="text-sm text-muted-foreground">Coverage</p>
              </div>
              <FileText className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {summary.complianceStandardsCovered?.length || 0}
                </p>
                <p className="text-sm text-muted-foreground">
                  Compliance Standards
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">Ready</p>
                <p className="text-sm text-muted-foreground">Status</p>
              </div>
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div
        className="grid gap-6 lg:grid-cols-3 animate-slide-up"
        style={{ animationDelay: "0.1s" }}
      >
        {/* Test Cases List */}
        <div className="lg:col-span-2">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Test Cases</CardTitle>
              <CardDescription>
                Generated from your requirements with full traceability
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {testCases.map((testCase, index) => (
                <div
                  key={testCase.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedTestCase === index
                      ? "border-primary bg-primary/5"
                      : "border-glass-border hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedTestCase(index)}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className="text-xs">
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
                          className="text-xs"
                        >
                          {testCase.priority}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {testCase.category}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-foreground">
                        {testCase.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {testCase.description}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {testCase.complianceStandards?.slice(0, 3).map((comp) => (
                          <Badge
                            key={comp}
                            variant="outline"
                            className="text-xs bg-primary/10 text-primary border-primary/20"
                          >
                            {comp}
                          </Badge>
                        ))}
                        {testCase.complianceStandards?.length > 3 && (
                          <Badge
                            variant="outline"
                            className="text-xs bg-primary/10 text-primary border-primary/20"
                          >
                            +{testCase.complianceStandards.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground mt-2" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Test Case Details */}
        <div>
          {testCases.length > 0 && (
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{testCases[selectedTestCase]?.id}</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyTestCase(testCases[selectedTestCase])}
                    className="glass-button"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription>
                  {testCases[selectedTestCase]?.title}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="details" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 glass-input">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="trace">Traceability</TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="space-y-4 mt-4">
                    <div>
                      <h4 className="font-semibold mb-2">Description</h4>
                      <p className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">
                        {testCases[selectedTestCase]?.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-1">Priority</h4>
                        <Badge variant={
                          testCases[selectedTestCase]?.priority === "High"
                            ? "destructive"
                            : testCases[selectedTestCase]?.priority === "Medium" 
                            ? "default"
                            : "secondary"
                        }>
                          {testCases[selectedTestCase]?.priority}
                        </Badge>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Risk Level</h4>
                        <Badge variant="outline">
                          {testCases[selectedTestCase]?.riskLevel}
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Test Steps</h4>
                      <ol className="text-sm space-y-2">
                        {testCases[selectedTestCase]?.testSteps.map((step, i) => (
                          <li key={i} className="space-y-1">
                            <div className="flex">
                              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                                {step.stepNumber}
                              </span>
                              <div className="flex-1">
                                <div className="text-muted-foreground">{step.action}</div>
                                <div className="text-xs text-primary mt-1">Expected: {step.expectedResult}</div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ol>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Expected Result</h4>
                      <p className="text-sm text-muted-foreground p-3 bg-primary/5 rounded-lg">
                        {testCases[selectedTestCase]?.expectedResults}
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="trace" className="space-y-4 mt-4">
                    <div>
                      <h4 className="font-semibold mb-2">
                        Requirement Traceability
                      </h4>
                      <Badge variant="outline" className="mb-4">
                        {testCases[selectedTestCase]?.requirementId}
                      </Badge>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Compliance Standards</h4>
                      <div className="space-y-2">
                        {testCases[selectedTestCase]?.complianceStandards?.map((comp) => (
                          <div
                            key={comp}
                            className="flex items-center justify-between p-2 bg-muted/20 rounded"
                          >
                            <span className="text-sm font-medium">{comp}</span>
                            <CheckCircle className="h-4 w-4 text-primary" />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Test Data</h4>
                      {testCases[selectedTestCase]?.testData && (
                        <div className="space-y-2">
                          <div>
                            <label className="text-xs font-medium">Inputs:</label>
                            <p className="text-sm bg-muted/30 p-2 rounded">
                              {testCases[selectedTestCase]?.testData.inputs || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <label className="text-xs font-medium">Expected Outputs:</label>
                            <p className="text-sm bg-muted/30 p-2 rounded">
                              {testCases[selectedTestCase]?.testData.outputs || 'N/A'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Output;