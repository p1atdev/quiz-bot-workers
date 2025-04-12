import { DiscordHono } from "discord-hono";
import { Hono } from "hono";
import { getAllQuizzes, getQuiz } from "./kv";

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
            `Here is a list of quizzes: 
            ${
                Object.entries(quizzes).map(([key, quiz]) => {
                    return `
                    - \`${key}\`: ${quiz.question}
                    `.trim();
                }).join("\n")
            }`,
        );
    })
    .command("answer", async (c) => {
        const params = c.var as {
            quiz: string;
            answer: string;
        };
        const quiz = await getQuiz(c.env.KV, params.quiz);
        if (!quiz) {
            return c.ephemeral().res("Quiz not found");
        }
        if (quiz.answer === params.answer) {
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
    });

const app = new Hono<Env>();

app.mount("/bot", bot.fetch);
app.get("*", (c) => {
    return c.text("Hello, Hono!");
});

export default app;
