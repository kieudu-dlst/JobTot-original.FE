export function interviewFeedbackForm(interview) {
  const feedback = interview?.feedbacks?.find((item) => item.isOwn);
  return {
    score: feedback?.score ?? 5,
    decision: feedback?.decision ?? "Consider",
    comment: feedback?.comment ?? "",
  };
}
