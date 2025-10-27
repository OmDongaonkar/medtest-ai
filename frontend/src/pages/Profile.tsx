import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  User,
  Mail,
  Building,
  Calendar,
  FileText,
  Download,
  Settings,
  History,
  Loader2,
  Eye,
  AlertCircle,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

// Firebase imports
import { getDatabase, ref, get, set } from "firebase/database";

// Import SheetJS for Excel export
import * as XLSX from 'xlsx';

interface UserInfo {
  name: string;
  email: string;
  createdAt: string;
  avatar?: string;
  id?: string;
}

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

interface DetailedTestCase {
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
  };
}

interface TestCase {
  id: string;
  docId: string;
  generatedAt: string;
  requirementsLength: number;
  testCasesCount: number;
  title: string;
  summary: {
    totalTestCases: number;
    categoriesBreakdown: Record<string, number>;
    priorityBreakdown: Record<string, number>;
    complianceStandardsCovered: string[];
    overallRiskAssessment: string;
  };
  userEmail: string;
  userName: string;
}

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTestCases, setLoadingTestCases] = useState(false);
  const [updating, setUpdating] = useState(false);
  
  // Modal states
  const [selectedTestCase, setSelectedTestCase] = useState<DetailedTestCase | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();

  // Redirect to /auth if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/auth", { replace: true });
    }
  }, [isLoggedIn, navigate]);

  // Fetch user data from Firebase using session-based user info
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        if (!user || !user.email) {
          console.log("No authenticated user found in session or no email");
          navigate("/auth", { replace: true });
          return;
        }

        const userEmail = user.email;
        console.log("Fetching data for email:", userEmail);

        const database = getDatabase();
        const usersRef = ref(database, 'users');
        const snapshot = await get(usersRef);
        
        if (snapshot.exists()) {
          const allUsers = snapshot.val();
          let foundUser = null;
          let foundUserId = null;
          
          Object.keys(allUsers).forEach(userId => {
            const dbUser = allUsers[userId];
            if (dbUser.email === userEmail) {
              foundUser = dbUser;
              foundUserId = userId;
            }
          });
          
          if (foundUser) {
            console.log("User data found:", foundUser);
            setUserInfo({
              id: foundUserId,
              name: foundUser.name || "User",
              email: foundUser.email || "",
              createdAt: foundUser.createdAt || new Date().toISOString(),
              avatar: foundUser.photoURL || foundUser.avatar || user.photoURL || "",
            });
          } else {
            console.log("No user data found for email:", userEmail);
            toast({
              title: "Profile not found",
              description: "No profile data found for your account. Please contact support if this is unexpected.",
              variant: "destructive",
            });
          }
        } else {
          console.log("No users data exists in database");
          toast({
            title: "No data found",
            description: "No user data exists in the database.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast({
          title: "Error loading profile",
          description: "Failed to load your profile data. Please try refreshing the page.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (isLoggedIn && user) {
      fetchUserData();
    }
  }, [isLoggedIn, user, navigate, toast]);

  // Fetch test cases for the user from Firebase directly
  useEffect(() => {
    const fetchUserTestCases = async () => {
      if (!user?.email) return;

      try {
        setLoadingTestCases(true);
        console.log("Fetching test cases for user:", user.email);

        // Get Firebase Realtime Database instance
        const database = getDatabase();
        
        // Get all test cases and filter by createdBy email
        const testCasesRef = ref(database, 'testCases');
        const snapshot = await get(testCasesRef);
        
        if (snapshot.exists()) {
          const allTestCases = snapshot.val();
          const userTestCases: TestCase[] = [];
          
          // Filter test cases by createdBy field matching user email
          Object.keys(allTestCases).forEach(testCaseId => {
            const testCase = allTestCases[testCaseId];
            
            // Check if this test case was created by the current user
            if (testCase.metadata?.createdBy === user.email || 
                testCase.metadata?.userEmail === user.email) {
              
              console.log("Found test case for user:", testCase.metadata?.createdBy);
              
              // Create a properly formatted test case object
              const formattedTestCase: TestCase = {
                id: testCaseId,
                docId: testCaseId,
                generatedAt: testCase.metadata?.generatedAt || new Date().toISOString(),
                requirementsLength: testCase.metadata?.requirementsLength || 0,
                testCasesCount: testCase.summary?.totalTestCases || testCase.testCases?.length || 0,
                title: testCase.metadata?.originalRequirements?.substring(0, 100) + 
                       (testCase.metadata?.originalRequirements?.length > 100 ? '...' : '') || 
                       'Test Case Set',
                summary: testCase.summary || {
                  totalTestCases: testCase.testCases?.length || 0,
                  categoriesBreakdown: {},
                  priorityBreakdown: {},
                  complianceStandardsCovered: [],
                  overallRiskAssessment: ''
                },
                userEmail: testCase.metadata?.userEmail || user.email,
                userName: testCase.metadata?.user?.displayName || testCase.metadata?.user?.name || user.displayName || user.name || 'Unknown'
              };
              
              userTestCases.push(formattedTestCase);
            }
          });
          
          // Sort by generation date (newest first)
          userTestCases.sort((a, b) => 
            new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
          );
          
          console.log(`Found ${userTestCases.length} test cases for user:`, user.email);
          setTestCases(userTestCases);
          
        } else {
          console.log("No test cases collection exists in database");
          setTestCases([]);
        }

      } catch (error) {
        console.error("Error fetching test cases:", error);
        toast({
          title: "Error loading test cases",
          description: "Failed to load your test cases. Please try refreshing the page.",
          variant: "destructive",
        });
        setTestCases([]);
      } finally {
        setLoadingTestCases(false);
      }
    };

    if (user?.email) {
      fetchUserTestCases();
    }
  }, [user?.email, toast]);

  // Save updated user data to Firebase
  const handleSave = async () => {
    if (!userInfo || !userInfo.id) return;
    
    try {
      setUpdating(true);
      
      const form = document.getElementById("profile-form") as HTMLFormElement;
      const formData = new FormData(form);
      
      const updatedUserInfo = {
        ...userInfo,
        name: formData.get("name") as string,
        email: formData.get("email") as string,
      };

      const database = getDatabase();
      const userRef = ref(database, `users/${userInfo.id}`);
      
      const updateData = {
        name: updatedUserInfo.name,
        email: updatedUserInfo.email,
        createdAt: userInfo.createdAt,
        photoURL: userInfo.avatar,
      };

      await set(userRef, updateData);
      
      setUserInfo(updatedUserInfo);
      setIsEditing(false);
      
      toast({
        title: "Profile updated",
        description: "Your profile information has been saved successfully.",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update failed",
        description: "Failed to update your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  // Fetch detailed test case data from Firebase
  const fetchTestCaseDetails = async (docId: string): Promise<DetailedTestCase | null> => {
    try {
      console.log("Fetching detailed test case:", docId);
      
      const database = getDatabase();
      const testCaseRef = ref(database, `testCases/${docId}`);
      const snapshot = await get(testCaseRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        return {
          id: docId,
          testCases: data.testCases || [],
          summary: data.summary || {},
          metadata: data.metadata || {}
        };
      }
      
      return null;
    } catch (error) {
      console.error("Error fetching test case details:", error);
      throw error;
    }
  };

  // View full test case details in modal
  const viewTestCase = async (docId: string) => {
    try {
      setLoadingDetails(true);
      setIsModalOpen(true);
      
      const detailedTestCase = await fetchTestCaseDetails(docId);
      
      if (detailedTestCase) {
        setSelectedTestCase(detailedTestCase);
      } else {
        toast({
          title: "Test case not found",
          description: "The requested test case could not be found.",
          variant: "destructive",
        });
        setIsModalOpen(false);
      }
      
    } catch (error) {
      console.error("Error viewing test case:", error);
      toast({
        title: "Error",
        description: "Failed to load test case details.",
        variant: "destructive",
      });
      setIsModalOpen(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Download test case as Excel file
  const downloadTestCase = async (testCase: TestCase) => {
    try {
      console.log("Downloading test case:", testCase.docId);
      
      // First fetch the detailed test case data
      const detailedTestCase = await fetchTestCaseDetails(testCase.docId);
      
      if (!detailedTestCase) {
        toast({
          title: "Download failed",
          description: "Could not retrieve test case data for download.",
          variant: "destructive",
        });
        return;
      }

      // Prepare data for Excel export
      const worksheetData = [];
      
      // Add header information
      worksheetData.push(['Test Case Report']);
      worksheetData.push(['Generated Date:', new Date(detailedTestCase.metadata.generatedAt).toLocaleString()]);
      worksheetData.push(['Created By:', detailedTestCase.metadata.createdBy]);
      worksheetData.push(['Total Test Cases:', detailedTestCase.summary.totalTestCases]);
      worksheetData.push(['Requirements Length:', detailedTestCase.metadata.requirementsLength + ' characters']);
      worksheetData.push([]);
      
      // Add summary information
      worksheetData.push(['SUMMARY']);
      worksheetData.push(['Categories Breakdown:']);
      Object.entries(detailedTestCase.summary.categoriesBreakdown || {}).forEach(([category, count]) => {
        worksheetData.push([`  ${category}:`, count]);
      });
      worksheetData.push([]);
      
      worksheetData.push(['Priority Breakdown:']);
      Object.entries(detailedTestCase.summary.priorityBreakdown || {}).forEach(([priority, count]) => {
        worksheetData.push([`  ${priority}:`, count]);
      });
      worksheetData.push([]);
      
      worksheetData.push(['Compliance Standards:', (detailedTestCase.summary.complianceStandardsCovered || []).join(', ')]);
      worksheetData.push(['Risk Assessment:', detailedTestCase.summary.overallRiskAssessment]);
      worksheetData.push([]);
      
      // Add original requirements
      worksheetData.push(['ORIGINAL REQUIREMENTS']);
      worksheetData.push([detailedTestCase.metadata.originalRequirements]);
      worksheetData.push([]);
      
      // Add detailed test cases
      worksheetData.push(['DETAILED TEST CASES']);
      worksheetData.push([]);
      
      detailedTestCase.testCases.forEach((tc, index) => {
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
      const fileName = `TestCases_${testCase.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Download file
      XLSX.writeFile(workbook, fileName);
      
      toast({
        title: "Download started",
        description: `Test cases exported to ${fileName}`,
      });
      
    } catch (error) {
      console.error("Error downloading test case:", error);
      toast({
        title: "Download failed",
        description: "Failed to export test case to Excel.",
        variant: "destructive",
      });
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return "Unknown";
    }
  };

  // Format join date
  const formatJoinDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long' 
      });
    } catch (error) {
      return "Recently";
    }
  };

  // Get status based on test case data
  const getTestCaseStatus = (testCase: TestCase) => {
    // You can implement your own logic for determining status
    return "Completed";
  };

  // Show loading state
  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if no user info
  if (!userInfo) {
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Profile Not Found</h1>
          <p className="text-muted-foreground">Unable to load your profile information.</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-4 animate-fade-in">
        <h1 className="text-4xl font-bold text-foreground">Profile</h1>
        <p className="text-xl text-muted-foreground">
          Manage your account and view your testing history
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Overview */}
        <div className="md:col-span-1">
          <Card className="glass-card animate-slide-up">
            <CardHeader className="text-center">
              <Avatar className="w-24 h-24 mx-auto mb-4">
                <AvatarImage src={userInfo.avatar} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {userInfo.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <CardTitle>{userInfo.name}</CardTitle>
              <CardDescription>User</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{userInfo.email}</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Joined {formatJoinDate(userInfo.createdAt)}</span>
              </div>

              <div className="pt-4 border-t border-glass-border">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-primary">
                      {loadingTestCases ? "..." : testCases.reduce((sum, tc) => sum + tc.testCasesCount, 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">Test Cases</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">
                      {loadingTestCases ? "..." : testCases.length}
                    </p>
                    <p className="text-xs text-muted-foreground">Projects</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Details */}
        <div className="md:col-span-2">
          <Card
            className="glass-card animate-slide-up"
            style={{ animationDelay: "0.1s" }}
          >
            <Tabs defaultValue="details" className="w-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Account Details</CardTitle>
                    <CardDescription>
                      View and edit your profile information
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      isEditing ? handleSave() : setIsEditing(true)
                    }
                    className="glass-button"
                    disabled={updating}
                  >
                    {updating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Settings className="h-4 w-4 mr-2" />
                        {isEditing ? "Save" : "Edit"}
                      </>
                    )}
                  </Button>
                </div>
                <TabsList className="glass-input">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="projects">
                    Test Cases ({loadingTestCases ? "..." : testCases.length})
                  </TabsTrigger>
                </TabsList>
              </CardHeader>

              <TabsContent value="details">
                <CardContent>
                  <form id="profile-form" className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-1">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          name="name"
                          defaultValue={userInfo.name}
                          disabled={!isEditing}
                          className="glass-input"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          defaultValue={userInfo.email}
                          disabled={!isEditing}
                          className="glass-input"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-1">
                      <div className="space-y-2">
                        <Label>Member Since</Label>
                        <Input
                          value={formatJoinDate(userInfo.createdAt)}
                          disabled
                          className="glass-input"
                        />
                      </div>
                    </div>
                  </form>
                </CardContent>
              </TabsContent>

              <TabsContent value="projects">
                <CardContent>
                  {loadingTestCases ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center space-y-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                        <p className="text-muted-foreground">Loading test cases...</p>
                      </div>
                    </div>
                  ) : testCases.length === 0 ? (
                    <div className="text-center py-8 space-y-4">
                      <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
                      <div>
                        <h3 className="font-semibold text-foreground">No test cases found</h3>
                        <p className="text-muted-foreground text-sm">
                          You haven't generated any test cases yet. 
                        </p>
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          onClick={() => navigate('/upload')}
                        >
                          Create Test Cases
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {testCases.map((testCase) => (
                        <div
                          key={testCase.id}
                          className="p-4 rounded-lg border border-glass-border hover:border-primary/50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center space-x-3">
                                <h3 className="font-semibold text-sm">
                                  {testCase.title}
                                </h3>
                              </div>
                              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                <span>{formatDate(testCase.generatedAt)}</span>
                                <span>{testCase.testCasesCount} test cases</span>
                                <span>{testCase.requirementsLength} chars</span>
                              </div>
                              {testCase.summary?.complianceStandardsCovered?.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {testCase.summary.complianceStandardsCovered.slice(0, 3).map((standard) => (
                                    <Badge key={standard} variant="secondary" className="text-xs">
                                      {standard}
                                    </Badge>
                                  ))}
                                  {testCase.summary.complianceStandardsCovered.length > 3 && (
                                    <Badge variant="secondary" className="text-xs">
                                      +{testCase.summary.complianceStandardsCovered.length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              <Badge
                                variant={
                                  getTestCaseStatus(testCase) === "Completed"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {getTestCaseStatus(testCase)}
                              </Badge>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => viewTestCase(testCase.docId)}
                                title="View details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => downloadTestCase(testCase)}
                                title="Download"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>

      {/* Test Case Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Test Case Details</span>
            </DialogTitle>
            <DialogDescription>
              {selectedTestCase && (
                <>
                  Generated on {new Date(selectedTestCase.metadata.generatedAt).toLocaleDateString()} • 
                  {selectedTestCase.summary.totalTestCases} test cases • 
                  Created by {selectedTestCase.metadata.userName || selectedTestCase.metadata.createdBy}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[70vh] w-full pr-4">
            {loadingDetails ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                  <p className="text-muted-foreground">Loading test case details...</p>
                </div>
              </div>
            ) : selectedTestCase ? (
              <div className="space-y-6">
                {/* Summary Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Total Test Cases</Label>
                        <p className="text-2xl font-bold text-primary">{selectedTestCase.summary.totalTestCases}</p>
                      </div>
                      <div>
                        <Label>Requirements Length</Label>
                        <p className="text-lg">{selectedTestCase.metadata.requirementsLength} characters</p>
                      </div>
                    </div>
                    
                    {/* Categories Breakdown */}
                    {Object.keys(selectedTestCase.summary.categoriesBreakdown || {}).length > 0 && (
                      <div>
                        <Label>Categories Breakdown</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {Object.entries(selectedTestCase.summary.categoriesBreakdown).map(([category, count]) => (
                            <Badge key={category} variant="secondary">
                              {category}: {count}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Priority Breakdown */}
                    {Object.keys(selectedTestCase.summary.priorityBreakdown || {}).length > 0 && (
                      <div>
                        <Label>Priority Breakdown</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {Object.entries(selectedTestCase.summary.priorityBreakdown).map(([priority, count]) => (
                            <Badge key={priority} variant="outline">
                              {priority}: {count}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Compliance Standards */}
                    {selectedTestCase.summary.complianceStandardsCovered?.length > 0 && (
                      <div>
                        <Label>Compliance Standards</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedTestCase.summary.complianceStandardsCovered.map((standard) => (
                            <Badge key={standard} variant="default">
                              {standard}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Risk Assessment */}
                    {selectedTestCase.summary.overallRiskAssessment && (
                      <div>
                        <Label>Overall Risk Assessment</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {selectedTestCase.summary.overallRiskAssessment}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Original Requirements */}
                {selectedTestCase.metadata.originalRequirements && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Original Requirements</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <p className="text-sm whitespace-pre-wrap">
                          {selectedTestCase.metadata.originalRequirements}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Test Cases */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Test Cases</h3>
                  {selectedTestCase.testCases?.map((testCase, index) => (
                    <Card key={testCase.id || index}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{testCase.title}</CardTitle>
                          <div className="flex gap-2">
                            <Badge variant="outline">{testCase.category}</Badge>
                            <Badge variant={
                              testCase.priority === 'High' ? 'destructive' :
                              testCase.priority === 'Medium' ? 'default' : 'secondary'
                            }>
                              {testCase.priority}
                            </Badge>
                            <Badge variant="outline">{testCase.riskLevel}</Badge>
                          </div>
                        </div>
                        <CardDescription>{testCase.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Test Case ID</Label>
                            <p className="text-sm">{testCase.id}</p>
                          </div>
                          <div>
                            <Label>Estimated Duration</Label>
                            <p className="text-sm">{testCase.estimatedDuration}</p>
                          </div>
                          <div>
                            <Label>Automation Potential</Label>
                            <p className="text-sm">{testCase.automationPotential}</p>
                          </div>
                          <div>
                            <Label>Requirement ID</Label>
                            <p className="text-sm">{testCase.requirementId}</p>
                          </div>
                        </div>
                        
                        {/* Compliance Standards for this test case */}
                        {testCase.complianceStandards?.length > 0 && (
                          <div>
                            <Label>Compliance Standards</Label>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {testCase.complianceStandards.map((standard) => (
                                <Badge key={standard} variant="secondary" className="text-xs">
                                  {standard}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Preconditions */}
                        {testCase.preconditions?.length > 0 && (
                          <div>
                            <Label>Preconditions</Label>
                            <ul className="list-disc list-inside text-sm mt-1 space-y-1">
                              {testCase.preconditions.map((precondition, idx) => (
                                <li key={idx}>{precondition}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {/* Test Steps */}
                        {testCase.testSteps?.length > 0 && (
                          <div>
                            <Label>Test Steps</Label>
                            <div className="space-y-2 mt-2">
                              {testCase.testSteps.map((step, stepIdx) => (
                                <div key={stepIdx} className="border rounded-lg p-3">
                                  <div className="flex items-start gap-2">
                                    <Badge variant="outline" className="text-xs">
                                      Step {step.stepNumber}
                                    </Badge>
                                  </div>
                                  <div className="mt-2 space-y-1">
                                    <div>
                                      <Label className="text-xs">Action:</Label>
                                      <p className="text-sm">{step.action}</p>
                                    </div>
                                    <div>
                                      <Label className="text-xs">Expected Result:</Label>
                                      <p className="text-sm">{step.expectedResult}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Expected Results */}
                        {testCase.expectedResults && (
                          <div>
                            <Label>Overall Expected Results</Label>
                            <p className="text-sm mt-1">{testCase.expectedResults}</p>
                          </div>
                        )}
                        
                        {/* Test Data */}
                        {testCase.testData && (testCase.testData.inputs || testCase.testData.outputs) && (
                          <div>
                            <Label>Test Data</Label>
                            <div className="mt-2 space-y-2">
                              {testCase.testData.inputs && (
                                <div>
                                  <Label className="text-xs">Inputs:</Label>
                                  <p className="text-sm bg-muted/50 p-2 rounded">{testCase.testData.inputs}</p>
                                </div>
                              )}
                              {testCase.testData.outputs && (
                                <div>
                                  <Label className="text-xs">Expected Outputs:</Label>
                                  <p className="text-sm bg-muted/50 p-2 rounded">{testCase.testData.outputs}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Traceability Link */}
                        {testCase.traceabilityLink && (
                          <div>
                            <Label>Traceability Link</Label>
                            <p className="text-sm mt-1">{testCase.traceabilityLink}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No test case data available</p>
              </div>
            )}
          </ScrollArea>

          {/* Modal Actions */}
          {selectedTestCase && !loadingDetails && (
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  const testCase = testCases.find(tc => tc.docId === selectedTestCase.id);
                  if (testCase) {
                    downloadTestCase(testCase);
                  }
                }}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download Excel
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;