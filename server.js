import fastify from "fastify";
import axios from "axios";
import ical from "node-ical";
import icalgen from "ical-generator";
import fs from "fs";
import knex from "knex";
import dotenv from "dotenv";
dotenv.config({ path: ".server.env" });

const port = process.env.PORT || 3000;
const calc = (s) => Function(`return(${s})`)();
const sleepTime = calc(process.env.SLEEP_TIME) || 60 * 60 * 1000; // wait 1 hour by default

//* DEFAULT value given by ADE
// const VCALENDAR = {
//     "vcalendar": {
//         "type": "VCALENDAR",
//         "method": "REQUEST",
//         "prodid": "-//ADE/version 6.0",
//         "version": "2.0",
//         "calscale": "GREGORIAN"
//     }
// }

const VCALENDAR = {
    name: "ADECal",
    method: "REQUEST",
    prodId: "-//ADE/version 6.0",
    scale: "GREGORIAN",
};

const app = fastify();

// Create a Knex instance with SQLite3 as the client
const db = knex({
    client: "sqlite3",
    connection: {
        filename: "./database.db",
    },
    useNullAsDefault: true,
});

async function createTable() {
    return await db.schema.createTable("ical_data", function (table) {
        table.increments("id").primary();
        table.dateTime("start");
        table.dateTime("end");
        table.string("summary");
        table.string("location");
        table.text("description");
        table.json("raw");
    });
}

async function initializeDatabase() {
    // Define a migration to create the ical_data table
    await db.schema
        .hasTable("ical_data")
        .then(async (exists) => {
            if (!exists) {
                return createTable();
            } else {
                // we drop the table and recreate it
                await db.schema.dropTable("ical_data");
                createTable();
                return Promise.resolve(exists);
            }
        })
        .then((exists) => {
            if (!exists) {
                console.log("ical_data table created");
            }
        })
        .catch((err) => {
            console.error("Error creating ical_data table:", err);
        });
}
// Define a function to insert events into the database
async function insertEventToDatabase(event, trx) {
    if (event.type !== "VEVENT") {
        return;
    }
    try {
        await trx("ical_data").insert({
            start: event.start / 1000,
            end: event.end / 1000,
            summary: event.summary,
            location: event.location,
            description: event.description,
            raw: JSON.stringify(event),
        });
    } catch (error) {
        console.error("Error inserting event to database:", error);
    }
}

// Define a function to sync ical data from links
async function syncIcalData() {
    initializeDatabase();
    console.log("Syncing ical data...");
    try {
        const links = fs
            .readFileSync("links.txt", "utf8")
            .split("\n")
            .filter((link) => link.trim() !== "");
        const time1 = new Date().getTime();
        const responses = await Promise.all(links.map((url) => axios.get(url)));
        const time2 = new Date().getTime() - time1;
        console.log(`Time to get all links: ${time2} ms`);
        // const links = fs
        //     .readFileSync("links.txt", "utf8")
        //     .split("\n")
        //     .filter((link) => link.trim() !== "");
        // const responses = await Promise.all(links.map((url) => axios.get(url)));

        // for (const response of responses) {
        //     const events = ical.sync.parseICS(response.data);
        //     for (const eventId in events) {
        //         await insertEventToDatabase(events[eventId]);
        //     }
        // }
        await insertAllEventsToDatabase(responses);
        const time3 = new Date().getTime() - time1;
        console.log(`Syncing ical data done! Total time: ${time3} ms`);
    } catch (error) {
        console.error("Error syncing ical data:", error);
    }
}

async function insertAllEventsToDatabase(responses) {
    // we use a transaction to speed up the insertion
    await db.transaction(async (trx) => {
        const time1 = new Date().getTime();
        for (const response of responses) {
            const events = ical.sync.parseICS(response.data);
            for (const eventId in events) {
                await insertEventToDatabase(events[eventId], trx);
            }
        }
        const time2 = new Date().getTime() - time1;
        console.log(`Time to insert all events: ${time2} ms`);
    });
}

async function isDatabaseEmpty() {
    // returns true if there is no table in the database file
    return db.schema.hasTable("ical_data").then((exists) => !exists);
}
// Initialize the database and sync ical data if necessary
async function isTableEmpty() {
    const isEmpty = await db("ical_data")
        .count("* as count")
        .first()
        .then((row) => row.count === 0);
    return isEmpty;
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function main() {
    if (
        !fs.existsSync("database.db") ||
        (await isDatabaseEmpty()) ||
        (await isTableEmpty())
    ) {
        // if the database is empty we set it up, otherwise we wait 1 hour
        console.log("Syncing ical data1...");
        await syncIcalData();
    }
    while (true) {
        await delay(sleepTime);
        console.log("Syncing ical data2...");
        await syncIcalData();
    }
}

main();

app.get("/", async (req, reply) => {
    reply.header("Content-Type", "text/html; charset=utf-8");
    return "README.md is available at <a href='https://github.com/TheGeeKing/fds-umontpellier-ical-api'>https://github.com/TheGeeKing/fds-umontpellier-ical-api</a>";
});

// Route to get event by id
app.get("/id/:id", async (req, reply) => {
    const { id } = req.params;
    const { format = "json" } = req.query;

    if (!["json", "ical", "ics"].includes(format.toLowerCase())) {
        return reply.status(400).send({
            error: "Invalid format",
        });
    }

    try {
        const data = await db("ical_data").where("id", id).first();
        if (!data) {
            return reply.status(404).send({ error: "Event not found" });
        }

        if (format.toLowerCase() !== "json") {
            reply.header("Content-Type", "text/calendar");
            const { start, end, summary, location, description } = data;
            let cal = icalgen();
            cal.createEvent({ start, end, summary, location, description });
            return cal.toString();
        }
        return data;
    } catch (error) {
        console.error("Error retrieving event by id:", error);
        reply.status(500).send({ error: "Internal Server Error" });
    }
});

app.get("/length", async (req, reply) => {
    try {
        const data = await db("ical_data").count("* as count").first();
        return data;
    } catch (error) {
        console.error("Error retrieving event by id:", error);
        reply.status(500).send({ error: "Internal Server Error" });
    }
});

// Define other routes for filtering events (start, end, location, etc.)
app.get("/search", async (req, reply) => {
    const {
        start,
        end,
        location,
        summary,
        description,
        after,
        before,
        locationMatchType,
        summaryMatchType,
        descriptionMatchType,
        sort = false,
        format = "json",
    } = req.query;

    if (!["json", "ical", "ics"].includes(format.toLowerCase())) {
        return reply.status(400).send({
            error: "Invalid format",
        });
    }

    try {
        let data = await db("ical_data").where((builder) => {
            if (start) {
                builder.where("start", start);
            }
            if (end) {
                builder.where("end", end);
            }
            if (location) {
                if (locationMatchType === "strict") {
                    builder.where("location", location);
                } else {
                    builder.where("location", "like", `%${location}%`);
                }
            }
            if (summary) {
                if (summaryMatchType === "strict") {
                    builder.where("summary", summary);
                } else {
                    builder.where("summary", "like", `%${summary}%`);
                }
            }
            if (description) {
                if (descriptionMatchType === "strict") {
                    builder.where("description", description);
                } else {
                    builder.where("description", "like", `%${description}%`);
                }
            }
            if (after) {
                builder.where("start", ">=", after);
            }
            if (before) {
                builder.where("end", "<=", before);
            }
        });
        if (locationMatchType === "regex") {
            data = data.filter((event) => {
                const regex = new RegExp(location);
                return regex.test(event.location);
            });
        }
        if (summaryMatchType === "regex") {
            data = data.filter((event) => {
                const regex = new RegExp(summary);
                return regex.test(event.summary);
            });
        }
        if (descriptionMatchType === "regex") {
            data = data.filter((event) => {
                const regex = new RegExp(description);
                return regex.test(event.description);
            });
        }
        if (data && sort) {
            // sort by start date
            data = data.sort((a, b) => a.start - b.start);
        }
        if (format !== "json") {
            reply.header("Content-Type", "text/calendar");
            const cal = icalgen(VCALENDAR);
            for (const event of data) {
                const { start, end, summary, location, description } = event;
                cal.createEvent({
                    start: new Date(start),
                    end: new Date(end),
                    summary: summary,
                    location: location,
                    description: description,
                });
            }
            return cal.toString();
        }
        return data;
    } catch (error) {
        console.error("Error retrieving events:", error);
        reply.status(500).send({ error: "Internal Server Error" });
    }
});

// Start the server
app.listen(
    {
        port: port,
        host: "0.0.0.0",
    },
    () => {
        console.log(`Server running at http://localhost:${port}/`);
    }
);
