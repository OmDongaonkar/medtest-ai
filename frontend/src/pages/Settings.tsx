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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings as SettingsIcon,
  Bell,
  Shield,
  Palette,
  ExternalLink,
  Key,
  Database,
  Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const navigate = useNavigate();
  const { login, isLoggedIn } = useAuth();

  // Redirect to /auth if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/auth", { replace: true });
    }
  }, [isLoggedIn, navigate]);

  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    testCompletion: true,
    weeklyReport: true,
  });

  const [jiraConnected, setJiraConnected] = useState(false);
  const { toast } = useToast();

  const handleSave = (section: string) => {
    toast({
      title: "Settings saved",
      description: `${section} settings have been updated successfully.`,
    });
  };

  const handleJiraIntegration = () => {
    if (jiraConnected) {
      setJiraConnected(false);
      toast({
        title: "JIRA Disconnected",
        description: "Your JIRA integration has been removed.",
      });
    } else {
      // Simulate connection
      setTimeout(() => {
        setJiraConnected(true);
        toast({
          title: "JIRA Connected",
          description: "Successfully connected to your JIRA instance.",
        });
      }, 2000);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-4 animate-fade-in">
        <h1 className="text-4xl font-bold text-foreground">Settings</h1>
        <p className="text-xl text-muted-foreground">
          Configure your account and platform preferences
        </p>
      </div>

      <Card className="glass-card animate-slide-up">
        <Tabs defaultValue="general" className="w-full">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <SettingsIcon className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>
                  Manage your account preferences and integrations
                </CardDescription>
              </div>
            </div>
            <TabsList className="glass-input mt-6">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="integrations">Integrations</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>
          </CardHeader>

          <TabsContent value="general">
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center space-x-2">
                  <Palette className="h-5 w-5 text-primary" />
                  <span>Appearance</span>
                </h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="theme">Theme</Label>
                    <Select defaultValue="system">
                      <SelectTrigger className="glass-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select defaultValue="en">
                      <SelectTrigger className="glass-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center space-x-2">
                  <Database className="h-5 w-5 text-primary" />
                  <span>Default Settings</span>
                </h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="export-format">Default Export Format</Label>
                    <Select defaultValue="pdf">
                      <SelectTrigger className="glass-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="excel">Excel</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="test-priority">Default Test Priority</Label>
                    <Select defaultValue="medium">
                      <SelectTrigger className="glass-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Button onClick={() => handleSave("General")}>
                Save Changes
              </Button>
            </CardContent>
          </TabsContent>

          <TabsContent value="notifications">
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center space-x-2">
                  <Bell className="h-5 w-5 text-primary" />
                  <span>Notification Preferences</span>
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border border-glass-border">
                    <div className="space-y-1">
                      <Label htmlFor="email-notifications">
                        Email Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Receive email updates about your test cases
                      </p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={notifications.email}
                      onCheckedChange={(checked) =>
                        setNotifications((prev) => ({
                          ...prev,
                          email: checked,
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg border border-glass-border">
                    <div className="space-y-1">
                      <Label htmlFor="push-notifications">
                        Push Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Receive browser push notifications
                      </p>
                    </div>
                    <Switch
                      id="push-notifications"
                      checked={notifications.push}
                      onCheckedChange={(checked) =>
                        setNotifications((prev) => ({ ...prev, push: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg border border-glass-border">
                    <div className="space-y-1">
                      <Label htmlFor="test-completion">
                        Test Completion Alerts
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when test case generation is complete
                      </p>
                    </div>
                    <Switch
                      id="test-completion"
                      checked={notifications.testCompletion}
                      onCheckedChange={(checked) =>
                        setNotifications((prev) => ({
                          ...prev,
                          testCompletion: checked,
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg border border-glass-border">
                    <div className="space-y-1">
                      <Label htmlFor="weekly-report">Weekly Reports</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive weekly summary of your testing activity
                      </p>
                    </div>
                    <Switch
                      id="weekly-report"
                      checked={notifications.weeklyReport}
                      onCheckedChange={(checked) =>
                        setNotifications((prev) => ({
                          ...prev,
                          weeklyReport: checked,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              <Button onClick={() => handleSave("Notifications")}>
                Save Preferences
              </Button>
            </CardContent>
          </TabsContent>

          <TabsContent value="integrations">
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center space-x-2">
                  <ExternalLink className="h-5 w-5 text-primary" />
                  <span>External Integrations</span>
                </h3>

                <div className="space-y-4">
                  {/* JIRA Integration */}
                  <div className="p-6 rounded-lg border border-glass-border space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                          <ExternalLink className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold">JIRA Integration</h4>
                          <p className="text-sm text-muted-foreground">
                            Export test cases directly to your JIRA instance
                          </p>
                        </div>
                      </div>
                      <Button
                        variant={jiraConnected ? "destructive" : "default"}
                        onClick={handleJiraIntegration}
                        disabled={!jiraConnected && notifications.push} // simulate loading
                      >
                        {jiraConnected ? "Disconnect" : "Connect"}
                      </Button>
                    </div>

                    {jiraConnected && (
                      <div className="space-y-3 pt-4 border-t border-glass-border">
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="jira-url">JIRA URL</Label>
                            <Input
                              id="jira-url"
                              placeholder="https://yourcompany.atlassian.net"
                              className="glass-input"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="jira-project">
                              Default Project Key
                            </Label>
                            <Input
                              id="jira-project"
                              placeholder="PROJECT"
                              className="glass-input"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* GitHub Integration */}
                  <div className="p-6 rounded-lg border border-glass-border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-500/10 flex items-center justify-center">
                          <ExternalLink className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold">GitHub Integration</h4>
                          <p className="text-sm text-muted-foreground">
                            Coming soon - Export test cases to GitHub Issues
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" disabled>
                        Coming Soon
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </TabsContent>

          <TabsContent value="security">
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <span>Security Settings</span>
                </h3>

                <div className="space-y-4">
                  <div className="p-4 rounded-lg border border-glass-border">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">Change Password</h4>
                        <p className="text-sm text-muted-foreground">
                          Update your account password
                        </p>
                      </div>
                      <Key className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="current-password">
                          Current Password
                        </Label>
                        <Input
                          id="current-password"
                          type="password"
                          className="glass-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input
                          id="new-password"
                          type="password"
                          className="glass-input"
                        />
                      </div>
                    </div>
                    <Button className="mt-3" variant="outline">
                      Update Password
                    </Button>
                  </div>

                  <div className="p-4 rounded-lg border border-destructive/20 bg-destructive/5">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-destructive">
                          Delete Account
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Permanently delete your account and all data
                        </p>
                      </div>
                      <Trash2 className="h-5 w-5 text-destructive" />
                    </div>
                    <Button variant="destructive" size="sm">
                      Delete Account
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Settings;
