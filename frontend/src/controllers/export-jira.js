export const formatTestCaseForJira = (testCase) => {
  let description = `**Description:**\n${testCase.description}\n\n`;

  description += `**Category:** ${testCase.category}\n`;
  description += `**Priority:** ${testCase.priority}\n`;
  description += `**Risk Level:** ${testCase.riskLevel}\n`;
  description += `**Estimated Duration:** ${testCase.estimatedDuration}\n\n`;

  if (testCase.preconditions && testCase.preconditions.length > 0) {
    description += `**Preconditions:**\n`;
    testCase.preconditions.forEach((pre, idx) => {
      description += `${idx + 1}. ${pre}\n`;
    });
    description += `\n`;
  }

  description += `**Test Steps:**\n`;
  testCase.testSteps.forEach((step) => {
    description += `\n**Step ${step.stepNumber}:**\n`;
    description += `Action: ${step.action}\n`;
    description += `Expected Result: ${step.expectedResult}\n`;
  });

  description += `\n**Overall Expected Results:**\n${testCase.expectedResults}\n\n`;

  if (testCase.testData) {
    description += `**Test Data:**\n`;
    description += `Inputs: ${testCase.testData.inputs}\n`;
    description += `Expected Outputs: ${testCase.testData.outputs}\n\n`;
  }

  description += `**Compliance Standards:**\n${testCase.complianceStandards.join(
    ", "
  )}\n\n`;
  description += `**Requirement ID:** ${testCase.requirementId}\n`;
  description += `**Traceability:** ${testCase.traceabilityLink}\n`;
  description += `**Automation Potential:** ${testCase.automationPotential}`;

  return description;
};

export const exportToJira = async (testCaseData, toast) => {
  if (!testCaseData) {
    toast({
      title: "No test cases",
      description: "No test cases available to export",
      variant: "destructive",
    });
    return;
  }

  try {
    // Check Jira connection status
    const statusResponse = await fetch(
      `${import.meta.env.VITE_REQUEST_URL}/integrations/jira/status`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!statusResponse.ok) {
      const errorText = await statusResponse.text();

      toast({
        title: "Authentication required",
        description: "Please connect your Jira account first",
        variant: "destructive",
      });
      return;
    }

    const statusData = await statusResponse.json();

    if (!statusData.connected) {
      toast({
        title: "Jira not connected",
        description: "Please connect your Jira account to export test cases",
        variant: "destructive",
      });
      return;
    }

    // Fetch available projects
    const projectsResponse = await fetch(
      `${import.meta.env.VITE_REQUEST_URL}/integrations/jira/projects`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!projectsResponse.ok) {
      const errorText = await projectsResponse.text();
      throw new Error("Failed to fetch Jira projects");
    }

    const projectsData = await projectsResponse.json();

    if (!projectsData.projects || projectsData.projects.length === 0) {
      toast({
        title: "No projects found",
        description: "No Jira projects found in your account",
        variant: "destructive",
      });
      return;
    }

    // Use the first project or let user select
    const selectedProject = projectsData.projects[0];

    const testCases = testCaseData.testCases || [];

    toast({
      title: "Exporting to Jira",
      description: `Starting export of ${testCases.length} test cases to ${selectedProject.name}...`,
    });

    // Export each test case as a Jira issue
    let successCount = 0;
    let failCount = 0;

    for (const testCase of testCases) {
      try {
        // Format test case description for Jira
        const description = formatTestCaseForJira(testCase);

        const issueData = {
          projectKey: selectedProject.key,
          summary: `${testCase.id}: ${testCase.title}`,
          description: description,
          issueType: "Task",
        };

        const createResponse = await fetch(
          `${import.meta.env.VITE_REQUEST_URL}/integrations/jira/issue`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(issueData),
          }
        );

        if (createResponse.ok) {
          successCount++;
        } else {
          failCount++;
          const errorText = await createResponse.text();
        }

        // Add a small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        failCount++;
      }
    }

    // Show final result
    if (successCount > 0) {
      toast({
        title: "Export completed",
        description: `Successfully exported ${successCount} test case${
          successCount > 1 ? "s" : ""
        } to Jira${failCount > 0 ? `. ${failCount} failed.` : ""}`,
      });
    } else {
      toast({
        title: "Export failed",
        description: "No test cases were exported successfully",
        variant: "destructive",
      });
    }
  } catch (error) {
    toast({
      title: "Export failed",
      description:
        error instanceof Error
          ? error.message
          : "Failed to export test cases to Jira. Please try again.",
      variant: "destructive",
    });
  }
};