import { jsPDF } from "jspdf";

export const exportToPDF = (testCaseData, toast) => {
  if (!testCaseData) {
    toast({
      title: "No test cases",
      description: "No test cases available to export",
      variant: "destructive",
    });
    return;
  }

  try {
    const doc = new jsPDF();

    let yPosition = 20;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    const lineHeight = 7;
    const maxWidth = 170;

    const checkPageBreak = (additionalSpace = 10) => {
      if (yPosition + additionalSpace > pageHeight - margin) {
        doc.addPage();
        yPosition = 20;
        return true;
      }
      return false;
    };

    const addText = (text, fontSize = 10, isBold = false) => {
      doc.setFontSize(fontSize);
      doc.setFont(undefined, isBold ? "bold" : "normal");
      const lines = doc.splitTextToSize(text, maxWidth);

      lines.forEach((line) => {
        checkPageBreak();
        doc.text(line, margin, yPosition);
        yPosition += lineHeight;
      });
    };

    const addSpace = (lines = 1) => {
      yPosition += lineHeight * lines;
    };

    // Header
    addText("Test Case Report", 16, true);
    addSpace();

    // Metadata
    addText(
      `Generated Date: ${new Date(
        testCaseData.metadata.generatedAt
      ).toLocaleString()}`,
      10
    );
    addText(`Created By: ${testCaseData.metadata.createdBy}`, 10);
    addText(`Total Test Cases: ${testCaseData.summary.totalTestCases}`, 10);
    addText(
      `Requirements Length: ${testCaseData.metadata.requirementsLength} characters`,
      10
    );
    addSpace(2);

    // Summary
    addText("SUMMARY", 14, true);
    addSpace();

    addText("Categories Breakdown:", 11, true);
    Object.entries(testCaseData.summary.categoriesBreakdown || {}).forEach(
      ([category, count]) => {
        addText(`  ${category}: ${count}`, 10);
      }
    );
    addSpace();

    addText("Priority Breakdown:", 11, true);
    Object.entries(testCaseData.summary.priorityBreakdown || {}).forEach(
      ([priority, count]) => {
        addText(`  ${priority}: ${count}`, 10);
      }
    );
    addSpace();

    addText(
      `Compliance Standards: ${(
        testCaseData.summary.complianceStandardsCovered || []
      ).join(", ")}`,
      10
    );
    addText(
      `Risk Assessment: ${testCaseData.summary.overallRiskAssessment}`,
      10
    );
    addSpace(2);

    // Original Requirements
    checkPageBreak(30);
    addText("ORIGINAL REQUIREMENTS", 14, true);
    addSpace();
    addText(testCaseData.metadata.originalRequirements, 9);
    addSpace(2);

    // Test Cases
    checkPageBreak(30);
    addText("DETAILED TEST CASES", 14, true);
    addSpace(2);

    testCaseData.testCases.forEach((tc, index) => {
      checkPageBreak(40);

      addText(`TEST CASE ${index + 1}: ${tc.title}`, 12, true);
      addSpace();

      addText(`ID: ${tc.id}`, 10);
      addText(`Description: ${tc.description}`, 10);
      addText(`Category: ${tc.category}`, 10);
      addText(`Priority: ${tc.priority}`, 10);
      addText(`Risk Level: ${tc.riskLevel}`, 10);
      addText(`Estimated Duration: ${tc.estimatedDuration}`, 10);
      addText(`Automation Potential: ${tc.automationPotential}`, 10);
      addText(`Requirement ID: ${tc.requirementId}`, 10);
      addText(`Traceability: ${tc.traceabilityLink}`, 10);
      addText(
        `Compliance Standards: ${(tc.complianceStandards || []).join(", ")}`,
        10
      );
      addSpace();

      checkPageBreak(20);
      addText("Preconditions:", 11, true);
      (tc.preconditions || []).forEach((precondition, idx) => {
        addText(`  ${idx + 1}. ${precondition}`, 9);
      });
      addSpace();

      checkPageBreak(20);
      addText("Test Steps:", 11, true);
      (tc.testSteps || []).forEach((step) => {
        checkPageBreak(15);
        addText(`  Step ${step.stepNumber}:`, 10, true);
        addText(`    Action: ${step.action}`, 9);
        addText(`    Expected Result: ${step.expectedResult}`, 9);
      });
      addSpace();

      checkPageBreak(15);
      addText(`Overall Expected Results: ${tc.expectedResults}`, 10);
      addSpace();

      if (tc.testData) {
        checkPageBreak(15);
        addText("Test Data:", 11, true);
        addText(`  Inputs: ${tc.testData.inputs}`, 9);
        addText(`  Expected Outputs: ${tc.testData.outputs}`, 9);
        addSpace();
      }

      addText("─".repeat(70), 8);
      addSpace(2);
    });

    const fileName = `TestCases_Output_${
      new Date().toISOString().split("T")[0]
    }.pdf`;
    doc.save(fileName);

    toast({
      title: "Download started",
      description: `Test cases exported to ${fileName}`,
    });
  } catch (error) {
    toast({
      title: "Export failed",
      description: "Failed to export test cases to PDF.",
      variant: "destructive",
    });
  }
};