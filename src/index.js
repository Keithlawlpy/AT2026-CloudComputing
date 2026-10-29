
export default {
    async fetch(request, env) {
        if (request.method !== "GET") {
            return Response.json(
                { error: "Method not allowed" },
                { status: 405 }
            );
        }

        // Check that Cloudflare has both Airtable settings.
        if (!env.AIRTABLE_TOKEN || !env.AIRTABLE_BASE_ID) {
            return Response.json(
                { error: "Airtable configuration is missing" },
                { status: 500 }
            );
        }

        try {
            // Request up to five records from the Events table.
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
                // Do not expose Airtable's detailed error or credentials.
                console.error("Airtable request failed:", response.status);

                return Response.json(
                    { error: "Could not read the Airtable Events table" },
                    { status: 502 }
                );
            }

            const data = await response.json();

            // Return only the number of records, not the event data.
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
    },
};
