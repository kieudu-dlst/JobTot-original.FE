import { test } from "node:test";
import assert from "node:assert/strict";
import { interviewFeedbackForm } from "../src/pages/employer-candidates/model/interview-feedback.js";

test("reopening an interview restores the signed-in recruiter's saved evaluation", () => {
  const saved = {
    score: 8.5,
    decision: "Pass",
    comment: "Giao tiếp tốt.\nCó kinh nghiệm phù hợp với vị trí.",
  };
  // Simulate the JSON response received again after a full page reload.
  const interview = JSON.parse(JSON.stringify({ feedbacks: [{ ...saved, isOwn: true }] }));
  assert.deepEqual(interviewFeedbackForm(interview), saved);
});

test("the form restores only the current recruiter's feedback when several people review", () => {
  const own = { score: 0, decision: "Fail", comment: "Chưa đáp ứng yêu cầu." };
  assert.deepEqual(
    interviewFeedbackForm({
      feedbacks: [
        { score: 9, decision: "Pass", comment: "Nhận xét của đồng nghiệp", isOwn: false },
        { ...own, isOwn: true },
      ],
    }),
    own,
  );
});

test("new evaluations start with defaults without copying a colleague's comment", () => {
  const defaults = { score: 5, decision: "Consider", comment: "" };
  for (const interview of [
    undefined,
    { feedbacks: [] },
    { feedbacks: [{ score: 9, decision: "Pass", comment: "Đạt", isOwn: false }] },
  ]) {
    assert.deepEqual(interviewFeedbackForm(interview), defaults);
  }
});
