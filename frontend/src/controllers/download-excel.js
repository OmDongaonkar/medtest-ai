import * as XLSX from "xlsx";

export const exportToExcel = (testCaseData, toast) => {
  if (!testCaseData) {
    toast({
      title: "No test cases",
      description: "No test cases available to export",
      variant: "destructive",
    });
    return;
  }

  try {
    const worksheetData = [];

    worksheetData.push(["Test Case Report"]);
    worksheetData.push([
      "Generated Date:",
      new Date(testCaseData.metadata.generatedAt).toLocaleString(),
    ]);
    worksheetData.push(["Created By:", testCaseData.metadata.createdBy]);
    worksheetData.push([
      "Total Test Cases:",
      testCaseData.summary.totalTestCases,
    ]);
    worksheetData.push([
      "Requirements Length:",
      testCaseData.metadata.requirementsLength + " characters",
    ]);
    worksheetData.push([]);

    worksheetData.push(["SUMMARY"]);
    worksheetData.push(["Categories Breakdown:"]);
    Object.entries(testCaseData.summary.categoriesBreakdown || {}).forEach(
      ([category, count]) => {
        worksheetData.push([`  ${category}:`, count]);
      }
    );
    worksheetData.push([]);

    worksheetData.push(["Priority Breakdown:"]);
    Object.entries(testCaseData.summary.priorityBreakdown || {}).forEach(
      ([priority, count]) => {
        worksheetData.push([`  ${priority}:`, count]);
      }
    );
    worksheetData.push([]);

    worksheetData.push([
      "Compliance Standards:",
      (testCaseData.summary.complianceStandardsCovered || []).join(", "),
    ]);
    worksheetData.push([
      "Risk Assessment:",
      testCaseData.summary.overallRiskAssessment,
    ]);
    worksheetData.push([]);

    worksheetData.push(["ORIGINAL REQUIREMENTS"]);
    worksheetData.push([testCaseData.metadata.originalRequirements]);
    worksheetData.push([]);

    worksheetData.push(["DETAILED TEST CASES"]);
    worksheetData.push([]);

    testCaseData.testCases.forEach((tc, index) => {
      worksheetData.push([`TEST CASE ${index + 1}: ${tc.title}`]);
      worksheetData.push(["ID:", tc.id]);
      worksheetData.push(["Description:", tc.description]);
      worksheetData.push(["Category:", tc.category]);
      worksheetData.push(["Priority:", tc.priority]);
      worksheetData.push(["Risk Level:", tc.riskLevel]);
      worksheetData.push(["Estimated Duration:", tc.estimatedDuration]);
      worksheetData.push(["Automation Potential:", tc.automationPotential]);
      worksheetData.push(["Requirement ID:", tc.requirementId]);
      worksheetData.push(["Traceability:", tc.traceabilityLink]);
      worksheetData.push([
        "Compliance Standards:",
        (tc.complianceStandards || []).join(", "),
      ]);
      worksheetData.push([]);

      worksheetData.push(["Preconditions:"]);
      (tc.preconditions || []).forEach((precondition, idx) => {
        worksheetData.push([`  ${idx + 1}. ${precondition}`]);
      });
      worksheetData.push([]);

      worksheetData.push(["Test Steps:"]);
      (tc.testSteps || []).forEach((step) => {
        worksheetData.push([`  Step ${step.stepNumber}:`]);
        worksheetData.push([`    Action: ${step.action}`]);
        worksheetData.push([`    Expected Result: ${step.expectedResult}`]);
      });
      worksheetData.push([]);

      worksheetData.push(["Overall Expected Results:", tc.expectedResults]);
      worksheetData.push([]);

      if (tc.testData) {
        worksheetData.push(["Test Data:"]);
        worksheetData.push(["  Inputs:", tc.testData.inputs]);
        worksheetData.push(["  Expected Outputs:", tc.testData.outputs]);
      }
      worksheetData.push([]);
      worksheetData.push(["=".repeat(50)]);
      worksheetData.push([]);
    });

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    const maxWidth = 100;
    worksheet["!cols"] = [{ wch: 25 }, { wch: maxWidth }];

    XLSX.utils.book_append_sheet(workbook, worksheet, "Test Cases");

    const fileName = `TestCases_Output_${
      new Date().toISOString().split("T")[0]
    }.xlsx`;

    XLSX.writeFile(workbook, fileName);

    toast({
      title: "Download started",
      description: `Test cases exported to ${fileName}`,
    });
  } catch (error) {
    toast({
      title: "Export failed",
      description: "Failed to export test cases to Excel.",
      variant: "destructive",
    });
  }
};