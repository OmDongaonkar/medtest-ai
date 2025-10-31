export const exportToXML = (testCaseData, toast) => {
  if (!testCaseData) {
    toast({
      title: "No test cases",
      description: "No test cases available to export",
      variant: "destructive",
    });
    return;
  }

  try {
    const escapeXML = (str) => {
      if (!str) return "";
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
    };

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += "<TestCaseReport>\n";

    // Metadata
    xml += "  <Metadata>\n";
    xml += `    <GeneratedAt>${escapeXML(
      testCaseData.metadata.generatedAt
    )}</GeneratedAt>\n`;
    xml += `    <CreatedBy>${escapeXML(
      testCaseData.metadata.createdBy
    )}</CreatedBy>\n`;
    xml += `    <RequirementsLength>${escapeXML(
      testCaseData.metadata.requirementsLength
    )}</RequirementsLength>\n`;
    xml += `    <OriginalRequirements>${escapeXML(
      testCaseData.metadata.originalRequirements
    )}</OriginalRequirements>\n`;
    xml += "  </Metadata>\n\n";

    // Summary
    xml += "  <Summary>\n";
    xml += `    <TotalTestCases>${escapeXML(
      testCaseData.summary.totalTestCases
    )}</TotalTestCases>\n`;

    xml += "    <CategoriesBreakdown>\n";
    Object.entries(testCaseData.summary.categoriesBreakdown || {}).forEach(
      ([category, count]) => {
        xml += `      <Category name="${escapeXML(category)}">${escapeXML(
          count
        )}</Category>\n`;
      }
    );
    xml += "    </CategoriesBreakdown>\n";

    xml += "    <PriorityBreakdown>\n";
    Object.entries(testCaseData.summary.priorityBreakdown || {}).forEach(
      ([priority, count]) => {
        xml += `      <Priority level="${escapeXML(priority)}">${escapeXML(
          count
        )}</Priority>\n`;
      }
    );
    xml += "    </PriorityBreakdown>\n";

    xml += "    <ComplianceStandards>\n";
    (testCaseData.summary.complianceStandardsCovered || []).forEach(
      (standard) => {
        xml += `      <Standard>${escapeXML(standard)}</Standard>\n`;
      }
    );
    xml += "    </ComplianceStandards>\n";

    xml += `    <OverallRiskAssessment>${escapeXML(
      testCaseData.summary.overallRiskAssessment
    )}</OverallRiskAssessment>\n`;
    xml += "  </Summary>\n\n";

    // Test Cases
    xml += "  <TestCases>\n";
    testCaseData.testCases.forEach((tc) => {
      xml += "    <TestCase>\n";
      xml += `      <ID>${escapeXML(tc.id)}</ID>\n`;
      xml += `      <Title>${escapeXML(tc.title)}</Title>\n`;
      xml += `      <Description>${escapeXML(tc.description)}</Description>\n`;
      xml += `      <Category>${escapeXML(tc.category)}</Category>\n`;
      xml += `      <Priority>${escapeXML(tc.priority)}</Priority>\n`;
      xml += `      <RiskLevel>${escapeXML(tc.riskLevel)}</RiskLevel>\n`;
      xml += `      <EstimatedDuration>${escapeXML(
        tc.estimatedDuration
      )}</EstimatedDuration>\n`;
      xml += `      <AutomationPotential>${escapeXML(
        tc.automationPotential
      )}</AutomationPotential>\n`;
      xml += `      <RequirementID>${escapeXML(
        tc.requirementId
      )}</RequirementID>\n`;
      xml += `      <TraceabilityLink>${escapeXML(
        tc.traceabilityLink
      )}</TraceabilityLink>\n`;

      xml += "      <ComplianceStandards>\n";
      (tc.complianceStandards || []).forEach((standard) => {
        xml += `        <Standard>${escapeXML(standard)}</Standard>\n`;
      });
      xml += "      </ComplianceStandards>\n";

      xml += "      <Preconditions>\n";
      (tc.preconditions || []).forEach((precondition) => {
        xml += `        <Precondition>${escapeXML(
          precondition
        )}</Precondition>\n`;
      });
      xml += "      </Preconditions>\n";

      xml += "      <TestSteps>\n";
      (tc.testSteps || []).forEach((step) => {
        xml += `        <Step number="${escapeXML(step.stepNumber)}">\n`;
        xml += `          <Action>${escapeXML(step.action)}</Action>\n`;
        xml += `          <ExpectedResult>${escapeXML(
          step.expectedResult
        )}</ExpectedResult>\n`;
        xml += "        </Step>\n";
      });
      xml += "      </TestSteps>\n";

      xml += `      <ExpectedResults>${escapeXML(
        tc.expectedResults
      )}</ExpectedResults>\n`;

      if (tc.testData) {
        xml += "      <TestData>\n";
        xml += `        <Inputs>${escapeXML(tc.testData.inputs)}</Inputs>\n`;
        xml += `        <Outputs>${escapeXML(tc.testData.outputs)}</Outputs>\n`;
        xml += "      </TestData>\n";
      }

      xml += "    </TestCase>\n\n";
    });
    xml += "  </TestCases>\n";
    xml += "</TestCaseReport>";

    // Create and download XML file
    const blob = new Blob([xml], { type: "application/xml" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const fileName = `TestCases_Output_${
      new Date().toISOString().split("T")[0]
    }.xml`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Download started",
      description: `Test cases exported to ${fileName}`,
    });
  } catch (error) {
    toast({
      title: "Export failed",
      description: "Failed to export test cases to XML.",
      variant: "destructive",
    });
  }
};