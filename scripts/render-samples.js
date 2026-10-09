#!/usr/bin/env node
// Renders one sample lecture in several templates and languages, so the look can be
// reviewed without calling any AI. Writes to ./samples/.
import { writeFileSync, mkdirSync } from "node:fs";
import { normaliseDocument, normaliseOsce } from "../src/render/schema.js";
import { renderDocument, renderOsce } from "../src/render/html.js";

const B = (en, ar) => ({ en, ar });

const SAMPLE = {
  title: B("Price elasticity of demand", "المرونة السعرية للطلب"),
  subtitle: B("Intro microeconomics · Lecture 7", "مقدمة الاقتصاد الجزئي · المحاضرة 7"),
  sections: [
    { type: "heading", text: B("Definition", "التعريف") },
    { type: "definition", term: B("Price elasticity of demand", "المرونة السعرية للطلب"), meaning: B("Percentage change in quantity demanded divided by the percentage change in price.", "نسبة التغير في الكمية المطلوبة مقسومة على نسبة التغير في السعر."), example: B("Price rises 10%, quantity falls 20%: elasticity = −2.", "السعر زاد 10% والكمية نقصت 20%: المرونة = −2.") },
    { type: "formula", label: B("Midpoint formula", "قانون المنتصف"), expression: "E = [(Q2 − Q1) / ((Q1+Q2)/2)] ÷ [(P2 − P1) / ((P1+P2)/2)]", when: B("Use when prices change a lot.", "استخدمه لما السعر يتغير بشكل كبير.") },
    { type: "heading", text: B("Classes of elasticity", "أنواع المرونة") },
    { type: "table", caption: B("Reading |E|", "قراءة |E|"), headers: [B("Value", "القيمة"), B("Name", "الاسم"), B("Revenue when price rises", "الإيراد لما السعر يزيد")], rows: [[B("|E| > 1", "|E| > 1"), B("Elastic", "مرن"), B("Falls", "يقل")], [B("|E| = 1", "|E| = 1"), B("Unit elastic", "مرونة وحدوية"), B("Unchanged", "ثابت")], [B("|E| < 1", "|E| < 1"), B("Inelastic", "غير مرن"), B("Rises", "يزيد")]] },
    { type: "points", items: [B("Necessities tend to be inelastic.", "السلع الضرورية عادة غير مرنة."), B("Luxuries and close substitutes tend to be elastic.", "الكماليات والبدائل القريبة عادة مرنة."), B("Longer time horizons make demand more elastic.", "المدة الزمنية الأطول بتخلي الطلب أكتر مرونة.")] },
    { type: "trap", text: B("Elasticity is not the slope of the demand curve. Slope depends on units; elasticity does not.", "المرونة مش ميل منحنى الطلب. الميل بيعتمد على الوحدات، والمرونة لأ.") },
    { type: "heading", text: B("Steps to compute", "خطوات الحساب") },
    { type: "steps", items: [B("Write down the two prices and the two quantities.", "اكتب السعرين والكميتين."), B("Compute the percentage change using the midpoint method.", "احسب نسبة التغير بطريقة المنتصف."), B("Divide the quantity change by the price change.", "اقسم نسبة تغير الكمية على نسبة تغير السعر."), B("Read the sign and the absolute value.", "اقرأ الإشارة والقيمة المطلقة.")] },
    { type: "qa", question: B("Why use the midpoint formula?", "ليه بنستخدم قانون المنتصف؟"), answer: B("It gives the same answer whether you move from A to B or from B to A.", "بيدي نفس الإجابة سواء اتحركت من A لـ B أو من B لـ A.") },
    { type: "qa", question: B("Is a negative sign a problem?", "الإشارة السالبة مشكلة؟"), answer: B("No. The law of demand makes it negative; compare absolute values.", "لأ. قانون الطلب بيخليها سالبة؛ قارن القيم المطلقة.") },
  ],
  keywords: ["elasticity", "midpoint", "inelastic", "elastic", "revenue"],
};

const OSCE = {
  title: B("Price change station set", "محطات تغير الأسعار"),
  stations: [
    { title: B("Explain a bread price rise", "اشرح ارتفاع سعر الخبز"), setting: B("Tutorial room", "قاعة التمارين"), scenario: B("A student asks why bread prices rose after a harvest failure.", "طالب بيسأل ليه سعر الخبز زاد بعد فشل المحصول."), tasks: [B("Ask what the student already knows", "اسأل الطالب عن معلوماته"), B("Draw the supply shift on a board", "ارسم انتقال العرض على السبورة")], checklist: [{ item: B("Identifies the supply shift", "بيحدد انتقال العرض"), marks: 2 }, { item: B("States the new equilibrium price", "بيذكر سعر التوازن الجديد"), marks: 1 }, { item: B("Checks understanding before moving on", "بيتأكد من الفهم قبل ما يكمل"), marks: 1 }], key_phrases: [B("supply shift", "انتقال العرض"), B("new equilibrium", "توازن جديد")], common_errors: [B("Confuses a shift with a movement along the curve", "بيخلط بين الانتقال والحركة على المنحنى")] },
  ],
};

mkdirSync("samples", { recursive: true });
const date = "8 Oct 2026";
const jobs = [
  ["cram", "en"], ["table", "ar"], ["cornell", "bilingual"], ["flow", "en"], ["qa", "ar"],
];
for (const [template, lang] of jobs) {
  const doc = normaliseDocument(SAMPLE, { lang });
  const html = renderDocument({ doc, lang, template, dateLabel: date });
  const file = `samples/sample-${template}-${lang}.html`;
  writeFileSync(file, html);
  console.log("wrote", file, html.length, "bytes");
}
const osce = normaliseOsce(OSCE, { lang: "bilingual" });
writeFileSync("samples/sample-osce-bilingual.html", renderOsce({ osce, lang: "bilingual", dateLabel: date }));
console.log("wrote samples/sample-osce-bilingual.html");
