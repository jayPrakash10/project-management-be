// Route parameter shapes for typed controllers. Express 5 types params as
// string | string[] by default; these match the validated UUID params.
export type ProjectParams = { projectId: string };
export type ProjectMemberParams = { projectId: string; userId: string };
export type SectionParams = { sectionId: string };
export type TaskParams = { taskId: string };
export type CommentParams = { commentId: string };
export type UserParams = { userId: string };
