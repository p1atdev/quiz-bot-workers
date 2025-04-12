export interface Quiz {
    question: string;
    answer: string;
    hint: string;
}

export interface User {
    score: number;
    quizzes: Record<string, boolean>;
}

export const QUIZ_PREFIX = "quiz_";
export const USER_PREFIX = "user_";

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

export const getUser = async (
    kv: KVNamespace,
    userId: string,
): Promise<User> => {
    const user = await kv.get<User>(`${USER_PREFIX}${userId}`, {
        type: "json",
    });
    if (!user) {
        await createUser(kv, userId);
        return getUser(kv, userId);
    }

    return user;
};

export const createUser = async (
    kv: KVNamespace,
    userId: string,
): Promise<void> => {
    const quizzes = await getAllQuizzes(kv);

    const user: User = {
        score: 0,
        quizzes: Object.keys(quizzes).reduce((acc, quizId) => {
            acc[quizId] = false;
            return acc;
        }, {} as Record<string, boolean>),
    };

    await kv.put(`${USER_PREFIX}${userId}`, JSON.stringify(user));
};

export const incrementUserScore = async (
    kv: KVNamespace,
    userId: string,
): Promise<void> => {
    const user = await getUser(kv, userId);
    if (!user) {
        // create
        await createUser(kv, userId);
        return incrementUserScore(kv, userId);
    }

    user.score += 1;
    await kv.put(`${USER_PREFIX}${userId}`, JSON.stringify(user));
};

export const setUserQuizCompleted = async (
    kv: KVNamespace,
    userId: string,
    quizId: string,
): Promise<void> => {
    const user = await getUser(kv, userId);
    if (!user) {
        // create
        await createUser(kv, userId);
        return setUserQuizCompleted(kv, userId, quizId);
    }

    user.quizzes[quizId] = true;
    await kv.put(`${USER_PREFIX}${userId}`, JSON.stringify(user));
};
