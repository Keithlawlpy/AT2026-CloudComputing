import { verifyKey } from "discord-interactions";

export default {
    async fetch(request, env) {

        // PART 1: Keep the existing Airtable connection test.
        if (request.method === "GET") {

            if (!env.AIRTABLE_TOKEN || !env.AIRTABLE_BASE_ID) {
                return Response.json(
                    { error: "Airtable configuration is missing" },
                    { status: 500 }
                );
            }

            try {
                const airtableUrl = new URL(
                    `https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/Events`
                );

                airtableUrl.searchParams.set("maxRecords", "5");

                const response = await fetch(airtableUrl, {
                    headers: {
                        Authorization: `Bearer ${env.AIRTABLE_TOKEN}`,
                    },
                });

                if (!response.ok) {
                    console.error("Airtable request failed:", response.status);

                    return Response.json(
                        { error: "Could not read the Airtable Events table" },
                        { status: 502 }
                    );
                }

                const data = await response.json();

                return Response.json({
                    message: "Airtable connection successful!",
                    recordsFound: data.records.length,
                });

            } catch (error) {
                console.error("Airtable connection error:", error.message);

                return Response.json(
                    { error: "An unexpected error occurred" },
                    { status: 500 }
                );
            }
        }

        // PART 2: Receive Discord interactions.
        if (request.method === "POST") {

            if (!env.DISCORD_PUBLIC_KEY) {
                return Response.json(
                    { error: "Discord public key is missing" },
                    { status: 500 }
                );
            }

            // wait for text 
            const body = await request.text();
            const signature = request.headers.get("X-Signature-Ed25519");
            const timestamp = request.headers.get("X-Signature-Timestamp");

            // Verify that Discord sent this request.
            let isValid = false;
            if (signature && timestamp) {
                try {
                    isValid = await verifyKey(
                        body,
                        signature,
                        timestamp,
                        env.DISCORD_PUBLIC_KEY
                    );
                } catch {
                    isValid = false;
                }
            }

            if (!isValid) {
                return Response.json(
                    { error: "Invalid Discord request" },
                    { status: 401 }
                );
            }

            // Turns request text to JavaScript data.
            const interaction = JSON.parse(body);

            // PONG respones from discord 
            if (interaction.type === 1) {
                return Response.json({
                    type: 1
                });
            }

            if (interaction.type === 2) {
                const commandName = interaction.data.name;
                console.log("Received command:", commandName);   

                if (commandName === "hello") {
                    return Response.json({
                        type: 4,
                        data: {
                            content: "Hello from Cloudflare!"
                        }
                    });
                }
            }

            return Response.json({
                error: "Interaction not supported yet"
            }, { status: 400 });
        }

        return Response.json(
            { error: "Method not allowed" },
            { status: 405 }
        );
    },
};
