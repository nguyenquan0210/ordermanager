import { FeedbackStatus } from "../interface/feedbackstatus";

export class QueryFeedback {
    search?: string;
    isOwner?: boolean;
    status?: FeedbackStatus;
}
