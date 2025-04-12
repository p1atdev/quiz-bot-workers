import Cloudflare from "cloudflare";
import { Command, Option, register } from "discord-hono";

const client = new Cloudflare({
    apiToken: process.env.CLOUDFLARE_API_TOKEN,
});

const keys = [];

for await (
    const key of await client.kv.namespaces.keys.list(
        process.env.CLOUDFLARE_KV_ID,
        {
            account_id: process.env.CLOUDFLARE_ACCOUNT_ID,
            prefix: "quiz_",
        },
    )
) {
    keys.push(key.name.replace("quiz_", ""));
}

const commands = [
    new Command("list", "クイズを取得します"),
    new Command("answer", "クイズに回答します").options(
        new Option("quiz", "クイズ ID", "String").required().choices(
            ...keys.map((key) => ({
                name: key,
                value: key,
            })),
        ),
        new Option("answer", "回答", "String").required(),
    ),
    new Command("hint", "ヒントを取得します").options(
        new Option("quiz", "クイズ ID", "String").required().choices(
            ...keys.map((key) => ({
                name: key,
                value: key,
            })),
        ),
    ),
];

register(
    commands,
    process.env.DISCORD_APPLICATION_ID,
    process.env.DISCORD_TOKEN,
    //process.env.DISCORD_GUILD_ID,
);
