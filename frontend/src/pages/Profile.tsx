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
  Bot,
  Mail,
  Building,
  Calendar,
  FileText,
  Download,
  FileCode,
  FileType,
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
import { getDatabase, ref, get, set } from "firebase/database";

// Import controller functions
import { exportToPDF } from "@/controllers/download-pdf";
import { exportToExcel } from "@/controllers/download-excel";
import { exportToXML } from "@/controllers/download-xml";
import { exportToJira } from "@/controllers/export-jira";

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
  const [exportingToJira, setExportingToJira] = useState(false);
  const [selectedTestCase, setSelectedTestCase] =
    useState<DetailedTestCase | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const { toast } = useToast();
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/auth", { replace: true });
    }
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        if (!user || !user.email) {
          navigate("/auth", { replace: true });
          return;
        }

        const database = getDatabase();
        const usersRef = ref(database, "users");
        const snapshot = await get(usersRef);

        if (snapshot.exists()) {
          const allUsers = snapshot.val();
          let foundUser = null;
          let foundUserId = null;

          Object.keys(allUsers).forEach((userId) => {
            const dbUser = allUsers[userId];
            if (dbUser.email === user.email) {
              foundUser = dbUser;
              foundUserId = userId;
            }
          });

          if (foundUser) {
            setUserInfo({
              id: foundUserId,
              name: foundUser.name || "User",
              email: foundUser.email || "",
              createdAt: foundUser.createdAt || new Date().toISOString(),
              avatar:
                foundUser.photoURL || foundUser.avatar || user.photoURL || "",
            });
          } else {
            toast({
              title: "Profile not found",
              description: "No profile data found for your account.",
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast({
          title: "Error loading profile",
          description: "Failed to load your profile data.",
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

  const CallJiraConnect = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_REQUEST_URL}/integrations/jira`,
        {
          method: "GET",
          credentials: "include",
        }
      );
      const data = await response.json();
      window.location.href = data.url;
    } catch (err) {
      console.error("Failed to connect Jira:", err);
      toast({
        title: "Connection failed",
        description: "Failed to connect to Jira.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const fetchUserTestCases = async () => {
      if (!user?.email) return;

      try {
        setLoadingTestCases(true);
        const database = getDatabase();
        const testCasesRef = ref(database, "testCases");
        const snapshot = await get(testCasesRef);

        if (snapshot.exists()) {
          const allTestCases = snapshot.val();
          const userTestCases: TestCase[] = [];

          Object.keys(allTestCases).forEach((testCaseId) => {
            const testCase = allTestCases[testCaseId];

            if (
              testCase.metadata?.createdBy === user.email ||
              testCase.metadata?.userEmail === user.email
            ) {
              const formattedTestCase: TestCase = {
                id: testCaseId,
                docId: testCaseId,
                generatedAt:
                  testCase.metadata?.generatedAt || new Date().toISOString(),
                requirementsLength: testCase.metadata?.requirementsLength || 0,
                testCasesCount:
                  testCase.summary?.totalTestCases ||
                  testCase.testCases?.length ||
                  0,
                title:
                  testCase.metadata?.originalRequirements?.substring(0, 100) +
                    (testCase.metadata?.originalRequirements?.length > 100
                      ? "..."
                      : "") || "Test Case Set",
                summary: testCase.summary || {
                  totalTestCases: testCase.testCases?.length || 0,
                  categoriesBreakdown: {},
                  priorityBreakdown: {},
                  complianceStandardsCovered: [],
                  overallRiskAssessment: "",
                },
                userEmail: testCase.metadata?.userEmail || user.email,
                userName:
                  testCase.metadata?.user?.displayName ||
                  user.displayName ||
                  "Unknown",
              };

              userTestCases.push(formattedTestCase);
            }
          });

          userTestCases.sort(
            (a, b) =>
              new Date(b.generatedAt).getTime() -
              new Date(a.generatedAt).getTime()
          );

          setTestCases(userTestCases);
        } else {
          setTestCases([]);
        }
      } catch (error) {
        console.error("Error fetching test cases:", error);
        toast({
          title: "Error loading test cases",
          description: "Failed to load your test cases.",
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
      await set(userRef, {
        name: updatedUserInfo.name,
        email: updatedUserInfo.email,
        createdAt: userInfo.createdAt,
        photoURL: userInfo.avatar,
      });

      setUserInfo(updatedUserInfo);
      setIsEditing(false);

      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully.",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update failed",
        description: "Failed to update your profile.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const fetchTestCaseDetails = async (
    docId: string
  ): Promise<DetailedTestCase | null> => {
    try {
      const database = getDatabase();
      const testCaseRef = ref(database, `testCases/${docId}`);
      const snapshot = await get(testCaseRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        return {
          id: docId,
          testCases: data.testCases || [],
          summary: data.summary || {},
          metadata: data.metadata || {},
        };
      }
      return null;
    } catch (error) {
      console.error("Error fetching test case details:", error);
      throw error;
    }
  };

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

  const passDetails = async (docId: string) => {
    try {
      const detailedTestCase = await fetchTestCaseDetails(docId);

      if (detailedTestCase) {
        navigate("/chat", {
          state: { testCase: detailedTestCase },
          replace: false,
        });
      } else {
        toast({
          title: "Test case not found",
          description: "The requested test case could not be found.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error in passDetails:", error);
      toast({
        title: "Error",
        description: "Failed to load test case details.",
        variant: "destructive",
      });
    }
  };

  // Use controller function for Excel download
  const downloadTestCase = async (testCase: TestCase) => {
    try {
      const detailedTestCase = await fetchTestCaseDetails(testCase.docId);

      if (!detailedTestCase) {
        toast({
          title: "Download failed",
          description: "Could not retrieve test case data.",
          variant: "destructive",
        });
        return;
      }

      exportToExcel(detailedTestCase, toast);
    } catch (error) {
      console.error("Error downloading test case:", error);
      toast({
        title: "Download failed",
        description: "Failed to export test case to Excel.",
        variant: "destructive",
      });
    }
  };

  // Use controller function for XML download
  const downloadTestCaseAsXML = async (testCase: TestCase) => {
    try {
      const detailedTestCase = await fetchTestCaseDetails(testCase.docId);

      if (!detailedTestCase) {
        toast({
          title: "Download failed",
          description: "Could not retrieve test case data.",
          variant: "destructive",
        });
        return;
      }

      exportToXML(detailedTestCase, toast);
    } catch (error) {
      console.error("Error downloading XML:", error);
      toast({
        title: "Download failed",
        description: "Failed to export test case to XML.",
        variant: "destructive",
      });
    }
  };

  // Use controller function for PDF download
  const downloadTestCaseAsPDF = async (testCase: TestCase) => {
    try {
      const detailedTestCase = await fetchTestCaseDetails(testCase.docId);

      if (!detailedTestCase) {
        toast({
          title: "Download failed",
          description: "Could not retrieve test case data.",
          variant: "destructive",
        });
        return;
      }

      exportToPDF(detailedTestCase, toast);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast({
        title: "Download failed",
        description: "Failed to export test case to PDF.",
        variant: "destructive",
      });
    }
  };

  // Use controller function for Jira export
  const handleExportToJira = async (testCase: TestCase) => {
    try {
      setExportingToJira(true);
      const detailedTestCase = await fetchTestCaseDetails(testCase.docId);

      if (!detailedTestCase) {
        toast({
          title: "Export failed",
          description: "Could not retrieve test case data.",
          variant: "destructive",
        });
        return;
      }

      await exportToJira(detailedTestCase, toast);
    } catch (error) {
      console.error("Error exporting to Jira:", error);
      toast({
        title: "Export failed",
        description: "Failed to export test cases to Jira.",
        variant: "destructive",
      });
    } finally {
      setExportingToJira(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Unknown";
    }
  };

  const formatJoinDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      });
    } catch {
      return "Recently";
    }
  };

  const getTestCaseStatus = (testCase: TestCase) => {
    return "Completed";
  };

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

  if (!userInfo) {
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Profile Not Found</h1>
          <p className="text-muted-foreground">
            Unable to load your profile information.
          </p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Profile</h1>
        <p className="text-xl text-muted-foreground">
          Manage your account and view your testing history
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="text-center">
              <Avatar className="w-24 h-24 mx-auto mb-4">
                <AvatarImage src={userInfo.avatar} />
                <AvatarFallback className="text-2xl">
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
                <Mail className="h-4 w-4" />
                <span className="truncate">{userInfo.email}</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <Calendar className="h-4 w-4" />
                <span>Joined {formatJoinDate(userInfo.createdAt)}</span>
              </div>
              <div className="pt-4 border-t">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-primary">
                      {loadingTestCases
                        ? "..."
                        : testCases.reduce(
                            (sum, tc) => sum + tc.testCasesCount,
                            0
                          )}
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

        <div className="md:col-span-2">
          <Card>
            <Tabs defaultValue="details" className="w-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Account Details</CardTitle>
                    <CardDescription>
                      View and edit your profile
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      isEditing ? handleSave() : setIsEditing(true)
                    }
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
                <TabsList>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="projects">
                    Test Cases ({loadingTestCases ? "..." : testCases.length})
                  </TabsTrigger>
                </TabsList>
              </CardHeader>

              <TabsContent value="details">
                <CardContent>
                  <form id="profile-form" className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        name="name"
                        defaultValue={userInfo.name}
                        disabled={!isEditing}
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
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Member Since</Label>
                      <Input
                        value={formatJoinDate(userInfo.createdAt)}
                        disabled
                      />
                    </div>
                    <div className="pt-4 border-t">
                      <Button
                        variant="default"
                        className="w-full"
                        onClick={CallJiraConnect}
                        type="button"
                      >
                        <Building className="h-4 w-4 mr-2" />
                        Connect to Jira
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </TabsContent>

              <TabsContent value="projects">
                <CardContent>
                  {loadingTestCases ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : testCases.length === 0 ? (
                    <div className="text-center py-8 space-y-4">
                      <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
                      <div>
                        <h3 className="font-semibold">No test cases found</h3>
                        <p className="text-sm text-muted-foreground">
                          You haven't generated any test cases yet.
                        </p>
                        <Button
                          variant="outline"
                          className="mt-4"
                          onClick={() => navigate("/upload")}
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
                          className="p-4 rounded-lg border hover:border-primary/50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="space-y-1 flex-1">
                              <h3 className="font-semibold text-sm">
                                {testCase.title}
                              </h3>
                              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                <span>{formatDate(testCase.generatedAt)}</span>
                                <span>
                                  {testCase.testCasesCount} test cases
                                </span>
                              </div>
                              {testCase.summary?.complianceStandardsCovered
                                ?.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {testCase.summary.complianceStandardsCovered
                                    .slice(0, 3)
                                    .map((standard) => (
                                      <Badge
                                        key={standard}
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        {standard}
                                      </Badge>
                                    ))}
                                  {testCase.summary.complianceStandardsCovered
                                    .length > 3 && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      +
                                      {testCase.summary
                                        .complianceStandardsCovered.length -
                                        3}{" "}
                                      more
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
                                onClick={() => passDetails(testCase.docId)}
                                title="Chat with AI Assistant"
                              >
                                <Bot className="h-4 w-4 text-blue-500" />
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

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Test Case Details</DialogTitle>
            <DialogDescription>
              {selectedTestCase && (
                <>
                  Generated on{" "}
                  {new Date(
                    selectedTestCase.metadata.generatedAt
                  ).toLocaleDateString()}{" "}
                  •{selectedTestCase.summary.totalTestCases} test cases •
                  Created by{" "}
                  {selectedTestCase.metadata.userName ||
                    selectedTestCase.metadata.createdBy}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[70vh] w-full pr-4">
            {loadingDetails ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                  <p className="text-muted-foreground">
                    Loading test case details...
                  </p>
                </div>
              </div>
            ) : selectedTestCase ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Total Test Cases</Label>
                        <p className="text-2xl font-bold text-primary">
                          {selectedTestCase.summary.totalTestCases}
                        </p>
                      </div>
                      <div>
                        <Label>Requirements Length</Label>
                        <p className="text-lg">
                          {selectedTestCase.metadata.requirementsLength}{" "}
                          characters
                        </p>
                      </div>
                    </div>

                    {Object.keys(
                      selectedTestCase.summary.categoriesBreakdown || {}
                    ).length > 0 && (
                      <div>
                        <Label>Categories Breakdown</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {Object.entries(
                            selectedTestCase.summary.categoriesBreakdown
                          ).map(([category, count]) => (
                            <Badge key={category} variant="secondary">
                              {category}: {count}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {Object.keys(
                      selectedTestCase.summary.priorityBreakdown || {}
                    ).length > 0 && (
                      <div>
                        <Label>Priority Breakdown</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {Object.entries(
                            selectedTestCase.summary.priorityBreakdown
                          ).map(([priority, count]) => (
                            <Badge key={priority} variant="outline">
                              {priority}: {count}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedTestCase.summary.complianceStandardsCovered
                      ?.length > 0 && (
                      <div>
                        <Label>Compliance Standards</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedTestCase.summary.complianceStandardsCovered.map(
                            (standard) => (
                              <Badge key={standard} variant="default">
                                {standard}
                              </Badge>
                            )
                          )}
                        </div>
                      </div>
                    )}

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

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Test Cases</h3>
                  {selectedTestCase.testCases?.map((testCase, index) => (
                    <Card key={testCase.id || index}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">
                            {testCase.title}
                          </CardTitle>
                          <div className="flex gap-2">
                            <Badge variant="outline">{testCase.category}</Badge>
                            <Badge
                              variant={
                                testCase.priority === "High"
                                  ? "destructive"
                                  : testCase.priority === "Medium"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {testCase.priority}
                            </Badge>
                            <Badge variant="outline">
                              {testCase.riskLevel}
                            </Badge>
                          </div>
                        </div>
                        <CardDescription>
                          {testCase.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Test Case ID</Label>
                            <p className="text-sm">{testCase.id}</p>
                          </div>
                          <div>
                            <Label>Estimated Duration</Label>
                            <p className="text-sm">
                              {testCase.estimatedDuration}
                            </p>
                          </div>
                          <div>
                            <Label>Automation Potential</Label>
                            <p className="text-sm">
                              {testCase.automationPotential}
                            </p>
                          </div>
                          <div>
                            <Label>Requirement ID</Label>
                            <p className="text-sm">{testCase.requirementId}</p>
                          </div>
                        </div>

                        {testCase.complianceStandards?.length > 0 && (
                          <div>
                            <Label>Compliance Standards</Label>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {testCase.complianceStandards.map((standard) => (
                                <Badge
                                  key={standard}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {standard}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {testCase.preconditions?.length > 0 && (
                          <div>
                            <Label>Preconditions</Label>
                            <ul className="list-disc list-inside text-sm mt-1 space-y-1">
                              {testCase.preconditions.map(
                                (precondition, idx) => (
                                  <li key={idx}>{precondition}</li>
                                )
                              )}
                            </ul>
                          </div>
                        )}

                        {testCase.testSteps?.length > 0 && (
                          <div>
                            <Label>Test Steps</Label>
                            <div className="space-y-2 mt-2">
                              {testCase.testSteps.map((step, stepIdx) => (
                                <div
                                  key={stepIdx}
                                  className="border rounded-lg p-3"
                                >
                                  <div className="flex items-start gap-2">
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      Step {step.stepNumber}
                                    </Badge>
                                  </div>
                                  <div className="mt-2 space-y-1">
                                    <div>
                                      <Label className="text-xs">Action:</Label>
                                      <p className="text-sm">{step.action}</p>
                                    </div>
                                    <div>
                                      <Label className="text-xs">
                                        Expected Result:
                                      </Label>
                                      <p className="text-sm">
                                        {step.expectedResult}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {testCase.expectedResults && (
                          <div>
                            <Label>Overall Expected Results</Label>
                            <p className="text-sm mt-1">
                              {testCase.expectedResults}
                            </p>
                          </div>
                        )}

                        {testCase.testData &&
                          (testCase.testData.inputs ||
                            testCase.testData.outputs) && (
                            <div>
                              <Label>Test Data</Label>
                              <div className="mt-2 space-y-2">
                                {testCase.testData.inputs && (
                                  <div>
                                    <Label className="text-xs">Inputs:</Label>
                                    <p className="text-sm bg-muted/50 p-2 rounded">
                                      {testCase.testData.inputs}
                                    </p>
                                  </div>
                                )}
                                {testCase.testData.outputs && (
                                  <div>
                                    <Label className="text-xs">
                                      Expected Outputs:
                                    </Label>
                                    <p className="text-sm bg-muted/50 p-2 rounded">
                                      {testCase.testData.outputs}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                        {testCase.traceabilityLink && (
                          <div>
                            <Label>Traceability Link</Label>
                            <p className="text-sm mt-1">
                              {testCase.traceabilityLink}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No test case data available
                </p>
              </div>
            )}
          </ScrollArea>

          {selectedTestCase && !loadingDetails && (
            <div className="flex justify-between items-center gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Close
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    const testCase = testCases.find(
                      (tc) => tc.docId === selectedTestCase.id
                    );
                    if (testCase) {
                      downloadTestCase(testCase);
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Excel
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const testCase = testCases.find(
                      (tc) => tc.docId === selectedTestCase.id
                    );
                    if (testCase) {
                      downloadTestCaseAsXML(testCase);
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <FileCode className="h-4 w-4" />
                  XML
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const testCase = testCases.find(
                      (tc) => tc.docId === selectedTestCase.id
                    );
                    if (testCase) {
                      downloadTestCaseAsPDF(testCase);
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <FileType className="h-4 w-4" />
                  PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const testCase = testCases.find(
                      (tc) => tc.docId === selectedTestCase.id
                    );
                    if (testCase) {
                      handleExportToJira(testCase);
                    }
                  }}
                  title="Export to Jira"
                  disabled={exportingToJira}
                  className="flex items-center gap-2"
                >
                  {exportingToJira ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Building className="h-4 w-4" />
                  )}
                  Export to Jira
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
