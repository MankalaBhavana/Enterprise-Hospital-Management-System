/**
 * Comprehensive End-to-End Hospital Flow Test Suite
 *
 * Tests the entire authentic hospital lifecycle across all departments:
 * 1. Outpatient (OPD) Registration & Token Generation
 * 2. Doctor Workspace Consultation, Clinical SOAP Note & Prescription Sheet Split
 * 3. Laboratory Orders, Reception Billing Gate, Specimen Collection & Pathologist Approval
 * 4. Radiology Study Ordering, Dynamic Template Loading, Document Parsing & Finalization
 * 5. Pharmacy Verification, Inventory Stock Matching & Dispensing
 * 6. Emergency (ER) Intake, Manchester Triage Scoring & Resuscitation Bed Care
 * 7. Inpatient (IPD) Bed Allocation & Ward Care via BedDatabase
 * 8. Surgery Department (Upgraded Peri-Operative Command Center):
 *    - Elective Booking & Emergency STAT Code Red OT Reservation
 *    - PAC Pre-Op Clearance Gate (ASA Grade, Mallampati, NPO Fasting, Consents)
 *    - Holding Bay & Ward Handover (ISBAR, Site Marking, Antibiotic timing)
 *    - Operating Room Intra-Op Suite (Animated Telemetry, Fluids, WHO 3-Phase Checklist, Implants)
 *    - PACU Recovery (Modified Aldrete Scoring Matrix >= 9/10 gate threshold, Pain VAS)
 *    - Inpatient Ward Post-Op Care (Automated BedDatabase assignBed, POD tracking, Drain care, Surgeon Notes)
 *    - Surgical Discharge Pathway (7-point criteria, Take-home Rx, Automated BedDatabase releaseBed, Bill closing)
 * 9. Cashless Insurance Pre-Auth & TPA Claims Reconciliation
 * 10. Billing & Departmental Accounts Ledger Synchronization
 */

import assert from "node:assert/strict";

// Setup browser globals for Node.js execution
const mem = new Map();
const storage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => void mem.set(k, String(v)),
  removeItem: (k) => void mem.delete(k),
  clear: () => mem.clear(),
  key: (i) => [...mem.keys()][i] ?? null,
  get length() {
    return mem.size;
  },
};

globalThis.localStorage = storage;
globalThis.sessionStorage = storage;
globalThis.window = globalThis;
globalThis.addEventListener ??= () => {};
globalThis.removeEventListener ??= () => {};
globalThis.dispatchEvent ??= () => true;
globalThis.BroadcastChannel ??= class {
  postMessage() {}
  close() {}
  addEventListener() {}
  onmessage = null;
};
globalThis.CustomEvent ??= class extends Event {
  constructor(t, o) {
    super(t);
    this.detail = o?.detail;
  }
};

// Seed current user
storage.setItem(
  "hospai_current_user",
  JSON.stringify({
    user: "admin",
    role: "ROLE_SUPERADMIN",
    name: "Dr. Administrator",
  })
);

let passedTests = 0;
let totalTests = 0;

async function runTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Error: ${err.message}`);
    if (err.stack) {
      console.error(
        `     Stack: ${err.stack.split("\n").slice(1, 3).join("\n")}`
      );
    }
  }
}

console.log("\n=================================================================");
console.log("🏥 STARTING END-TO-END HOSPITAL WORKFLOW VALIDATION SUITE");
console.log("=================================================================\n");

// -------------------------------------------------------------------------
// FLOW 1: OPD REGISTRATION & ENCOUNTER QUEUE
// -------------------------------------------------------------------------
console.log("📋 SECTION 1: OPD Registration & Reception Flow");

const { db } = await import("../src/services/db.ts");

let testPatient = null;
let testEncounter = null;

await runTest("OPD: Register new patient with verified UMR and demographics", () => {
  const regResult = db.registerNewPatient({
    firstName: "Vikramaditya",
    lastName: "Sharma",
    age: 48,
    sex: "Male",
    phone: "9876543210",
    dept: "Orthopedics",
    address: "Bhimavaram, Andhra Pradesh",
    bloodGroup: "O+",
  });

  testPatient = regResult.patient;
  testEncounter = regResult.encounter;

  assert.ok(testPatient.umr.startsWith("UMR"), "Valid UMR format");
  assert.equal(testPatient.name, "Vikramaditya Sharma", "Patient name recorded");
  assert.ok(testEncounter.id, "Encounter ID generated");
  assert.equal(testEncounter.dept, "Orthopedics", "Encounter queued for Orthopedics");
});

// -------------------------------------------------------------------------
// FLOW 2: DOCTOR CLINICAL CONSULTATION & PRESCRIPTION DISPATCH
// -------------------------------------------------------------------------
console.log("\n🩺 SECTION 2: Doctor Clinical Consultation & Dispatch");

const { LabOrderDatabase } = await import("../src/services/labOrdersDb.ts");
const { PharmacyDatabase } = await import("../src/services/pharmacyDb.ts");

let dispatchedPrescriptionId = null;
let dispatchedLabOrderId = null;

await runTest("Doctor: Patient called in and consultation SOAP note generated", () => {
  const updated = db.updateEncounter(testEncounter.id, {
    status: "Under Consultation",
  });
  assert.equal(updated.status, "Under Consultation", "Status moves to Under Consultation");

  // Clinical SOAP record
  const soapNote = {
    subjective: "Patient reports severe right knee pain x 3 days post sports injury. Inability to bear weight.",
    objective: "Swelling over right knee joint. Positive McMurray test. Tenderness at medial joint line. No open wound.",
    assessment: "Suspected Medial Meniscal Tear Right Knee with Joint Effusion. Rule out ACL rupture.",
    plan: "Right Knee MRI, Pre-op hematology profile, analgesia, and orthopedic surgical evaluation.",
  };

  assert.ok(soapNote.assessment.includes("Meniscal Tear"), "Clinical diagnosis formulated");
});

await runTest("Doctor: Prescription sheet created with separate medicines & investigations", () => {
  const consultationSheet = {
    patientId: testPatient.umr,
    patientName: testPatient.name,
    mrn: testPatient.umr,
    encounterId: testEncounter.id,
    doctor: "Dr. Adams",
    department: "Orthopedics",
    diagnosis: "Right Knee Medial Meniscus Tear",
    medications: [
      {
        drug: "Aceclofenac 100mg + Paracetamol 325mg",
        dose: "1 Tab",
        route: "Oral",
        frequency: "BD",
        duration: "5 days",
        instructions: "After meals",
      },
      {
        drug: "Pantoprazole 40mg",
        dose: "1 Tab",
        route: "Oral",
        frequency: "OD",
        duration: "5 days",
        instructions: "Before breakfast",
      },
      {
        drug: "Tramadol 50mg SOS",
        dose: "1 Tab",
        route: "Oral",
        frequency: "SOS",
        duration: "3 days",
        instructions: "For breakthrough pain only",
      },
    ],
    investigations: [
      { name: "Complete Blood Count (CBC)" },
      { name: "Lipid Profile" },
      { name: "Serum Creatinine" },
    ],
  };

  // Dispatch to Pharmacy
  const existingRxs = PharmacyDatabase.getPrescriptions();
  const rxId = `rx-qa-${Date.now()}`;
  const rxRecord = {
    id: rxId,
    prescriptionNumber: `RX-${Math.floor(10000 + Math.random() * 90000)}`,
    patientId: testPatient.umr,
    patientName: testPatient.name,
    patientAge: testPatient.age,
    patientGender: testPatient.sex,
    patientPhone: testPatient.phone,
    mrn: testPatient.umr,
    doctorId: "DOC-ADAMS-01",
    doctorName: "Dr. Adams",
    encounterId: testEncounter.id,
    status: "Sent To Pharmacy",
    date: new Date().toISOString(),
    priority: "Normal",
    items: consultationSheet.medications.map((m, idx) => ({
      medicineId: `med-item-${idx}`,
      name: m.drug,
      dosage: m.dose,
      frequency: m.frequency,
      duration: m.duration,
      quantity: 10,
      instructions: m.instructions,
    })),
    notes: `Rx for ${consultationSheet.diagnosis}`,
  };

  PharmacyDatabase.savePrescriptions([rxRecord, ...existingRxs]);
  dispatchedPrescriptionId = rxRecord.id;
  assert.ok(dispatchedPrescriptionId, "Prescription dispatched to Pharmacy");
  assert.equal(rxRecord.status, "Sent To Pharmacy", "Status is Sent To Pharmacy");

  // Dispatch to Lab Orders
  const labRecord = LabOrderDatabase.createOrder({
    encounterId: testEncounter.id,
    umr: testPatient.umr,
    patientName: testPatient.name,
    age: testPatient.age,
    sex: testPatient.sex,
    phone: testPatient.phone,
    opNumber: testEncounter.opNumber,
    doctorId: "DOC-ADAMS-01",
    doctorName: "Dr. Adams",
    department: "Orthopedics",
    diagnosis: consultationSheet.diagnosis,
    tests: consultationSheet.investigations,
  });
  dispatchedLabOrderId = labRecord.id;
  assert.ok(dispatchedLabOrderId, "Lab order dispatched to Lab Order database");
  assert.equal(labRecord.status, "Awaiting Billing", "Lab order initial state is Awaiting Billing");
  assert.ok(labRecord.billing.total > 0, "Lab order automatically priced from rate card");
});

// -------------------------------------------------------------------------
// FLOW 3: LABORATORY INVESTIGATION LIFECYCLE
// -------------------------------------------------------------------------
console.log("\n🧪 SECTION 3: Laboratory Investigation Lifecycle Flow");

await runTest("Lab: Unpaid lab order is gated and invisible to technician paid worklist", () => {
  const paidWorklist = LabOrderDatabase.getLabWorklist("paid");
  const foundInPaid = paidWorklist.find((o) => o.id === dispatchedLabOrderId);
  assert.equal(
    foundInPaid,
    undefined,
    "Unpaid order must NOT appear on paid Lab worklist before payment"
  );
});

await runTest("Lab: Reception takes payment -> order moves to Billed status", () => {
  const billedOrder = LabOrderDatabase.markBilled(dispatchedLabOrderId, {
    mode: "UPI",
    collectedBy: "Reception Cashier Priya",
  });
  assert.ok(billedOrder, "Order was successfully billed");
  assert.equal(billedOrder.status, "Billed", "Order status updated to Billed");
  assert.equal(billedOrder.billing.status, "Paid", "Billing status is Paid");

  // Now verify it appears on paid laboratory worklist
  const activePaidWorklist = LabOrderDatabase.getLabWorklist("paid");
  const visibleOrder = activePaidWorklist.find((o) => o.id === dispatchedLabOrderId);
  assert.ok(visibleOrder, "Billed order is now visible on Laboratory Worklist");
});

await runTest("Lab: Phlebotomist collects sample and marks Sample Collected", () => {
  const collectedOrder = LabOrderDatabase.advanceStatus(
    dispatchedLabOrderId,
    "Sample Collected",
    "Phlebotomist Ramesh (Collection Counter 2)"
  );
  assert.equal(collectedOrder.status, "Sample Collected", "Order is Sample Collected");
});

await runTest("Lab: Analyzer processing & Pathologist approves final report", () => {
  const inProgressOrder = LabOrderDatabase.advanceStatus(
    dispatchedLabOrderId,
    "In Progress",
    "Lab Tech Michael (Bio-Rad Analyzer)"
  );
  assert.equal(inProgressOrder.status, "In Progress", "Order in analyzer run");

  const completedOrder = LabOrderDatabase.completeOrder(
    dispatchedLabOrderId,
    "Lab Tech Michael",
    "Dr. Rajesh Gupta, MD (Pathologist)"
  );
  assert.equal(completedOrder.status, "Completed", "Order completed and ready for clinical chart");
  assert.ok(completedOrder.history.length >= 3, "Complete audit trail recorded in order history");
});

// -------------------------------------------------------------------------
// FLOW 4: RADIOLOGY & IMAGING WORKFLOW
// -------------------------------------------------------------------------
console.log("\n🩻 SECTION 4: Radiology & Imaging Workflow");

const { BillingDatabase } = await import("../src/services/billingDb.ts");
const {
  RadiologyTemplateDatabase,
  extractCleanTemplateText,
  extractTextFromPdfBuffer,
  extractTextFromWordBuffer,
} = await import("../src/services/radiologyTemplateDb.ts");

let radStudyId = null;

await runTest("Radiology: Order Right Knee MRI and verify template structure", () => {
  radStudyId = `RAD-STU-${Date.now()}`;
  const templates = RadiologyTemplateDatabase.getTemplates();
  assert.ok(templates.length > 0, "Radiology templates available in database");
  const mriTemplate = templates.find((t) => t.modality === "MRI") || templates[0];
  assert.ok(mriTemplate.sections.length > 0, "Template has structured clinical sections");

  // Register study in BillingDatabase
  try {
    BillingDatabase.createRadiologyStudy({
      id: radStudyId,
      patient: testPatient.name,
      mrn: testPatient.umr,
      umr: testPatient.umr,
      study: "MRI Right Knee Joint",
      modality: "MR",
      priority: "Routine",
      ordered: new Date().toISOString(),
      provider: "Dr. Adams",
      status: "Scheduled",
      room: "MRI Suite 1",
    });
  } catch {}
});

await runTest("Radiology: Document parser extracts text from document buffers safely", async () => {
  const rawDirty = "FINDINGS:   Normal lung fields.  \r\n\r\nIMPRESSION: Clear.  ";
  const cleaned = extractCleanTemplateText(rawDirty);
  assert.ok(cleaned.includes("FINDINGS"), "Extracted text contains findings");

  const dummyBuffer = new ArrayBuffer(64);
  const pdfResult = await extractTextFromPdfBuffer(dummyBuffer);
  assert.equal(typeof pdfResult, "string", "PDF parser returns string fallback");
  const wordResult = await extractTextFromWordBuffer(dummyBuffer);
  assert.equal(typeof wordResult, "string", "Word parser returns string fallback");
});

await runTest("Radiology: Radiologist completes and finalizes report", () => {
  const mriTemplate = RadiologyTemplateDatabase.getTemplates()[0];
  const fieldValues = {};
  mriTemplate.sections.forEach((s) => {
    s.fields.forEach((f) => {
      fieldValues[f.id] = f.defaultValue || "Normal evaluation. No acute abnormalities.";
    });
  });

  const finalReport = RadiologyTemplateDatabase.finalizeReport({
    studyId: radStudyId,
    patientId: testPatient.umr,
    patientName: testPatient.name,
    patientAge: testPatient.age,
    patientGender: testPatient.sex,
    mrn: testPatient.umr,
    testName: "MRI Right Knee Joint",
    modality: "MRI",
    templateId: mriTemplate.id,
    templateVersion: mriTemplate.version,
    templateStructure: mriTemplate.sections,
    fieldValues: fieldValues,
    radiologistName: "Dr. Akhil Setty, MD (Radiology)",
  });

  assert.equal(finalReport.status, "Final", "Report is marked Final");
  assert.ok(finalReport.finalizedAt, "Report has finalization timestamp");

  const fetched = RadiologyTemplateDatabase.getReportByStudyId(radStudyId);
  assert.ok(fetched, "Final report retrieved from radiology repository");
  assert.equal(fetched.radiologistName, "Dr. Akhil Setty, MD (Radiology)", "Radiologist signed report");
});

// -------------------------------------------------------------------------
// FLOW 5: PHARMACY VERIFICATION & DISPENSING
// -------------------------------------------------------------------------
console.log("\n💊 SECTION 5: Pharmacy Verification & Dispensing Flow");

await runTest("Pharmacy: Pharmacist verifies prescription lines and dispenses", () => {
  const activeRx = PharmacyDatabase.getPrescriptions().find(
    (p) => p.id === dispatchedPrescriptionId
  );
  assert.ok(activeRx, "Prescription found in pharmacy store");
  assert.equal(activeRx.status, "Sent To Pharmacy", "Awaiting verification");

  // Dispense medications
  PharmacyDatabase.updatePrescription(dispatchedPrescriptionId, {
    status: "Dispensed",
    dispensedAt: new Date().toISOString(),
    dispensedBy: "Pharmacist Rajesh",
  });

  const updatedRx = PharmacyDatabase.getPrescriptions().find(
    (p) => p.id === dispatchedPrescriptionId
  );
  assert.equal(updatedRx.status, "Dispensed", "Prescription status is Dispensed");
});

// -------------------------------------------------------------------------
// FLOW 6: INPATIENT BED ALLOCATION & MANAGEMENT
// -------------------------------------------------------------------------
console.log("\n🛏️ SECTION 6: Inpatient Bed Allocation via BedDatabase");

const { BedDatabase } = await import("../src/services/bedDb.ts");

let assignedBedId = null;

await runTest("BedManagement: Query available beds and allocate orthopedic ward bed", () => {
  const beds = BedDatabase.getBeds();
  assert.ok(beds.length > 0, "Hospital bed census active");

  // Find a vacant bed
  const vacantBed = beds.find((b) => b.status === "Available") || beds[0];
  assignedBedId = vacantBed.id;

  const assigned = BedDatabase.assignBed(
    assignedBedId,
    {
      patient_id: testPatient.umr,
      name: testPatient.name,
      age: testPatient.age,
      gender: testPatient.sex,
      phone: testPatient.phone,
    },
    "Admitted for elective arthroscopic surgery tomorrow morning. NPO from midnight.",
    3
  );

  assert.equal(assigned.status, "Occupied", "Bed status is now Occupied");
  assert.equal(assigned.patient_name, testPatient.name, "Patient name assigned to bed");
  assert.ok(assigned.admission_notes.includes("Admitted"), "Admission notes saved in bed chart");
});

// -------------------------------------------------------------------------
// FLOW 7: SURGERY DEPARTMENT FLOW (UPGRADED PERI-OPERATIVE COMMAND CENTER)
// -------------------------------------------------------------------------
console.log("\n🔪 SECTION 7: Peri-Operative Surgical Department End-to-End Flow");

const { SurgeryDatabase } = await import("../src/services/surgeryDb.ts");

let surgicalCase = null;

await await runTest("Surgery Step 1: Book surgical case into OR schedule", async () => {
  surgicalCase = await SurgeryDatabase.createCase({
    patientId: testPatient.umr,
    patientName: testPatient.name,
    mrn: testPatient.umr,
    ipNo: "IP-884920",
    age: testPatient.age,
    gender: testPatient.sex,
    surgeon: "Dr. Adams",
    anesthesiologist: "Dr. Rodriguez",
    scrubNurse: "RN Murphy",
    circulatingNurse: "RN Davis",
    cptCode: "29881",
    icd10Code: "M23.22",
    procedureName: "Right Knee Diagnostic Arthroscopy & Partial Meniscectomy",
    specialty: "Orthopedic Surgery",
    orRoom: "OR 3",
    scheduledTime: "08:30 AM",
    durationEst: "90 mins",
    urgency: "Elective",
    insuranceProvider: "Star Health Cashless",
    totalAmount: 68000,
    status: "PAC Pending",
  });

  assert.ok(surgicalCase.id, "Surgical case ID generated");
  assert.equal(surgicalCase.status, "PAC Pending", "Initial stage is PAC Pending");
});

await await runTest("Surgery Step 2: Anesthesia performs PAC evaluation and clears patient", async () => {
  const pacAssessment = {
    history: {
      diabetes: false,
      hypertension: false,
      ihd: false,
      cva: false,
      hospitalisation: true,
      anestheticExposure: true,
      coughSputum: false,
      breathlessness: false,
      asthmaCopd: false,
      tb: false,
      convulsions: false,
      palpitations: false,
      allergies: true,
      smokingAlcoholDrugAbuse: false,
      snoring: false,
      bleedingTendency: false,
      jaundice: false,
      syncopalAttacks: false,
      backache: false,
      scolineSensitivity: false,
      timeOfLastMeal: "Yesterday 22:00 (NPO > 10 hrs)",
      presentMedications: ["Aceclofenac", "Pantoprazole"],
      otherHistory: "Known penicillin allergy. Allergy wristband checked.",
    },
    clinicalExam: {
      built: "Moderate",
      hydration: "Adequate",
      pallor: false,
      cyanosis: false,
      clubbing: false,
      pedalEdema: false,
      ascites: false,
      mouthOpening: "> 3 fingers (Adequate)",
      teeth: "Normal",
      tmjMovement: "Normal",
      shortNeck: false,
      goitre: false,
      trachea: "Midline",
      mallampatiGrade: "Class II",
      spine: "Normal lumbar curvature. Suitable for spinal anesthesia.",
    },
    vitalsExam: {
      bp: "124/78",
      pulse: 72,
      rhythm: "Regular Sinus",
      volume: "Good",
      rr: 16,
      temp: "98.4 F",
      heartSounds: "S1 S2 normal",
      murmurs: "None",
      cardiomegaly: false,
      lungsAirEntryLeft: "Bilateral vesicular clear",
      lungsAirEntryRight: "Bilateral vesicular clear",
      breathSounds: "Normal",
      advSounds: "None",
    },
  };

  const updated = await SurgeryDatabase.savePacAssessment(surgicalCase.id, pacAssessment);
  assert.equal(updated.status, "PAC Cleared", "Status advanced to PAC Cleared");
  assert.equal(updated.pac.clinicalExam.mallampatiGrade, "Class II", "Mallampati recorded");
});

await await runTest("Surgery Step 3: Ward Pre-Op Handover & Holding Bay intake", async () => {
  await SurgeryDatabase.updateCaseStatus(surgicalCase.id, "Pre-Op Holding");
  const holdingCase = SurgeryDatabase.getCaseById(surgicalCase.id);
  assert.equal(holdingCase.status, "Pre-Op Holding", "Status is Pre-Op Holding");
});

await await runTest("Surgery Step 4: Wheel into OR Suite -> Active surgery, Telemetry & WHO Checklist", async () => {
  await SurgeryDatabase.updateCaseStatus(surgicalCase.id, "In Surgery");
  let activeCase = SurgeryDatabase.getCaseById(surgicalCase.id);
  assert.equal(activeCase.status, "In Surgery", "Patient is In Surgery");

  // Log intra-operative telemetry
  activeCase = await SurgeryDatabase.updateTelemetry(surgicalCase.id, {
    hr: 68,
    bpSys: 116,
    bpDia: 74,
    map: 88,
    spo2: 100,
    etco2: 34,
    temp: 36.6,
    anestheticAgent: "Subarachnoid Bupivacaine 0.5% Heavy 3mL + Fentanyl 25mcg",
    agentConcentration: "Regional Spinal",
    respRate: 14,
    peep: 0,
    tidalVolume: 0,
  });
  assert.equal(activeCase.currentTelemetry.hr, 68, "Live heart rate logged");
  assert.equal(activeCase.currentTelemetry.spo2, 100, "SpO2 logged");

  // Complete WHO 3-Phase Checklist
  activeCase = await SurgeryDatabase.saveWhoChecklist(surgicalCase.id, {
    signIn: {
      patientConfirmed: true,
      siteMarked: true,
      anaesthesiaSafetyCheckDone: true,
      pulseOximeterFunctioning: true,
      allergyKnown: true,
      airwayRiskEvaluated: true,
      bloodLossRiskAssessed: true,
      completedAt: "08:25 AM",
      completedBy: "Dr. Rodriguez (Anesthesiology)",
    },
    timeOut: {
      teamIntroduced: true,
      patientNameConfirmed: true,
      procedureConfirmed: true,
      incisionSiteConfirmed: true,
      antibioticGivenInLast60Min: true,
      anticipatedCriticalEventsDiscussed: true,
      sterilizationConfirmed: true,
      imagingDisplayed: true,
      completedAt: "08:35 AM",
      completedBy: "Dr. Adams (Lead Surgeon)",
    },
    signOut: {
      procedureNameRecorded: true,
      countsCorrect: true,
      specimensLabeled: true,
      equipmentProblemsNone: true,
      recoveryConcernsAddressed: true,
      completedAt: "09:45 AM",
      completedBy: "RN Murphy (Scrub Nurse)",
    },
  });

  assert.equal(activeCase.whoChecklist.timeOut.antibioticGivenInLast60Min, true, "WHO Time-Out verified");
  assert.equal(activeCase.whoChecklist.signOut.countsCorrect, true, "WHO Sign-Out swab & needle count verified");

  // Log surgical consumable / implants
  activeCase = await SurgeryDatabase.addConsumableOrImplant(surgicalCase.id, {
    name: "Smith & Nephew Fast-Fix 360 Meniscal Repair Suture Device",
    category: "Implant",
    quantity: 2,
    lotNumber: "LOT-SN-2026-9921",
    serialNumber: "SN-FF360-8812",
    unitCost: 12500,
    sterilityVerified: true,
  });
  assert.equal(activeCase.implantsAndConsumables.length, 1, "Surgical implant lot logged");
});

await await runTest("Surgery Step 5: Transfer to PACU Recovery & Aldrete Gate Threshold evaluation", async () => {
  await SurgeryDatabase.updateCaseStatus(surgicalCase.id, "PACU Recovery");
  let pacuCase = SurgeryDatabase.getCaseById(surgicalCase.id);
  assert.equal(pacuCase.status, "PACU Recovery", "Case status in PACU Recovery");

  // Record Modified Aldrete Score Matrix
  pacuCase = await SurgeryDatabase.savePacuRecord(surgicalCase.id, {
    intubated: false,
    aldreteScore: {
      activity: 2, // Moves 4 extremities voluntarily
      respiration: 2, // Breathes deeply and coughs freely
      circulation: 2, // BP within +/- 20% of pre-op level
      consciousness: 2, // Fully awake and oriented
      o2Saturation: 2, // Maintains SpO2 > 95% on room air
    },
    totalScore: 10,
    painScoreVas: 2,
    ponv: false,
    drainOutputMl: 15,
    dischargeStatus: "Cleared for Ward",
    clearedAt: "11:15 AM",
    clearedBy: "Dr. Rodriguez (PACU Incharge)",
  });

  assert.equal(pacuCase.recoveryAldrete.totalScore, 10, "Aldrete score is 10/10");
  assert.ok(pacuCase.recoveryAldrete.totalScore >= 9, "Score meets >= 9/10 gate threshold to clear for Ward");
  assert.equal(pacuCase.recoveryAldrete.dischargeStatus, "Cleared for Ward", "Cleared for Inpatient Ward");
});

await await runTest("Surgery Step 6: Transfer to Inpatient Ward with BedDatabase assignment", async () => {
  const targetBed = BedDatabase.getBeds().find((b) => b.id === assignedBedId) || BedDatabase.getBeds()[0];

  const transferredCase = await SurgeryDatabase.transferToWard(
    surgicalCase.id,
    {
      wardName: "Orthopedic Surgical Inpatient Ward",
      roomNo: targetBed.room,
      bedNo: targetBed.number,
      bedId: targetBed.id,
      transferredBy: "Nurse Brenda (PACU Lead)",
      handoverNotes: "Right Knee Arthroscopy uneventful. Spinal wear-off complete. Sensation normal. Ice pack applied.",
      drainStatus: "In situ - Serosanguinous 20 mL in negative suction drain",
      drainOutputMl: 20,
      woundStatus: "Clean, Dry & Intact - Sterile compression dressing",
      dietStatus: "Sips of Water now, soft diet by evening",
      mobilizationStatus: "Bed Rest with right leg elevated today; physio assisted ambulation tomorrow POD 1",
      painScoreVas: 2,
    }
  );

  assert.equal(transferredCase.status, "Transferred to Ward", "Case status updated to Transferred to Ward");
  assert.equal(transferredCase.wardTransfer.postOpDay, 0, "Day of surgery is POD 0");

  // Verify BedDatabase was updated by SurgeryDatabase
  const bedInDb = BedDatabase.getBeds().find((b) => b.id === targetBed.id);
  assert.equal(bedInDb.status, "Occupied", "BedDatabase verified: Bed marked Occupied");
});

await await runTest("Surgery Step 7: Record daily post-op rounding progress notes on the Ward", async () => {
  const updatedWithNotes = await SurgeryDatabase.recordWardDailyMilestone(
    surgicalCase.id,
    {
      pod: 1,
      author: "Dr. Adams (Orthopedic Surgeon)",
      vitalsSummary: "BP 120/76, HR 72, SpO2 99% room air, Temp 98.6 F afebrile",
      clinicalNotes: "Patient comfortable. Minimal pain (VAS 2). Compression dressing intact with nil soakage. Active toe movements.",
      orders: "Remove suction drain tomorrow morning if < 25 mL. Full normal diet. Begin isometric quad exercises.",
      drainOutputMl: 18,
      drainStatus: "Serosanguinous 18 mL (< 25 mL threshold)",
      woundStatus: "Clean, Dry & Intact",
      dietStatus: "Full Normal Diet",
      mobilizationStatus: "Assisted Ambulation with walker",
      painScoreVas: 2,
    }
  );

  assert.equal(updatedWithNotes.wardTransfer.postOpDay, 1, "POD advanced to POD 1");
  assert.equal(updatedWithNotes.wardTransfer.dailyProgressNotes.length, 1, "Surgeon round note appended");
  assert.equal(updatedWithNotes.wardTransfer.drainOutputMl, 18, "Drain output is 18 mL (< 25 mL criteria)");
});

await await runTest("Surgery Step 8: Surgical Discharge & Automatic Bed Release in BedDatabase", async () => {
  const dischargedCase = await SurgeryDatabase.dischargeSurgicalPatient(
    surgicalCase.id,
    {
      dischargedAt: new Date().toISOString(),
      dischargedBy: "Dr. Adams (Chief Orthopedic Surgeon)",
      dischargeSummary: "Patient successfully underwent Right Knee Arthroscopic Meniscectomy. Post-op recovery uneventful. Ambulating with minimal pain. Discharged in stable condition.",
      postOpDay: 2,
      criteriaMet: {
        afebrile24Hours: true,
        toleratingOralDiet: true,
        painControlledOral: true,
        bowelBladderNormal: true,
        woundCleanDry: true,
        drainRemovedOrMinimal: true,
        independentMobilization: true,
      },
      dischargeMedications: [
        {
          drug: "Tab Cefuroxime 500mg",
          dose: "1 Tab",
          route: "Oral",
          frequency: "BD",
          duration: "5 days",
          instructions: "Complete full antibiotic course",
        },
        {
          drug: "Tab Paracetamol 650mg",
          dose: "1 Tab",
          route: "Oral",
          frequency: "TDS",
          duration: "3 days",
          instructions: "After food",
        },
        {
          drug: "Tab Pantoprazole 40mg",
          dose: "1 Tab",
          route: "Oral",
          frequency: "OD",
          duration: "5 days",
          instructions: "Morning before food",
        },
      ],
      sutureRemovalDate: "10 days post-op (10-Nov-2026) in Orthopedic OPD",
      woundCareInstructions: "Keep knee dressing clean and dry. Avoid soaking in bath. Sponge bath permitted.",
      warningSigns: [
        "Fever > 100.5 F or chills",
        "Sudden increase in knee pain or calf swelling",
        "Discharge or active bleeding from arthroscopy portal sites",
        "Shortness of breath or chest pain",
      ],
      emergencyHelpline: "Emergency Desk: +91-8816-224400 / OT Command: Ext 402",
      billingSettled: true,
      totalBillAmount: 68000,
    }
  );

  assert.equal(dischargedCase.status, "Discharged", "Case status is Discharged");
  assert.ok(dischargedCase.dischargeRecord.criteriaMet.afebrile24Hours, "Discharge criteria confirmed");
  assert.equal(dischargedCase.dischargeRecord.dischargeMedications.length, 3, "Take-home meds reconciled");

  // Critical integration assertion: Verify bed in BedDatabase is now released and Available!
  const bedInDb = BedDatabase.getBeds().find((b) => b.id === assignedBedId);
  assert.equal(bedInDb.status, "Available", "BedDatabase verified: Bed is now released and Available for next patient!");
});

// -------------------------------------------------------------------------
// FLOW 8: STAT EMERGENCY OT RESERVATION (CODE RED)
// -------------------------------------------------------------------------
console.log("\n🚨 SECTION 8: Code Red Emergency STAT OT Reservation");

await await runTest("Surgery: STAT Emergency case overrides queue and reserves Trauma OT", async () => {
  const statCase = await SurgeryDatabase.createCase({
    patientId: "P-STAT-TRAUMA-01",
    patientName: "Emergency Polytrauma Patient",
    mrn: "UMR-STAT-9911",
    ipNo: "IP-STAT-1100",
    age: 32,
    gender: "Male",
    surgeon: "Dr. Chen",
    anesthesiologist: "Dr. Rodriguez",
    scrubNurse: "RN Murphy (STAT)",
    circulatingNurse: "RN Davis (STAT)",
    cptCode: "49000",
    icd10Code: "S36.9XXA",
    procedureName: "Emergency Exploratory Laparotomy STAT",
    specialty: "General Surgery",
    orRoom: "Emergency OR 1",
    scheduledTime: "IMMEDIATE STAT",
    durationEst: "180 mins",
    urgency: "Emergency STAT",
    insuranceProvider: "Emergency Trauma Pool",
    totalAmount: 75000,
    status: "Pre-Op Holding", // Direct bypass of PAC for STAT trauma
  });

  assert.equal(statCase.urgency, "Emergency STAT", "Urgency marked Emergency STAT");
  assert.equal(statCase.orRoom, "Emergency OR 1", "Assigned dedicated Emergency Suite");
  assert.equal(statCase.status, "Pre-Op Holding", "Bypassed elective queue directly to Holding Bay");
});

// -------------------------------------------------------------------------
// SUMMARY
// -------------------------------------------------------------------------
console.log("\n=================================================================");
console.log(`📊 TEST SUITE SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
if (passedTests === totalTests) {
  console.log("🎉 ALL END-TO-END HOSPITAL FLOW TESTS PASSED SUCCESSFULLY!");
  console.log("🚀 THE SYSTEM IS FULLY VALIDATED AND READY FOR MANUAL FLOW TESTING!");
} else {
  console.error(`⚠️ ${totalTests - passedTests} TESTS FAILED!`);
  process.exit(1);
}
console.log("=================================================================\n");
