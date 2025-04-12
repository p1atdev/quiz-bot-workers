import { DiscordHono, Embed } from "discord-hono";
import { Hono } from "hono";
import {
    getAllQuizzes,
    getQuiz,
    getUser,
    incrementUserScore,
    setUserQuizCompleted,
} from "./kv";

type Env = {
    Bindings: {
        KV: KVNamespace;
    };
    Variables: Record<string, string>;
};

const bot = new DiscordHono<Env>()
    .command("list", async (c) => {
        const quizzes = await getAllQuizzes(c.env.KV);
        return c.res(
            {
                embeds: [
                    new Embed().title("Quiz List").fields(
                        ...Object.entries(quizzes).map(([key, quiz]) => {
                            return {
                                name: key,
                                value: quiz.question,
                                inline: false,
                            };
                        }),
                    ),
                ],
            },
        );
    })
    .command("answer", async (c) => {
        const userId = c.interaction.member?.user.id;
        if (!userId) {
            return c.res("User not found");
        }
        const params = c.var as {
            quiz: string;
            answer: string;
        };
        const quiz = await getQuiz(c.env.KV, params.quiz);
        if (!quiz) {
            return c.ephemeral().res("Quiz not found");
        }
        if (quiz.answer === params.answer) {
            await incrementUserScore(c.env.KV, userId);
            await setUserQuizCompleted(c.env.KV, userId, params.quiz);

            return c.ephemeral().res("Correct!");
        }

        return c.ephemeral().res("Incorrect answer. Please try again.");
    })
    .command("hint", async (c) => {
        const params = c.var as {
            quiz: string;
        };
        const quiz = await getQuiz(c.env.KV, params.quiz);
        if (!quiz) {
            return c.ephemeral().res("Quiz not found");
        }

        return c.ephemeral().res(`Hint: ${quiz.hint}`);
    })
    .command("profile", async (c) => {
        const userId = c.interaction.member?.user.id;
        if (!userId) {
            return c.res("User not found");
        }

        const user = await getUser(c.env.KV, userId);

        return c.res(
            {
                embeds: [
                    new Embed()
                        .title("Profile")
                        .fields(
                            {
                                name: "Score",
                                value: `${user.score}`,
                            },
                            ...Object.entries(user.quizzes).map(
                                ([key, value]) => {
                                    return {
                                        name: key,
                                        value: value
                                            ? "Completed"
                                            : "Not Completed",
                                        inline: true,
                                    };
                                },
                            ),
                        ),
                ],
            },
        );
    });

const app = new Hono<Env>();

app.mount("/bot", bot.fetch);
app.get("*", (c) => {
    return c.text("Hello, Hono!");
});

export default app;
