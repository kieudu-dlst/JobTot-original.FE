import { candidateFetch } from "@/shared/api/candidate-session";
import { employerFetch } from "@/shared/api/employer-session";
import { searchCareer } from "../model/career-search";

export const requestCareerSearch = (employer, question, signal, image, conversationId) =>
  searchCareer(question, signal, employer ? employerFetch : candidateFetch, image, conversationId);
