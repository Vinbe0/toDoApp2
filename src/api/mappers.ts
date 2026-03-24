export function toUiTask(apiTask: any) {
    return {
        id: apiTask.id,
        text: apiTask.title,
        description: apiTask.description ?? "",
        deadline: apiTask.dueDate ?? null,
        priority: apiTask.priority ?? "low",
        completed: !!apiTask.completed,
        labels: [],
    };
}

export function toApiCreateTask(draft: any) {
    return {
        title: draft.text,
        description: draft.description ?? "",
        dueDate: draft.deadline ?? null,
        priority: draft.priority ?? "low",
    };
}