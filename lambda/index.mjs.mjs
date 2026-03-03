import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand, ScanCommand, DeleteCommand, GetCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS"
  };

  console.log("EVENT:", JSON.stringify(event));

  const method = event.httpMethod || event.requestContext?.http?.method || "POST";
  const path = event.path || event.rawPath || "";

  try {

    // ── GAMES ROUTES ──────────────────────────────────────────
    if (path.includes("games")) {

      if (method === "GET") {
        const gameID = event.queryStringParameters?.gameID;
        if (!gameID) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing gameID" }) };
        }
        const response = await docClient.send(new GetCommand({
          TableName: "Games",
          Key: { gameID: String(gameID) }
        }));
        if (!response.Item) {
          return { statusCode: 404, headers, body: JSON.stringify({ error: "Game not found" }) };
        }
        return { statusCode: 200, headers, body: JSON.stringify(response.Item) };
      }

      if (method === "POST") {
        const body = event.body ? JSON.parse(event.body) : event;
        if (!body.gameID) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing gameID" }) };
        }
        const item = {
          gameID: String(body.gameID),
          gameDate: String(body.gameDate || ""),
          gameNumber: String(body.gameNumber || ""),
          opponent: String(body.opponent || ""),
          createdAt: new Date().toISOString()
        };
        await docClient.send(new PutCommand({ TableName: "Games", Item: item }));
        return { statusCode: 200, headers, body: JSON.stringify({ message: "Game created!", gameID: item.gameID }) };
      }
    }

    // ── ROSTER ROUTES ──────────────────────────────────────────
    if (path.includes("roster")) {

      if (method === "GET") {
        const teamID = event.queryStringParameters?.teamID || "main";
        const response = await docClient.send(new QueryCommand({
          TableName: "Rosters",
          KeyConditionExpression: "teamID = :teamID",
          ExpressionAttributeValues: { ":teamID": teamID }
        }));
        return { statusCode: 200, headers, body: JSON.stringify(response.Items) };
      }

      if (method === "POST") {
        const body = event.body ? JSON.parse(event.body) : event;
        const item = {
          teamID: String(body.teamID || "main"),
          pitcherID: String(body.pitcherID),
          name: String(body.name || ""),
          number: String(body.number || "")
        };
        await docClient.send(new PutCommand({ TableName: "Rosters", Item: item }));
        return { statusCode: 200, headers, body: JSON.stringify({ message: "Pitcher saved!" }) };
      }

      if (method === "DELETE") {
        const body = event.body ? JSON.parse(event.body) : event;
        await docClient.send(new DeleteCommand({
          TableName: "Rosters",
          Key: {
            teamID: String(body.teamID || "main"),
            pitcherID: String(body.pitcherID)
          }
        }));
        return { statusCode: 200, headers, body: JSON.stringify({ message: "Pitcher deleted!" }) };
      }
    }

    // ── BATTER ROUTES ──────────────────────────────────────────
    if (path.includes("batters")) {

      if (method === "GET") {
        const gameID = event.queryStringParameters?.gameID;
        if (!gameID) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing gameID" }) };
        }
        const response = await docClient.send(new QueryCommand({
          TableName: "Batters",
          KeyConditionExpression: "gameID = :gameID",
          ExpressionAttributeValues: { ":gameID": gameID }
        }));
        return { statusCode: 200, headers, body: JSON.stringify(response.Items) };
      }

      if (method === "POST") {
        const body = event.body ? JSON.parse(event.body) : event;
        const item = {
          gameID: String(body.gameID),
          batterID: String(body.batterID),
          number: String(body.number || ""),
          name: String(body.name || ""),
          hand: String(body.hand || "")
        };
        await docClient.send(new PutCommand({ TableName: "Batters", Item: item }));
        return { statusCode: 200, headers, body: JSON.stringify({ message: "Batter saved!" }) };
      }

      if (method === "DELETE") {
        const body = event.body ? JSON.parse(event.body) : event;
        await docClient.send(new DeleteCommand({
          TableName: "Batters",
          Key: {
            gameID: String(body.gameID),
            batterID: String(body.batterID)
          }
        }));
        return { statusCode: 200, headers, body: JSON.stringify({ message: "Batter deleted!" }) };
      }
    }

// ── PITCH ROUTES ──────────────────────────────────────────
if (path.includes("pitches")) {

  if (method === "GET") {
    const gameId = event.queryStringParameters?.gameId ||
                   event.queryStringParameters?.gameID;
    if (!gameId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing gameId" }) };
    }
    const response = await docClient.send(new QueryCommand({
      TableName: "Pitches",
      KeyConditionExpression: "gameID = :gameID",
      ExpressionAttributeValues: { ":gameID": String(gameId) }
    }));
    return { statusCode: 200, headers, body: JSON.stringify(response.Items) };
  }

      if (method === "POST") {
        const pitch = event.body ? JSON.parse(event.body) : event;
        if (!pitch.gameId) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing gameId" }) };
        }
        const item = {
          gameID: String(pitch.gameId),
          pitchNumber: parseInt(pitch.pitchNumber, 10),
          gameDate: String(pitch.gameDate || ""),
          gameNumber: String(pitch.gameNumber || ""),
          inning: String(pitch.inning || ""),
          pitcherName: String(pitch.pitcherName || ""),
          pitcherNumber: String(pitch.pitcherNumber || ""),
          batterNumber: String(pitch.batterNumber || ""),
          batterName: String(pitch.batterName || ""),
          batterHand: String(pitch.batterHand || ""),
          pitchType: String(pitch.pitchType || ""),
          velocity: String(pitch.velocity || ""),
          zone: String(pitch.zone || ""),
          result: String(pitch.result || ""),
          outcome: String(pitch.outcome || ""),
          opponent: String(pitch.opponent || ""),
          ballCount: String(pitch.ballCount ?? ""),
          strikeCount: String(pitch.strikeCount ?? "")
        };
        await docClient.send(new PutCommand({ TableName: "Pitches", Item: item }));
        return { statusCode: 200, headers, body: JSON.stringify({ message: "Pitch saved!" }) };
      }
    }

    // ── FALLBACK ──────────────────────────────────────────────
    return { statusCode: 404, headers, body: JSON.stringify({ error: "Route not found" }) };

  } catch (error) {
    console.log("ERROR:", error.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};