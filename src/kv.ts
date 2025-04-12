export interface Quiz {
    question: string;
    answer: string;
    hint: string;
}

const QUIZ_PREFIX = "quiz_";

export const getQuiz = async (
    kv: KVNamespace,
    quizId: string,
): Promise<Quiz | null> => {
    const quiz = await kv.get<Quiz>(`${QUIZ_PREFIX}${quizId}`, {
        type: "json",
    });
    if (!quiz) {
        return null;
    }

    return quiz;
};

export const getAllQuizzes = async (
    kv: KVNamespace,
): Promise<Record<string, Quiz>> => {
    const quizzes: Record<string, Quiz> = {};
    const list = await kv.list<Quiz>({
        prefix: QUIZ_PREFIX,
    });

    for (const item of list.keys) {
        const quiz = await kv.get<Quiz>(item.name, {
            type: "json",
        });
        if (quiz) {
            quizzes[item.name.replace(QUIZ_PREFIX, "")] = quiz;
        }
    }

    return quizzes;
};
