import { collection, getDocs, doc, getDoc, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface TestCase {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  requirementId: string;
  traceabilityLink: string;
  preconditions: string[];
  testSteps: Array<{
    stepNumber: number;
    action: string;
    expectedResult: string;
  }>;
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

export interface TestCaseDocument {
  testCases: TestCase[];
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
    processingTime: number;
    version: string;
    userId?: string;
    originalRequirements: string;
  };
  firebaseDocId?: string;
}

// Generate test cases via backend API
export const generateTestCases = async (requirements: string, userId?: string): Promise<TestCaseDocument> => {
  const response = await fetch('/api/generate-test', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requirements, userId }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate test cases');
  }

  return response.json();
};

// Get test cases for a specific user
export const getUserTestCases = async (userId: string, limitCount = 10): Promise<TestCaseDocument[]> => {
  const response = await fetch(`/api/test-cases/${userId}?limit=${limitCount}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch test cases');
  }

  const data = await response.json();
  return data.testCases;
};

// Get a specific test case by ID
export const getTestCaseById = async (docId: string): Promise<TestCaseDocument> => {
  const response = await fetch(`/api/test-case/${docId}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch test case');
  }

  return response.json();
};

// Delete a test case
export const deleteTestCase = async (docId: string, userId?: string): Promise<void> => {
  const response = await fetch(`/api/test-case/${docId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId }),
  });

  if (!response.ok) {
    throw new Error('Failed to delete test case');
  }
};

// Get test cases directly from Firestore (alternative method)
export const getTestCasesFromFirestore = async (userId?: string): Promise<TestCaseDocument[]> => {
  try {
    let q = query(
      collection(db, 'testCases'),
      orderBy('metadata.generatedAt', 'desc'),
      limit(10)
    );

    if (userId) {
      q = query(
        collection(db, 'testCases'),
        where('metadata.userId', '==', userId),
        orderBy('metadata.generatedAt', 'desc'),
        limit(10)
      );
    }

    const querySnapshot = await getDocs(q);
    const testCases: TestCaseDocument[] = [];

    querySnapshot.forEach((doc) => {
      testCases.push({
        ...doc.data() as TestCaseDocument,
        firebaseDocId: doc.id,
      });
    });

    return testCases;
  } catch (error) {
    console.error('Error fetching from Firestore:', error);
    throw error;
  }
};

/*

	rule for production
	
	rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /testCases/{document} {
      allow read, write: if request.auth != null && 
        (resource == null || resource.data.metadata.userId == request.auth.uid);
    }
  }
}
*/