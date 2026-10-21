// Comprehensive Emergency Medicine & Resuscitation Question Bank (334 MCQs)
// Each quiz matches an uploaded file exactly by its name and question count.
// High-resolution image assets are attached for Emergency Radiology CT/X-ray and ALS ECG cases.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const EMERGENCY_QUIZ_TITLE = "Emergency Medicine & Resuscitation Question Bank (334 MCQs with Images)";

export const EMERGENCY_QUIZ_CATEGORIES = Object.freeze([
  {
    "id": "core",
    "nameAr": "امتحان الطوارئ والإنعاش الشامل",
    "nameEn": "Core Emergency Medicine Exam",
    "count": 50,
    "part": 1
  },
  {
    "id": "chest",
    "nameAr": "آلام الصدر واضطراب النبض (Chest Pain & Dysrhythmias)",
    "nameEn": "Chest Pain & Cardiac Dysrhythmias",
    "count": 45,
    "part": 2
  },
  {
    "id": "trauma",
    "nameAr": "إصابات الحوادث والتروما (Trauma)",
    "nameEn": "Trauma & Resuscitation",
    "count": 43,
    "part": 3
  },
  {
    "id": "shock",
    "nameAr": "أنواع الصدمات والإنعاش (Shock & Resuscitation)",
    "nameEn": "Shock & Resuscitation",
    "count": 27,
    "part": 4
  },
  {
    "id": "gi",
    "nameAr": "نزيف وطوارئ الجهاز الهضمي (Gastrointestinal Bleeding)",
    "nameEn": "Gastrointestinal Bleeding",
    "count": 17,
    "part": 5
  },
  {
    "id": "als",
    "nameAr": "الإنعاش المتقدم وتخطيط القلب (ALS & Resuscitation)",
    "nameEn": "ALS & Resuscitation (with ECG)",
    "count": 22,
    "part": 6
  },
  {
    "id": "radio",
    "nameAr": "أشعة وحالات الطوارئ (Emergency Radiology Cases)",
    "nameEn": "Emergency Radiology Cases (CT & X-Ray)",
    "count": 10,
    "part": 7
  },
  {
    "id": "bls_pretest",
    "nameAr": "اختبار وأساسيات الإنعاش (BLS Pretest & CPR)",
    "nameEn": "Basic Life Support Pretest & CPR Questions",
    "count": 34,
    "part": 8
  },
  {
    "id": "bls_bank",
    "nameAr": "بنك الإسعافات والإنعاش الشامل (First Aid & BLS Bank)",
    "nameEn": "Comprehensive CPR, First Aid & BLS Bank",
    "count": 86,
    "part": 9
  }
]);

export const EMERGENCY_QUIZ_PARTS = Object.freeze([
  {
    "id": 1,
    "name": "Core Emergency Medicine Exam",
    "nameAr": "امتحان الطوارئ والإنعاش الشامل",
    "range": "Q1 - Q50",
    "count": 50,
    "start": 1,
    "end": 50
  },
  {
    "id": 2,
    "name": "Chest Pain & Cardiac Dysrhythmias",
    "nameAr": "آلام الصدر واضطراب النبض",
    "range": "Q51 - Q95",
    "count": 45,
    "start": 51,
    "end": 95
  },
  {
    "id": 3,
    "name": "Trauma & Resuscitation",
    "nameAr": "إصابات الحوادث والتروما (Trauma)",
    "range": "Q96 - Q138",
    "count": 43,
    "start": 96,
    "end": 138
  },
  {
    "id": 4,
    "name": "Shock & Resuscitation",
    "nameAr": "أنواع الصدمات والإنعاش (Shock)",
    "range": "Q139 - Q165",
    "count": 27,
    "start": 139,
    "end": 165
  },
  {
    "id": 5,
    "name": "Gastrointestinal Bleeding",
    "nameAr": "نزيف وطوارئ الجهاز الهضمي (GI Bleeding)",
    "range": "Q166 - Q182",
    "count": 17,
    "start": 166,
    "end": 182
  },
  {
    "id": 6,
    "name": "ALS & Resuscitation (with ECG)",
    "nameAr": "الإنعاش المتقدم وتخطيط القلب (ALS)",
    "range": "Q183 - Q204",
    "count": 22,
    "start": 183,
    "end": 204
  },
  {
    "id": 7,
    "name": "Emergency Radiology Cases (CT & X-Ray)",
    "nameAr": "أشعة وحالات الطوارئ (Radiology)",
    "range": "Q205 - Q214",
    "count": 10,
    "start": 205,
    "end": 214
  },
  {
    "id": 8,
    "name": "Basic Life Support Pretest & CPR Questions",
    "nameAr": "اختبار وأساسيات الإنعاش (BLS Pretest)",
    "range": "Q215 - Q248",
    "count": 34,
    "start": 215,
    "end": 248
  },
  {
    "id": 9,
    "name": "Comprehensive CPR, First Aid & BLS Bank",
    "nameAr": "بنك الإسعافات والإنعاش الشامل (BLS Bank)",
    "range": "Q249 - Q334",
    "count": 86,
    "start": 249,
    "end": 334
  }
]);

export const EMERGENCY_QUIZ_ITEMS = Object.freeze([
  {
    "id": 1,
    "part": 1,
    "category": "Core Emergency Exam",
    "q": "The recommended maternal position during resuscitation is:",
    "options": [
      "Prone",
      "Supine without tilt",
      "Left lateral tilt 15-30",
      "Right lateral 10"
    ],
    "answer": 2,
    "explanation": "Left lateral tilt (15-30 degrees) relieves aortocaval compression by the gravid uterus, optimizing venous return and cardiac output during maternal CPR."
  },
  {
    "id": 2,
    "part": 1,
    "category": "Core Emergency Exam",
    "q": "Perimortem caesarean section should be initiated when no response to CPR after:",
    "options": [
      "1 minute",
      "2 minutes",
      "5 minutes",
      "10 minutes"
    ],
    "answer": 2,
    "explanation": "Perimortem cesarean section (resuscitative hysterotomy) should be initiated within 4 to 5 minutes of cardiac arrest in pregnant patients (>20 weeks gestation)."
  },
  {
    "id": 3,
    "part": 1,
    "category": "Core Emergency Exam",
    "q": "Which PaO2 value defines hypoxemia?",
    "options": [
      "PaO2 < 80 mmHg",
      "PaO2 < 60 mmHg",
      "PaO2 < 40 mmHg",
      "PaO2 < 100 mmHg"
    ],
    "answer": 1,
    "explanation": "PaO2 < 60 mmHg (corresponding to oxygen saturation < 90%) clinically defines hypoxemic respiratory failure."
  },
  {
    "id": 4,
    "part": 1,
    "category": "Core Emergency Exam",
    "q": "In the context of suspected cardiogenic pulmonary edema, which symptom combination is most characteristic?",
    "options": [
      "Chest pain, paroxysmal nocturnal dyspnea, orthopnea",
      "Productive cough with purulent sputum and fever",
      "Sudden unilateral chest pain with hemoptysis",
      "Gradual onset dyspnea with weight gain only"
    ],
    "answer": 0,
    "explanation": "Cardiogenic pulmonary edema typically presents with acute dyspnea, orthopnea, paroxysmal nocturnal dyspnea (PND), and elevated jugular venous pressure."
  },
  {
    "id": 5,
    "part": 1,
    "category": "Core Emergency Exam",
    "q": "What is the imaging test of choice to diagnose pulmonary embolism PE in a hemodynamically stable patient?",
    "options": [
      "V/Q scan",
      "CT pulmonary angiography (multidetector CT)",
      "Chest radiograph",
      "MRI pulmonary angiography"
    ],
    "answer": 1,
    "explanation": "CT Pulmonary Angiography (CTPA) is the primary first-line imaging modality of choice for pulmonary embolism in hemodynamically stable patients."
  },
  {
    "id": 6,
    "part": 1,
    "category": "Core Emergency Exam",
    "q": "Which treatment is used to dissolve clots in acute ischemic stroke?",
    "options": [
      "IV Heparin",
      "IV Alteplase (tPA)",
      "Warfarin",
      "Aspirin only"
    ],
    "answer": 1,
    "explanation": "Intravenous Alteplase (recombinant tPA) is the thrombolytic agent of choice administered within 3-4.5 hours of symptom onset to dissolve ischemic clots."
  },
  {
    "id": 7,
    "part": 1,
    "category": "Core Emergency Exam",
    "q": "During management of Diabetic Keto Acidosis (DKA) what is the continuous Insulin infusion rate?",
    "options": [
      "0.01 unit /kg/hr.",
      "0.05 unit /kg/hr.",
      "0.1 unit /kg/hr",
      "1 unit /kg/hr."
    ],
    "answer": 2,
    "explanation": "The standard continuous regular insulin infusion rate for DKA is 0.1 unit/kg/hour to steadily clear ketonemia while avoiding rapid osmolar shifts."
  },
  {
    "id": 8,
    "part": 1,
    "category": "Core Emergency Exam",
    "q": "Neurogenic shock commonly occurs with injury at which level of spinal cord?",
    "options": [
      "Lumbar spine",
      "Sacral spine",
      "Cervical or high thoracic levels",
      "Coccyx"
    ],
    "answer": 2,
    "explanation": "Neurogenic shock results from disruption of sympathetic pathways occurring with injuries at or above the T6 level (cervical and high thoracic spine)."
  },
  {
    "id": 9,
    "part": 1,
    "category": "Core Emergency Exam",
    "q": "What is the key of managing neurogenic shock?",
    "options": [
      "Avoid fluids",
      "Fluids + vasopressors when needed",
      "Beta-blockers",
      "Antibiotics"
    ],
    "answer": 1,
    "explanation": "Management focuses on IV fluid resuscitation to restore intravascular volume, followed by vasopressors (e.g. norepinephrine) to treat loss of vascular tone."
  },
  {
    "id": 10,
    "part": 1,
    "category": "Core Emergency Exam",
    "q": "A 4-years old child weight 20 Kg develops wheeze and hypotension after a bee sting. What is the correct IM adrenaline dose?",
    "options": [
      "0.1 mg (0.1 ml of 1:1000)",
      "0.2 mg (0.2 ml of 1:1000)",
      "0.5 mg (0.5 ml of 1:1000)",
      "1 mg (1 ml of 1:1000)"
    ],
    "answer": 1,
    "explanation": "Pediatric IM adrenaline (epinephrine 1:1000) dose is 0.01 mg/kg. For 20 kg: 20 x 0.01 = 0.2 mg (0.2 mL of 1:1000)."
  },
  {
    "id": 11,
    "part": 1,
    "category": "Core Emergency Exam",
    "q": "What is the first step in management of DKA/HHS?",
    "options": [
      "Start insulin",
      "Start antibiotics",
      "Fluid resuscitation",
      "Potassium infusion"
    ],
    "answer": 2,
    "explanation": "The essential initial step in DKA/HHS is aggressive isotonic fluid resuscitation to restore perfusion and intravascular volume before insulin administration."
  },
  {
    "id": 12,
    "part": 1,
    "category": "Core Emergency Exam",
    "q": "Anion gap is typically:",
    "options": [
      "High in DKA",
      "Normal in DKA",
      "Always high in HHS",
      "Always low in DKA"
    ],
    "answer": 0,
    "explanation": "DKA is characterized by a high anion gap metabolic acidosis (>12 mEq/L) due to circulating ketoacid anions."
  },
  {
    "id": 13,
    "part": 1,
    "category": "Core Emergency Exam",
    "q": "pH 7.50, Paco2 28, HCO3- 22. What is the acid base abnormality?",
    "options": [
      "Respiratory alkalosis",
      "Metabolic alkalosis",
      "Mixed alkalosis",
      "Normal"
    ],
    "answer": 0,
    "explanation": "High pH (>7.45) indicates alkalemia; low PaCO2 (<35 mmHg) indicates primary respiratory alkalosis due to alveolar hyperventilation."
  },
  {
    "id": 14,
    "part": 1,
    "category": "Core Emergency Exam",
    "q": "A 27-year-old male presents after an MVC with abdominal pain, BP 90/60, HR 120, guarding, and positive FAST for free fluid. What is the next step?",
    "options": [
      "CT scan of the abdomen with contrast",
      "Diagnostic peritoneal lavage",
      "Immediate exploratory laparotomy",
      "Observation with serial examinations"
    ],
    "answer": 2,
    "explanation": "A hemodynamically unstable trauma patient with a positive FAST scan for free intraperitoneal fluid requires immediate exploratory laparotomy in the OR."
  },
  {
    "id": 15,
    "part": 1,
    "category": "Core Emergency Exam",
    "q": "A 28-year-old male presents after head trauma (GCS 6, intubated). BP is 160/90, pulse is 50 bpm, irregular breathing. Likely condition?",
    "options": [
      "Hypovolemic shock",
      "Septic shock",
      "Raised intracranial pressure",
      "Brainstem infarction"
    ],
    "answer": 2,
    "explanation": "Hypertension, bradycardia, and irregular respirations (Cushing's triad) is a classic physiological sign of raised intracranial pressure (ICP) and impending herniation."
  },
  {
    "id": 16,
    "part": 1,
    "category": "Core Emergency Exam",
    "q": "A 32-year-old male is brought after an MVA with severe midline cervical tenderness. Conscious and stable. What is the immediate management?",
    "options": [
      "Remove cervical collar and examine range of motion",
      "Apply cervical immobilization and obtain CT cervical spine",
      "Send for MRI immediately",
      "Discharge with analgesics and follow-up"
    ],
    "answer": 1,
    "explanation": "Midline cervical spine tenderness after trauma mandates continuous rigid cervical collar immobilization and prompt CT imaging of the cervical spine."
  },
  {
    "id": 17,
    "part": 1,
    "category": "Core Emergency Exam",
    "q": "A 40-year-old male presents after a fall with hypotension (BP 80/50), bradycardia (HR 45), and paralysis below chest level. Initial management?",
    "options": [
      "Large-volume IV fluids only",
      "Blood transfusion",
      "Vasopressors and spinal immobilization",
      "Immediate laparotomy"
    ],
    "answer": 2,
    "explanation": "Neurogenic shock is characterized by hypotension with paradoxical bradycardia. Management requires spinal immobilization, cautious fluid repletion, and vasopressors."
  },
  {
    "id": 18,
    "part": 1,
    "category": "Core Emergency Exam",
    "q": "A 25-year-old male presents with acute ascending flaccid paralysis over 3 days and absent reflexes following a respiratory infection. Next step?",
    "options": [
      "Start intravenous corticosteroids",
      "Start intravenous immunoglobulins IVIG",
      "Give intravenous antibiotics",
      "Observe only"
    ],
    "answer": 1,
    "explanation": "Guillain-Barré syndrome (GBS) is treated with IVIG or plasmapheresis. Corticosteroids are ineffective in acute GBS."
  },
  {
    "id": 19,
    "part": 1,
    "category": "Core Emergency Exam",
    "q": "A 30-year-old male after an RTA: Eye opening to pain (2), Verbal response inappropriate words (3), Motor response withdraws (4). GCS score?",
    "options": [
      "GCS is 8",
      "GCS is 9",
      "GCS is 10",
      "GCS is 11"
    ],
    "answer": 1,
    "explanation": "GCS calculation: Eye (2) + Verbal (3) + Motor (4) = 9."
  },
  {
    "id": 20,
    "part": 1,
    "category": "Core Emergency Exam",
    "q": "According to classification of head trauma according to GCS, a score of 9 is classified as:",
    "options": [
      "Mild head trauma",
      "Moderate head trauma",
      "Severe head trauma",
      "No head trauma"
    ],
    "answer": 1,
    "explanation": "Head trauma severity by GCS: Mild (13-15), Moderate (9-12), Severe (3-8). A score of 9 indicates moderate head injury."
  },
  {
    "id": 21,
    "part": 1,
    "category": "Core Emergency Exam",
    "q": "What are the indications for emergent thoracotomy in massive hemothorax?",
    "options": [
      "More than 1500 cc first gush or 200 cc per hour for 4 hours",
      "More than 750 cc first gush or 100 cc per hour for 4 hours",
      "More than 2000 cc first gush or 100 cc per hour for 4 hours",
      "More than 1000 cc first gush or 150 cc per hour for 4 hours"
    ],
    "answer": 0,
    "explanation": "Immediate operative thoracotomy is indicated if initial chest tube output exceeds 1500 mL or persistent bleeding continues >200 mL/hr for 2 to 4 hours."
  },
  {
    "id": 22,
    "part": 1,
    "category": "Core Emergency Exam",
    "q": "A 38-year-old male patient was rescued from a pool with hypotension (BP 80/60) and pulse 50 bpm. What is your provisional diagnosis?",
    "options": [
      "Cardiogenic shock",
      "Cardiac tamponade",
      "Tension pneumothorax",
      "Neurogenic shock"
    ],
    "answer": 3,
    "explanation": "Diving accidents in pools frequently cause cervical spinal cord injury resulting in neurogenic shock (hypotension accompanied by bradycardia)."
  },
  {
    "id": 23,
    "part": 1,
    "category": "Core Emergency Exam",
    "q": "Which of the following is not part of 'the primary survey' in trauma patients?",
    "options": [
      "Airway assessment",
      "Breathing assessment",
      "Circulation assessment",
      "Digital rectal examination"
    ],
    "answer": 3,
    "explanation": "The primary survey strictly adheres to ABCDE. Digital rectal examination is an adjunct performed during the secondary survey."
  },
  {
    "id": 24,
    "part": 1,
    "category": "Core Emergency Exam",
    "q": "Which drug can be used in a patient on beta-blockers who is not responding to adrenaline?",
    "options": [
      "Atropine",
      "Glucagon",
      "Loratadine",
      "Ranitidine"
    ],
    "answer": 1,
    "explanation": "Glucagon activates myocardial adenylate cyclase directly via independent receptors, bypassing beta-adrenergic receptor blockade."
  },
  {
    "id": 25,
    "part": 1,
    "category": "Core Emergency Exam",
    "q": "Definitive airway management is achieved by:",
    "options": [
      "Laryngeal mask",
      "Endotracheal intubation",
      "Jaw-thrust maneuver",
      "Oropharyngeal airway"
    ],
    "answer": 1,
    "explanation": "A definitive airway is defined as a cuffed tube placed within the trachea, most commonly via endotracheal intubation."
  },
  {
    "id": 26,
    "part": 1,
    "category": "Core Emergency Exam",
    "q": "A 22-year-old man with kidney stones has pH 7.29, PCO2 32, HCO3 15, Na 138, K 3, Cl 110. What is the most likely acid-base disorder?",
    "options": [
      "Respiratory acidosis",
      "Respiratory alkalosis",
      "Metabolic acidosis",
      "Metabolic alkalosis"
    ],
    "answer": 2,
    "explanation": "Low pH (7.29) with low HCO3 (15 mEq/L) confirms metabolic acidosis with a normal anion gap (138 - (110 + 15) = 13), consistent with renal tubular acidosis."
  },
  {
    "id": 27,
    "part": 1,
    "category": "Core Emergency Exam",
    "q": "A 48-year-old presented with no signs of life. The defibrillator/monitor shows a flat line with no electrical activity. What is this rhythm?",
    "options": [
      "Regular ventricular tachycardia",
      "Irregular ventricular tachycardia",
      "Ventricular fibrillation",
      "Asystole"
    ],
    "answer": 3,
    "explanation": "A flat line without organized electrical activity or palpable pulse represents asystole."
  },
  {
    "id": 28,
    "part": 1,
    "category": "Core Emergency Exam",
    "q": "A 41-year-old male presents with palpitations, dyspnea, and BP 70/40. ECG shows rapid regular narrow-complex SVT. What is the immediate management?",
    "options": [
      "Adenosine 6 mg",
      "Synchronized D.C shock",
      "D.C shock",
      "Vagal maneuvers"
    ],
    "answer": 1,
    "explanation": "Any tachyarrhythmia with hemodynamic instability (severe hypotension, shock, altered mental status) requires immediate synchronized electrical cardioversion."
  },
  {
    "id": 29,
    "part": 1,
    "category": "Core Emergency Exam",
    "q": "A 55-year-old heavy smoker presents to the ED. ECG reveals ST elevation in leads II, III, and aVF. What is the diagnosis?",
    "options": [
      "Anterior MI",
      "Posterior MI",
      "Lateral MI",
      "Inferior MI"
    ],
    "answer": 3,
    "explanation": "ST segment elevation in inferior leads II, III, and aVF indicates an acute inferior wall myocardial infarction (usually RCA occlusion)."
  },
  {
    "id": 30,
    "part": 1,
    "category": "Core Emergency Exam",
    "q": "Which of the following is an established major risk factor for acute coronary syndrome?",
    "options": [
      "Low blood pressure",
      "High blood cholesterol",
      "Healthy diet",
      "Underweight"
    ],
    "answer": 1,
    "explanation": "High blood cholesterol (hypercholesterolemia / elevated LDL) is a proven major modifiable risk factor for coronary atherosclerosis and ACS."
  },
  {
    "id": 31,
    "part": 1,
    "category": "Core Emergency Exam",
    "q": "WHAT ARE THE CHARACTERISTICS of STEMI?",
    "options": [
      "ST segment elevation, elevated cardiac enzymes, and chest pain",
      "ST segment depression, elevated cardiac enzymes, and chest pain",
      "ST segment elevation, normal cardiac enzymes, and chest pain",
      "ST segment depression, normal cardiac enzymes, and chest pain"
    ],
    "answer": 0,
    "explanation": "STEMI is defined by ischemic chest discomfort, ST-segment elevation on 12-lead ECG, and subsequent elevation of cardiac biomarkers."
  },
  {
    "id": 32,
    "part": 1,
    "category": "Core Emergency Exam",
    "q": "In management of acute coronary syndrome, we use MONA. The 'N' letter stands for what?",
    "options": [
      "Nifedipine",
      "Naloxone",
      "Nicardipine",
      "Nitrates"
    ],
    "answer": 3,
    "explanation": "MONA = Morphine, Oxygen, Nitrates (nitroglycerin), and Aspirin."
  },
  {
    "id": 33,
    "part": 1,
    "category": "Core Emergency Exam",
    "q": "To open the airway in a trauma patient with spinal injury, we use the head-tilt chin-lift technique.",
    "options": [
      "True",
      "False"
    ],
    "answer": 1,
    "explanation": "False: In trauma patients with suspected cervical spine injury, the jaw-thrust maneuver without head extension must be used."
  },
  {
    "id": 34,
    "part": 1,
    "category": "Core Emergency Exam",
    "q": "A trauma patient arrives after a road traffic collision. According to the ABCDE approach, what should be assessed first?",
    "options": [
      "Disability",
      "Airway",
      "Exposure",
      "Circulation"
    ],
    "answer": 1,
    "explanation": "Airway with cervical spine protection is evaluated and secured first in trauma resuscitation."
  },
  {
    "id": 35,
    "part": 1,
    "category": "Core Emergency Exam",
    "q": "During the Breathing assessment, which observation indicates tension pneumothorax?",
    "options": [
      "Bilateral equal breath sounds",
      "Respiratory rate of 18/min",
      "Absent breath sounds on one side",
      "Oxygen saturation of 98%"
    ],
    "answer": 2,
    "explanation": "Unilateral absent breath sounds with severe respiratory distress, hypotension, and tracheal shift indicate tension pneumothorax."
  },
  {
    "id": 36,
    "part": 1,
    "category": "Core Emergency Exam",
    "q": "The AVPU scale is used to assess what?",
    "options": [
      "Respiratory function",
      "Circulation",
      "Mental status",
      "Exposure"
    ],
    "answer": 2,
    "explanation": "AVPU (Alert, Voice, Pain, Unresponsive) is a rapid scale to assess level of consciousness and mental status under Disability (D)."
  },
  {
    "id": 37,
    "part": 1,
    "category": "Core Emergency Exam",
    "q": "After ABCD assessment, the nurse removes the patient's clothing and notices a hidden penetrating wound in the back. Which principle is this?",
    "options": [
      "Disability",
      "Exposure",
      "Breathing",
      "Circulation"
    ],
    "answer": 1,
    "explanation": "'E' stands for Exposure / Environmental control: undressing the trauma patient completely to reveal all occult wounds while preventing hypothermia."
  },
  {
    "id": 38,
    "part": 1,
    "category": "Core Emergency Exam",
    "q": "A tension pneumothorax occurs when:",
    "options": [
      "Air enters the pleural space and escapes normally",
      "Blood fills the pleural cavity",
      "Air enters the pleural space but cannot escape",
      "The diaphragm ruptures"
    ],
    "answer": 2,
    "explanation": "A one-way valve effect allows air to enter the pleural space during inspiration but prevents its escape during expiration."
  },
  {
    "id": 39,
    "part": 1,
    "category": "Core Emergency Exam",
    "q": "The priority treatment for suspected tension pneumothorax is:",
    "options": [
      "Chest X-ray first",
      "Oxygen only",
      "Immediate needle decompression",
      "Antibiotics"
    ],
    "answer": 2,
    "explanation": "Tension pneumothorax is a clinical diagnosis requiring immediate needle decompression without waiting for radiographic confirmation."
  },
  {
    "id": 40,
    "part": 1,
    "category": "Core Emergency Exam",
    "q": "Which fluid should you give during resuscitation for hypovolemic shock?",
    "options": [
      "Oral fluids",
      "IV crystalloids",
      "Glucose tablets",
      "Diuretics"
    ],
    "answer": 1,
    "explanation": "Balanced isotonic IV crystalloids (Ringer's lactate or 0.9% normal saline) are the first-line resuscitation fluid in shock."
  },
  {
    "id": 41,
    "part": 1,
    "category": "Core Emergency Exam",
    "q": "Flail chest occurs in which condition?",
    "options": [
      "One rib fracture",
      "Two or more adjacent ribs fracture in two places",
      "Sternum fractures",
      "Clavicle fractures"
    ],
    "answer": 1,
    "explanation": "Flail chest occurs when two or more contiguous ribs are fractured in two or more places, resulting in paradoxical chest wall motion."
  },
  {
    "id": 42,
    "part": 1,
    "category": "Core Emergency Exam",
    "q": "A patient with chest trauma presents with hypotension, distended neck veins, muffled heart sounds, and tachycardia. What is the diagnosis?",
    "options": [
      "Massive hemothorax",
      "Cardiac tamponade",
      "Tension pneumothorax",
      "Pulmonary edema"
    ],
    "answer": 1,
    "explanation": "Hypotension, distended neck veins, and muffled heart sounds constitute Beck's triad, pathognomonic for acute cardiac tamponade."
  },
  {
    "id": 43,
    "part": 1,
    "category": "Core Emergency Exam",
    "q": "The normal arterial blood pH range is:",
    "options": [
      "6.8–7.0",
      "7.15–7.25",
      "7.35–7.45",
      "7.50–7.60"
    ],
    "answer": 2,
    "explanation": "Normal physiological arterial blood pH is tightly regulated between 7.35 and 7.45."
  },
  {
    "id": 44,
    "part": 1,
    "category": "Core Emergency Exam",
    "q": "An elevated PaCO2 (>45 mmHg) usually indicates:",
    "options": [
      "Respiratory acidosis",
      "Respiratory alkalosis",
      "Metabolic acidosis",
      "Metabolic alkalosis"
    ],
    "answer": 0,
    "explanation": "Hypercapnia (elevated PaCO2) indicates alveolar hypoventilation, resulting in respiratory acidosis."
  },
  {
    "id": 45,
    "part": 1,
    "category": "Core Emergency Exam",
    "q": "A patient is breathing rapidly due to severe anxiety. ABG: pH = 7.50, PaCO2 = 28 mmHg, HCO3- = 24 mEq/L. What is the diagnosis?",
    "options": [
      "Respiratory alkalosis",
      "Respiratory acidosis",
      "Metabolic acidosis",
      "Normal ABG"
    ],
    "answer": 0,
    "explanation": "Elevated pH with decreased PaCO2 and normal bicarbonate confirms acute primary respiratory alkalosis from hyperventilation."
  },
  {
    "id": 46,
    "part": 1,
    "category": "Core Emergency Exam",
    "q": "A patient in septic shock has: pH = 7.18, PaCO2 = 30 mmHg, HCO3- = 14 mEq/L. What is the most likely acid-base disorder?",
    "options": [
      "Respiratory acidosis",
      "Metabolic acidosis"
    ],
    "answer": 1,
    "explanation": "Low pH (7.18) with low bicarbonate (14 mEq/L) indicates metabolic acidosis (lactic acidosis from tissue hypoperfusion in sepsis)."
  },
  {
    "id": 47,
    "part": 1,
    "category": "Core Emergency Exam",
    "q": "A 65-year-old female presents with seizures and serum Na 110 mmol/L. What is your decision after seizure control?",
    "options": [
      "Water restriction",
      "Hypertonic saline",
      "Hypotonic saline",
      "Isotonic saline"
    ],
    "answer": 1,
    "explanation": "Severe symptomatic hyponatremia with neurological manifestations (seizures) is treated with 3% hypertonic saline."
  },
  {
    "id": 48,
    "part": 1,
    "category": "Core Emergency Exam",
    "q": "A 70-year-old patient suffers from syncope and chest pain. ECG shows HR 30 bpm. What is the correct initial dose of atropine?",
    "options": [
      "300 mcg iv",
      "400 mcg iv",
      "500 mcg iv",
      "600 mcg iv"
    ],
    "answer": 2,
    "explanation": "Standard ACLS initial dosing for symptomatic bradycardia is Atropine 0.5 mg (500 mcg) IV push."
  },
  {
    "id": 49,
    "part": 1,
    "category": "Core Emergency Exam",
    "q": "A 25-year-old pregnant woman develops eclamptic seizures. What is the drug of choice for her condition?",
    "options": [
      "Magnesium sulfate",
      "Atropine",
      "Insulin",
      "Calcium"
    ],
    "answer": 0,
    "explanation": "Magnesium sulfate is the definitive first-line anticonvulsant for the prevention and treatment of eclampsia in pregnancy."
  },
  {
    "id": 50,
    "part": 1,
    "category": "Core Emergency Exam",
    "q": "A 25-year-old male presents with pinpoint pupils and RR 6/min from opioid overdose. What is your initial drug for management?",
    "options": [
      "Naloxone",
      "Calcium",
      "Insulin",
      "Antibiotic"
    ],
    "answer": 0,
    "explanation": "Naloxone is the competitive opioid receptor antagonist used emergently to reverse severe opioid-induced respiratory depression."
  },
  {
    "id": 51,
    "part": 2,
    "category": "Chest Pain & Dysrhythmias",
    "q": "59M with chest pain radiating to left arm, HTN, hyperlipidemia, smoking. ECG shows T-wave inversions in lateral leads. What is the most appropriate next step in management?",
    "options": [
      "Give two sublingual nitroglycerin tablets and observe for pain resolution",
      "Place on cardiac monitor, administer oxygen, and give aspirin",
      "Call cardiac catheterization lab for immediate PCI",
      "Order chest x-ray; administer aspirin, clopidogrel, and heparin",
      "Start a beta-blocker immediately"
    ],
    "answer": 1,
    "explanation": "Initial management of suspected ACS: cardiac monitor, oxygen if hypoxic, and aspirin. PCI is not immediate for T-wave inversion without STEMI."
  },
  {
    "id": 52,
    "part": 2,
    "category": "Chest Pain & Dysrhythmias",
    "q": "36F with sudden left-sided chest pain, dyspnea worsened by deep breath, recent 7-hr flight, left calf swelling. What is the most common ECG finding in this condition?",
    "options": [
      "S1Q3T3 pattern",
      "Atrial fibrillation",
      "Right-axis deviation",
      "Right-atrial enlargement",
      "Tachycardia or nonspecific ST-T wave changes"
    ],
    "answer": 4,
    "explanation": "Most common ECG finding in pulmonary embolism is sinus tachycardia or nonspecific ST-T changes; S1Q3T3 is classic but less common."
  },
  {
    "id": 53,
    "part": 2,
    "category": "Chest Pain & Dysrhythmias",
    "q": "51M with HTN and intermittent palpitations for a week. HR 130, BP 130/75, stable. ECG shows atrial fibrillation with rapid ventricular response. What is the most appropriate next step?",
    "options": [
      "Sedate for immediate synchronized cardioversion with 100 Joules",
      "Prepare for cardiac catheterization laboratory",
      "Administer Coumadin",
      "Administer amiodarone",
      "Administer diltiazem"
    ],
    "answer": 4,
    "explanation": "For stable atrial fibrillation with rapid ventricular response, rate control with a calcium channel blocker such as diltiazem is first-line."
  },
  {
    "id": 54,
    "part": 2,
    "category": "Chest Pain & Dysrhythmias",
    "q": "54F with ESRD on dialysis, fatigue and confusion for 3 days. Alert and oriented to person only. ECG shows peaked T waves and widened QRS. Which electrolyte abnormality explains this?",
    "options": [
      "Hypokalemia",
      "Hyperkalemia",
      "Hypocalcemia",
      "Hypercalcemia",
      "Hyponatremia"
    ],
    "answer": 1,
    "explanation": "ECG findings of peaked T waves and widened QRS in a dialysis patient indicate hyperkalemia, which can cause weakness and confusion."
  },
  {
    "id": 55,
    "part": 2,
    "category": "Chest Pain & Dysrhythmias",
    "q": "29M tall thin man with 2 days of dyspnea. Stable vitals, normal exam. CXR shows small right spontaneous pneumothorax (<10%), which decreased on repeat CXR at 6 hours. Next step?",
    "options": [
      "Discharge with follow-up in 24 hours",
      "Needle decompression in the second intercostal space, midclavicular line",
      "Insert a 20F chest tube into right hemithorax",
      "Observe for another 6 hours",
      "Admit for pleurodesis"
    ],
    "answer": 3,
    "explanation": "Small, stable primary spontaneous pneumothorax that is improving on repeat imaging can be observed; observation for another 6 hours is appropriate."
  },
  {
    "id": 56,
    "part": 2,
    "category": "Chest Pain & Dysrhythmias",
    "q": "42M alcoholic, vomiting, acute persistent chest pain, dysphagia, pain on neck flexion. HR 101, crunching heart sound. CXR shows lateral displacement of left mediastinal pleural. Most likely diagnosis?",
    "options": [
      "Aspiration pneumonia",
      "Acute pancreatitis",
      "Pericarditis",
      "Esophageal perforation",
      "Aortic dissection"
    ],
    "answer": 3,
    "explanation": "Boerhaave syndrome: vomiting → full-thickness esophageal rupture → mediastinitis. Hamman crunch, dysphagia, neck pain, and left pleural effusion/mediastinal air are classic."
  },
  {
    "id": 57,
    "part": 2,
    "category": "Chest Pain & Dysrhythmias",
    "q": "65M hypertensive with sudden tearing chest pain radiating to jaw, BP 205/110, diastolic murmur at right sternal border, widened mediastinum on CXR. Preferred diagnostic study?",
    "options": [
      "Electrocardiogram (ECG)",
      "Transthoracic echocardiography (TTE)",
      "Transesophageal echocardiography (TEE)",
      "Computed tomography (CT) scan",
      "Magnetic resonance imaging (MRI)"
    ],
    "answer": 3,
    "explanation": "CT angiography is the preferred initial study for aortic dissection: rapid, widely available, and highly sensitive/specific. TEE is alternative if unstable."
  },
  {
    "id": 58,
    "part": 2,
    "category": "Chest Pain & Dysrhythmias",
    "q": "47M hypertensive with continuous left chest pain after snorting cocaine. BP 170/90, HR 101. Only alprazolam. Which medication is contraindicated?",
    "options": [
      "Metoprolol",
      "Diltiazem",
      "Aspirin",
      "Lorazepam",
      "Nitroglycerin"
    ],
    "answer": 0,
    "explanation": "Nonselective beta-blockers are contraindicated in cocaine toxicity: unopposed alpha stimulation can worsen hypertension and coronary vasoconstriction. Use benzodiazepines, nitrates, CCBs."
  },
  {
    "id": 59,
    "part": 2,
    "category": "Chest Pain & Dysrhythmias",
    "q": "32F IV drug user with fever 101°F, heart murmur, splenomegaly, bilateral patchy infiltrates, WBC 14,000, first-degree AV block. Most appropriate next step?",
    "options": [
      "Obtain four sets of blood cultures, order TTE, and start antibiotics",
      "Order monospot and avoid vigorous activity for 1 month",
      "Administer NSAID and diagnose pericarditis",
      "Administer INH and report to Department of Health",
      "Order Lyme antibody and begin antibiotic therapy"
    ],
    "answer": 0,
    "explanation": "Infective endocarditis (tricuspid, IVDU): obtain blood cultures before antibiotics, echo, and start empiric antibiotics. AV block suggests valve ring abscess."
  },
  {
    "id": 60,
    "part": 2,
    "category": "Chest Pain & Dysrhythmias",
    "q": "61F with chest pressure, diaphoresis, dyspnea. BP 130/70, HR 76. ECG shows ST elevation in V1–V4. Which location of MI?",
    "options": [
      "Anteroseptal",
      "Anterior",
      "Lateral",
      "Inferior",
      "Posterior"
    ],
    "answer": 0,
    "explanation": "ST elevation in V1–V4 indicates anteroseptal MI (LAD territory). V1–V2 = septal; V3–V4 = anterior; V5–V6 = lateral."
  },
  {
    "id": 61,
    "part": 2,
    "category": "Chest Pain & Dysrhythmias",
    "q": "31yo male mover with gradual chest pain worse with activity and reproducible tenderness at left sternal border 3rd/4th rib. HR 68, BP 120/70, clear lungs, no murmur. ECG sinus rhythm, CXR normal. Next step?",
    "options": [
      "Administer aspirin and send for a troponin",
      "Give aspirin, clopidogrel, heparin and admit for ACS",
      "Administer ibuprofen and reassure patient he is not having a heart attack",
      "Inject corticosteroid into the costochondral joint",
      "Observe the patient for 6 hours"
    ],
    "answer": 2,
    "explanation": "Reproducible costochondral tenderness with gradual activity-related pain and normal ECG/CXR indicates costochondritis; NSAIDs and reassurance are appropriate."
  },
  {
    "id": 62,
    "part": 2,
    "category": "Chest Pain & Dysrhythmias",
    "q": "21yo woman with mitral valve prolapse and lightheadedness. HR 170, BP 105/55. After medication, HR 89, regular. ECG: PR 100 msec with slurred upstroke of QRS. Most likely diagnosis?",
    "options": [
      "Ventricular tachycardia",
      "Atrial flutter with 3:1 block",
      "Atrial fibrillation",
      "Lown-Ganong-Levine (LGL) syndrome",
      "Wolff-Parkinson-White (WPW) syndrome"
    ],
    "answer": 4,
    "explanation": "Short PR interval with delta wave (slurred upstroke) and history of reentrant tachycardia is WPW; LGL has short PR but no delta wave."
  },
  {
    "id": 63,
    "part": 2,
    "category": "Chest Pain & Dysrhythmias",
    "q": "55yo diabetic smoker presents with weakness, cramps, paresthesias and diffuse weakness. ECG shows peaked T waves. What is the most important next step in management?",
    "options": [
      "Administer calcium gluconate",
      "Administer insulin and dextrose",
      "Administer aspirin and call the catheterization laboratory",
      "Order an emergent head CT scan and get a neurology consult",
      "Collect a sample of his urine to test for ketones"
    ],
    "answer": 0,
    "explanation": "ECG shows hyperkalemia with peaked T waves; calcium gluconate is given first to stabilize the myocardium and prevent arrhythmia."
  },
  {
    "id": 64,
    "part": 2,
    "category": "Chest Pain & Dysrhythmias",
    "q": "55yo man feels steak stuck, drooling, retching, no respiratory distress. Vitals stable, CXR no free air. Most appropriate next step?",
    "options": [
      "Administer 1-mg glucagon IV while arranging endoscopy",
      "Administer meat tenderizer such as papain",
      "Administer 10-mL syrup of ipecac to induce vomiting",
      "Perform the Heimlich maneuver until dislodged",
      "Call surgery to prepare for laparotomy"
    ],
    "answer": 0,
    "explanation": "Food impaction without airway compromise is treated with IV glucagon to relax LES and urgent endoscopy; ipecac and papain are contraindicated/harmful."
  },
  {
    "id": 65,
    "part": 2,
    "category": "Chest Pain & Dysrhythmias",
    "q": "59yo man with 2 hours of pressure-like left chest pain radiating to arm, diaphoresis. ECG shows 2-mm ST elevation in I, aVL, V3-V6. Which is an absolute contraindication to thrombolytics?",
    "options": [
      "Systolic BP greater than 180 mm Hg",
      "Patient on Coumadin and aspirin",
      "Total hip replacement 3 months ago",
      "Peptic ulcer disease",
      "Previous hemorrhagic stroke"
    ],
    "answer": 4,
    "explanation": "Any history of hemorrhagic stroke is an absolute contraindication to thrombolysis; recent surgery and anticoagulation are relative."
  },
  {
    "id": 66,
    "part": 2,
    "category": "Chest Pain & Dysrhythmias",
    "q": "67F with dyspnea, palpitations, HR 139, BP 80/50, cool/diaphoretic, bilateral crackles, chest pain. ECG: narrow complex irregular rhythm in 140s. Best immediate treatment?",
    "options": [
      "Diltiazem",
      "Metoprolol",
      "Digoxin",
      "Coumadin",
      "Synchronized cardioversion"
    ],
    "answer": 4,
    "explanation": "Unstable atrial fibrillation with hypotension and ischemia requires immediate synchronized cardioversion; rate-control drugs are contraindicated in instability."
  },
  {
    "id": 67,
    "part": 2,
    "category": "Chest Pain & Dysrhythmias",
    "q": "61F with CHF presents with dyspnea, SpO2 85% on RA, rales halfway up, BP 185/90, JVP elevated, pitting edema. Best first-line medication to lower preload?",
    "options": [
      "Metoprolol",
      "Morphine sulfate",
      "Nitroprusside",
      "Nitroglycerin",
      "Oxygen"
    ],
    "answer": 3,
    "explanation": "Nitroglycerin is first-line for preload reduction in acute cardiogenic pulmonary edema; it venodilates and reduces pulmonary congestion."
  },
  {
    "id": 68,
    "part": 2,
    "category": "Chest Pain & Dysrhythmias",
    "q": "27M healthy, thumb laceration repaired, requests ECG. ECG shows early repolarization pattern (benign). Most appropriate next step?",
    "options": [
      "Admit for pacemaker placement",
      "Admit for 24-hour observation",
      "Administer aspirin and send cardiac biomarkers",
      "Repeat the ECG because of incorrect lead placement",
      "Discharge the patient home"
    ],
    "answer": 4,
    "explanation": "Early repolarization is a benign normal variant in young healthy patients; no further cardiac workup is needed."
  },
  {
    "id": 69,
    "part": 2,
    "category": "Chest Pain & Dysrhythmias",
    "q": "56F with ovarian cancer, acute right chest pain, SOB, HR 101, BP 131/75, SpO2 97% on RA. Suspected PE. Which test is most likely abnormal?",
    "options": [
      "Arterial blood gas",
      "Oxygen saturation",
      "ECG",
      "Chest radiograph",
      "D-dimer"
    ],
    "answer": 4,
    "explanation": "D-dimer is highly sensitive for PE and is almost always elevated, though nonspecific; ABG, SpO2, ECG, and CXR are often normal."
  },
  {
    "id": 70,
    "part": 2,
    "category": "Chest Pain & Dysrhythmias",
    "q": "61F with diabetes/hypertension, 12h of dyspnea, chest tingling, diaphoresis. ECG: ST depression in II, III, aVF. NSTEMI suspected. Which marker rises in 3-6h, peaks 12-24h, normalizes in 7-10d?",
    "options": [
      "Myoglobin",
      "Creatinine kinase (CK)",
      "Creatinine kinase-MB (CK-MB)",
      "Troponin I",
      "Lactic dehydrogenase (LDH)"
    ],
    "answer": 2,
    "explanation": "CK-MB rises 3-6h, peaks 12-24h, and returns to baseline in 7-10 days, useful for reinfarction; troponin stays elevated 1-2 weeks."
  },
  {
    "id": 71,
    "part": 2,
    "category": "Chest Pain & Dysrhythmias",
    "q": "27M with palpitations and lightheadedness for 1 hour. HR 180, BP 110/65, SpO2 99%. ECG: regular narrow-complex tachycardia, no discernible P waves. Most appropriate medication?",
    "options": [
      "Digoxin",
      "Lidocaine",
      "Amiodarone",
      "Adenosine",
      "Bretylium"
    ],
    "answer": 3,
    "explanation": "Regular narrow-complex tachycardia without P waves is likely AVNRT. Adenosine is first-line for stable patients due to its rapid onset and short half-life."
  },
  {
    "id": 72,
    "part": 2,
    "category": "Chest Pain & Dysrhythmias",
    "q": "59M with left-sided chest pain and dyspnea for 1 hour. BP 85/45, HR 105, SpO2 94%. ECG shows ST-segment elevation. Most appropriate definitive treatment?",
    "options": [
      "Metoprolol or diltiazem",
      "Electrical cardioversion",
      "Calcium gluconate",
      "Thrombolytic therapy",
      "Percutaneous angioplasty"
    ],
    "answer": 0,
    "explanation": "The patient is hypotensive with STEMI; however, the ECG likely shows an inferior MI with right ventricular involvement. Actually, the key is that this is a STEMI with cardiogenic shock; percutane"
  },
  {
    "id": 73,
    "part": 2,
    "category": "Chest Pain & Dysrhythmias",
    "q": "55M with left-sided chest pain radiating to left arm. Takes beta-blocker, PPI, statin, and took sildenafil last night. BP 130/70, HR 77. Which medication is contraindicated?",
    "options": [
      "Aspirin",
      "Unfractionated heparin",
      "Nitroglycerin",
      "Metoprolol",
      "Morphine sulfate"
    ],
    "answer": 2,
    "explanation": "Nitroglycerin is contraindicated within 24-48 hours of sildenafil use due to risk of severe hypotension from additive vasodilation."
  },
  {
    "id": 74,
    "part": 2,
    "category": "Chest Pain & Dysrhythmias",
    "q": "31F with sharp substernal chest pain radiating to back, worse lying down, better sitting up. Temp 100.6°F, friction rub. ECG shows diffuse ST elevation. CXR and echo normal. Next step?",
    "options": [
      "Anticoagulate and CT for PE",
      "NSAID and discharge",
      "Aspirin, heparin, clopidogrel, admit for ACS",
      "Thrombolytics if pain persists",
      "Antibiotics and discharge"
    ],
    "answer": 1,
    "explanation": "Presentation is classic for acute pericarditis: positional sharp pain, fever, friction rub, diffuse ST elevation. Treat with NSAIDs and consider colchicine; discharge with follow-up."
  },
  {
    "id": 75,
    "part": 2,
    "category": "Chest Pain & Dysrhythmias",
    "q": "71M with left-sided chest pain, left hand numbness, and dyspnea. ECG performed. Which best describes the order of ECG changes in an MI?",
    "options": [
      "Hyperacute T wave, ST-segment elevation, Q wave",
      "Q wave, ST-segment elevation, hyperacute T wave",
      "Hyperacute T wave, Q wave, ST-segment elevation",
      "ST-segment elevation, Q wave, hyperacute T wave",
      "ST-segment elevation, hyperacute T wave, Q wave"
    ],
    "answer": 0,
    "explanation": "The classic sequence of ECG changes in acute MI is hyperacute T waves first, followed by ST-segment elevation, then Q-wave formation as necrosis develops."
  },
  {
    "id": 76,
    "part": 2,
    "category": "Chest Pain & Dysrhythmias",
    "q": "63M with dyspnea, RR 31, BP 185/90, SpO2 90%, crackles and 2+ edema after stopping diuretic. ECG shows sinus tachycardia. He is sitting up and speaking. After monitor and IV, best next step?",
    "options": [
      "Obtain blood cultures, CBC, and begin empiric antibiotics",
      "Order a STAT portable chest x-ray",
      "Oxygen via nasal cannula and have patient chew aspirin",
      "Oxygen via non-rebreather, furosemide, nitroglycerin, consider noninvasive ventilation",
      "Rapid sequence endotracheal intubation"
    ],
    "answer": 3,
    "explanation": "Acute decompensated heart failure with hypertension and hypoxemia: treat with oxygen, IV loop diuretic, nitrates, and consider NIV; intubation not needed as patient speaks."
  },
  {
    "id": 77,
    "part": 2,
    "category": "Chest Pain & Dysrhythmias",
    "q": "23M collapses during basketball, BP 80/palp, family history of young sudden cardiac death. Monitor shows polymorphic VT with twisting axis. Best rhythm description?",
    "options": [
      "Ventricular fibrillation",
      "Atrial fibrillation",
      "Wolf-Parkinson-White syndrome",
      "Supraventricular tachycardia",
      "Torsades de pointes"
    ],
    "answer": 4,
    "explanation": "Polymorphic VT with twisting QRS axis is torsades de pointes; in a young patient with family history suggests congenital long QT; treat with magnesium and defibrillation if unstable."
  },
  {
    "id": 78,
    "part": 2,
    "category": "Chest Pain & Dysrhythmias",
    "q": "Which patient has the lowest clinical probability for pulmonary embolism?",
    "options": [
      "21F 2 days after cesarean delivery",
      "55F on estrogen replacement therapy, total hip replacement 3 days ago",
      "39M occasional smoker, uncomplicated appendectomy 2 months ago",
      "62M with pancreatic cancer",
      "45M with factor V Leiden deficiency"
    ],
    "answer": 2,
    "explanation": "Recent uncomplicated surgery >4 weeks ago and no other risk factors carry low pretest probability; all others have major VTE risk factors (pregnancy/postpartum, hip surgery, cancer, thrombophilia"
  },
  {
    "id": 79,
    "part": 2,
    "category": "Chest Pain & Dysrhythmias",
    "q": "75M with exertional syncope while shoveling snow, now asymptomatic, BP 160/85, harsh systolic ejection murmur, ECG shows LVH. Most likely diagnosis?",
    "options": [
      "Asystolic cardiac arrest",
      "Brugada syndrome",
      "Subclavian steal syndrome",
      "Pulmonary embolism",
      "Aortic stenosis"
    ],
    "answer": 4,
    "explanation": "Exertional syncope plus harsh systolic ejection murmur in an elderly patient is classic for aortic stenosis; exertional syncope indicates severe AS and high risk."
  },
  {
    "id": 80,
    "part": 2,
    "category": "Chest Pain & Dysrhythmias",
    "q": "56M with substernal chest pain radiating to left arm, relieved by antacid and nitroglycerin; ECG normal. Which statement about acute MI diagnosis is most accurate?",
    "options": [
      "A normal ECG rules out acute MI",
      "One set of negative cardiac enzymes is sufficient to exclude MI",
      "Troponin may not reach peak levels for at least 12 hours",
      "Relief of symptoms by antacids essentially rules out a cardiac cause",
      "Epigastric discomfort and indigestion is a rare presentation of ACS"
    ],
    "answer": 2,
    "explanation": "Troponin peaks at 12-24 hours; a single early normal ECG or enzyme set cannot rule out MI. Antacid relief and epigastric symptoms do not exclude ACS."
  },
  {
    "id": 81,
    "part": 2,
    "category": "Chest Pain & Dysrhythmias",
    "q": "62yo woman with weakness, dyspnea, substernal chest pain radiating to left shoulder. BP 155/80, HR 92, RR 16. Suspected acute MI. Which therapeutic agent independently reduces mortality in acute MI?",
    "options": [
      "Nitroglycerin",
      "Aspirin",
      "Unfractionated heparin",
      "Lidocaine",
      "Diltiazem"
    ],
    "answer": 1,
    "explanation": "Aspirin is the only agent among these proven to independently reduce mortality in acute MI via antiplatelet effect; give chewable aspirin early."
  },
  {
    "id": 82,
    "part": 2,
    "category": "Chest Pain & Dysrhythmias",
    "q": "22yo college student with 5 days fever, fatigue, myalgias, vomiting/diarrhea, now constant substernal chest pain and dyspnea. T 100.9°F, HR 119, BP 120/75, RR 18. ECG sinus tachycardia, CXR normal, mild leukocytosis. Most common cause?",
    "options": [
      "Streptococcus viridans",
      "Staphylococcus aureus",
      "Coxsackie B virus",
      "Atherosclerotic disease",
      "Cocaine abuse"
    ],
    "answer": 2,
    "explanation": "Viral myopericarditis after a viral prodrome; Coxsackie B is the most common viral cause of pericarditis/myocarditis in young patients."
  },
  {
    "id": 83,
    "part": 2,
    "category": "Chest Pain & Dysrhythmias",
    "q": "51yo athletic woman with 5 days of crushing substernal chest pressure waking her from sleep, resolving in 20-30 min. ECG shows ST elevations, biomarkers negative, pain relieved by nitroglycerin. Minimal CAD on angiography. Best treatment?",
    "options": [
      "Aspirin",
      "Calcium channel blocker (CCB)",
      "β-Blocker",
      "H2-Blocker",
      "Antidepressant"
    ],
    "answer": 1,
    "explanation": "Prinzmetal (variant) angina due to coronary vasospasm; calcium channel blockers are first-line, with nitrates for relief. β-Blockers may worsen spasm."
  },
  {
    "id": 84,
    "part": 2,
    "category": "Chest Pain & Dysrhythmias",
    "q": "23yo teacher with syncope preceded by lightheadedness, no seizure. Father died of 'heart problem' at 32. Vitals and exam normal. ECG (rhythm strip) shows prolonged QT interval. Most likely diagnosis?",
    "options": [
      "Wolff-Parkinson-White syndrome",
      "Long QT syndrome",
      "Lown-Ganong-Levine syndrome",
      "Complete heart block",
      "Atrial flutter"
    ],
    "answer": 1,
    "explanation": "Congenital long QT syndrome presents with syncope and sudden cardiac death in young patients; family history of early cardiac death supports this diagnosis."
  },
  {
    "id": 85,
    "part": 2,
    "category": "Chest Pain & Dysrhythmias",
    "q": "Patient with AICD reports repeated shocks after returning from radiology; monitor shows sinus rhythm and a third shock occurs. Most appropriate next step?",
    "options": [
      "Send to radiology for another radiograph to desensitize AICD",
      "Give pain medication and wait for device representative to power off AICD",
      "Admit to telemetry to monitor rhythm and find cause of AICD discharge",
      "Place a magnet over the AICD generator to inactivate it and prevent further shocks",
      "Make a small incision over chest wall and remove AICD generator and leads"
    ],
    "answer": 3,
    "explanation": "Inappropriate AICD shocks in sinus rhythm require immediate magnet application over the generator to suspend tachytherapy and stop further shocks."
  },
  {
    "id": 86,
    "part": 2,
    "category": "Chest Pain & Dysrhythmias",
    "q": "55M with chest pain, SOB; BP 170/80, SpO2 90%. Crackles halfway up both lungs, new holosystolic murmur loudest at apex radiating to axilla. ECG: inferior ST elevations. CXR: pulmonary edema, normal cardiac silhouette. Cause of murmur?",
    "options": [
      "Critical aortic stenosis",
      "Papillary muscle rupture",
      "Pericardial effusion",
      "Congestive heart failure",
      "Aortic dissection"
    ],
    "answer": 1,
    "explanation": "Inferior MI with acute severe mitral regurgitation (holosystolic apical murmur to axilla) and pulmonary edema indicates papillary muscle rupture, typically of the posteromedial muscle in inferior"
  },
  {
    "id": 87,
    "part": 2,
    "category": "Chest Pain & Dysrhythmias",
    "q": "82F with fatigue, dizziness, lightheadedness; HR 37, BP 140/70, RR 15. ECG shows third-degree AV block. Most appropriate next step?",
    "options": [
      "Bed rest for 48 hours and follow-up with primary care",
      "Aspirin, cardiac enzymes, admit to CCU",
      "Place a magnet on her chest to turn off her pacemaker",
      "Admit for Holter monitoring and echocardiogram",
      "Place on cardiac monitor, apply external pacing pads, admit to CCU"
    ],
    "answer": 4,
    "explanation": "Symptomatic complete heart block requires immediate monitoring and readiness for transcutaneous pacing; definitive treatment is transvenous pacemaker."
  },
  {
    "id": 88,
    "part": 2,
    "category": "Chest Pain & Dysrhythmias",
    "q": "22M with acute MI (ST elevations, positive biomarkers). Smokes 0.5 ppd for 3 months, occasional alcohol, grandfather had MI at 80. No HTN/DM, normal lipids. Most likely explanation?",
    "options": [
      "Cigarette smoking",
      "Family history of MI at age 80",
      "Incorrectly placed ECG leads",
      "Undisclosed cocaine use",
      "Alcohol use"
    ],
    "answer": 3,
    "explanation": "In a young patient with few traditional risk factors, cocaine-induced coronary vasospasm/thrombosis is the most likely cause; smoking and family history are insufficient."
  },
  {
    "id": 89,
    "part": 2,
    "category": "Chest Pain & Dysrhythmias",
    "q": "29M syncope during basketball. Systolic ejection murmur at LSB/apex. ECG: LVH, LA enlargement, septal Q waves. Valsalva maneuver effect on murmur intensity?",
    "options": [
      "Decrease",
      "Increase",
      "Remain unchanged",
      "Disappear",
      "Intensity same but heart skips a beat"
    ],
    "answer": 1,
    "explanation": "Hypertrophic cardiomyopathy murmur increases with Valsalva (decreased preload), unlike aortic stenosis which decreases; syncope with exertion is classic."
  },
  {
    "id": 90,
    "part": 2,
    "category": "Chest Pain & Dysrhythmias",
    "q": "61F with metastatic breast cancer, chest pain, cough, progressive SOB ×1 week. JVD present, BP 105/70, HR 98. CXR shows large pericardial effusion. Associated ECG finding?",
    "options": [
      "Low-voltage complexes",
      "High-voltage complexes",
      "ST-segment depression",
      "ST-segment elevation",
      "T-wave inversion"
    ],
    "answer": 0,
    "explanation": "Malignant pericardial effusion causes low-voltage QRS complexes (and electrical alternans); JVD and dyspnea suggest tamponade physiology."
  },
  {
    "id": 91,
    "part": 2,
    "category": "Chest Pain & Dysrhythmias",
    "q": "68F with uterine cancer presents with acute sharp right-sided chest pain worse on inspiration. BP 135/85, HR 107, RR 20, SpO2 97%. Exam: swollen tender right calf. ECG: sinus tachycardia. Best next step?",
    "options": [
      "Start heparin before diagnostics",
      "Administer thrombolytics",
      "Order V/Q scan",
      "Order CT angiogram",
      "Order D-dimer"
    ],
    "answer": 3,
    "explanation": "High pretest probability for PE (cancer, tachycardia, calf DVT). CT pulmonary angiography is the diagnostic test of choice; D-dimer is unhelpful when PE is likely."
  },
  {
    "id": 92,
    "part": 2,
    "category": "Chest Pain & Dysrhythmias",
    "q": "57M with palpitations and lightheadedness for 1 hour. History of coronary stenting, smoking. HR 140, BP 115/70, SpO2 99%. ECG: regular wide-complex tachycardia at 140. Prior ECG: sinus rhythm at 80. Best medication?",
    "options": [
      "Digoxin",
      "Diltiazem",
      "Amiodarone",
      "Adenosine",
      "Bretylium"
    ],
    "answer": 2,
    "explanation": "Regular wide-complex tachycardia is presumed VT, especially with prior CAD. Amiodarone is the antiarrhythmic of choice; AV nodal blockers are contraindicated."
  },
  {
    "id": 93,
    "part": 2,
    "category": "Chest Pain & Dysrhythmias",
    "q": "55M with HTN and smoking presents with 3 episodes of severe heavy chest pain radiating to left shoulder at rest this morning. Prior exertional angina relieved by rest. BP 155/80, HR 76, pain-free in ED. ECG sinus rhythm at 72. Troponin negative. Diagnosis?",
    "options": [
      "Variant angina",
      "Stable angina",
      "Unstable angina",
      "NSTEMI",
      "STEMI"
    ],
    "answer": 2,
    "explanation": "Rest angina with negative troponin and nondiagnostic ECG is unstable angina (new-onset rest pain). It is part of ACS and requires urgent evaluation."
  },
  {
    "id": 94,
    "part": 2,
    "category": "Chest Pain & Dysrhythmias",
    "q": "58M with syncope at dinner. Wife reports sudden loss of consciousness for 1 minute. Patient had chest discomfort and dyspnea prior. EMS rhythm strip shown (ECG shows progressive PR prolongation with dropped beats). Findings?",
    "options": [
      "Mobitz type I",
      "Mobitz type II",
      "First-degree AV block",
      "Atrial flutter with PVCs",
      "Sinus bradycardia"
    ],
    "answer": 1,
    "explanation": "Mobitz type II shows constant PR with intermittent dropped QRS complexes, indicating infranodal disease and high risk of complete heart block and syncope."
  },
  {
    "id": 95,
    "part": 2,
    "category": "Chest Pain & Dysrhythmias",
    "q": "Same patient develops chest discomfort, dyspnea, and another syncopal episode. ECG shown (ECG shows complete heart block with slow wide-complex escape). Most appropriate next step?",
    "options": [
      "Call cardiology consult",
      "Cardiovert the patient",
      "Administer metoprolol",
      "Administer amiodarone",
      "Apply transcutaneous pacemaker"
    ],
    "answer": 4,
    "explanation": "Symptomatic complete heart block with syncope requires immediate transcutaneous pacing. Cardiology consult is adjunctive; AV nodal blockers and cardioversion are inappropriate."
  },
  {
    "id": 96,
    "part": 3,
    "category": "Trauma & Resuscitation",
    "q": "58F fell on ice, 1-min LOC, now repeatedly asks what happened/where she is, vomited once. Normal CT brain. No focal deficits. Most likely diagnosis?",
    "options": [
      "Cerebral concussion",
      "Diffuse axonal injury",
      "Cerebral contusion",
      "Posttraumatic epilepsy",
      "Trauma-induced Alzheimer disease"
    ],
    "answer": 0,
    "explanation": "Concussion = transient LOC, amnesia, headache, vomiting, normal CT. DAI and contusion typically show CT abnormalities or focal deficits."
  },
  {
    "id": 97,
    "part": 3,
    "category": "Trauma & Resuscitation",
    "q": "41M restrained driver in high-speed MVC, chest wall bruising, HR 121, GCS 14, suspected cardiac injury. Which location most commonly involves cardiac contusions?",
    "options": [
      "Right atrium",
      "Right ventricle",
      "Left atrium",
      "Left ventricle",
      "Septum"
    ],
    "answer": 1,
    "explanation": "The right ventricle is most anterior and closest to the sternum, making it the most commonly contused chamber in blunt chest trauma."
  },
  {
    "id": 98,
    "part": 3,
    "category": "Trauma & Resuscitation",
    "q": "25M motorcycle crash, BP 90/60, HR 115. Which smallest amount of blood loss produces a decrease in systolic BP in adults?",
    "options": [
      "Loss of 5% of blood volume",
      "Loss of 10% of blood volume",
      "Loss of 15% to 30% of blood volume",
      "Loss of 30% to 40% of blood volume",
      "Loss of greater than 40% of blood volume"
    ],
    "answer": 2,
    "explanation": "Systolic BP remains normal until class II hemorrhage (15–30% loss); tachycardia and narrowed pulse pressure occur first."
  },
  {
    "id": 99,
    "part": 3,
    "category": "Trauma & Resuscitation",
    "q": "Mass casualty: two dead, one critically hypotensive, three stable injured. Which is the leading cause of death and disability in trauma victims?",
    "options": [
      "Abdominal injury",
      "Thoracic injury",
      "Back injury",
      "Cervical injury",
      "Head injury"
    ],
    "answer": 4,
    "explanation": "Traumatic brain injury is the leading cause of trauma-related death and long-term disability."
  },
  {
    "id": 100,
    "part": 3,
    "category": "Trauma & Resuscitation",
    "q": "45M high-speed MVC, BP 85/50, HR 131 after 2L NS, slow to respond. RUQ ultrasound shows free fluid. Most appropriate next step?",
    "options": [
      "Emergent abdominal computed tomographic (CT) scan",
      "Transfer to the operating room (OR) for laparotomy",
      "Perform a diagnostic peritoneal lavage (DPL)",
      "Observe until one more liter of crystalloid fluid is administered",
      "Serial abdominal examinations"
    ],
    "answer": 1,
    "explanation": "Hypotension with positive FAST in blunt trauma = hemodynamically unstable → immediate laparotomy, not CT or observation."
  },
  {
    "id": 101,
    "part": 3,
    "category": "Trauma & Resuscitation",
    "q": "17-year-old football player 'spears' another player, has severe neck pain, no paresthesias, moves all extremities. Cervical CT shows multiple fractures of C1. Which fracture is this?",
    "options": [
      "Odontoid fracture",
      "Hangman's fracture",
      "Jefferson fracture",
      "Clay-shoveler's fracture",
      "Teardrop fracture"
    ],
    "answer": 2,
    "explanation": "Jefferson fracture is a burst fracture of the atlas (C1) from axial loading, classically from head-first impact ('spearing')."
  },
  {
    "id": 102,
    "part": 3,
    "category": "Trauma & Resuscitation",
    "q": "20-year-old with multiple chest stab wounds, BP 85/50, HR 123, mumbling, good air entry, JVD. Pulseless and no BP while listening to heart. Next best step?",
    "options": [
      "Atropine",
      "Epinephrine",
      "Bilateral chest tubes",
      "ED thoracotomy",
      "Pericardiocentesis"
    ],
    "answer": 3,
    "explanation": "Penetrating chest trauma causing cardiac arrest with suspected tamponade; ED thoracotomy is indicated for penetrating thoracic trauma with witnessed arrest."
  },
  {
    "id": 103,
    "part": 3,
    "category": "Trauma & Resuscitation",
    "q": "22-year-old punched in face, holding avulsed front incisor. What is the best advice to preserve the tooth until ED arrival?",
    "options": [
      "Place the tooth in a napkin and bring it to the ED",
      "Place the tooth in a glass of water and bring it to the ED",
      "Place the tooth in a glass of beer and bring it to the ED",
      "Pour some water over the tooth and place it immediately back into the socket",
      "Place the tooth in a glass of milk and bring it to the ED"
    ],
    "answer": 4,
    "explanation": "Milk is the best transport medium for an avulsed tooth, preserving periodontal ligament cell viability; water and dry storage are harmful."
  },
  {
    "id": 104,
    "part": 3,
    "category": "Trauma & Resuscitation",
    "q": "19-year-old after head-on cycling accident without helmet. Eyes closed but open to command; moves arms/legs on command; disoriented but conversant. What is his GCS score?",
    "options": [
      "11",
      "12",
      "13",
      "14",
      "15"
    ],
    "answer": 2,
    "explanation": "Eyes open to command = 3, motor obeys commands = 6, verbal confused/disoriented = 4; total GCS = 13."
  },
  {
    "id": 105,
    "part": 3,
    "category": "Trauma & Resuscitation",
    "q": "18-year-old stabbed in abdomen, HR 140, BP 90/40, pain. Two large-bore IVs, fluids wide open; after 2 L BP does not improve. Most common organ injured in stab wounds?",
    "options": [
      "Liver",
      "Small bowel",
      "Stomach",
      "Colon",
      "Spleen"
    ],
    "answer": 0,
    "explanation": "The liver is the most commonly injured intra-abdominal organ in penetrating abdominal stab wounds."
  },
  {
    "id": 106,
    "part": 3,
    "category": "Trauma & Resuscitation",
    "q": "61M chest wall pain after MVC. Speaking full sentences, equal breath sounds, well-perfused. BP 150/75, HR 92, SpO2 97% RA. CXR: right 7th/8th anterolateral rib fractures, no other injury. Best treatment?",
    "options": [
      "Apply adhesive tape perpendicular to the rib fractures",
      "Insert a chest tube into the right thorax",
      "Bring the patient to the OR for surgical fixation",
      "Analgesia and incentive spirometry",
      "Observation"
    ],
    "answer": 3,
    "explanation": "Stable rib fractures are managed with adequate analgesia and incentive spirometry to prevent atelectasis and pneumonia; taping is harmful, surgery is not indicated."
  },
  {
    "id": 107,
    "part": 3,
    "category": "Trauma & Resuscitation",
    "q": "27M after MVC: RR 45, SpO2 89%, HR 112, BP 115/75. Decreased breath sounds on the left. Most appropriate next step?",
    "options": [
      "Order a STAT chest radiograph",
      "Perform a pericardiocentesis",
      "Perform a DPL",
      "Perform an ED thoracotomy",
      "Perform a tube thoracostomy"
    ],
    "answer": 4,
    "explanation": "Tension pneumothorax is a clinical diagnosis; immediate tube thoracostomy (or needle decompression) is required before imaging in the unstable patient."
  },
  {
    "id": 108,
    "part": 3,
    "category": "Trauma & Resuscitation",
    "q": "29M stabbed in left back. BP 120/80, HR 105, RR 16, SpO2 98% RA. Secondary survey: left lower extremity motor weakness and loss of pain sensation in right lower extremity. Most likely diagnosis?",
    "options": [
      "Spinal shock",
      "Central cord syndrome",
      "Anterior cord syndrome",
      "Brown-Séquard syndrome",
      "Cauda equina syndrome"
    ],
    "answer": 3,
    "explanation": "Brown-Séquard syndrome results from hemisection of the spinal cord, causing ipsilateral motor weakness and contralateral loss of pain/temperature sensation."
  },
  {
    "id": 109,
    "part": 3,
    "category": "Trauma & Resuscitation",
    "q": "33M intoxicated, assaulted with multiple head blows. BP 150/75, HR 90, RR 13, SpO2 100% on NRB. Opens eyes to pain, pupils equal/reactive, withdraws to pain, moans. Best next step?",
    "options": [
      "Prepare for intubation",
      "Suture repair of head laceration",
      "Administer mannitol",
      "Bilateral burr holes",
      "Neurosurgical intervention"
    ],
    "answer": 0,
    "explanation": "GCS is 8 (E2 V2 M4); intubation is indicated for airway protection in severe traumatic brain injury before other interventions."
  },
  {
    "id": 110,
    "part": 3,
    "category": "Trauma & Resuscitation",
    "q": "74M after MVC, chest hit steering wheel, pain with breathing. RR 20, SpO2 98% RA, BP 145/75, HR 90. Exam: paradoxical respirations. Which best describes a flail chest?",
    "options": [
      "One rib with three fracture sites",
      "Two adjacent ribs each with two fracture sites",
      "Three adjacent ribs each with two fracture sites",
      "One fractured right sided rib and one fractured left-sided rib",
      "Two fractured right sided ribs and two fractured left-sided ribs"
    ],
    "answer": 2,
    "explanation": "Flail chest is defined as three or more adjacent ribs each fractured in two or more places, creating a free-floating segment with paradoxical motion."
  },
  {
    "id": 111,
    "part": 3,
    "category": "Trauma & Resuscitation",
    "q": "29yo man stabbed in neck between mandible and cricoid; wound violates platysma, oozing blood, no expanding hematoma. Vitals normal, speaking full sentences. Best next step?",
    "options": [
      "Explore wound and blindly clamp bleeding vessels",
      "Probe wound to identify injured vessels",
      "Apply pressure and emergent OR for zone 1 exploration",
      "Apply pressure and emergent OR for zone 2 exploration",
      "Apply pressure and emergent OR for zone 3 exploration"
    ],
    "answer": 3,
    "explanation": "Penetrating neck injury with platysma violation is zone 2 (cricoid to mandible angle); hard signs like active bleeding warrant emergent operative exploration."
  },
  {
    "id": 112,
    "part": 3,
    "category": "Trauma & Resuscitation",
    "q": "45yo man after head-on MVC; C-spine x-ray shows bilateral C2 fractures. Neuro exam normal. Which fracture is this?",
    "options": [
      "Colles fracture",
      "Boxer's fracture",
      "Jefferson fracture",
      "Hangman's fracture",
      "Clay-shoveler's fracture"
    ],
    "answer": 3,
    "explanation": "Bilateral fractures of C2 pars interarticularis = Hangman's fracture, from hyperextension; Jefferson is C1 ring, Clay-shoveler is lower cervical spinous process."
  },
  {
    "id": 113,
    "part": 3,
    "category": "Trauma & Resuscitation",
    "q": "71yo man fallen one story; hypothermic, hypotensive, confused. Clear fluid dripping from left ear and ecchymosis over mastoid. Most likely diagnosis?",
    "options": [
      "LeFort fracture",
      "Basilar skull fracture",
      "Otitis interna",
      "Otitis externa",
      "Tripod fracture"
    ],
    "answer": 1,
    "explanation": "CSF otorrhea and Battle's sign (mastoid ecchymosis) after trauma are classic for basilar skull fracture."
  },
  {
    "id": 114,
    "part": 3,
    "category": "Trauma & Resuscitation",
    "q": "34yo fall from 30 ft; hypotensive, hypoxic, gurgling respirations, diminished right breath sounds, unstable pelvis, blood at meatus, deformed extremities. Next step?",
    "options": [
      "Insert 32F right chest tube",
      "Perform DPL to rule out intra-abdominal hemorrhage",
      "Create two Burr holes for potential epidural hematoma",
      "Immediately reduce extremity injuries and splint",
      "Endotracheal intubation with in-line cervical stabilization"
    ],
    "answer": 4,
    "explanation": "Airway is first priority in trauma; gurgling and poor respirations require immediate intubation with in-line stabilization before other interventions."
  },
  {
    "id": 115,
    "part": 3,
    "category": "Trauma & Resuscitation",
    "q": "20yo man after MVC, initially lucid then collapsed; BP 175/90, HR 65, right pupil fixed/dilated. (Head CT shows biconvex lens-shaped hyperdensity.) Most likely diagnosis?",
    "options": [
      "Epidural hematoma",
      "Subdural hematoma",
      "Subarachnoid hemorrhage",
      "Intracerebral hematoma",
      "Cerebral contusion"
    ],
    "answer": 0,
    "explanation": "Lucid interval, hypertension with bradycardia, and unilaterally dilated pupil suggest epidural hematoma; CT shows biconvex lens-shaped hematoma."
  },
  {
    "id": 116,
    "part": 3,
    "category": "Trauma & Resuscitation",
    "q": "81-year-old woman tripped, hyperextension neck injury, in collar. No upper extremity sensorimotor function, 1/5 quadriceps, patchy lower sensation, decreased rectal tone. Most likely diagnosis?",
    "options": [
      "Central cord syndrome",
      "Anterior cord syndrome",
      "Brown-Séquard syndrome",
      "Transverse myelitis",
      "Exacerbation of Parkinson disease"
    ],
    "answer": 0,
    "explanation": "Hyperextension injury in elderly with greater upper extremity weakness than lower is classic central cord syndrome due to cord contusion."
  },
  {
    "id": 117,
    "part": 3,
    "category": "Trauma & Resuscitation",
    "q": "22-year-old man ejected in MVC, BP 85/55, HR 141. Received 3 L crystalloid, BP 83/57. Best statement regarding management of hypotensive trauma patient failing volume resuscitation?",
    "options": [
      "It is important to wait for fully cross-matched blood prior to transfusion",
      "Whole blood should be used rather than packed red blood cells (RBCs)",
      "Blood transfusion should begin after 4 L of crystalloid infusion",
      "Type O blood that is Rh-negative should be transfused",
      "Type O blood that is Rh-positive should be transfused"
    ],
    "answer": 3,
    "explanation": "In hypotensive trauma patients unresponsive to crystalloid, emergency release type O Rh-negative blood should be transfused immediately."
  },
  {
    "id": 118,
    "part": 3,
    "category": "Trauma & Resuscitation",
    "q": "24-year-old man run over by car, BP 90/HR 121, unstable pelvis, FAST negative. Large-bore fluids running. Most appropriate immediate next step?",
    "options": [
      "Bilateral chest tubes",
      "Application of external fixator",
      "Application of pelvic binding apparatus",
      "Venographic embolization",
      "Angiographic embolization"
    ],
    "answer": 2,
    "explanation": "Unstable pelvic fracture with hypotension requires immediate pelvic binder application to reduce hemorrhage."
  },
  {
    "id": 119,
    "part": 3,
    "category": "Trauma & Resuscitation",
    "q": "32-year-old man diving accident, cannot move arms/legs, cannot feel pain below clavicle but light touch and position intact. C-spine x-ray no fracture. Most likely diagnosis?",
    "options": [
      "Spinal cord injury without radiographic abnormality (SCIWORA)",
      "Central cord syndrome",
      "Anterior cord syndrome",
      "Cauda equina syndrome",
      "Brown-Séquard syndrome"
    ],
    "answer": 2,
    "explanation": "Loss of motor and pain/temperature with preserved proprioception and light touch indicates anterior cord syndrome."
  },
  {
    "id": 120,
    "part": 3,
    "category": "Trauma & Resuscitation",
    "q": "22-year-old unrestrained driver, SOB, HR 117, BP 80/60, bruise central chest, neck veins flat, absent right breath sounds. After 2 L LR BP still 80. Next step?",
    "options": [
      "Sedate, paralyze, and intubate",
      "Perform a needle thoracostomy",
      "Perform a DPL",
      "Perform a FAST examination",
      "Perform a pericardiocentesis"
    ],
    "answer": 1,
    "explanation": "Hypotension, absent unilateral breath sounds, and flat neck veins suggest tension pneumothorax; immediate needle thoracostomy is required."
  },
  {
    "id": 121,
    "part": 3,
    "category": "Trauma & Resuscitation",
    "q": "87M after fall down steps, on board/collar. HR 99, BP 160/90, RR 16, alert. Breath sounds equal, right arm fracture. No cervical tenderness or deformity. Which statement is true?",
    "options": [
      "Epidural hematomas are very common in the elderly",
      "Cerebral atrophy in the elderly protects against subdural hematomas",
      "Increased lung elasticity allows elderly to recover from thoracic trauma faster",
      "Most common cervical spine fracture in this age group is a wedge fracture of C6",
      "Despite lack of cervical spine tenderness, imaging of his cervical spine is warranted"
    ],
    "answer": 4,
    "explanation": "Elderly trauma patients warrant C-spine imaging even without tenderness; altered mental status, distracting injury, or age may preclude clinical clearance."
  },
  {
    "id": 122,
    "part": 3,
    "category": "Trauma & Resuscitation",
    "q": "41M restrained passenger in high-speed MVC. BP 90/50, HR 125. Abdomen soft, pelvis unstable. FAST and DPL negative. X-ray shows open book pelvic fracture. After 2L LR, BP 80/40. Next step?",
    "options": [
      "Immediate exploratory laparotomy",
      "Pelvic angiography with embolization",
      "CT scan",
      "Pericardiocentesis",
      "Retrograde urethrogram"
    ],
    "answer": 1,
    "explanation": "Hemodynamically unstable pelvic fracture with negative FAST/DPL suggests pelvic bleeding; next step is angiography with embolization."
  },
  {
    "id": 123,
    "part": 3,
    "category": "Trauma & Resuscitation",
    "q": "45M after head-on MVC. BP 85/45, HR 130, coherent, breath sounds equal. After 2L fluids, BP 80/40. FAST shows fluid in Morison pouch. Most likely injured organ in blunt abdominal trauma?",
    "options": [
      "Liver",
      "Spleen",
      "Kidney",
      "Small bowel",
      "Bladder"
    ],
    "answer": 0,
    "explanation": "Fluid in Morison's pouch indicates hemoperitoneum; liver is the most commonly injured organ in blunt abdominal trauma."
  },
  {
    "id": 124,
    "part": 3,
    "category": "Trauma & Resuscitation",
    "q": "47M after 20-ft fall. HR 110, BP 110/80, RR 20, SpO2 100%. Chest clear, abdomen nontender, pelvis stable, FAST negative. Large scrotal hematoma and blood at urethral meatus. Next step?",
    "options": [
      "Scrotal ultrasound",
      "KUB radiograph",
      "IV pyelogram",
      "Retrograde cystogram",
      "Retrograde urethrogram"
    ],
    "answer": 4,
    "explanation": "Blood at urethral meatus and scrotal hematoma suggest urethral injury; perform retrograde urethrogram before catheterization."
  },
  {
    "id": 125,
    "part": 3,
    "category": "Trauma & Resuscitation",
    "q": "17M hit in right eye with tennis ball. Periorbital swelling and ecchymosis. Visual acuity 20/20. Right eye cannot look superiorly; pain on upward gaze. Most likely diagnosis?",
    "options": [
      "Zygomatic arch fracture",
      "Orbital floor fracture",
      "Retrobulbar hematoma",
      "Ruptured globe",
      "Mandible fracture with pterygoid entrapment"
    ],
    "answer": 1,
    "explanation": "Inability to look up and pain on upward gaze after blunt trauma indicates orbital floor blowout fracture with inferior rectus entrapment."
  },
  {
    "id": 126,
    "part": 3,
    "category": "Trauma & Resuscitation",
    "q": "24yo man shot in abdomen. BP 100/60→85/65, HR 115→125 after 2L fluid. Entry right of umbilicus, exit right of lumbar spine. GCS 15. Most appropriate next step?",
    "options": [
      "Probe the entry wound to see if it violates the peritoneum",
      "Perform a FAST examination",
      "Perform a DPL",
      "Take the patient directly to the CT scanner",
      "Take the patient directly to the OR"
    ],
    "answer": 4,
    "explanation": "Hemodynamically unstable penetrating abdominal trauma with hypotension after resuscitation warrants emergent laparotomy; FAST/CT would delay definitive hemorrhage control."
  },
  {
    "id": 127,
    "part": 3,
    "category": "Trauma & Resuscitation",
    "q": "55yo woman with 3h epistaxis. Anterior packing failed; bleeding from posterior septum. Stable vitals, normal labs. Most appropriate management?",
    "options": [
      "Place posterior nasal packing, start antibiotics, and admit to monitored bed",
      "Place the patient supine and wait for spontaneous resolution",
      "Keep pressure on nasal septum and give FFP and platelets",
      "Place posterior nasal packing and discharge home with 24h follow-up",
      "Apply silver nitrate to the nasal mucosa until bleeding stops"
    ],
    "answer": 0,
    "explanation": "Posterior epistaxis failing anterior packing requires posterior packing; admit for monitoring and antibiotics to cover toxic shock/staph risk."
  },
  {
    "id": 128,
    "part": 3,
    "category": "Trauma & Resuscitation",
    "q": "44yo man struck by car. BP 70/palp, HR 125, O2 89% RA. Eyes closed, no verbal or motor response. Deformed left foot, arm laceration. Next step?",
    "options": [
      "Prepare for emergent orotracheal intubation",
      "Begin aggressive fluid resuscitation and administer morphine",
      "Apply a tourniquet just above left foot and begin fluid resuscitation",
      "Apply pressure to laceration, splint left foot, and order radiograph",
      "Administer packed RBCs and bring to CT for pan-scan"
    ],
    "answer": 0,
    "explanation": "GCS 3 with hypoxia and hypotension: airway is priority; intubate before other interventions per ABCs."
  },
  {
    "id": 129,
    "part": 3,
    "category": "Trauma & Resuscitation",
    "q": "17yo boy found unconscious in pool, intubated. HR 49, BP 80/50, spontaneous abdominal breathing 16/min. Earliest condition to consider?",
    "options": [
      "Cervical spine injury",
      "Electrolyte imbalance",
      "Metabolic acidosis",
      "Severe atelectasis",
      "Toxic ingestion"
    ],
    "answer": 0,
    "explanation": "Diving/submersion trauma mandates early C-spine immobilization; bradycardia/hypotension may reflect spinal shock or hypoxia."
  },
  {
    "id": 130,
    "part": 3,
    "category": "Trauma & Resuscitation",
    "q": "26yo belted driver in head-on MVC with dyspnea, hemoptysis, right chest ecchymosis, equal breath sounds, no crepitus, trachea midline. CXR (not shown) likely shows?",
    "options": [
      "Diaphragm rupture",
      "Hemothorax",
      "Tension pneumothorax",
      "Pulmonary contusion",
      "Acute respiratory distress syndrome"
    ],
    "answer": 3,
    "explanation": "Mechanism, hypoxemia, hemoptysis, chest wall ecchymosis with equal breath sounds and midline trachea suggest pulmonary contusion on CXR."
  },
  {
    "id": 131,
    "part": 3,
    "category": "Trauma & Resuscitation",
    "q": "22yo man with GSW to right thigh. HR 105, BP 115/75. Large medial thigh hematoma, numb/pale right foot, no palpable distal pulse but Doppler present, cannot move foot. Next step?",
    "options": [
      "Angiography",
      "Exploration and repair in the OR",
      "Fasciotomy to treat compartment syndrome",
      "Wound exploration",
      "CT scan of the right extremity"
    ],
    "answer": 1,
    "explanation": "Hard signs of vascular injury (pulseless, pale, paralyzed) mandate immediate operative exploration and repair, not angiography or imaging."
  },
  {
    "id": 132,
    "part": 3,
    "category": "Trauma & Resuscitation",
    "q": "67yo woman struck by cyclist. GCS 6, BP 175/90, HR 75. Right pupil 8 mm nonreactive, left 4 mm minimally reactive. Most common manifestation of rising ICP causing herniation?",
    "options": [
      "Change in level of consciousness",
      "Ipsilateral pupillary dilation",
      "Contralateral pupillary dilation",
      "Significantly elevated BP",
      "Hemiparesis"
    ],
    "answer": 0,
    "explanation": "Altered mental status/level of consciousness is the earliest and most common sign of increasing ICP; pupillary changes occur later."
  },
  {
    "id": 133,
    "part": 3,
    "category": "Trauma & Resuscitation",
    "q": "34yo man with right chest GSW, hypotensive, diminished right breath sounds, hazy right lung on CXR. After 36F chest tube, 1200 cc blood drained. Which is an indication for thoracotomy?",
    "options": [
      "500 cc of initial chest tube drainage of blood",
      "1200 cc of initial chest tube drainage of blood",
      "Persistent bleeding from the chest tube at a rate of 50 cc/h",
      "Chest radiograph with greater than 50% lung field white out",
      "Evidence of a PTX"
    ],
    "answer": 1,
    "explanation": "Initial chest tube drainage >1000-1500 cc, or >200 cc/h for 2-4 h, indicates ongoing hemorrhage requiring thoracotomy."
  },
  {
    "id": 134,
    "part": 3,
    "category": "Trauma & Resuscitation",
    "q": "32yo woman MVC, abdominal pain, distended abdomen, positive FAST in LUQ, BP 90/70, HR 120. After 2 L crystalloid, BP 80/60. Next step?",
    "options": [
      "Administer a vasoconstrictor, such as epinephrine.",
      "Administer another 2 L of crystalloid.",
      "Administer type O, Rh-negative blood.",
      "Bring patient to the CT scanner for an emergent scan.",
      "Perform another FAST examination to see if the fluid is increasing."
    ],
    "answer": 2,
    "explanation": "Hypotension persisting after crystalloid in hemorrhagic shock warrants immediate blood transfusion (type O Rh-negative) and operative intervention."
  },
  {
    "id": 135,
    "part": 3,
    "category": "Trauma & Resuscitation",
    "q": "27yo pregnant woman (3rd trimester) in low-speed MVC, seat-belted. BP 120/70, HR 107. FAST negative, fetus stable. Next step in management?",
    "options": [
      "Perform an immediate cesarean section in the OR.",
      "Perform an immediate cesarean section in the ED.",
      "CT scan of the abdomen and pelvis to rule out occult injury.",
      "Discharge the patient if laboratory testing is normal.",
      "Monitor the patient and fetus for a minimum of 4 hours."
    ],
    "answer": 4,
    "explanation": "Stable pregnant trauma patients with negative FAST and reassuring fetal status require at least 4 hours of maternal and fetal monitoring."
  },
  {
    "id": 136,
    "part": 3,
    "category": "Trauma & Resuscitation",
    "q": "61M with low back pain after slip, bilateral leg radiation, urinary difficulty, absent plantar flexion, diminished rectal tone. History of vascular surgery. Best diagnosis?",
    "options": [
      "Abdominal aortic aneurysm",
      "Disk herniation",
      "Spinal stenosis",
      "Cauda equina syndrome",
      "Osteomyelitis"
    ],
    "answer": 3,
    "explanation": "Cauda equina syndrome: saddle anesthesia, bowel/bladder dysfunction, bilateral leg pain/weakness, diminished rectal tone. Emergent MRI and decompression."
  },
  {
    "id": 137,
    "part": 3,
    "category": "Trauma & Resuscitation",
    "q": "55F struck by car, GCS 8, left pupil dilated. Preparing to intubate. Which has the quickest effect to reduce ICP?",
    "options": [
      "Cranial decompression",
      "Dexamethasone",
      "Furosemide",
      "Hyperventilation",
      "Mannitol"
    ],
    "answer": 3,
    "explanation": "Hyperventilation lowers PaCO2, causing cerebral vasoconstriction and rapid ICP reduction within minutes. Definitive treatment is decompression."
  },
  {
    "id": 138,
    "part": 3,
    "category": "Trauma & Resuscitation",
    "q": "19M shot in chest, RR 32, SpO2 88% on 15L, trachea deviated left, absent breath sounds right. Most appropriate next step?",
    "options": [
      "Stat portable chest x-ray",
      "Intubation",
      "Perform ED thoracotomy",
      "Call the surgical service",
      "Needle decompression"
    ],
    "answer": 4,
    "explanation": "Tension pneumothorax is a clinical diagnosis. Immediate needle decompression followed by tube thoracostomy; do not delay for imaging."
  },
  {
    "id": 139,
    "part": 4,
    "category": "Shock & Critical Care",
    "q": "79yo woman with CAD, prior CABG, 2 days dyspnea/confusion, no chest pain/fever/cough. BP 85/50, HR 125, RR 26, rales at bases, 2+ bilateral edema. Most likely diagnosis?",
    "options": [
      "Hypovolemic shock",
      "Neurogenic shock",
      "Cardiogenic shock",
      "Anaphylactic shock",
      "Septic shock"
    ],
    "answer": 2,
    "explanation": "Elderly with CAD/CABG, hypotension, tachycardia, pulmonary rales, and bilateral edema indicate cardiogenic shock from acute heart failure."
  },
  {
    "id": 140,
    "part": 4,
    "category": "Shock & Critical Care",
    "q": "32yo man with palpitations, weakness for 2 days, heart racing for 6 hours. No chest pain or dyspnea. Vitals and ECG not provided. What is the most likely diagnosis?",
    "options": [
      "Atrial fibrillation",
      "Sinus tachycardia",
      "Ventricular tachycardia",
      "Supraventricular tachycardia",
      "Atrial flutter"
    ],
    "answer": 3,
    "explanation": "Young patient with sudden onset regular palpitations and no structural heart disease most likely has SVT (AVNRT/AVRT); ECG would show narrow-complex regular tachycardia."
  },
  {
    "id": 141,
    "part": 4,
    "category": "Shock & Critical Care",
    "q": "78yo woman on airplane with chest pain, dyspnea. BP 75/40, HR 180, wide QRS regular tachycardia, no P waves, bounding carotid pulse. Next step after emergency landing?",
    "options": [
      "Amiodarone IV",
      "Synchronized cardioversion",
      "Verapamil IV",
      "Lidocaine IV",
      "Procainamide IV"
    ],
    "answer": 1,
    "explanation": "Unstable wide-complex tachycardia (hypotension, distress) requires immediate synchronized cardioversion; medications are for stable patients."
  },
  {
    "id": 142,
    "part": 4,
    "category": "Shock & Critical Care",
    "q": "41yo IV heroin user in PEA arrest, intubated, no IV access. Which drug is ineffective when administered via endotracheal tube?",
    "options": [
      "Atropine",
      "Naloxone",
      "Lidocaine",
      "Epinephrine",
      "Sodium bicarbonate"
    ],
    "answer": 4,
    "explanation": "Sodium bicarbonate is not recommended for ET administration; epinephrine, atropine, lidocaine, and naloxone can be given via ET tube."
  },
  {
    "id": 143,
    "part": 4,
    "category": "Shock & Critical Care",
    "q": "75yo man with chest pain, dyspnea. BP 70/40, HR 140 irregular, rales at bases. ECG shows atrial fibrillation with rapid ventricular response. First-line treatment?",
    "options": [
      "Heparin drip",
      "Diltiazem 10 mg IV push",
      "Metoprolol 5 mg IV push",
      "Digoxin 0.5 mg IV",
      "Synchronized cardioversion at 100 J"
    ],
    "answer": 4,
    "explanation": "Unstable tachyarrhythmia (hypotension, ischemia, pulmonary edema) from rapid AF requires immediate synchronized cardioversion, not rate-control drugs."
  },
  {
    "id": 144,
    "part": 4,
    "category": "Shock & Critical Care",
    "q": "19M struck by car. Awake, severe right leg pain. BP 85/50, HR 125, RR 24. Airway patent, equal breath sounds, soft nontender abdomen. Right leg shortened, angulated, swollen anterior thigh, no open wound. Most likely diagnosis?",
    "options": [
      "Hypovolemic shock",
      "Neurogenic shock",
      "Cardiogenic shock",
      "Anaphylactic shock",
      "Septic shock"
    ],
    "answer": 0,
    "explanation": "Femur fracture causes significant blood loss (up to 1.5 L) leading to hypovolemic shock; other shock types inconsistent with exam."
  },
  {
    "id": 145,
    "part": 4,
    "category": "Shock & Critical Care",
    "q": "Hypotensive patient with altered mental status. ECG shows atrial flutter at 150 bpm with 2:1 AV block. Unstable, you elect emergency cardioversion. Monitor leads attached. Critical next step?",
    "options": [
      "Set the appropriate energy level",
      "Position conductor pads or paddles on patient",
      "Charge the defibrillator",
      "Turn on the synchronization mode",
      "Administer 25 μg of fentanyl IV"
    ],
    "answer": 3,
    "explanation": "Synchronization mode must be activated before cardioversion to avoid delivering shock during refractory period (R-on-T) and induce VF."
  },
  {
    "id": 146,
    "part": 4,
    "category": "Shock & Critical Care",
    "q": "54M found down, intubated, CPR ongoing. Monitor shows sinus bradycardia but no palpable pulses. Bilateral breath sounds, soft abdomen, no rashes, left arm AV graft. Next intervention besides CPR, epi, atropine?",
    "options": [
      "Administer 1 ampule of sodium bicarbonate",
      "Administer 1 ampule of calcium gluconate",
      "Administer 1 ampule of D50 (dextrose)",
      "Place left-sided chest tube",
      "Perform pericardiocentesis"
    ],
    "answer": 2,
    "explanation": "Dialysis patient (AV graft) with bradycardia and no pulses likely hyperkalemia; empiric calcium and glucose are indicated, but D50 is listed as next step. Actually calcium is first for hyperkalem"
  },
  {
    "id": 147,
    "part": 4,
    "category": "Shock & Critical Care",
    "q": "85M nursing home, incoherent, not eating. PMH: HTN, DM, dementia, BPH. Combative, oriented to name only. T 101°F, BP 85/50, HR 125, RR 22, glucose 154. Cachectic, clear lungs with scant crackles, soft abdomen, Foley with cloudy white urine. Most likely diagnosis?",
    "options": [
      "Hypovolemic shock",
      "Neurogenic shock",
      "Cardiogenic shock",
      "Anaphylactic shock",
      "Septic shock"
    ],
    "answer": 4,
    "explanation": "Elderly nursing home patient with fever, hypotension, tachycardia, and cloudy urine suggests urinary tract infection causing septic shock."
  },
  {
    "id": 148,
    "part": 4,
    "category": "Shock & Critical Care",
    "q": "72M with weakness, sudden unresponsive on monitor. Rhythm shown (monitor shows ventricular fibrillation). Next step?",
    "options": [
      "Wait 5 minutes to see if he awakens on his own.",
      "Immediately defibrillate at 200 J (biphasic).",
      "Perform synchronized cardioversion at 100 J.",
      "Immediately intubate the patient.",
      "Insert an IV line and administer amiodarone."
    ],
    "answer": 1,
    "explanation": "VF is a shockable rhythm; immediate defibrillation is indicated. Biphasic shock at 200 J is appropriate."
  },
  {
    "id": 149,
    "part": 4,
    "category": "Shock & Critical Care",
    "q": "Called to a code: patient intubated, IV access, monitor shows flat line with no pulses. EMT student doing chest compressions is asked to stop. Next step in management?",
    "options": [
      "Defibrillate at 360 J",
      "Epinephrine 1-mg IV push",
      "Atropine 1-mg IV push",
      "Ask the nurse to run a rhythm strip in an additional lead",
      "Apply transcutaneous pacers"
    ],
    "answer": 3,
    "explanation": "Asystole can be mimicked by fine VF or lead disconnection; confirm in a second lead before continuing ACLS. Defibrillation/pacing are not indicated for asystole."
  },
  {
    "id": 150,
    "part": 4,
    "category": "Shock & Critical Care",
    "q": "34-year-old woman at sushi dinner develops itching, facial flushing, chest pain, dyspnea, dizziness; BP 85/50, HR 125, RR 26, SpO2 91%. Most likely diagnosis?",
    "options": [
      "Hypovolemic shock",
      "Neurogenic shock",
      "Cardiogenic shock",
      "Anaphylactic shock",
      "Septic shock"
    ],
    "answer": 3,
    "explanation": "Acute onset of urticaria, flushing, respiratory compromise, and hypotension after food exposure is classic anaphylactic shock."
  },
  {
    "id": 151,
    "part": 4,
    "category": "Shock & Critical Care",
    "q": "82-year-old in septic shock intubated; tube passed through cords, colorimetric ETCO2 changes color, equal breath sounds, chest wall motion. Most reliable method to verify ET tube placement?",
    "options": [
      "Chest radiograph",
      "Visualization of the ET tube passing through the vocal cords",
      "Observation of chest wall motion with ventilation",
      "Hearing equal, bilateral breath sounds on auscultation",
      "End-tidal carbon dioxide color change"
    ],
    "answer": 4,
    "explanation": "Continuous end-tidal CO2 is the most reliable confirmation of endotracheal placement; auscultation and chest wall motion can be misleading."
  },
  {
    "id": 152,
    "part": 4,
    "category": "Shock & Critical Care",
    "q": "82-year-old man on HCTZ, benazepril, atenolol, metformin presents weak, dizzy, dyspneic; denies chest pain, GI bleeding, syncope. Vitals truncated. What is the next best step?",
    "options": [
      "Obtain ECG and check electrolytes, BUN/creatinine, and glucose",
      "Give 1 L normal saline bolus",
      "Start empiric antibiotics",
      "Order CT head",
      "Give atropine 1 mg IV"
    ],
    "answer": 0,
    "explanation": "Elderly on thiazide, ACE inhibitor, and beta-blocker with weakness/dizziness requires ECG and labs to evaluate bradycardia, electrolyte derangement, and renal failure."
  },
  {
    "id": 153,
    "part": 4,
    "category": "Shock & Critical Care",
    "q": "25-year-old man fell off surfboard onto rocks, immobilized, alert but weak in all extremities. Vitals truncated. What is the most appropriate next step?",
    "options": [
      "Obtain cervical spine imaging and neurosurgical consultation",
      "Clear the cervical collar clinically",
      "Give high-dose steroids",
      "Perform a log-roll and discharge if no tenderness",
      "Start antibiotics for presumed meningitis"
    ],
    "answer": 0,
    "explanation": "Weakness in all extremities after trauma suggests cervical spinal cord injury; maintain immobilization, obtain imaging, and consult neurosurgery."
  },
  {
    "id": 154,
    "part": 4,
    "category": "Shock & Critical Care",
    "q": "48M, CABG 1 month ago, bedridden with dizziness. HR 44, BP 86/60. Monitor shows complete heart block. What is initial treatment?",
    "options": [
      "Observe on monitor",
      "Transcutaneous pacing",
      "Transvenous pacing",
      "Atropine 0.5-mg IV",
      "Epinephrine IV drip at 2 μg/min"
    ],
    "answer": 2,
    "explanation": "Symptomatic complete heart block after CABG needs transvenous pacing; atropine is ineffective for infranodal block. TCP is a bridge but transvenous is definitive initial treatment."
  },
  {
    "id": 155,
    "part": 4,
    "category": "Shock & Critical Care",
    "q": "54F with schizophrenia and CAD, chest pain resolved, then transient loss of consciousness. Monitor shows torsades de pointes. Next step?",
    "options": [
      "Observe patient",
      "Magnesium sulfate IV",
      "Lidocaine IV",
      "Transvenous pacemaker",
      "Isoproterenol IV"
    ],
    "answer": 1,
    "explanation": "Torsades de pointes is treated with IV magnesium sulfate; observation or lidocaine is inappropriate for this polymorphic VT."
  },
  {
    "id": 156,
    "part": 4,
    "category": "Shock & Critical Care",
    "q": "48M with cirrhosis vomiting bright red blood, hypotensive (75/43), HR 130. Which fluid is most critical for resuscitation?",
    "options": [
      "7% Sodium chloride",
      "0.9% Sodium chloride",
      "Type and cross-matched blood",
      "Type-specific blood",
      "Type O, Rh-positive blood"
    ],
    "answer": 4,
    "explanation": "In severe hemorrhagic shock, uncrossmatched type O Rh-positive blood is given emergently; crystalloids should be minimized."
  },
  {
    "id": 157,
    "part": 4,
    "category": "Shock & Critical Care",
    "q": "19M with RLQ stab wound, BP 130/95, HR 111, soft nontender abdomen. Which fluid for initial resuscitation?",
    "options": [
      "7% Sodium chloride",
      "0.9% Sodium chloride",
      "10% Albumin",
      "Type and cross-matched blood",
      "Type-specific blood"
    ],
    "answer": 1,
    "explanation": "Initial resuscitation for trauma uses isotonic crystalloid (0.9% NaCl); blood is reserved for ongoing hemorrhage or shock."
  },
  {
    "id": 158,
    "part": 4,
    "category": "Shock & Critical Care",
    "q": "EMS brings in a patient who collapsed 5 min ago, intubated and in cardiac arrest. Monitor shows ventricular fibrillation. Next step?",
    "options": [
      "Perform synchronized cardioversion at 100 J",
      "Immediately defibrillate at 200 J",
      "Confirm the rhythm in two leads, begin CPR, then defibrillate at 200 J",
      "Confirm the rhythm in two leads, begin CPR, then administer amiodarone",
      "Confirm the rhythm in two leads, begin CPR, then administer epinephrine and atropine"
    ],
    "answer": 2,
    "explanation": "For VF, confirm rhythm, start CPR, and defibrillate immediately; synchronized cardioversion is for unstable tachycardias with a pulse."
  },
  {
    "id": 159,
    "part": 4,
    "category": "Shock & Critical Care",
    "q": "18F with fever, headache, arthralgias, petechial rash, nuchal rigidity, photophobia, oozing gums; platelets 80, PTT 60s, INR 1.9, fibrinogen 250. On ceftriaxone/vancomycin for meningococcemia. Next step?",
    "options": [
      "IV heparin",
      "Transfuse cryoprecipitate",
      "Transfuse packed red blood cells (RBC)",
      "Transfuse platelets",
      "Transfuse fresh frozen plasma (FFP)"
    ],
    "answer": 2,
    "explanation": "In DIC, transfuse when bleeding: platelets transfused if <50 with bleeding; here Hct 36 is okay but severe thrombocytopenia causes bleeding."
  },
  {
    "id": 160,
    "part": 4,
    "category": "Shock & Critical Care",
    "q": "82M COPD/HTN, septic shock from pneumonia, hypotensive despite IV fluids and dopamine. BP 75/50. Next most appropriate step?",
    "options": [
      "D5 normal saline IV bolus",
      "Phenylephrine IV drip",
      "Fludrocortisone IV",
      "Hydrocortisone IV",
      "Epinephrine IV drip"
    ],
    "answer": 3,
    "explanation": "Refractory septic shock warrants IV hydrocortisone for relative adrenal insufficiency; vasopressors alone inadequate."
  },
  {
    "id": 161,
    "part": 4,
    "category": "Shock & Critical Care",
    "q": "64F depressed, found down, bradycardic 42, hypotensive 70/40, first-degree AV block. On fluoxetine and atenolol. Most specific treatment for ingestion?",
    "options": [
      "Fluid bolus",
      "Atropine",
      "Glucagon",
      "Epinephrine",
      "Cardiac pacing"
    ],
    "answer": 2,
    "explanation": "Beta-blocker overdose: glucagon bypasses beta receptors, increasing cAMP and heart rate; most specific antidote."
  },
  {
    "id": 162,
    "part": 4,
    "category": "Shock & Critical Care",
    "q": "19M GSW left chest, hypotensive 70/40, HR 140, distended neck veins, clear lungs, muffled heart sounds; CXR globular heart. Given 2L NS. Definitive management?",
    "options": [
      "Intubation",
      "Tube thoracostomy",
      "Pericardiocentesis",
      "Thoracotomy",
      "Blood transfusion"
    ],
    "answer": 3,
    "explanation": "Penetrating chest trauma with tamponade physiology; definitive is thoracotomy for hemorrhage control, not pericardiocentesis."
  },
  {
    "id": 163,
    "part": 4,
    "category": "Shock & Critical Care",
    "q": "84F metastatic breast cancer, dyspnea, hypotensive 70/50, HR 110; ultrasound shows echo-free space with RA/RV collapse. Most likely diagnosis?",
    "options": [
      "Pulmonary embolism",
      "Congestive heart failure",
      "Massive myocardial infarction (MI)",
      "Cardiac tamponade",
      "Dehydration"
    ],
    "answer": 3,
    "explanation": "Echo findings of pericardial effusion with right heart collapse indicate cardiac tamponade, causing obstructive shock."
  },
  {
    "id": 164,
    "part": 4,
    "category": "Shock & Critical Care",
    "q": "50M with HTN, 1h severe left chest pain radiating to arm, nausea. Vitals: 98.3F, 160/92, HR 92, RR 16, SpO2 98%. ECG: ST elevation in II, III, aVF. Given aspirin, nitroglycerin, morphine. 10 min later BP 60/30, HR 100. Most likely cause of hypotension?",
    "options": [
      "Medication-related adverse reaction",
      "Cardiogenic shock",
      "Papillary muscle rupture",
      "Free wall rupture",
      "Rupture of the interventricular septum"
    ],
    "answer": 0,
    "explanation": "Inferior MI with right ventricular involvement is preload-dependent; nitroglycerin and morphine can cause severe hypotension. Hold nitrates, give fluids."
  },
  {
    "id": 165,
    "part": 4,
    "category": "Shock & Critical Care",
    "q": "87F with dementia, arthritis, HTN presents with mid-epigastric pain and one episode of nonbloody, nonbilious vomiting. Oriented to name only. Temp 99.8F, HR 110, BP 80/44, RR 16, SpO2 96%. Abdomen soft, nontender, no rebound/guarding. Stool brown, guaiac negative. Two IVs placed, fluids started",
    "options": [
      "Start IV antibiotics",
      "Order a CT scan of her abdomen",
      "Call the surgery service",
      "Place a central venous line",
      "Discharge home with Maalox"
    ],
    "answer": 2,
    "explanation": "Pneumoperitoneum on CXR indicates hollow viscus perforation; immediate surgical consultation is required. Elderly may lack peritoneal signs."
  },
  {
    "id": 166,
    "part": 5,
    "category": "Gastrointestinal Bleeding",
    "q": "51M with bleeding ulcer, black stool, hematemesis. BP 90/60→80/50, HR 110→114, becoming drowsy. Most appropriate next step?",
    "options": [
      "Assess airway, two large-bore IVs, cross-match, 1-2 L NS, emergent endoscopy",
      "Assess airway, two large-bore IVs, cross-match, administer proton pump inhibitor",
      "Two large-bore IVs, cross-match, 1-2 L NS, emergent endoscopy",
      "Intubate, two large-bore IVs, cross-match, 1-2 L NS, emergent endoscopy",
      "Intubate, two large-bore IVs, cross-match, administer proton pump inhibitor"
    ],
    "answer": 3,
    "explanation": "Patient is deteriorating with altered mental status from hemorrhagic shock; secure airway via intubation before resuscitation and endoscopy."
  },
  {
    "id": 167,
    "part": 5,
    "category": "Gastrointestinal Bleeding",
    "q": "45F with 1 day painful rectal bleeding. Exquisitely tender, bluish, engorged swelling distal to anal verge. HR 105. Next best step?",
    "options": [
      "Warm sitz baths, topical analgesics, stool softeners, high-fiber diet, surgical follow-up",
      "Incision and drainage under local anesthesia or procedural sedation, packing, surgical follow-up",
      "CBC, clotting studies, type and cross, emergent colonoscopy",
      "Excision under local anesthesia followed by sitz baths and analgesics",
      "Surgical consult for immediate operative management"
    ],
    "answer": 1,
    "explanation": "Thrombosed external hemorrhoid with severe pain warrants incision and drainage (or excision) for immediate relief; conservative therapy is for mild cases."
  },
  {
    "id": 168,
    "part": 5,
    "category": "Gastrointestinal Bleeding",
    "q": "20M with fever, RLQ pain, 2 months crampy pain, weight loss, bloody diarrhea, recurrent perirectal abscesses. CT: distal ileal and colonic inflammation, no appendiceal stranding. Diagnosis?",
    "options": [
      "Crohn disease",
      "Ulcerative colitis",
      "Appendicitis",
      "Pseudomembranous enterocolitis",
      "Diverticulitis"
    ],
    "answer": 0,
    "explanation": "Chronic transmural inflammation with perirectal abscesses, ileocolonic involvement, and skip lesions is classic for Crohn disease."
  },
  {
    "id": 169,
    "part": 5,
    "category": "Gastrointestinal Bleeding",
    "q": "62M with sudden severe epigastric pain, prior postprandial pain. Pale, rigid tender abdomen, guarding/rebound, orthostatic vitals, Hb 8.5. Diagnosis?",
    "options": [
      "Boerhaave syndrome",
      "Perforated gastric ulcer",
      "Abdominal aortic aneurysm",
      "Inflammatory bowel disease",
      "Diverticulosis"
    ],
    "answer": 1,
    "explanation": "History of ulcer symptoms with sudden severe pain, peritonitis, and anemia suggests perforated gastric ulcer with hemorrhage."
  },
  {
    "id": 170,
    "part": 5,
    "category": "Gastrointestinal Bleeding",
    "q": "60M alcoholic with hematemesis after binge vomiting, red eyes, no abdominal/chest pain. HR 115, stable otherwise. Endoscopy likely confirms?",
    "options": [
      "Esophageal varices",
      "Boerhaave syndrome",
      "Curling ulcer",
      "Perforated gastric ulcer",
      "Mallory-Weiss tear"
    ],
    "answer": 4,
    "explanation": "Hematemesis after repeated vomiting with no pain or varices risk factors is classic for Mallory-Weiss mucosal tear at the GE junction."
  },
  {
    "id": 171,
    "part": 5,
    "category": "Gastrointestinal Bleeding",
    "q": "50M with hematemesis, HR 127, BP 79/45. Spider angiomata, palmar erythema, gynecomastia. Hct 28%, platelets 40, AST 675, ALT 325, bili 14.4. Most likely diagnosis?",
    "options": [
      "Perforated gastric ulcer",
      "Diverticulosis",
      "Splenic laceration",
      "Esophageal varices",
      "Ruptured AAA"
    ],
    "answer": 3,
    "explanation": "Stigmata of chronic liver disease, thrombocytopenia, and elevated AST/ALT with hyperbilirubinemia indicate portal hypertension; hematemesis is from varices."
  },
  {
    "id": 172,
    "part": 5,
    "category": "Gastrointestinal Bleeding",
    "q": "55M alcoholic with cirrhosis, portal hypertension, and known esophageal varices presents with hematemesis, HR 110, BP 80/55. Which is inappropriate in initial management?",
    "options": [
      "Sengstaken-Blakemore tube placement",
      "Two large-bore IV lines and volume repletion with crystalloid",
      "Nasogastric (NG) lavage",
      "IV octreotide",
      "Gastrointestinal (GI) consult"
    ],
    "answer": 0,
    "explanation": "Sengstaken-Blakemore tube is not initial management; it is used for refractory hemorrhage after failed pharmacologic/endoscopic therapy due to high complication risk."
  },
  {
    "id": 173,
    "part": 5,
    "category": "Gastrointestinal Bleeding",
    "q": "70F with dark stool and occasional bright red blood for 3 weeks, decreased appetite, constipation, 10-lb weight loss, fatigue. Orthostatic. Most likely diagnosis?",
    "options": [
      "Hemorrhoids",
      "Diverticulitis",
      "Mallory-Weiss tear",
      "Diverticulosis",
      "Adenocarcinoma"
    ],
    "answer": 4,
    "explanation": "Chronic melena, weight loss, anorexia, and new constipation in an elderly patient strongly suggest colorectal adenocarcinoma, not benign diverticular bleeding."
  },
  {
    "id": 174,
    "part": 5,
    "category": "Gastrointestinal Bleeding",
    "q": "76F with CHF, CAD, irregular heartbeat, several days abdominal pain. HR 114 irregularly irregular, abdomen soft nontender, stool heme-positive. Highest risk for which condition?",
    "options": [
      "Perforated gastric ulcer",
      "Diverticulitis",
      "Acute cholecystitis",
      "Mesenteric ischemia",
      "Sigmoid volvulus"
    ],
    "answer": 3,
    "explanation": "Atrial fibrillation with abdominal pain and heme-positive stool raises concern for embolic acute mesenteric ischemia, which can present with pain out of proportion."
  },
  {
    "id": 175,
    "part": 5,
    "category": "Gastrointestinal Bleeding",
    "q": "70F with HTN, CHF, AF, acute diffuse abdominal pain, pain out of proportion, lactate 8, trace heme-positive stool. Concerned for mesenteric ischemia. Best diagnostic test?",
    "options": [
      "Serum lactate levels",
      "Abdominal radiograph (supine and upright)",
      "CT scan",
      "Angiography",
      "Barium contrast study"
    ],
    "answer": 3,
    "explanation": "Angiography is the gold standard for diagnosing acute mesenteric ischemia; CT angiography is often used initially, but conventional angiography allows diagnosis and therapy."
  },
  {
    "id": 176,
    "part": 5,
    "category": "Gastrointestinal Bleeding",
    "q": "55M with ESRD on HD presents with painless hematochezia; prior angiodysplasia. HR 90, BP 145/95, abdomen soft/nontender. Which statement about angiodysplasia is true?",
    "options": [
      "They are responsible for over 50% of acute lower GI bleeding.",
      "They are more common in younger patients.",
      "Angiography is the most sensitive method for identifying angiodysplasias.",
      "They are less common in patients with end-stage renal disease.",
      "The majority are located on the right side of the colon."
    ],
    "answer": 4,
    "explanation": "Angiodysplasias are most common in the right colon/c Cecum; they are more common in elderly and ESRD. They cause <10% of lower GI bleeds; colonoscopy is most sensitive."
  },
  {
    "id": 177,
    "part": 5,
    "category": "Gastrointestinal Bleeding",
    "q": "49M vomited ~3 cups blood over 2 hours with epigastric pain. NG tube returns 200 mL coffee-ground blood. What is the most common etiology of upper GI bleed?",
    "options": [
      "Varices",
      "Peptic ulcer",
      "Gastric erosions",
      "Mallory-Weiss tear",
      "Esophagitis"
    ],
    "answer": 1,
    "explanation": "Peptic ulcer disease is the most common cause of upper GI bleeding, accounting for ~50% of cases."
  },
  {
    "id": 178,
    "part": 5,
    "category": "Gastrointestinal Bleeding",
    "q": "68M 4h post-upper endoscopy with biopsy of ulcerated dysphagia lesion; severe neck/chest pain, HR 123, T 101, crepitus in neck, crunching over heart. Next best step after surgical consult?",
    "options": [
      "Perform an immediate bronchoscopy.",
      "Give aspirin 325 mg and obtain cardiology consult for possible catheterization.",
      "Repeat endoscopy to evaluate the biopsy site.",
      "Perform an immediate thoracotomy.",
      "Order an immediate esophagram with water-soluble agent."
    ],
    "answer": 4,
    "explanation": "Signs suggest esophageal perforation (pneumomediastinum). Water-soluble esophagram confirms diagnosis; immediate surgery may follow."
  },
  {
    "id": 179,
    "part": 5,
    "category": "Gastrointestinal Bleeding",
    "q": "65M with diverticulosis presents with 2-3 days RLQ pain, fever, nausea; RLQ tenderness with rebound/guarding, HR 95, T 101.3. CT shows pericolic fat inflammation, bowel wall thickening, fluid-filled appendix. Next step?",
    "options": [
      "Discharge with broad-spectrum oral antibiotics and surgical follow-up.",
      "Begin IV hydration and broad-spectrum antibiotics, keep patient NPO, and admit.",
      "Begin IV antibiotics and call surgery for emergent operative procedure.",
      "Arrange emergent barium enema to confirm diagnosis.",
      "Begin sulfasalazine 3-4 g/d with IV steroid therapy."
    ],
    "answer": 1,
    "explanation": "Acute diverticulitis without abscess/perforation is managed with bowel rest, IV fluids, and antibiotics; emergent surgery is not indicated."
  },
  {
    "id": 180,
    "part": 5,
    "category": "Gastrointestinal Bleeding",
    "q": "20M with several weeks of painful rectal bleeding, worst during and after defecation; bright red blood on toilet paper. No fever, nausea, or vomiting. Most common etiology of painful rectal bleeding?",
    "options": [
      "External hemorrhoid",
      "Anal fissure",
      "Anorectal tumor",
      "Internal hemorrhoid",
      "Venereal proctitis"
    ],
    "answer": 1,
    "explanation": "Anal fissure is the most common cause of painful rectal bleeding, typically with pain on defecation and small amounts of bright red blood."
  },
  {
    "id": 181,
    "part": 5,
    "category": "Gastrointestinal Bleeding",
    "q": "67F with HTN/CHF presents with burning epigastric pain worsening over weeks, now waking her at night, unrelieved by usual meds. Guaiac-positive stool. What is the most common serious complication of peptic ulcer disease?",
    "options": [
      "GI hemorrhage",
      "GI perforation",
      "GI penetration",
      "Gastric outlet obstruction",
      "Pernicious anemia"
    ],
    "answer": 0,
    "explanation": "Hemorrhage is the most common serious complication of PUD; perforation, penetration, and obstruction are less common."
  },
  {
    "id": 182,
    "part": 5,
    "category": "Gastrointestinal Bleeding",
    "q": "78M with ASCVD/CHF presents with sudden progressive abdominal pain for 1 day, one episode of melena. HR 105, temp 99F. He is at high risk for which condition?",
    "options": [
      "Cholecystitis",
      "Cecal volvulus",
      "Mesenteric ischemia",
      "Perforated peptic ulcer",
      "Small bowel obstruction"
    ],
    "answer": 2,
    "explanation": "Acute mesenteric ischemia risk rises with age, atherosclerosis, CHF, and AF; pain out of proportion and melena support it."
  },
  {
    "id": 183,
    "part": 6,
    "category": "ALS & Resuscitation",
    "q": "Which of the following statements is correct regarding ST-segment elevation myocardial infarction (STEMI)?",
    "options": [
      "May present with ST depression in leads V1-V3",
      "Rarely causes ventricular fibrillation",
      "May never present with new LBBB on ECG",
      "Is always accompanied by acute chest pain"
    ],
    "answer": 0,
    "explanation": "True posterior STEMI presents with reciprocal ST-segment depression in leads V1-V3."
  },
  {
    "id": 184,
    "part": 6,
    "category": "ALS & Resuscitation",
    "q": "With regard to standard ECG recording and continuous monitoring:",
    "options": [
      "Normal QRS complex duration is > 0.12 s",
      "Electrodes for 3-lead monitoring are best placed over bone",
      "Continuous monitoring via pads is preferred over ECG electrodes",
      "Normal PR interval is more than 0.20 s"
    ],
    "answer": 1,
    "explanation": "Placing electrodes over bone (clavicles/ribs) minimizes muscular somatic tremor artifact."
  },
  {
    "id": 185,
    "part": 6,
    "category": "ALS & Resuscitation",
    "q": "At 4 min after cardiac arrest in a 70 kg woman with confirmed asystole on ECG and CPR ongoing, you recommend:",
    "options": [
      "Delivery of a 150 J shock",
      "Calcium chloride 5 mL 10% IV",
      "Sodium bicarbonate 500 mmol IV",
      "Adrenaline 1 mg IV"
    ],
    "answer": 3,
    "explanation": "For non-shockable arrest rhythms (asystole/PEA), Adrenaline 1 mg IV is indicated as soon as feasible."
  },
  {
    "id": 186,
    "part": 6,
    "category": "ALS & Resuscitation",
    "q": "Post-VF cardiac arrest ABG on 15 L/min O2: pH 7.11, PaCO2 7.2 kPa, PaO2 22.6 kPa, HCO3 14 mmol/L, BE -10.6. These results show:",
    "options": [
      "The patient has severe acidaemia",
      "Compensatory metabolic alkalosis is present",
      "Oxygenation is appropriate for FiO2 85%",
      "50 mmol 8.4% sodium bicarbonate is immediately required"
    ],
    "answer": 0,
    "explanation": "pH 7.11 (<7.35) confirms severe mixed respiratory and metabolic acidaemia post-cardiac arrest."
  },
  {
    "id": 187,
    "part": 6,
    "category": "ALS & Resuscitation",
    "q": "Which statement is correct regarding Pulseless Electrical Activity (PEA)?",
    "options": [
      "Should be treated by giving 300 mg amiodarone IV",
      "Is rarely the arrest rhythm in severe hypovolaemia",
      "Characterised by organised ECG rhythm without a palpable pulse",
      "Is rarely the first monitored rhythm in arrest"
    ],
    "answer": 2,
    "explanation": "PEA is defined as organized cardiac electrical activity on monitor without a palpable arterial pulse."
  },
  {
    "id": 188,
    "part": 6,
    "category": "ALS & Resuscitation",
    "q": "A 55-year-old woman presents with severe crushing chest pain, BP 75/45 mmHg, HR 38 bpm (sinus bradycardia). Management includes:",
    "options": [
      "Opioid analgesia is contraindicated",
      "Adrenaline infusion 20-100 mcg/min is first line",
      "24% oxygen via mask until ABG is known",
      "Atropine 500 mcg IV should be given"
    ],
    "answer": 3,
    "explanation": "Symptomatic sinus bradycardia with adverse signs (shock/hypotension) is treated with Atropine 500 mcg IV."
  },
  {
    "id": 189,
    "part": 6,
    "category": "ALS & Resuscitation",
    "q": "The correct advanced life support management of an adult in ventricular fibrillation (VF) includes:",
    "options": [
      "Adrenaline 1 mg IV after every shock",
      "An initial biphasic shock energy of at least 120 J",
      "Atropine 3 mg after 2 loops",
      "Digoxin 500 mcg IV push"
    ],
    "answer": 1,
    "explanation": "Initial biphasic defibrillation shock energy must be at least 120-150 J (typically 150-200 J)."
  },
  {
    "id": 190,
    "part": 6,
    "category": "ALS & Resuscitation",
    "q": "Which of the following statements regarding resuscitation drugs is correct?",
    "options": [
      "Initial dose of amiodarone for shock-refractory VF is 150 mg",
      "Lidocaine 100 mg is preferred for all broad-complex VT",
      "Adrenaline 1 mg IV is given before the 1st shock in VF",
      "Adenosine is effective in terminating regular SVT"
    ],
    "answer": 3,
    "explanation": "Adenosine rapidly terminates AV node-dependent regular narrow-complex tachycardias (PSVT)."
  },
  {
    "id": 191,
    "part": 6,
    "category": "ALS & Resuscitation",
    "q": "During advanced life support CPR, high-quality chest compressions:",
    "options": [
      "Should be performed at a rate of 60/min in adults",
      "Should not be interrupted for rhythm change in 2-min cycle unless ROSC",
      "Should be interrupted to palpate a pulse in agonal breathing",
      "Are interrupted for ventilation after tracheal intubation"
    ],
    "answer": 1,
    "explanation": "Chest compressions should continue without pause during 2-min cycles unless clear signs of ROSC appear."
  },
  {
    "id": 192,
    "part": 6,
    "category": "ALS & Resuscitation",
    "q": "In the management of acute severe asthma:",
    "options": [
      "Oxygen should be titrated to achieve SpO2 88-90%",
      "Magnesium sulfate 2 g (8 mmol) IV can produce bronchodilatation",
      "A PaCO2 of 6 kPa is a sign of good prognosis",
      "Cardiac arrest is mainly secondary to hypercapnia"
    ],
    "answer": 1,
    "explanation": "IV Magnesium sulfate (1.2-2 g) promotes bronchial smooth muscle relaxation in severe asthma."
  },
  {
    "id": 193,
    "part": 6,
    "category": "ALS & Resuscitation",
    "q": "In a patient with suspected severe anaphylaxis:",
    "options": [
      "Adrenaline 0.5 mg IM is the first-line treatment of choice",
      "Colloids are preferred to crystalloids for fluid resuscitation",
      "Systemic steroids must be given before adrenaline",
      "Skin and mucosal changes are uncommon features"
    ],
    "answer": 0,
    "explanation": "Intramuscular Adrenaline (0.5 mg 1:1000 in adults) is the prompt life-saving drug of choice."
  },
  {
    "id": 194,
    "part": 6,
    "category": "ALS & Resuscitation",
    "q": "A 65-year-old with chest pain develops regular broad QRS tachycardia at 180 bpm and BP 86/54 mmHg. The immediate management is:",
    "options": [
      "Amiodarone 300 mg IV infusion over 30 minutes",
      "Verapamil 10 mg slow IV push",
      "Immediate synchronized DC cardioversion",
      "Adenosine 6 mg rapid IV push"
    ],
    "answer": 2,
    "explanation": "Broad-complex tachycardia with adverse features (hypotension/shock) requires synchronized DC cardioversion."
  },
  {
    "id": 195,
    "part": 6,
    "category": "ALS & Resuscitation",
    "q": "Which of the following is true regarding severe hyperkalaemia?",
    "options": [
      "Can be treated by giving 10 mL 1% calcium chloride IV",
      "Causes tall, peaked T waves and ST-segment changes on ECG",
      "Is defined as a plasma potassium concentration of > 5.5 mmol/L",
      "May be caused by heart failure alone"
    ],
    "answer": 1,
    "explanation": "Hyperkalaemia characteristically causes tall peaked symmetrical T waves, PR prolongation, and QRS widening."
  },
  {
    "id": 196,
    "part": 6,
    "category": "ALS & Resuscitation",
    "q": "During Advanced Life Support (ALS) defibrillation:",
    "options": [
      "If rhythm changes during ventilations from asystole to VF, shock",
      "Amplitude of VF waveform determines shock indication",
      "Pads must always be placed antero-posterior in ICD patients",
      "Higher defibrillation energies may be required in severe asthma"
    ],
    "answer": 3,
    "explanation": "Hyperinflated lungs in asthma increase transthoracic impedance, requiring higher shock energies."
  },
  {
    "id": 197,
    "part": 6,
    "category": "ALS & Resuscitation",
    "q": "In a patient suspected of having an acute coronary syndrome (ACS):",
    "options": [
      "Thrombolysis is contraindicated if surgery within 1 month",
      "Fibrinolytic therapy is less effective than primary PCI",
      "Troponin values above normal always indicate myocardial infarction",
      "A single normal 12-lead ECG excludes ACS completely"
    ],
    "answer": 1,
    "explanation": "Primary PCI provides superior reperfusion, lower re-infarction, and lower intracranial hemorrhage vs lysis."
  },
  {
    "id": 198,
    "part": 6,
    "category": "ALS & Resuscitation",
    "q": "With reference to the 12-lead ECG shown in the image:",
    "options": [
      "Cardiac monitoring is optional",
      "Primary PCI is indicated immediately",
      "Sinus bradycardia is present",
      "Aspirin should be avoided"
    ],
    "answer": 1,
    "explanation": "Acute inferior STEMI requires emergent coronary reperfusion therapy, preferably primary PCI.",
    "imageFile": "q198_stemi_ecg.jpg"
  },
  {
    "id": 199,
    "part": 6,
    "category": "ALS & Resuscitation",
    "q": "With reference to the rhythm strip shown in the image:",
    "options": [
      "Defibrillation is the treatment of choice",
      "A precordial thump is always indicated",
      "Adrenaline 1 mg IV is initial treatment before shock",
      "This rhythm is associated with spontaneous circulation"
    ],
    "answer": 0,
    "explanation": "Ventricular fibrillation (VF) in cardiac arrest mandates immediate unsynchronized electrical defibrillation.",
    "imageFile": "q199_vf_strip.jpg"
  },
  {
    "id": 200,
    "part": 6,
    "category": "ALS & Resuscitation",
    "q": "With reference to the rhythm strip shown in the image:",
    "options": [
      "The rhythm is regular",
      "The rhythm originates in the ventricles",
      "P waves are clearly present",
      "Heart rate is under 100 beats per minute"
    ],
    "answer": 0,
    "explanation": "Supraventricular tachycardia (SVT) presents as a rapid, regular rhythm with narrow QRS complexes.",
    "imageFile": "q200_svt_strip.jpg"
  },
  {
    "id": 201,
    "part": 6,
    "category": "ALS & Resuscitation",
    "q": "With reference to the rhythm strip shown in the image:",
    "options": [
      "This rhythm is always associated with unconsciousness",
      "Transvenous cardiac pacing may be appropriate",
      "A patient with this rhythm will not have a pulse",
      "The patient is not at risk of developing asystole"
    ],
    "answer": 1,
    "explanation": "Third-degree (complete) AV block with adverse signs (hypotension) requires pacing.",
    "imageFile": "q201_pacing_strip.jpg"
  },
  {
    "id": 202,
    "part": 6,
    "category": "ALS & Resuscitation",
    "q": "With reference to the rhythm strip shown in the image:",
    "options": [
      "Adrenaline is contraindicated in this rhythm",
      "Atropine 0.5 mg IV is the initial drug of choice",
      "The PR interval is abnormally prolonged",
      "The ventricular rate is in the range 50-60 bpm"
    ],
    "answer": 1,
    "explanation": "Atropine 0.5 mg (or 500 mcg) IV bolus is the initial first-line medication for unstable bradycardia.",
    "imageFile": "q202_brady_strip.jpg"
  },
  {
    "id": 203,
    "part": 6,
    "category": "ALS & Resuscitation",
    "q": "With reference to the rhythm strip shown in the image:",
    "options": [
      "P waves are clearly visible",
      "The rhythm is irregular",
      "The QRS complex is normal duration",
      "The ventricular rate is greater than 200 min-1"
    ],
    "answer": 3,
    "explanation": "Rapid monomorphic VT or flutter with 1:1 conduction exceeds 200 bpm with wide regular QRS complexes.",
    "imageFile": "q203_fast_strip.jpg"
  },
  {
    "id": 204,
    "part": 6,
    "category": "ALS & Resuscitation",
    "q": "With reference to the rhythm strip shown in the image:",
    "options": [
      "Amiodarone 300 mg slow IV is the first option",
      "Atropine 0.5 mg IV is appropriate treatment",
      "If the patient is conscious, no treatment is required",
      "Synchronised electrical cardioversion is treatment of choice"
    ],
    "answer": 3,
    "explanation": "Any tachyarrhythmia with adverse features (systolic BP < 90 mmHg / shock) mandates synchronized DC cardioversion.",
    "imageFile": "q204_cardiovert_strip.jpg"
  },
  {
    "id": 205,
    "part": 7,
    "category": "Emergency Radiology Cases",
    "q": "56 year old male presented by the following CT findings after road traffic accident. The initial diagnosis is:",
    "options": [
      "Acute cerebrovascular ischemia",
      "Parenchymal contusion",
      "Intraventricular hemorrhage",
      "Acute extra-dural (epidural) hematoma",
      "Subarachnoid hemorrhage"
    ],
    "answer": 3,
    "explanation": "Biconvex (lens-shaped) hyperdense extra-axial collection limited by suture lines indicates epidural hematoma.",
    "imageFile": "q205_epidural.jpg"
  },
  {
    "id": 206,
    "part": 7,
    "category": "Emergency Radiology Cases",
    "q": "In the same previous patient: Is this hematoma mostly associated with underlying calvarial fracture?",
    "options": [
      "Yes",
      "No"
    ],
    "answer": 0,
    "explanation": "Epidural hematomas are associated with an overlying skull (calvarial) fracture in 85-95% of adult cases.",
    "imageFile": "q206_epidural.jpg"
  },
  {
    "id": 207,
    "part": 7,
    "category": "Emergency Radiology Cases",
    "q": "In the same previous patient. The mostly affected vessel is:",
    "options": [
      "Internal carotid artery",
      "Middle meningeal artery",
      "Middle cerebral artery",
      "Posterior cerebral artery",
      "Bridging subdural veins"
    ],
    "answer": 1,
    "explanation": "Laceration of the middle meningeal artery (MMA) beneath the pterion is the primary cause of epidural hematoma.",
    "imageFile": "q207_epidural.jpg"
  },
  {
    "id": 208,
    "part": 7,
    "category": "Emergency Radiology Cases",
    "q": "62 year old male presented by the following CT findings after recent left hemiplegic insult. The most probable diagnosis is:",
    "options": [
      "Acute cerebral ischemic infarct",
      "Cerebral parenchymal hemorrhage (ICH)",
      "Middle meningeal artery perforation",
      "Subacute subdural hematoma",
      "Diffuse axonal injury"
    ],
    "answer": 1,
    "explanation": "Acute intraparenchymal hyperattenuation (bright white) with surrounding vasogenic edema indicates hemorrhage.",
    "imageFile": "q208_ich.jpg"
  },
  {
    "id": 209,
    "part": 7,
    "category": "Emergency Radiology Cases",
    "q": "59 year old female presented by the following CT findings after recent left hemiplegic insult. The most probable diagnosis is:",
    "options": [
      "Cerebral ischemic infarct",
      "Cerebral hemorrhage",
      "Extra-dural hematoma",
      "Subdural hematoma",
      "Subarachnoid hemorrhage"
    ],
    "answer": 0,
    "explanation": "A wedge-shaped area of parenchymal hypodensity conforming to a vascular territory indicates ischemic infarction.",
    "imageFile": "q209_infarct.jpg"
  },
  {
    "id": 210,
    "part": 7,
    "category": "Emergency Radiology Cases",
    "q": "22 year old female presented by the following CT findings after severe headache. The most probable diagnosis is:",
    "options": [
      "Cerebral ischemic infarct",
      "Subarachnoid hemorrhage (SAH)",
      "Extra-dural hematoma",
      "Subdural hematoma",
      "Epidural hematoma"
    ],
    "answer": 1,
    "explanation": "High-attenuation acute blood within the basal cisterns, sulci, and sylvian fissures is pathognomonic for SAH.",
    "imageFile": "q210_sah.jpg"
  },
  {
    "id": 211,
    "part": 7,
    "category": "Emergency Radiology Cases",
    "q": "In the same previous patient. The most appropriate next radiological imaging modality is:",
    "options": [
      "MR brain non-contrast",
      "CT angiography (CTA)",
      "MR perfusion",
      "SWI sequence only",
      "Diffusion-weighted sequence"
    ],
    "answer": 1,
    "explanation": "CT Angiography (CTA) of intracranial vessels is the preferred emergent test to identify a ruptured aneurysm.",
    "imageFile": "q211_sah.jpg"
  },
  {
    "id": 212,
    "part": 7,
    "category": "Emergency Radiology Cases",
    "q": "Plain X-ray abdomen standing. The initial diagnosis is:",
    "options": [
      "Acute cholecystitis",
      "Acute pancreatitis",
      "Perforated viscus",
      "Intestinal obstruction",
      "Acute appendicitis"
    ],
    "answer": 3,
    "explanation": "Multiple dilated small bowel loops with air-fluid levels arranged in a step-ladder configuration indicate obstruction.",
    "imageFile": "q212_obstruction.jpg"
  },
  {
    "id": 213,
    "part": 7,
    "category": "Emergency Radiology Cases",
    "q": "Plain X-ray abdomen standing. The initial diagnosis is:",
    "options": [
      "Acute cholecystitis",
      "Acute pancreatitis",
      "Perforated gut (pneumoperitoneum)",
      "Intestinal obstruction",
      "Acute appendicitis"
    ],
    "answer": 2,
    "explanation": "Free air under the diaphragmatic dome (pneumoperitoneum) indicates perforation of an abdominal hollow viscus.",
    "imageFile": "q213_pneumoperitoneum.jpg"
  },
  {
    "id": 214,
    "part": 7,
    "category": "Emergency Radiology Cases",
    "q": "Plain X-ray abdomen standing. Does it exclude ruptured peptic ulcer?",
    "options": [
      "Yes",
      "No"
    ],
    "answer": 1,
    "explanation": "No; free gas is absent on plain radiographs in 20-30% of perforated peptic ulcers; emergent CT is needed.",
    "imageFile": "q214_peptic_ulcer.jpg"
  },
  {
    "id": 215,
    "part": 8,
    "category": "Basic Life Support Pretest & CPR",
    "q": "How deep should chest compressions be delivered for an adult victim of cardiac arrest?",
    "options": [
      "At least 5 to 6 cm (2 to 2.4 inches)",
      "1 inch (2.5 cm)",
      "2 to 3 cm",
      "0.5 inches (1 cm)"
    ],
    "answer": 0,
    "explanation": "Effective adult compressions must reach a depth of 5 to 6 cm (2 to 2.4 inches) to generate cardiac output."
  },
  {
    "id": 216,
    "part": 8,
    "category": "Basic Life Support Pretest & CPR",
    "q": "In standard single-rescuer adult CPR, how many chest compressions are given in each cycle before ventilations?",
    "options": [
      "15 compressions",
      "20 compressions",
      "30 compressions",
      "50 compressions"
    ],
    "answer": 2,
    "explanation": "Standard CPR protocol uses cycles of 30 chest compressions followed by 2 rescue breaths (30:2 ratio)."
  },
  {
    "id": 217,
    "part": 8,
    "category": "Basic Life Support Pretest & CPR",
    "q": "What is the recommended maneuver to open the airway in an unresponsive victim without suspected spinal trauma?",
    "options": [
      "Tilt head forward and chin down",
      "Tilt head backward and chin down",
      "Tilt head forward and chin up",
      "Tilt head backward and chin up (Head tilt-chin lift)"
    ],
    "answer": 3,
    "explanation": "The head tilt-chin lift maneuver pulls the tongue away from the posterior pharynx, opening the airway."
  },
  {
    "id": 218,
    "part": 8,
    "category": "Basic Life Support Pretest & CPR",
    "q": "Does CPR alone typically restart a heart in ventricular fibrillation or asystole?",
    "options": [
      "Yes, chest compressions directly reset the pacemaker",
      "No, CPR restores vital organ blood flow until defibrillation or ROSC",
      "Yes, rescue breathing triggers automaticity",
      "Only in pediatric cardiac arrests"
    ],
    "answer": 1,
    "explanation": "CPR circulates oxygenated blood to the brain and myocardium; it does not directly restart electrical activity."
  },
  {
    "id": 219,
    "part": 8,
    "category": "Basic Life Support Pretest & CPR",
    "q": "In an infant (under 1 year of age), which artery is the primary recommended site for checking a pulse?",
    "options": [
      "Femoral artery only",
      "Carotid artery in the neck",
      "Radial artery at the wrist",
      "Brachial artery in the upper arm"
    ],
    "answer": 3,
    "explanation": "The brachial artery on the medial upper arm is preferred in infants; short fat necks obscure the carotid."
  },
  {
    "id": 220,
    "part": 8,
    "category": "Basic Life Support Pretest & CPR",
    "q": "Under BLS guidelines, pediatric CPR algorithms apply to children from 1 year of age up to what milestone?",
    "options": [
      "Up to 4 years old",
      "Up to 8 years old (or signs of puberty)",
      "Up to 12 years old",
      "Up to 18 years old"
    ],
    "answer": 1,
    "explanation": "Pediatric BLS guidelines apply to victims from age 1 year up to the onset of puberty (~8-12 years)."
  },
  {
    "id": 221,
    "part": 8,
    "category": "Basic Life Support Pretest & CPR",
    "q": "For BLS guidelines, an 'infant' is specifically defined as an individual of what age?",
    "options": [
      "Less than 6 months",
      "Less than 1 year (12 months) of age",
      "Less than 2 years of age",
      "Less than 3 years of age"
    ],
    "answer": 1,
    "explanation": "In resuscitation terminology, infants are defined as children younger than 1 year of age (excluding newborns)."
  },
  {
    "id": 222,
    "part": 8,
    "category": "Basic Life Support Pretest & CPR",
    "q": "What does the resuscitation acronym 'CAB' stand for in modern emergency resuscitation algorithms?",
    "options": [
      "Circulation, Airway, Breathing",
      "Chest, Air, Blood",
      "Compressions, Airway, Breathing",
      "Cardiac, Alert, Breathing"
    ],
    "answer": 2,
    "explanation": "AHA guidelines reordered the sequence to CAB: Compressions, Airway, Breathing to prioritize perfusion."
  },
  {
    "id": 223,
    "part": 8,
    "category": "Basic Life Support Pretest & CPR",
    "q": "How should a healthcare provider or rescuer check responsiveness in an infant?",
    "options": [
      "Shaking the infant vigorously by the shoulders",
      "Tapping or patting the soles of the infant's feet",
      "Splashing cold water on the infant's face",
      "Performing a firm sternal rub"
    ],
    "answer": 1,
    "explanation": "Flicking or tapping the soles of the feet checks responsiveness safely without risking shaken baby trauma."
  },
  {
    "id": 224,
    "part": 8,
    "category": "Basic Life Support Pretest & CPR",
    "q": "You find an adult victim collapsed in a hospital hallway with no one nearby. Scene is safe. What is your immediate next action?",
    "options": [
      "Check responsiveness; if unresponsive, call for help/activate code and get AED",
      "Leave the patient to wait outside for the rapid response team",
      "Perform 2 blind finger sweeps in the oral cavity",
      "Immediately deliver 100 chest compressions without checking response"
    ],
    "answer": 0,
    "explanation": "Confirm unresponsiveness, shout for nearby help, activate emergency system, and get the AED immediately."
  },
  {
    "id": 225,
    "part": 8,
    "category": "Basic Life Support Pretest & CPR",
    "q": "A 55-year-old colleague complains of sudden, crushing substernal chest pain lasting > 5 min. What is your primary concern and action?",
    "options": [
      "Gastroesophageal reflux; give an antacid tablet",
      "Stable angina; advise scheduling a doctor appointment next week",
      "Acute myocardial infarction (heart attack); call 911/EMS immediately",
      "Musculoskeletal pain; drive him home"
    ],
    "answer": 2,
    "explanation": "Crushing central chest pain lasting > 5 min suggests acute myocardial infarction; activate EMS immediately."
  },
  {
    "id": 226,
    "part": 8,
    "category": "Basic Life Support Pretest & CPR",
    "q": "In an adult cardiac arrest where CPR and EMS activation are underway, what is the third link in the Chain of Survival?",
    "options": [
      "Administration of intravenous vasopressors by paramedics",
      "Rapid hospital admission and ICU bed assignment",
      "Rapid defibrillation with an AED or manual defibrillator",
      "Post-cardiac arrest targeted temperature management"
    ],
    "answer": 2,
    "explanation": "The adult Chain of Survival links: 1) Recognition/Activation, 2) Early CPR, 3) Rapid Defibrillation."
  },
  {
    "id": 227,
    "part": 8,
    "category": "Basic Life Support Pretest & CPR",
    "q": "A 60-year-old man suddenly develops unilateral facial drooping, right arm weakness, and garbled speech. What is the most likely diagnosis?",
    "options": [
      "Grand mal epileptic seizure",
      "Acute coronary syndrome",
      "Acute cerebrovascular stroke",
      "Diabetic ketoacidosis"
    ],
    "answer": 2,
    "explanation": "Sudden focal neurological deficits (unilateral face weakness, arm drift, dysarthria) indicate acute stroke."
  },
  {
    "id": 228,
    "part": 8,
    "category": "Basic Life Support Pretest & CPR",
    "q": "A lone rescuer pulls a 3-year-old child from a swimming pool. She is limp and unresponsive. When should the lone rescuer call 911?",
    "options": [
      "After providing 5 cycles (~2 minutes) of CPR",
      "Immediately before touching the child in the water",
      "Only after the child fully regains spontaneous consciousness",
      "After 10 minutes of chest compressions"
    ],
    "answer": 0,
    "explanation": "Drowning causes hypoxic arrest; lone rescuers perform 2 minutes (5 cycles) of CPR before leaving to call EMS."
  },
  {
    "id": 229,
    "part": 8,
    "category": "Basic Life Support Pretest & CPR",
    "q": "Why is CPR training required for responders even when automated external defibrillators (AEDs) are available?",
    "options": [
      "AEDs eliminate the need for manual chest compressions",
      "Responders must diagnose complex ECG dysrhythmias themselves",
      "CPR maintains vital organ perfusion before and between AED shocks",
      "AEDs are only effective in 10% of cardiac arrests"
    ],
    "answer": 2,
    "explanation": "CPR circulates oxygenated blood, preserving brain and heart viability until defibrillation can succeed."
  },
  {
    "id": 230,
    "part": 8,
    "category": "Basic Life Support Pretest & CPR",
    "q": "You respond to an unresponsive child in bed with no evidence or history of trauma. How should you open her airway?",
    "options": [
      "Pull forward forcefully on the lower teeth",
      "Jaw-thrust maneuver with cervical immobilization",
      "Head tilt-chin lift maneuver",
      "Hyperextend the neck fully backwards"
    ],
    "answer": 2,
    "explanation": "In non-trauma pediatric patients, the gentle head tilt-chin lift maneuver is the standard method."
  },
  {
    "id": 231,
    "part": 8,
    "category": "Basic Life Support Pretest & CPR",
    "q": "Before attempting to deliver rescue ventilations to an unresponsive non-breathing victim, what must the rescuer do?",
    "options": [
      "Check pupillary light reflexes",
      "Properly open the airway (head tilt-chin lift)",
      "Insert a nasogastric tube",
      "Deliver 5 rapid back blows"
    ],
    "answer": 1,
    "explanation": "Opening the airway lifts the tongue and epiglottis, allowing air to enter the lungs rather than the stomach."
  },
  {
    "id": 232,
    "part": 8,
    "category": "Basic Life Support Pretest & CPR",
    "q": "Why are healthcare providers specifically cautioned to look for 'adequate' breathing rather than just any respiratory effort?",
    "options": [
      "Agonal gasps occur commonly after arrest but do not provide ventilation",
      "Victims never make respiratory sounds after cardiac arrest",
      "Hyperventilation occurs spontaneously in all arrest cases",
      "Normal breathing always exceeds 30 breaths per minute"
    ],
    "answer": 0,
    "explanation": "Agonal gasps are slow, irregular, reflex sounds seen in cardiac arrest; they do not oxygenate the patient."
  },
  {
    "id": 233,
    "part": 8,
    "category": "Basic Life Support Pretest & CPR",
    "q": "In a cafeteria, a woman suddenly clutches her neck with both hands, unable to speak or cough. What should you do first?",
    "options": [
      "Immediately perform a blind finger sweep in her mouth",
      "Ask her: 'Are you choking?' to assess airway compromise",
      "Slap her vigorously on the back while she sits",
      "Give her a glass of water to drink"
    ],
    "answer": 1,
    "explanation": "Universal choking sign: clutching neck. Asking 'Are you choking?' verifies complete vs partial obstruction."
  },
  {
    "id": 234,
    "part": 8,
    "category": "Basic Life Support Pretest & CPR",
    "q": "When delivering bag-mask rescue ventilations to a child who has a pulse but is in respiratory arrest, what is the correct rate?",
    "options": [
      "1 breath every 1 to 2 seconds",
      "1 breath every 2 to 3 seconds (20-30 breaths/min)",
      "1 breath every 8 to 10 seconds",
      "1 breath every 15 seconds"
    ],
    "answer": 1,
    "explanation": "Pediatric rescue breathing with a pulse is delivered at 1 breath every 2 to 3 seconds (20-30 breaths/min)."
  },
  {
    "id": 235,
    "part": 8,
    "category": "Basic Life Support Pretest & CPR",
    "q": "A 3-year-old child eating grapes suddenly chokes but is coughing forcefully and crying loudly. What is the best action?",
    "options": [
      "Perform immediate abdominal thrusts",
      "Perform back slaps and chest thrusts",
      "Encourage the child to cough and monitor closely without interfering",
      "Perform a blind finger sweep of the mouth"
    ],
    "answer": 2,
    "explanation": "Good air exchange (coughing, crying) indicates partial obstruction; do not intervene, allow coughing."
  },
  {
    "id": 236,
    "part": 8,
    "category": "Basic Life Support Pretest & CPR",
    "q": "When providing bag-mask rescue breathing with supplemental oxygen for an adult in respiratory arrest, how should breaths be given?",
    "options": [
      "Deliver 20-30 rapid forceful breaths per minute",
      "1 breath every 5 to 6 seconds (10-12/min), each over 1 second with chest rise",
      "Deliver as much volume as possible until resistance is met",
      "Give 1 breath every 12 seconds"
    ],
    "answer": 1,
    "explanation": "Adult rescue breathing: 1 breath every 5-6 seconds, each lasting 1 second, causing visible chest rise."
  },
  {
    "id": 237,
    "part": 8,
    "category": "Basic Life Support Pretest & CPR",
    "q": "In 2-rescuer adult CPR, when the airway is opened and no normal breathing is present, what is given during ventilation cycles?",
    "options": [
      "1 quick puff of air",
      "2 rescue breaths, each over 1 second, observing for visible chest rise",
      "5 rapid ventilations without pause",
      "Continuous blowing without allowing exhalation"
    ],
    "answer": 1,
    "explanation": "Deliver 2 breaths, each over 1 second, with enough volume to produce visible chest rise."
  },
  {
    "id": 238,
    "part": 8,
    "category": "Basic Life Support Pretest & CPR",
    "q": "Why is delivering rescue ventilations effective in sustaining an unresponsive non-breathing victim?",
    "options": [
      "Exhaled air contains pure carbon dioxide",
      "Exhaled air contains approximately 16-17% oxygen, adequate for oxygenation",
      "Ventilation directly defibrillates the myocardium",
      "Rescue breaths restore ventricular automaticity"
    ],
    "answer": 1,
    "explanation": "Exhaled air contains ~16% oxygen and 4% CO2, sufficient to support oxygen transport during CPR."
  },
  {
    "id": 239,
    "part": 8,
    "category": "Basic Life Support Pretest & CPR",
    "q": "A 52-year-old collapses at a fitness center. What is the preferred anatomical site for a pulse check in this adult victim?",
    "options": [
      "Radial artery of the wrist",
      "Brachial artery of the upper arm",
      "Carotid artery of the neck",
      "Apical beat on the left chest"
    ],
    "answer": 2,
    "explanation": "The carotid artery in the groove between the trachea and sternocleidomastoid muscle is preferred in adults."
  },
  {
    "id": 240,
    "part": 8,
    "category": "Basic Life Support Pretest & CPR",
    "q": "Where should a rescuer place their hands on an adult victim's chest to perform high-quality chest compressions?",
    "options": [
      "On the upper half of the sternum near the sternal notch",
      "Over the left side of the rib cage directly over the apex",
      "Over the xiphoid process at the bottom of the sternum",
      "On the lower half of the breastbone (sternum), center of chest"
    ],
    "answer": 3,
    "explanation": "Compressions should be delivered on the lower half of the breastbone (sternum) in the center of the chest."
  },
  {
    "id": 241,
    "part": 8,
    "category": "Basic Life Support Pretest & CPR",
    "q": "What is the recommended ratio of chest compressions to ventilations for single-rescuer adult CPR?",
    "options": [
      "30 compressions to 2 ventilations (30:2)",
      "15 compressions to 2 ventilations (15:2)",
      "5 compressions to 1 ventilation (5:1)",
      "50 compressions to 2 ventilations (50:2)"
    ],
    "answer": 0,
    "explanation": "The universal adult compression-to-ventilation ratio for all rescuers is 30 compressions to 2 breaths."
  },
  {
    "id": 242,
    "part": 8,
    "category": "Basic Life Support Pretest & CPR",
    "q": "What is the recommended speed (rate) of chest compressions for an adult cardiac arrest victim?",
    "options": [
      "60 to 80 compressions per minute",
      "80 to 100 compressions per minute",
      "100 to 120 compressions per minute",
      "140 to 160 compressions per minute"
    ],
    "answer": 2,
    "explanation": "The recommended rate for high-quality compressions across all age groups is 100 to 120 compressions per minute."
  },
  {
    "id": 243,
    "part": 8,
    "category": "Basic Life Support Pretest & CPR",
    "q": "When performing chest compressions on a 5-year-old child, which compression technique should be used?",
    "options": [
      "Tips of 2 fingers only",
      "Heel of one hand (or two hands if needed to achieve 5 cm depth)",
      "Thumbs encircling technique only",
      "Palms and flat fingers of both hands"
    ],
    "answer": 1,
    "explanation": "For children, use 1 or 2 hands on the lower half of the sternum to achieve a depth of ~5 cm (1/3 AP diameter)."
  },
  {
    "id": 244,
    "part": 8,
    "category": "Basic Life Support Pretest & CPR",
    "q": "Two rescuers confirm an adult is unresponsive with no breathing and no carotid pulse. What should they do immediately?",
    "options": [
      "Attach AED if ready, and start chest compressions and cycles of 30:2",
      "Deliver 5 abdominal thrusts to clear the airway",
      "Wait 2 minutes and recheck the pulse",
      "Deliver 10 rescue breaths before starting compressions"
    ],
    "answer": 0,
    "explanation": "Immediately initiate high-quality chest compressions and apply the AED as soon as available."
  },
  {
    "id": 245,
    "part": 8,
    "category": "Basic Life Support Pretest & CPR",
    "q": "During ongoing adult CPR, when should rescuers pause compressions to re-evaluate the cardiac rhythm or pulse?",
    "options": [
      "After every single compression cycle",
      "Every 30 seconds",
      "After every 2 minutes of CPR (about 5 cycles of 30:2)",
      "Only when EMS arrives at the scene"
    ],
    "answer": 2,
    "explanation": "Reassess rhythm/pulse every 2 minutes (~5 cycles of 30:2), taking no more than 10 seconds to minimize pauses."
  },
  {
    "id": 246,
    "part": 8,
    "category": "Basic Life Support Pretest & CPR",
    "q": "According to BLS algorithms, exactly when should chest compressions be initiated?",
    "options": [
      "As soon as unresponsiveness, absent breathing, and no pulse are identified",
      "Only after delivering 5 initial rescue ventilations",
      "Only after an AED has analyzed the rhythm",
      "After checking bilateral pupillary reflexes"
    ],
    "answer": 0,
    "explanation": "Chest compressions should start within 10 seconds of recognizing cardiac arrest (unresponsive, no pulse/breathing)."
  },
  {
    "id": 247,
    "part": 8,
    "category": "Basic Life Support Pretest & CPR",
    "q": "How do immediate chest compressions and rescue breathing increase survival in sudden cardiac arrest?",
    "options": [
      "They prevent the need for cardiac catheterization",
      "They restore normal sinus rhythm on their own without electricity",
      "They maintain coronary and cerebral perfusion, preserving viability until defibrillation",
      "They reduce systemic blood pressure to protect cerebral vessels"
    ],
    "answer": 2,
    "explanation": "CPR maintains minimum vital perfusion to the heart and brain, extending the window for successful defibrillation."
  },
  {
    "id": 248,
    "part": 8,
    "category": "Basic Life Support Pretest & CPR",
    "q": "A 7-year-old child is struck by a vehicle and found unresponsive with a bleeding head laceration. How should his airway be opened?",
    "options": [
      "Forceful head tilt-chin lift",
      "Jaw-thrust maneuver with in-line cervical spine stabilization",
      "Blind digital sweep of the oral cavity",
      "Do not touch or position the airway under any circumstances"
    ],
    "answer": 1,
    "explanation": "In suspected cervical trauma, open the airway using the jaw thrust without neck extension."
  },
  {
    "id": 249,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "What is the very first question you must ask before you respond to any emergency first aid situation?",
    "options": [
      "Age of the injured or ill person",
      "Safety of the scene",
      "Nature and extent of the injury",
      "Exact time the injury occurred"
    ],
    "answer": 1,
    "explanation": "Ensuring scene safety is critical to protect rescuers and prevent additional casualties."
  },
  {
    "id": 250,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "Which of the following are considered essential standard Personal Protective Equipment (PPE)?",
    "options": [
      "Medical gloves",
      "Protective face mask",
      "Eye shield or goggles",
      "All of the above"
    ],
    "answer": 3,
    "explanation": "Gloves, masks, and eye protection form universal PPE against bloodborne and airborne pathogens."
  },
  {
    "id": 251,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "Which of the following clinical signs is most consistent with an acute acute stroke?",
    "options": [
      "Generalized confusion only",
      "Substernal chest pain",
      "Unilateral facial droop",
      "Isolated nausea and vomiting"
    ],
    "answer": 2,
    "explanation": "Unilateral facial droop, arm weakness, and speech difficulty are cardinal signs of stroke (FAST)."
  },
  {
    "id": 252,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "A 20-year-old dove off a dock into shallow water. Upon surfacing, he is motionless. What is the most likely injury?",
    "options": [
      "Acute myocardial infarction",
      "Severe hypoglycemia",
      "Cervical spine (neck) injury",
      "Mammalian diving reflex"
    ],
    "answer": 2,
    "explanation": "Diving into shallow water carries high risk of cervical spine fracture and spinal cord transection."
  },
  {
    "id": 253,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "You find an unresponsive, pulseless victim who has vomited. You are uncomfortable with mouth-to-mouth. Best approach?",
    "options": [
      "Wipe off the face and wait for EMS",
      "Perform Hands-Only (compression-only) CPR",
      "Leave the scene immediately to find help",
      "Do not initiate any resuscitation efforts"
    ],
    "answer": 1,
    "explanation": "Hands-Only CPR maintains circulation and oxygen delivery, vastly improving survival over doing nothing."
  },
  {
    "id": 254,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "You are performing single-rescuer CPR. The AED delivers a shock. What is the immediate next step?",
    "options": [
      "Call 911/EMS again",
      "Immediately resume CPR starting with chest compressions",
      "Stop and check the carotid pulse for 10 seconds",
      "Deliver 2 rescue ventilations before compressions"
    ],
    "answer": 1,
    "explanation": "Immediately resume chest compressions after shock delivery without pausing for a pulse check."
  },
  {
    "id": 255,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "In single-rescuer arrest, what is the main operational difference between finding an adult vs a child if leaving to call EMS?",
    "options": [
      "There is no difference in procedure",
      "Perform CPR first for adult; call EMS first for child",
      "Deliver 2 minutes of CPR for child before calling; call immediately for adult",
      "Always wait for bystanders before acting"
    ],
    "answer": 2,
    "explanation": "Most pediatric arrests are asphyxial (give 2 min CPR first); adult arrests are primary cardiac (call first)."
  },
  {
    "id": 256,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "A lone daycare provider finds an unwitnessed unresponsive, cyanotic 3-year-old child. What is the first priority?",
    "options": [
      "Perform 5 back blows immediately",
      "Perform a blind finger sweep",
      "Deliver 2 minutes of CPR before leaving to call EMS",
      "Leave immediately to search for the parents"
    ],
    "answer": 2,
    "explanation": "In unwitnessed pediatric cardiac arrest, a lone rescuer provides 5 cycles (~2 min) of CPR before activating EMS."
  },
  {
    "id": 257,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "While attempting to relieve choking in a responsive infant, the infant becomes limp and unresponsive. Next step?",
    "options": [
      "Leave the infant to summon emergency help",
      "Perform repeated blind finger sweeps",
      "Place infant on a firm, flat surface and begin CPR",
      "Perform forceful abdominal thrusts (Heimlich)"
    ],
    "answer": 2,
    "explanation": "If a choking infant becomes unresponsive, place on a firm flat surface and begin CPR (look for object before breaths)."
  },
  {
    "id": 258,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "Up to what developmental age/stage is it necessary to use pediatric AED pads with an attenuator if available?",
    "options": [
      "Up to 18 years of age",
      "Up to 14 years of age",
      "Up to 8 years of age (or pre-puberty)",
      "Only for newborns under 1 month"
    ],
    "answer": 2,
    "explanation": "Use pediatric pads/dose attenuator for infants and children up to 8 years old or pre-puberty."
  },
  {
    "id": 259,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "What is the correct, universal sequence of steps for operating an Automated External Defibrillator (AED)?",
    "options": [
      "Power on -> Deliver shock -> Attach pads -> Analyze",
      "Power on -> Attach electrode pads -> Analyze rhythm -> Deliver shock if advised",
      "Attach pads -> Deliver shock -> Power on -> Analyze",
      "Analyze rhythm -> Power on -> Attach pads -> Deliver shock"
    ],
    "answer": 1,
    "explanation": "Turn on AED, attach pads to bare chest, allow device to analyze rhythm, and shock if indicated."
  },
  {
    "id": 260,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "How deep should chest compressions be delivered for an adult victim of cardiac arrest?",
    "options": [
      "At least 5 to 6 cm (2 to 2.4 inches)",
      "1 inch (2.5 cm)",
      "2 to 3 cm",
      "0.5 inches (1 cm)"
    ],
    "answer": 0,
    "explanation": "Effective adult compressions must reach a depth of 5 to 6 cm (2 to 2.4 inches) to generate cardiac output."
  },
  {
    "id": 261,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "In standard single-rescuer adult CPR, how many chest compressions are given in each cycle before ventilations?",
    "options": [
      "15 compressions",
      "20 compressions",
      "30 compressions",
      "50 compressions"
    ],
    "answer": 2,
    "explanation": "Standard CPR protocol uses cycles of 30 chest compressions followed by 2 rescue breaths (30:2 ratio)."
  },
  {
    "id": 262,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "What is the recommended maneuver to open the airway in an unresponsive victim without suspected spinal trauma?",
    "options": [
      "Tilt head forward and chin down",
      "Tilt head backward and chin down",
      "Tilt head forward and chin up",
      "Tilt head backward and chin up (Head tilt-chin lift)"
    ],
    "answer": 3,
    "explanation": "The head tilt-chin lift maneuver pulls the tongue away from the posterior pharynx, opening the airway."
  },
  {
    "id": 263,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "Does CPR alone typically restart a heart in ventricular fibrillation or asystole?",
    "options": [
      "Yes, chest compressions directly reset the pacemaker",
      "No, CPR restores vital organ blood flow until defibrillation or ROSC",
      "Yes, rescue breathing triggers automaticity",
      "Only in pediatric cardiac arrests"
    ],
    "answer": 1,
    "explanation": "CPR circulates oxygenated blood to the brain and myocardium; it does not directly restart electrical activity."
  },
  {
    "id": 264,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "What does the medical abbreviation CPR stand for?",
    "options": [
      "Cardiac Passive Resuscitation",
      "Cardiopulmonary Resuscitation",
      "Chest Pulmonary Revival",
      "Cardiovascular Pressure Restoration"
    ],
    "answer": 1,
    "explanation": "CPR stands for Cardiopulmonary Resuscitation."
  },
  {
    "id": 265,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "In an infant (under 1 year of age), which artery is the primary recommended site for checking a pulse?",
    "options": [
      "Femoral artery only",
      "Carotid artery in the neck",
      "Radial artery at the wrist",
      "Brachial artery in the upper arm"
    ],
    "answer": 3,
    "explanation": "The brachial artery on the medial upper arm is preferred in infants; short fat necks obscure the carotid."
  },
  {
    "id": 266,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "Under BLS guidelines, pediatric CPR algorithms apply to children from 1 year of age up to what milestone?",
    "options": [
      "Up to 4 years old",
      "Up to 8 years old (or signs of puberty)",
      "Up to 12 years old",
      "Up to 18 years old"
    ],
    "answer": 1,
    "explanation": "Pediatric BLS guidelines apply to victims from age 1 year up to the onset of puberty (~8-12 years)."
  },
  {
    "id": 267,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "For BLS guidelines, an 'infant' is specifically defined as an individual of what age?",
    "options": [
      "Less than 6 months",
      "Less than 1 year (12 months) of age",
      "Less than 2 years of age",
      "Less than 3 years of age"
    ],
    "answer": 1,
    "explanation": "In resuscitation terminology, infants are defined as children younger than 1 year of age (excluding newborns)."
  },
  {
    "id": 268,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "What does the resuscitation acronym 'CAB' stand for in modern emergency resuscitation algorithms?",
    "options": [
      "Circulation, Airway, Breathing",
      "Chest, Air, Blood",
      "Compressions, Airway, Breathing",
      "Cardiac, Alert, Breathing"
    ],
    "answer": 2,
    "explanation": "AHA guidelines reordered the sequence to CAB: Compressions, Airway, Breathing to prioritize perfusion."
  },
  {
    "id": 269,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "How should a healthcare provider or rescuer check responsiveness in an infant?",
    "options": [
      "Shaking the infant vigorously by the shoulders",
      "Tapping or patting the soles of the infant's feet",
      "Splashing cold water on the infant's face",
      "Performing a firm sternal rub"
    ],
    "answer": 1,
    "explanation": "Flicking or tapping the soles of the feet checks responsiveness safely without risking shaken baby trauma."
  },
  {
    "id": 270,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "You find an adult victim collapsed in a hospital hallway with no one nearby. Scene is safe. What is your immediate next action?",
    "options": [
      "Check responsiveness; if unresponsive, call for help/activate code and get AED",
      "Leave the patient to wait outside for the rapid response team",
      "Perform 2 blind finger sweeps in the oral cavity",
      "Immediately deliver 100 chest compressions without checking response"
    ],
    "answer": 0,
    "explanation": "Confirm unresponsiveness, shout for nearby help, activate emergency system, and get the AED immediately."
  },
  {
    "id": 271,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "A 55-year-old colleague complains of sudden, crushing substernal chest pain lasting > 5 min. What is your primary concern and action?",
    "options": [
      "Gastroesophageal reflux; give an antacid tablet",
      "Stable angina; advise scheduling a doctor appointment next week",
      "Acute myocardial infarction (heart attack); call 911/EMS immediately",
      "Musculoskeletal pain; drive him home"
    ],
    "answer": 2,
    "explanation": "Crushing central chest pain lasting > 5 min suggests acute myocardial infarction; activate EMS immediately."
  },
  {
    "id": 272,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "In an adult cardiac arrest where CPR and EMS activation are underway, what is the third link in the Chain of Survival?",
    "options": [
      "Administration of intravenous vasopressors by paramedics",
      "Rapid hospital admission and ICU bed assignment",
      "Rapid defibrillation with an AED or manual defibrillator",
      "Post-cardiac arrest targeted temperature management"
    ],
    "answer": 2,
    "explanation": "The adult Chain of Survival links: 1) Recognition/Activation, 2) Early CPR, 3) Rapid Defibrillation."
  },
  {
    "id": 273,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "A 60-year-old man suddenly develops unilateral facial drooping, right arm weakness, and garbled speech. What is the most likely diagnosis?",
    "options": [
      "Grand mal epileptic seizure",
      "Acute coronary syndrome",
      "Acute cerebrovascular stroke",
      "Diabetic ketoacidosis"
    ],
    "answer": 2,
    "explanation": "Sudden focal neurological deficits (unilateral face weakness, arm drift, dysarthria) indicate acute stroke."
  },
  {
    "id": 274,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "A lone rescuer pulls a 3-year-old child from a swimming pool. She is limp and unresponsive. When should the lone rescuer call 911?",
    "options": [
      "After providing 5 cycles (~2 minutes) of CPR",
      "Immediately before touching the child in the water",
      "Only after the child fully regains spontaneous consciousness",
      "After 10 minutes of chest compressions"
    ],
    "answer": 0,
    "explanation": "Drowning causes hypoxic arrest; lone rescuers perform 2 minutes (5 cycles) of CPR before leaving to call EMS."
  },
  {
    "id": 275,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "Why is CPR training required for responders even when automated external defibrillators (AEDs) are available?",
    "options": [
      "AEDs eliminate the need for manual chest compressions",
      "Responders must diagnose complex ECG dysrhythmias themselves",
      "CPR maintains vital organ perfusion before and between AED shocks",
      "AEDs are only effective in 10% of cardiac arrests"
    ],
    "answer": 2,
    "explanation": "CPR circulates oxygenated blood, preserving brain and heart viability until defibrillation can succeed."
  },
  {
    "id": 276,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "You respond to an unresponsive child in bed with no evidence or history of trauma. How should you open her airway?",
    "options": [
      "Pull forward forcefully on the lower teeth",
      "Jaw-thrust maneuver with cervical immobilization",
      "Head tilt-chin lift maneuver",
      "Hyperextend the neck fully backwards"
    ],
    "answer": 2,
    "explanation": "In non-trauma pediatric patients, the gentle head tilt-chin lift maneuver is the standard method."
  },
  {
    "id": 277,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "Before attempting to deliver rescue ventilations to an unresponsive non-breathing victim, what must the rescuer do?",
    "options": [
      "Check pupillary light reflexes",
      "Properly open the airway (head tilt-chin lift)",
      "Insert a nasogastric tube",
      "Deliver 5 rapid back blows"
    ],
    "answer": 1,
    "explanation": "Opening the airway lifts the tongue and epiglottis, allowing air to enter the lungs rather than the stomach."
  },
  {
    "id": 278,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "Why are healthcare providers specifically cautioned to look for 'adequate' breathing rather than just any respiratory effort?",
    "options": [
      "Agonal gasps occur commonly after arrest but do not provide ventilation",
      "Victims never make respiratory sounds after cardiac arrest",
      "Hyperventilation occurs spontaneously in all arrest cases",
      "Normal breathing always exceeds 30 breaths per minute"
    ],
    "answer": 0,
    "explanation": "Agonal gasps are slow, irregular, reflex sounds seen in cardiac arrest; they do not oxygenate the patient."
  },
  {
    "id": 279,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "In a cafeteria, a woman suddenly clutches her neck with both hands, unable to speak or cough. What should you do first?",
    "options": [
      "Immediately perform a blind finger sweep in her mouth",
      "Ask her: 'Are you choking?' to assess airway compromise",
      "Slap her vigorously on the back while she sits",
      "Give her a glass of water to drink"
    ],
    "answer": 1,
    "explanation": "Universal choking sign: clutching neck. Asking 'Are you choking?' verifies complete vs partial obstruction."
  },
  {
    "id": 280,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "When delivering bag-mask rescue ventilations to a child who has a pulse but is in respiratory arrest, what is the correct rate?",
    "options": [
      "1 breath every 1 to 2 seconds",
      "1 breath every 2 to 3 seconds (20-30 breaths/min)",
      "1 breath every 8 to 10 seconds",
      "1 breath every 15 seconds"
    ],
    "answer": 1,
    "explanation": "Pediatric rescue breathing with a pulse is delivered at 1 breath every 2 to 3 seconds (20-30 breaths/min)."
  },
  {
    "id": 281,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "A 3-year-old child eating grapes suddenly chokes but is coughing forcefully and crying loudly. What is the best action?",
    "options": [
      "Perform immediate abdominal thrusts",
      "Perform back slaps and chest thrusts",
      "Encourage the child to cough and monitor closely without interfering",
      "Perform a blind finger sweep of the mouth"
    ],
    "answer": 2,
    "explanation": "Good air exchange (coughing, crying) indicates partial obstruction; do not intervene, allow coughing."
  },
  {
    "id": 282,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "When providing bag-mask rescue breathing with supplemental oxygen for an adult in respiratory arrest, how should breaths be given?",
    "options": [
      "Deliver 20-30 rapid forceful breaths per minute",
      "1 breath every 5 to 6 seconds (10-12/min), each over 1 second with chest rise",
      "Deliver as much volume as possible until resistance is met",
      "Give 1 breath every 12 seconds"
    ],
    "answer": 1,
    "explanation": "Adult rescue breathing: 1 breath every 5-6 seconds, each lasting 1 second, causing visible chest rise."
  },
  {
    "id": 283,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "In 2-rescuer adult CPR, when the airway is opened and no normal breathing is present, what is given during ventilation cycles?",
    "options": [
      "1 quick puff of air",
      "2 rescue breaths, each over 1 second, observing for visible chest rise",
      "5 rapid ventilations without pause",
      "Continuous blowing without allowing exhalation"
    ],
    "answer": 1,
    "explanation": "Deliver 2 breaths, each over 1 second, with enough volume to produce visible chest rise."
  },
  {
    "id": 284,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "Why is delivering rescue ventilations effective in sustaining an unresponsive non-breathing victim?",
    "options": [
      "Exhaled air contains pure carbon dioxide",
      "Exhaled air contains approximately 16-17% oxygen, adequate for oxygenation",
      "Ventilation directly defibrillates the myocardium",
      "Rescue breaths restore ventricular automaticity"
    ],
    "answer": 1,
    "explanation": "Exhaled air contains ~16% oxygen and 4% CO2, sufficient to support oxygen transport during CPR."
  },
  {
    "id": 285,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "A 52-year-old collapses at a fitness center. What is the preferred anatomical site for a pulse check in this adult victim?",
    "options": [
      "Radial artery of the wrist",
      "Brachial artery of the upper arm",
      "Carotid artery of the neck",
      "Apical beat on the left chest"
    ],
    "answer": 2,
    "explanation": "The carotid artery in the groove between the trachea and sternocleidomastoid muscle is preferred in adults."
  },
  {
    "id": 286,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "Where should a rescuer place their hands on an adult victim's chest to perform high-quality chest compressions?",
    "options": [
      "On the upper half of the sternum near the sternal notch",
      "Over the left side of the rib cage directly over the apex",
      "Over the xiphoid process at the bottom of the sternum",
      "On the lower half of the breastbone (sternum), center of chest"
    ],
    "answer": 3,
    "explanation": "Compressions should be delivered on the lower half of the breastbone (sternum) in the center of the chest."
  },
  {
    "id": 287,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "What is the recommended ratio of chest compressions to ventilations for single-rescuer adult CPR?",
    "options": [
      "30 compressions to 2 ventilations (30:2)",
      "15 compressions to 2 ventilations (15:2)",
      "5 compressions to 1 ventilation (5:1)",
      "50 compressions to 2 ventilations (50:2)"
    ],
    "answer": 0,
    "explanation": "The universal adult compression-to-ventilation ratio for all rescuers is 30 compressions to 2 breaths."
  },
  {
    "id": 288,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "What is the recommended speed (rate) of chest compressions for an adult cardiac arrest victim?",
    "options": [
      "60 to 80 compressions per minute",
      "80 to 100 compressions per minute",
      "100 to 120 compressions per minute",
      "140 to 160 compressions per minute"
    ],
    "answer": 2,
    "explanation": "The recommended rate for high-quality compressions across all age groups is 100 to 120 compressions per minute."
  },
  {
    "id": 289,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "When performing chest compressions on a 5-year-old child, which compression technique should be used?",
    "options": [
      "Tips of 2 fingers only",
      "Heel of one hand (or two hands if needed to achieve 5 cm depth)",
      "Thumbs encircling technique only",
      "Palms and flat fingers of both hands"
    ],
    "answer": 1,
    "explanation": "For children, use 1 or 2 hands on the lower half of the sternum to achieve a depth of ~5 cm (1/3 AP diameter)."
  },
  {
    "id": 290,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "Two rescuers confirm an adult is unresponsive with no breathing and no carotid pulse. What should they do immediately?",
    "options": [
      "Attach AED if ready, and start chest compressions and cycles of 30:2",
      "Deliver 5 abdominal thrusts to clear the airway",
      "Wait 2 minutes and recheck the pulse",
      "Deliver 10 rescue breaths before starting compressions"
    ],
    "answer": 0,
    "explanation": "Immediately initiate high-quality chest compressions and apply the AED as soon as available."
  },
  {
    "id": 291,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "During ongoing adult CPR, when should rescuers pause compressions to re-evaluate the cardiac rhythm or pulse?",
    "options": [
      "After every single compression cycle",
      "Every 30 seconds",
      "After every 2 minutes of CPR (about 5 cycles of 30:2)",
      "Only when EMS arrives at the scene"
    ],
    "answer": 2,
    "explanation": "Reassess rhythm/pulse every 2 minutes (~5 cycles of 30:2), taking no more than 10 seconds to minimize pauses."
  },
  {
    "id": 292,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "According to BLS algorithms, exactly when should chest compressions be initiated?",
    "options": [
      "As soon as unresponsiveness, absent breathing, and no pulse are identified",
      "Only after delivering 5 initial rescue ventilations",
      "Only after an AED has analyzed the rhythm",
      "After checking bilateral pupillary reflexes"
    ],
    "answer": 0,
    "explanation": "Chest compressions should start within 10 seconds of recognizing cardiac arrest (unresponsive, no pulse/breathing)."
  },
  {
    "id": 293,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "How do immediate chest compressions and rescue breathing increase survival in sudden cardiac arrest?",
    "options": [
      "They prevent the need for cardiac catheterization",
      "They restore normal sinus rhythm on their own without electricity",
      "They maintain coronary and cerebral perfusion, preserving viability until defibrillation",
      "They reduce systemic blood pressure to protect cerebral vessels"
    ],
    "answer": 2,
    "explanation": "CPR maintains minimum vital perfusion to the heart and brain, extending the window for successful defibrillation."
  },
  {
    "id": 294,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "A 7-year-old child is struck by a vehicle and found unresponsive with a bleeding head laceration. How should his airway be opened?",
    "options": [
      "Forceful head tilt-chin lift",
      "Jaw-thrust maneuver with in-line cervical spine stabilization",
      "Blind digital sweep of the oral cavity",
      "Do not touch or position the airway under any circumstances"
    ],
    "answer": 1,
    "explanation": "In suspected cervical trauma, open the airway using the jaw thrust without neck extension."
  },
  {
    "id": 295,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "In an unresponsive individual, how should a rescuer assess victim responsiveness?",
    "options": [
      "Shaking the victim violently by the head",
      "Slapping the victim across the face",
      "Tapping or patting the victim's shoulders and shouting loudly",
      "Pinching the victim's earlobes vigorously"
    ],
    "answer": 2,
    "explanation": "Tap the shoulders firmly and shout 'Are you OK?' to check adult responsiveness safely."
  },
  {
    "id": 296,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "If an adult victim is found unresponsive and not breathing normally, what is the correct operational sequence?",
    "options": [
      "Perform CPR for 5 minutes, then search for a telephone",
      "Activate emergency response system (call EMS/code), get AED, then start CPR",
      "Place victim in recovery position and wait for family",
      "Administer oral fluids immediately"
    ],
    "answer": 1,
    "explanation": "Early activation of emergency medical services and prompt CPR initiation are vital for adult survival."
  },
  {
    "id": 297,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "When assessing whether an unresponsive victim is breathing normally, the rescuer should simultaneously:",
    "options": [
      "Look for chest rise and fall",
      "Listen for breath sounds at the mouth/nose",
      "Feel for exhaled airflow against the cheek",
      "All of the above (within 10 seconds)"
    ],
    "answer": 3,
    "explanation": "Look, listen, and feel for normal breathing for no more than 10 seconds before starting CPR."
  },
  {
    "id": 298,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "What is the single most common cause of upper airway obstruction in an unconscious, supine patient?",
    "options": [
      "Foreign body / food bolus",
      "Laryngeal edema",
      "The tongue falling back against the posterior pharyngeal wall",
      "Displaced dentures"
    ],
    "answer": 2,
    "explanation": "Loss of muscle tone in unconsciousness causes the base of the tongue to occlude the hypopharynx."
  },
  {
    "id": 299,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "When providing mouth-to-mouth or bag-mask ventilations to an unconscious patient, the rescuer should:",
    "options": [
      "Pinch the nostrils closed during mouth-to-mouth",
      "Avoid hyperventilation and excessive tidal volume",
      "Allow passive exhalation between breaths",
      "All of the above"
    ],
    "answer": 3,
    "explanation": "Proper ventilation requires airway seal, avoiding gastric insufflation, and allowing passive recoil."
  },
  {
    "id": 300,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "During high-quality adult chest compressions, which principles must be strictly maintained?",
    "options": [
      "Compress at 100 to 120 beats per minute",
      "Use two hands on the lower half of the sternum",
      "Compress straight down to at least 5 cm (2 inches)",
      "All of the above"
    ],
    "answer": 3,
    "explanation": "Optimal depth (5-6 cm), proper rate (100-120/min), and correct hand position maximize cardiac output."
  },
  {
    "id": 301,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "To perform effective external chest compressions, what is the mandatory position for the patient?",
    "options": [
      "Prone with head turned to side",
      "Supine on a firm, flat surface",
      "Sitting upright at 45 degrees",
      "Lateral decubitus position"
    ],
    "answer": 1,
    "explanation": "Chest compressions require a firm, flat surface (floor or backboard) so force compresses the heart."
  },
  {
    "id": 302,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "What airway opening maneuver is specifically indicated when cervical spine injury is suspected?",
    "options": [
      "Head tilt-chin lift maneuver",
      "Extreme neck hyperextension",
      "Jaw-thrust maneuver without head extension",
      "Lateral neck rotation"
    ],
    "answer": 2,
    "explanation": "The jaw-thrust opens the airway by anterior displacement of the mandible without neck movement."
  },
  {
    "id": 303,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "To check circulation in an unresponsive adult victim, which pulse is assessed by healthcare professionals?",
    "options": [
      "Radial pulse at the wrist",
      "Femoral pulse only",
      "Carotid pulse in the neck",
      "Dorsalis pedis pulse"
    ],
    "answer": 2,
    "explanation": "The central carotid pulse remains palpable longer than peripheral pulses during shock and arrest."
  },
  {
    "id": 304,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "What is the most reliable objective clinical indicator of effective rescue breathing?",
    "options": [
      "Immediate resolution of all cyanosis",
      "Visible rise and fall of the victim's chest wall",
      "Air entering easily without any resistance",
      "Pupillary constriction"
    ],
    "answer": 1,
    "explanation": "Visible chest rise with each rescue breath confirms that sufficient volume is entering the lungs."
  },
  {
    "id": 305,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "Which cluster of signs and symptoms is typical of acute myocardial infarction (heart attack)?",
    "options": [
      "Substernal pressure or squeezing pain radiating to arm or jaw",
      "Profuse cold sweating (diaphoresis) and nausea",
      "Dyspnea, lightheadedness, or sudden weakness",
      "All of the above may occur together or individually"
    ],
    "answer": 3,
    "explanation": "MI presents with chest discomfort, diaphoresis, dyspnea, and radiation; presentation can be atypical."
  },
  {
    "id": 306,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "Before initiating external chest compressions in an adult, a healthcare professional must quickly confirm:",
    "options": [
      "Presence of severe external bleeding",
      "Dilated and fixed pupils",
      "Absence of a carotid pulse (and absent/abnormal breathing)",
      "Presence of core hypothermia"
    ],
    "answer": 2,
    "explanation": "Healthcare providers confirm cardiac arrest by absence of a pulse and breathing within 10 seconds."
  },
  {
    "id": 307,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "Acute primary respiratory arrest requiring immediate rescue breathing can be precipitated by:",
    "options": [
      "Opioid or sedative overdose",
      "Submersion / drowning accident",
      "Severe foreign body airway obstruction",
      "Any of the above"
    ],
    "answer": 3,
    "explanation": "Drug overdoses, drowning, and asphyxiation cause primary respiratory arrest which progresses to cardiac arrest."
  },
  {
    "id": 308,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "How much time should a healthcare provider take to check for a carotid pulse before starting CPR?",
    "options": [
      "At least 20 seconds",
      "At least 5 seconds but no more than 10 seconds",
      "Under 2 seconds",
      "Up to 30 seconds"
    ],
    "answer": 1,
    "explanation": "Check pulse for 5 to 10 seconds; if no pulse is definitely felt within 10 seconds, begin CPR immediately."
  },
  {
    "id": 309,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "For chest compressions to be maximally effective in producing perfusion, the rescuer must:",
    "options": [
      "Allow complete chest recoil after each compression",
      "Maintain an equal 50% compression and 50% relaxation duty cycle",
      "Maintain proper hand position without leaning on the chest",
      "All of the above"
    ],
    "answer": 3,
    "explanation": "Full recoil allows ventricular filling; proper duty cycle and hand placement ensure coronary perfusion."
  },
  {
    "id": 310,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "When performing adult chest compressions, the heel of the lower hand is positioned on the:",
    "options": [
      "Lower half of the sternum (breastbone)",
      "Middle to upper third of the sternum",
      "Xiphoid process at the epigastrium",
      "Left mid-clavicular intercostal space"
    ],
    "answer": 0,
    "explanation": "Position hands on the lower half of the sternum, avoiding the xiphoid process to prevent hepatic injury."
  },
  {
    "id": 311,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "In an unresponsive adult with a definite palpable carotid pulse but absent breathing, rescue breaths are given once every:",
    "options": [
      "1 to 2 seconds",
      "3 to 4 seconds",
      "5 to 6 seconds (10 to 12 breaths/min)",
      "10 to 12 seconds"
    ],
    "answer": 2,
    "explanation": "Adult rescue breathing with a pulse: 1 breath every 5-6 seconds (10-12 breaths/min), rechecking pulse every 2 min."
  },
  {
    "id": 312,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "What is the recommended ratio of compressions to ventilations for two-rescuer CPR on an adult victim?",
    "options": [
      "15 compressions to 2 ventilations (15:2)",
      "5 compressions to 1 ventilation (5:1)",
      "30 compressions to 2 ventilations (30:2)",
      "50 compressions to 2 ventilations (50:2)"
    ],
    "answer": 2,
    "explanation": "In adult CPR, the compression-to-ventilation ratio remains 30:2 regardless of whether 1 or 2 rescuers are present."
  },
  {
    "id": 313,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "An automated external defibrillator (AED) is applied to an unresponsive individual only when:",
    "options": [
      "The patient is unconscious only",
      "The patient is not breathing only",
      "The patient has no palpable pulse only",
      "Unresponsiveness, absent breathing, and pulselessness are all present"
    ],
    "answer": 3,
    "explanation": "AED is indicated in cardiac arrest, defined by concurrent unresponsiveness, apnea/agonal gasps, and pulselessness."
  },
  {
    "id": 314,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "Which of the following statements regarding AED operation is correct?",
    "options": [
      "Universal steps: power on, attach pads, analyze, deliver shock",
      "All rescuers and bystanders must clear the patient before shocking",
      "Resume CPR immediately after shock for 2 minutes before re-analyzing",
      "All of the above are correct"
    ],
    "answer": 3,
    "explanation": "Turn on AED, attach pads, clear to analyze, clear to shock, and immediately resume CPR for 2-minute cycles."
  },
  {
    "id": 315,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "What is the AHA recommended sequence of steps for basic life support?",
    "options": [
      "Airway, Breathing, Chest Compressions (ABC)",
      "Chest compressions, Airway, Breathing (CAB)",
      "Breathing, Airway, Compressions (BAC)",
      "Airway, Check pulse, Breathing (ACB)"
    ],
    "answer": 1,
    "explanation": "AHA guidelines established CAB (Compressions, Airway, Breathing) to initiate early blood circulation."
  },
  {
    "id": 316,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "Which of the following are critical components of high-quality cardiopulmonary resuscitation?",
    "options": [
      "Starting compressions within 10 seconds of arrest recognition",
      "Allowing complete chest recoil after every single compression",
      "Minimizing all interruptions in chest compressions (< 10 sec)",
      "All of the above"
    ],
    "answer": 3,
    "explanation": "Prompt start, adequate rate/depth, full recoil, and minimal interruptions define high-quality CPR."
  },
  {
    "id": 317,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "At what age or weight threshold is it necessary to use pediatric AED pads / dose attenuator if available?",
    "options": [
      "8 years of age or older",
      "8 years of age or younger (or < 25 kg)",
      "12 years of age or younger",
      "18 years of age or younger"
    ],
    "answer": 1,
    "explanation": "Pediatric pads with dose attenuator are used for children 8 years of age or younger (< 25 kg)."
  },
  {
    "id": 318,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "The compression to ventilation ratio for single-rescuer CPR on an adult victim of cardiac arrest is:",
    "options": [
      "30:1",
      "30:2",
      "15:1",
      "15:2"
    ],
    "answer": 1,
    "explanation": "For single-rescuer adult CPR, 30 chest compressions followed by 2 rescue breaths (30:2) is the standard."
  },
  {
    "id": 319,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "Where should a healthcare provider attempt to perform a pulse check in an unresponsive adult?",
    "options": [
      "Brachial artery",
      "Carotid artery",
      "Popliteal artery",
      "Temporal artery"
    ],
    "answer": 1,
    "explanation": "Check the carotid pulse in adults by feeling in the groove lateral to the trachea for 5 to 10 seconds."
  },
  {
    "id": 320,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "An AED can be safely and effectively deployed in all of the following clinical scenarios EXCEPT:",
    "options": [
      "Victim lying in dry snow",
      "Victim with an implanted pacemaker",
      "Victim with a transdermal medication patch on chest",
      "Victim lying partially submerged in water"
    ],
    "answer": 3,
    "explanation": "Water conducts electricity; remove victim from water and dry the chest before attaching and firing an AED."
  },
  {
    "id": 321,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "The five links in the adult out-of-hospital Chain of Survival include all of the following EXCEPT:",
    "options": [
      "Early recognition and activation of EMS",
      "Immediate high-quality CPR and Rapid Defibrillation",
      "Routine usage of intravenous cardiovascular medications",
      "Advanced resuscitation and post-cardiac arrest care"
    ],
    "answer": 2,
    "explanation": "Routine cardiovascular medications are not one of the core 5 links in the primary Chain of Survival."
  },
  {
    "id": 322,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "A lone rescuer encounters a patient in apparent collapse. The first 3 steps are: Check for danger/safety, __________, and call for help.",
    "options": [
      "Establish peripheral IV access",
      "Insert an advanced supraglottic airway",
      "Check for responsiveness",
      "Begin 100 chest compressions"
    ],
    "answer": 2,
    "explanation": "The primary initial assessment: 1) Check scene danger, 2) Check patient responsiveness, 3) Call for help."
  },
  {
    "id": 323,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "In both infants and children, what is the compression to ventilation ratio for single-rescuer CPR?",
    "options": [
      "15:1",
      "15:2",
      "30:1",
      "30:2"
    ],
    "answer": 3,
    "explanation": "Single rescuers use 30:2 for all age victims. (Two-rescuer pediatric CPR uses 15:2)."
  },
  {
    "id": 324,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "What is the proper, systematic sequence of steps for operating an automated external defibrillator (AED)?",
    "options": [
      "Attach pads -> Power on -> Shock patient -> Analyze",
      "Power on the AED -> Attach electrode pads -> Analyze rhythm -> Shock patient if advised",
      "Analyze rhythm -> Power on -> Attach pads -> Shock patient",
      "Power on -> Shock patient -> Attach pads -> Analyze"
    ],
    "answer": 1,
    "explanation": "AED operating order: Power on -> Apply pads to bare chest -> Stand clear and analyze -> Shock if advised."
  },
  {
    "id": 325,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "A 21-year-old student collapses and turns cyanotic while eating a hot dog at a bar. What is the most probable cause?",
    "options": [
      "Primary arrhythmic cardiac arrest",
      "Acute alcohol intoxication coma",
      "Foreign body airway obstruction (choking)",
      "Sedative drug overdose"
    ],
    "answer": 2,
    "explanation": "Sudden collapse while eating accompanied by cyanosis indicates acute foreign body airway obstruction."
  },
  {
    "id": 326,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "You assess the collapsed choking student from the previous question and determine he still has a pulse. What is the next step?",
    "options": [
      "Begin chest compressions immediately",
      "Open the airway and check for foreign object / provide rescue breaths",
      "Attach AED pads and analyze rhythm",
      "Search for a medical alert identification bracelet"
    ],
    "answer": 1,
    "explanation": "If a pulse is present, the patient is in respiratory arrest; open the airway and attempt rescue breaths."
  },
  {
    "id": 327,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "For BLS training and algorithm purposes, an 'infant' is categorized as a patient of what age?",
    "options": [
      "Under 1 year of age",
      "Under 2 years of age",
      "Under 3 years of age",
      "Under 4 years of age"
    ],
    "answer": 0,
    "explanation": "In BLS guidelines, an infant is defined as younger than 1 year (excluding newly born infants in delivery)."
  },
  {
    "id": 328,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "Why are rescue ventilations delivered to a pediatric arrest victim before seeking help in single-rescuer scenarios?",
    "options": [
      "EMS response times are invariably slower for children",
      "The child's parents are always expected to be nearby",
      "Most pediatric cardiac arrests are secondary to asphyxia / respiratory arrest",
      "AED defibrillation is strictly contraindicated in children"
    ],
    "answer": 2,
    "explanation": "Unlike adults (primary ventricular arrhythmias), children arrest from hypoxia; initial CPR restores oxygenation."
  },
  {
    "id": 329,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "A daycare provider finds an unresponsive 3-year-old who is not breathing. Alone with no phone, what should she do first?",
    "options": [
      "5 forceful back slaps",
      "Blind digital finger sweep",
      "Run out of the facility immediately to look for a telephone",
      "Deliver 2 minutes (~5 cycles) of CPR, then activate 911"
    ],
    "answer": 3,
    "explanation": "A lone rescuer provides 2 minutes of CPR to treat hypoxia before briefly leaving to call 911."
  },
  {
    "id": 330,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "A resuscitated child begins breathing spontaneously at 18/min, but her heart rate is 50 bpm with signs of poor perfusion. Next action?",
    "options": [
      "Increase rescue breathing frequency only",
      "Perform bilateral carotid sinus massage",
      "Begin chest compressions and CPR (HR < 60 with poor perfusion)",
      "Place in recovery position and monitor passively"
    ],
    "answer": 2,
    "explanation": "In pediatric BLS, a heart rate < 60 bpm with signs of poor perfusion despite oxygenation requires CPR."
  },
  {
    "id": 331,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "What is the complete medical term represented by the abbreviation AED?",
    "options": [
      "Automatic Energy Delivery",
      "Automated External Device",
      "Automated External Defibrillator",
      "Autonomous Energy Defibrillator"
    ],
    "answer": 2,
    "explanation": "AED stands for Automated External Defibrillator."
  },
  {
    "id": 332,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "A 49-year-old female in arrest has a subcutaneous pacemaker bulge with a healed scar in her upper chest. How should AED pads be placed?",
    "options": [
      "The AED cannot be used on this patient",
      "Place a strong magnet over the pacemaker bulge before shocking",
      "Place the AED electrode pad directly over the pacemaker bulge",
      "Avoid placing the AED pad over the bulge (place it at least 1 inch away)"
    ],
    "answer": 3,
    "explanation": "Avoid placing AED pads directly over an implanted pacemaker/ICD; place pad at least 2.5 cm (1 inch) away."
  },
  {
    "id": 333,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "The AED analyzes the rhythm and announces 'Shock Advised! Charging...'. What is the mandatory immediate action?",
    "options": [
      "Clear the patient ('Stand clear!') ensuring no one touches the patient",
      "Deliver 2 additional minutes of CPR before discharging shock",
      "Deliver rapid rescue ventilations while the shock is delivered",
      "Assume device error and immediately peel off the pads"
    ],
    "answer": 0,
    "explanation": "Ensure rescuer and bystander safety by loudly clearing everyone from touching the patient before shock delivery."
  },
  {
    "id": 334,
    "part": 9,
    "category": "Comprehensive CPR, First Aid & BLS Bank",
    "q": "Immediately after the AED delivers an electric shock to a patient in cardiac arrest, what is the next step?",
    "options": [
      "Pause and check the carotid pulse for 10 seconds",
      "Deliver rescue ventilations only for 1 minute",
      "Immediately resume CPR starting with high-quality chest compressions",
      "Remove the AED pads to evaluate skin burns"
    ],
    "answer": 2,
    "explanation": "Immediately resume CPR starting with chest compressions without pausing to check pulse or rhythm."
  }
]);

const imageCache = new Map();

export function getEmergencyQuizImageBuffer(imageFile) {
  if (!imageFile) return null;
  if (imageCache.has(imageFile)) return imageCache.get(imageFile);
  try {
    const p = path.join(__dirname, "assets/emergency", imageFile);
    if (fs.existsSync(p)) {
      const buf = fs.readFileSync(p);
      imageCache.set(imageFile, buf);
      return buf;
    }
  } catch {}
  return null;
}

export function getEmergencyQuizPart(pid) {
  return EMERGENCY_QUIZ_ITEMS.filter((item) => item.part === Number(pid)).map((item) => {
    if (item.imageFile) {
      const buf = getEmergencyQuizImageBuffer(item.imageFile);
      return {
        ...item,
        imageBuffer: buf,
        imageBase64: buf ? buf.toString("base64") : null,
        imageName: item.imageFile,
      };
    }
    return { ...item };
  });
}

export function getEmergencyQuizCategory(catId) {
  const cat = EMERGENCY_QUIZ_CATEGORIES.find((c) => c.id === catId);
  if (!cat) return [];
  return getEmergencyQuizPart(cat.part);
}
